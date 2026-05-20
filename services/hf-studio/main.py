"""
xfarming hf-studio — async compute service
===========================================
Mirrors app.py but as a standalone service (no Gradio UI).
All endpoints return 202 immediately and process in background threads.
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
import tempfile
import threading
from typing import Any, Dict, Optional

import requests
from fastapi import FastAPI
from pydantic import BaseModel

_repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from hf.infinity import AutoSubtitlePipeline  # noqa: E402
from hf.trendline_engine import render_dynamic_video  # noqa: E402

os.environ.setdefault("OUTPUT_DIR", "/tmp/outputs")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s",
                    handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

app = FastAPI(title="xfarming hf-studio", version="2.0.0")


class RenderRequest(BaseModel):
    job_id: str
    input_url: Optional[str] = None
    upload_url: str
    output_key: Optional[str] = None
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None
    payload: Dict[str, Any] = {}


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


def _callback(webhook_url: str, secret: str, job_id: str, output_key: str = "", error: str = "") -> None:
    if not webhook_url:
        return
    try:
        payload: Dict[str, Any] = {"job_id": job_id}
        if error:
            payload["error"] = error
        else:
            payload["output_key"] = output_key
        requests.post(webhook_url, json=payload,
                      headers={"x-webhook-secret": secret or "", "content-type": "application/json"},
                      timeout=30)
    except Exception as e:
        logger.error("Webhook failed for %s: %s", job_id, e)


def _run_infinity(req: RenderRequest) -> None:
    job_id = req.job_id
    output_key = req.output_key or f"outputs/{job_id}.mp4"
    try:
        if not req.input_url:
            raise ValueError("input_url required")
        story = str(req.payload.get("story") or "").strip()
        if len(story) < 5:
            raise ValueError("story too short")
        voice_gender = str(req.payload.get("voice_gender") or "male").lower()
        photo_position = str(req.payload.get("photo_position") or "center").lower()

        with tempfile.TemporaryDirectory() as td:
            photo_in = os.path.join(td, "photo.png")
            out_dir = os.path.join(td, "out")
            os.makedirs(out_dir, exist_ok=True)
            _download(req.input_url, photo_in)
            pipeline = AutoSubtitlePipeline(
                photo_path=photo_in, caption_text=story,
                voice_gender=voice_gender, photo_position=photo_position,
                output_dir=out_dir,
            )
            output_path = asyncio.run(pipeline.run())
            _upload(req.upload_url, output_path, "video/mp4")

        _callback(req.webhook_url or "", req.webhook_secret or "", job_id, output_key=output_key)
    except Exception as e:
        logger.error("[%s] infinity failed: %s", job_id, e)
        _callback(req.webhook_url or "", req.webhook_secret or "", job_id, error=str(e))


def _run_trendline(req: RenderRequest) -> None:
    job_id = req.job_id
    output_key = req.output_key or f"outputs/{job_id}.mp4"
    try:
        if not req.input_url:
            raise ValueError("input_url required")
        with tempfile.TemporaryDirectory() as td:
            csv_path = os.path.join(td, "input.csv")
            out_mp4 = os.path.join(td, "output.mp4")
            _download(req.input_url, csv_path)
            with open(csv_path, "r", encoding="utf-8", errors="ignore") as f:
                csv_text = f.read()
            render_dynamic_video(
                data_csv=csv_text, output_mp4=out_mp4,
                title=str(req.payload.get("title") or "X VS Y"),
                subtitle=str(req.payload.get("subtitle") or "Simulasi"),
                theme=str(req.payload.get("theme") or "black"),
                aspect_ratio=str(req.payload.get("aspect_ratio") or "9:16"),
                colA=str(req.payload.get("colA") or "A"),
                colB=str(req.payload.get("colB") or "B"),
                emojiA=str(req.payload.get("emojiA") or "💰"),
                emojiB=str(req.payload.get("emojiB") or "📈"),
            )
            _upload(req.upload_url, out_mp4, "video/mp4")

        _callback(req.webhook_url or "", req.webhook_secret or "", job_id, output_key=output_key)
    except Exception as e:
        logger.error("[%s] trendline failed: %s", job_id, e)
        _callback(req.webhook_url or "", req.webhook_secret or "", job_id, error=str(e))


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/infinity/render", status_code=202)
def infinity_render(req: RenderRequest):
    threading.Thread(target=_run_infinity, args=(req,), daemon=True).start()
    return {"ok": True, "job_id": req.job_id, "status": "accepted"}


@app.post("/trendline/render", status_code=202)
def trendline_render(req: RenderRequest):
    threading.Thread(target=_run_trendline, args=(req,), daemon=True).start()
    return {"ok": True, "job_id": req.job_id, "status": "accepted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "7860")))
