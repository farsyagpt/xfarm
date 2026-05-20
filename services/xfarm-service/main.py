"""
xfarming xfarm-service — async bulk content service
"""
from __future__ import annotations

import logging
import os
import sys
import threading
from typing import Any, Dict, Optional

import requests
from fastapi import FastAPI
from pydantic import BaseModel

_repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from hf.agenxy import bulk_process as xfarm_bulk_process  # noqa: E402

os.environ.setdefault("OUTPUT_DIR", "/tmp/outputs")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s",
                    handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

app = FastAPI(title="xfarming xfarm-service", version="2.0.0")


class RenderRequest(BaseModel):
    job_id: str
    input_url: Optional[str] = None
    upload_url: str
    output_key: Optional[str] = None
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None
    payload: Dict[str, Any] = {}


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


def _run_xfarm(req: RenderRequest) -> None:
    job_id = req.job_id
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

        zip_path, status = xfarm_bulk_process(
            feed, hf_token, max_items, provider, space_id, model_choice,
            progress=_Progress(),
        )
        if not zip_path:
            raise RuntimeError(str(status or "bulk failed"))

        _upload(req.upload_url, zip_path, "application/zip")
        _callback(req.webhook_url or "", req.webhook_secret or "", job_id, output_key=output_key)
        logger.info("[%s] XFarm done.", job_id)
    except Exception as e:
        logger.error("[%s] XFarm failed: %s", job_id, e)
        _callback(req.webhook_url or "", req.webhook_secret or "", job_id, error=str(e))


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/api/bulk", status_code=202)
def xfarm_bulk(req: RenderRequest):
    threading.Thread(target=_run_xfarm, args=(req,), daemon=True).start()
    return {"ok": True, "job_id": req.job_id, "status": "accepted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "7861")))
