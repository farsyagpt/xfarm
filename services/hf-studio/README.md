# hf-studio

FastAPI service for **Hero Video (INFINITY)** and **Trendline** compute.

Deployed as a HuggingFace Space. Called by the Cloudflare Queue consumer.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/infinity/render` | Download input video → run INFINITY pipeline → upload mp4 to R2 |
| POST | `/trendline/render` | Download input CSV → render trendline mp4 → upload to R2 |

## Request body (all POST)

```json
{
  "job_id": "string",
  "input_url": "presigned GET URL from R2",
  "upload_url": "presigned PUT URL to R2",
  "payload": {
    "story": "...",
    "voice_gender": "male|female",
    "title": "...",
    "subtitle": "...",
    "aspect_ratio": "16:9|9:16|4:3|1:1",
    "theme": "black|white"
  }
}
```

## Run locally

```bash
pip install -r requirements.txt
python main.py
```

## Deploy to HF Space

Set `HF_STUDIO_BASE_URL` in `wrangler.toml` / Cloudflare secrets to point to this Space URL.
