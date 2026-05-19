from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

import requests
from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="xfarming hf-studio", version="0.0.0")


class RenderRequest(BaseModel):
    job_id: str
    input_url: Optional[str] = None
    upload_url: str
    payload: Dict[str, Any] = {}


def _put_bytes(upload_url: str, data: bytes, content_type: str):
    # Upload ke R2 via presigned PUT URL (tanpa kredensial)
    resp = requests.put(
        upload_url,
        data=data,
        headers={"content-type": content_type},
        timeout=180,
    )
    resp.raise_for_status()


@app.post("/infinity/render")
def infinity_render(req: RenderRequest):
    """
    Placeholder endpoint.

    TODO:
    - Integrasi INFINITY engine: download input_url (video) -> run pipeline -> upload mp4 ke upload_url.
    - Pastikan tidak menyimpan output besar di repo; gunakan /tmp saja.
    """
    start = time.time()

    # NOTE: buat ngetes plumbing end-to-end dulu, upload file dummy minimal.
    dummy_mp4 = b""  # nanti diganti hasil render mp4
    _put_bytes(req.upload_url, dummy_mp4, content_type="video/mp4")

    return {"ok": True, "job_id": req.job_id, "ms": int((time.time() - start) * 1000)}


@app.post("/trendline/render")
def trendline_render(req: RenderRequest):
    """
    Placeholder endpoint.

    TODO:
    - Integrasi Trendline engine: download input_url (csv) -> render mp4 -> upload mp4 ke upload_url.
    """
    start = time.time()

    dummy_mp4 = b""
    _put_bytes(req.upload_url, dummy_mp4, content_type="video/mp4")

    return {"ok": True, "job_id": req.job_id, "ms": int((time.time() - start) * 1000)}


@app.get("/health")
def health():
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)

