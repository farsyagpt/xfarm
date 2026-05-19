"""
xfarming HF Space — unified compute entry point
================================================
Serves all three compute pipelines from a single HuggingFace Space:
  GET  /health              — Health check
  POST /infinity/render     — Hero Video (INFINITY pipeline)
  POST /trendline/render    — Trendline animated chart
  POST /api/bulk            — XFarm bulk RSS → carousel ZIP
  /                         — Gradio UI (XFarm studio, mounted at root)

All output is written to /tmp — nothing large is stored in the repo.
"""
from __future__ import annotations

import asyncio
import os
import tempfile
from typing import Any, Dict, Optional

import gradio as gr
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from hf.agenxy import bulk_process as xfarm_bulk_process
from hf.agenxy import create_ui as create_xfarm_ui
from hf.infinity import AutoSubtitlePipeline
from hf.trendline_engine import render_dynamic_video

# HF Spaces: always write to /tmp so nothing pollutes the repo
os.environ.setdefault("OUTPUT_DIR", "/tmp/outputs")

api = FastAPI(title="xfarming space", version="1.0.0")


class RenderRequest(BaseModel):
    job_id: str
    input_url: Optional[str] = None
    upload_url: str
    payload: Dict[str, Any] = {}


def _download_to_file(url: str, dst_path: str) -> None:
    """Stream-download a URL to a local file path."""
    r = requests.get(url, stream=True, timeout=180)
    r.raise_for_status()
    with open(dst_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)


def _upload_file(upload_url: str, file_path: str, content_type: str) -> None:
    """Upload a local file to a presigned PUT URL (R2)."""
    with open(file_path, "rb") as f:
        r = requests.put(
            upload_url,
            data=f,
            headers={"content-type": content_type},
            timeout=180,
        )
    r.raise_for_status()


@api.get("/health")
def health():
    return {"ok": True}


@api.post("/infinity/render")
def infinity_render(req: RenderRequest):
    """
    Download input video from R2, run INFINITY subtitle+voice pipeline,
    upload resulting mp4 back to R2 via presigned PUT.
    """
    if not req.input_url:
        raise HTTPException(status_code=400, detail="input_url required")

    story = str(req.payload.get("story") or "").strip()
    if len(story) < 10:
        raise HTTPException(status_code=400, detail="payload.story terlalu pendek (min 10 karakter)")

    voice_gender = str(req.payload.get("voice_gender") or "male").strip().lower()
    if voice_gender not in {"male", "female"}:
        voice_gender = "male"

    with tempfile.TemporaryDirectory() as td:
        video_in = os.path.join(td, "input.mp4")
        out_dir = os.path.join(td, "out")
        os.makedirs(out_dir, exist_ok=True)

        _download_to_file(req.input_url, video_in)

        pipeline = AutoSubtitlePipeline(
            video_path=video_in,
            caption_text=story,
            voice_gender=voice_gender,
            output_dir=out_dir,
        )
        output_path = asyncio.run(pipeline.run())

        _upload_file(req.upload_url, output_path, content_type="video/mp4")

    return {"ok": True, "job_id": req.job_id}


@api.post("/trendline/render")
def trendline_render(req: RenderRequest):
    """
    Download input CSV from R2, render animated trendline mp4,
    upload result back to R2 via presigned PUT.
    """
    if not req.input_url:
        raise HTTPException(status_code=400, detail="input_url required")

    title = str(req.payload.get("title") or "TABUNGAN VS INVESTASI")
    subtitle = str(req.payload.get("subtitle") or "Simulasi")
    aspect_ratio = str(req.payload.get("aspect_ratio") or "16:9")
    theme = str(req.payload.get("theme") or "black")

    with tempfile.TemporaryDirectory() as td:
        csv_path = os.path.join(td, "input.csv")
        out_mp4 = os.path.join(td, "output.mp4")

        _download_to_file(req.input_url, csv_path)
        with open(csv_path, "r", encoding="utf-8", errors="ignore") as f:
            csv_text = f.read()

        render_dynamic_video(
            data_csv=csv_text,
            output_mp4=out_mp4,
            title=title,
            subtitle=subtitle,
            theme=theme,
            aspect_ratio=aspect_ratio,
        )

        _upload_file(req.upload_url, out_mp4, content_type="video/mp4")

    return {"ok": True, "job_id": req.job_id}


class _DummyProgress:
    """No-op progress callback so bulk_process works outside Gradio context."""
    def __call__(self, *_args, **_kwargs):
        return None


@api.post("/api/bulk")
def xfarm_bulk(req: RenderRequest):
    """
    Run XFarm bulk content generation from RSS feeds,
    then upload the resulting ZIP to R2 via presigned PUT.
    """
    feed = str(req.payload.get("feed") or "🔥 Aggregated (60+ Feeds)")
    max_items = int(req.payload.get("maxItems") or 10)
    provider = str(req.payload.get("provider") or "pollinations")
    space_id = str(req.payload.get("space_id") or "")
    model_choice = req.payload.get("model_choice")
    hf_token = str(req.payload.get("hf_token") or "").strip()

    os.environ["OUTPUT_DIR"] = os.environ.get("OUTPUT_DIR", "/tmp/outputs")

    zip_path, status = xfarm_bulk_process(
        feed,
        hf_token,
        max_items,
        provider,
        space_id,
        model_choice,
        progress=_DummyProgress(),
    )

    if not zip_path:
        raise HTTPException(status_code=500, detail=str(status or "bulk process failed"))

    _upload_file(req.upload_url, zip_path, content_type="application/zip")

    return {"ok": True, "job_id": req.job_id, "status": status}


# Mount Gradio XFarm UI at root path
xfarm_ui = create_xfarm_ui()
app = gr.mount_gradio_app(api, xfarm_ui, path="/")
