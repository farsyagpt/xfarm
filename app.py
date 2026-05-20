"""
xfarming HF Space — unified async compute entry point
======================================================
All render endpoints are ASYNC:
  1. Accept job request → return 202 immediately
  2. Process in background thread
  3. Upload output to Supabase via presigned PUT
  4. Call webhook_url to notify Worker when done

Endpoints:
  GET  /health
  POST /infinity/render   — Hero Video (PNG photo + TTS)
  POST /trendline/render  — Trendline animated chart
  POST /api/bulk          — XFarm bulk RSS carousel
  /                       — Gradio UI (XFarm studio)
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
import tempfile
import threading
from typing import Any, Dict, Optional

import gradio as gr
import requests
from fastapi import FastAPI
from pydantic import BaseModel

from hf.agenxy import bulk_process as xfarm_bulk_process
from hf.agenxy import create_ui as create_xfarm_ui
from hf.infinity import AutoSubtitlePipeline
from hf.trendline_engine import render_dynamic_video

os.environ.setdefault("OUTPUT_DIR", "/tmp/outputs")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

api = FastAPI(title="xfarming space", version="2.0.0")


# ══════════════════════════════════════════════════════════════
# REQUEST / RESPONSE MODELS
# ══════════════════════════════════════════════════════════════

class RenderRequest(BaseModel):
    job_id: str
    input_url: Optional[str] = None
    upload_url: str
    output_key: Optional[str] = None
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None
    payload: Dict[str, Any] = {}


# ══════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════

def _download(url: str, dst: str) -> None:
    r = requests.get(url, stream=True, timeout=180)
    r.raise_for_status()
    with open(dst, "wb") as f:
        for chunk in r.iter_content(1024 * 1024):
            if chunk:
                f.write(chunk)


def _upload(upload_url: str, file_path: str, content_type: str) -> None:
    with open(file_path, "rb") as f:
        r = requests.put(upload_url, data=f, headers={"content-type": content_type}, timeout=300)
    r.raise_for_status()


def _callback(webhook_url: str, webhook_secret: str, job_id: str, output_key: str = "", error: str = "") -> None:
    """Notify Worker that job is done or failed."""
    if not webhook_url:
        return
    try:
        payload: Dict[str, Any] = {"job_id": job_id}
        if error:
            payload["error"] = error
        else:
            payload["output_key"] = output_key
        requests.post(
            webhook_url,
            json=payload,
            headers={"x-webhook-secret": webhook_secret or "", "content-type": "application/json"},
            timeout=30,
        )
        logger.info("Webhook sent for job %s", job_id)
    except Exception as e:
        logger.error("Webhook failed for job %s: %s", job_id, e)


# ══════════════════════════════════════════════════════════════
# BACKGROUND WORKERS
# ══════════════════════════════════════════════════════════════

def _run_infinity(req: RenderRequest) -> None:
    job_id = req.job_id
    webhook_url = req.webhook_url or ""
    webhook_secret = req.webhook_secret or ""
    output_key = req.output_key or f"outputs/{job_id}.mp4"

    try:
        if not req.input_url:
            raise ValueError("input_url required")

        story = str(req.payload.get("story") or "").strip()
        if len(story) < 5:
            raise ValueError("payload.story terlalu pendek")

        voice_gender = str(req.payload.get("voice_gender") or "male").lower()
        if voice_gender not in {"male", "female"}:
            voice_gender = "male"

        photo_position = str(req.payload.get("photo_position") or "center").lower()
        if photo_position not in {"center", "right"}:
            photo_position = "center"

        with tempfile.TemporaryDirectory() as td:
            photo_in = os.path.join(td, "photo.png")
            out_dir = os.path.join(td, "out")
            os.makedirs(out_dir, exist_ok=True)

            logger.info("[%s] Downloading photo...", job_id)
            _download(req.input_url, photo_in)

            logger.info("[%s] Running INFINITY pipeline...", job_id)
            pipeline = AutoSubtitlePipeline(
                photo_path=photo_in,
                caption_text=story,
                voice_gender=voice_gender,
                photo_position=photo_position,
                output_dir=out_dir,
            )
            output_path = asyncio.run(pipeline.run())

            logger.info("[%s] Uploading output...", job_id)
            _upload(req.upload_url, output_path, "video/mp4")

        _callback(webhook_url, webhook_secret, job_id, output_key=output_key)
        logger.info("[%s] INFINITY done.", job_id)

    except Exception as e:
        logger.error("[%s] INFINITY failed: %s", job_id, e)
        _callback(webhook_url, webhook_secret, job_id, error=str(e))


def _run_trendline(req: RenderRequest) -> None:
    job_id = req.job_id
    webhook_url = req.webhook_url or ""
    webhook_secret = req.webhook_secret or ""
    output_key = req.output_key or f"outputs/{job_id}.mp4"

    try:
        if not req.input_url:
            raise ValueError("input_url required")

        title = str(req.payload.get("title") or "TABUNGAN VS INVESTASI")
        subtitle = str(req.payload.get("subtitle") or "Simulasi")
        aspect_ratio = str(req.payload.get("aspect_ratio") or "9:16")
        theme = str(req.payload.get("theme") or "black")
        col_a = str(req.payload.get("colA") or "A")
        col_b = str(req.payload.get("colB") or "B")
        emoji_a = str(req.payload.get("emojiA") or "💰")
        emoji_b = str(req.payload.get("emojiB") or "📈")

        with tempfile.TemporaryDirectory() as td:
            csv_path = os.path.join(td, "input.csv")
            out_mp4 = os.path.join(td, "output.mp4")

            logger.info("[%s] Downloading CSV...", job_id)
            _download(req.input_url, csv_path)
            with open(csv_path, "r", encoding="utf-8", errors="ignore") as f:
                csv_text = f.read()

            logger.info("[%s] Rendering trendline...", job_id)
            render_dynamic_video(
                data_csv=csv_text,
                output_mp4=out_mp4,
                title=title,
                subtitle=subtitle,
                theme=theme,
                aspect_ratio=aspect_ratio,
                colA=col_a,
                colB=col_b,
                emojiA=emoji_a,
                emojiB=emoji_b,
            )

            logger.info("[%s] Uploading output...", job_id)
            _upload(req.upload_url, out_mp4, "video/mp4")

        _callback(webhook_url, webhook_secret, job_id, output_key=output_key)
        logger.info("[%s] Trendline done.", job_id)

    except Exception as e:
        logger.error("[%s] Trendline failed: %s", job_id, e)
        _callback(webhook_url, webhook_secret, job_id, error=str(e))


def _run_xfarm(req: RenderRequest) -> None:
    job_id = req.job_id
    webhook_url = req.webhook_url or ""
    webhook_secret = req.webhook_secret or ""
    output_key = req.output_key or f"outputs/{job_id}.zip"

    try:
        feed = str(req.payload.get("feed") or "🔥 Aggregated (60+ Feeds)")
        max_items = int(req.payload.get("maxItems") or 10)
        provider = str(req.payload.get("provider") or "pollinations")
        space_id = str(req.payload.get("space_id") or "")
        model_choice = req.payload.get("model_choice")
        hf_token = str(req.payload.get("hf_token") or "").strip()

        os.environ["OUTPUT_DIR"] = os.environ.get("OUTPUT_DIR", "/tmp/outputs")

        class _Progress:
            def __call__(self, *a, **kw): return None

        logger.info("[%s] Running XFarm bulk...", job_id)
        zip_path, status = xfarm_bulk_process(
            feed, hf_token, max_items, provider, space_id, model_choice,
            progress=_Progress(),
        )

        if not zip_path:
            raise RuntimeError(str(status or "bulk failed"))

        logger.info("[%s] Uploading ZIP...", job_id)
        _upload(req.upload_url, zip_path, "application/zip")

        _callback(webhook_url, webhook_secret, job_id, output_key=output_key)
        logger.info("[%s] XFarm done.", job_id)

    except Exception as e:
        logger.error("[%s] XFarm failed: %s", job_id, e)
        _callback(webhook_url, webhook_secret, job_id, error=str(e))


# ══════════════════════════════════════════════════════════════
# API ENDPOINTS — all return 202 immediately
# ══════════════════════════════════════════════════════════════

@api.get("/health")
def health():
    return {"ok": True, "version": "2.0.0"}


@api.post("/infinity/render", status_code=202)
def infinity_render(req: RenderRequest):
    """Accept Hero Video job, process async in background thread."""
    t = threading.Thread(target=_run_infinity, args=(req,), daemon=True)
    t.start()
    return {"ok": True, "job_id": req.job_id, "status": "accepted"}


@api.post("/trendline/render", status_code=202)
def trendline_render(req: RenderRequest):
    """Accept Trendline job, process async in background thread."""
    t = threading.Thread(target=_run_trendline, args=(req,), daemon=True)
    t.start()
    return {"ok": True, "job_id": req.job_id, "status": "accepted"}


@api.post("/api/bulk", status_code=202)
def xfarm_bulk(req: RenderRequest):
    """Accept XFarm bulk job, process async in background thread."""
    t = threading.Thread(target=_run_xfarm, args=(req,), daemon=True)
    t.start()
    return {"ok": True, "job_id": req.job_id, "status": "accepted"}


# ── Mount Gradio XFarm UI at root ──
xfarm_ui = create_xfarm_ui()
app = gr.mount_gradio_app(api, xfarm_ui, path="/")
