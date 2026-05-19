# xfarm-service

FastAPI service for **XFarm** bulk content generation (RSS → carousel image assets ZIP).

Deployed as a HuggingFace Space. Called by the Cloudflare Queue consumer.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/bulk` | Fetch RSS feeds → generate carousel images → upload ZIP to R2 |

## Request body

```json
{
  "job_id": "string",
  "upload_url": "presigned PUT URL to R2",
  "payload": {
    "feed": "🔥 Aggregated (60+ Feeds)",
    "maxItems": 10,
    "provider": "pollinations|hf-space|hf-inference",
    "space_id": "optional HF Space ID for image gen",
    "model_choice": "optional model ID",
    "hf_token": "optional HF token"
  }
}
```

## Run locally

```bash
pip install -r requirements.txt
python main.py
```

## Deploy to HF Space

Set `HF_XFARM_BASE_URL` in `wrangler.toml` / Cloudflare secrets to point to this Space URL.
