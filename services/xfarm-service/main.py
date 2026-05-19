"""
xfarming XFarm Service — production compute service
====================================================
Endpoint called by the Cloudflare Queue consumer:
  POST /api/bulk   — Bulk RSS → carousel image assets (ZIP)
  GET  /health     — Health check

Output ZIP is uploaded to R2 via presigned PUT.
Nothing large is stored in the repo (/tmp only).
"""
from __future__ import annotations

import os
import sys
from typing import Any, Dict, Optional

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Ensure hf/ modules are importable when running from repo root or this dir
_repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from hf.agenxy import bulk_process as xfarm_bulk_process  # noqa: E402

# HF Spaces: always write to /tmp
os.environ.setdefault("OUTPUT_DIR", "/tmp/outputs")

app = FastAPI(title="xfarming xfarm-service", version="1.0.0")


class RenderRequest(BaseModel):
    job_id: str
    input_url: Optional[str] = None
    upload_url: str
    payload: Dict[str, Any] = {}


def _upload_file(upload_url: str, file_path: str, content_type: str) -> None:
    """Upload a local file to a presigned PUT URL (R2)."""
    with open(file_path, "rb") as f:
        r = requests.put(
            upload_url,
            data=f,
            headers={"content-type": content_type},
            timeout=300,
        )
    r.raise_for_status()


class _DummyProgress:
    """No-op progress callback so bulk_process works outside Gradio context."""
    def __call__(self, *_args, **_kwargs):
        return None


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/api/bulk")
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

    # Ensure output goes to /tmp
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


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "7861"))
    uvicorn.run(app, host="0.0.0.0", port=port)
