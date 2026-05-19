"""
xfarming HF Studio — production compute service
================================================
Endpoints called by the Cloudflare Queue consumer:
  POST /infinity/render   — Hero Video (INFINITY pipeline)
  POST /trendline/render  — Trendline animated chart
  GET  /health            — Health check

All heavy output is written to /tmp and uploaded to R2 via presigned PUT.
Nothing large is stored in the repo.
"""
from __future__ import annotations

import asyncio
import os
import sys
import tempfile
from typing import Any, Dict, Optional

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Ensure hf/ modules are importable when running from repo root or this dir
_repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from hf.infinity import AutoSubtitlePipeline  # noqa: E402
from hf.trendline_engine import render_dynamic_video  # noqa: E402

# HF Spaces: always write to /tmp so nothing pollutes the repo
os.environ.setdefault("OUTPUT_DIR", "/tmp/outputs")

app = FastAPI(title="xfarming hf-studio", version="1.0.0")


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


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/infinity/render")
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


@app.post("/trendline/render")
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


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)
