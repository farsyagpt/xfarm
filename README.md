---
title: xfarm
emoji: 🚜
colorFrom: green
colorTo: blue
sdk: gradio
sdk_version: 4.44.1
app_file: app.py
pinned: false
---

# xfarming

Content factory: Hero Video, Trendline, XFarm — satu dashboard, deploy di Cloudflare + HuggingFace.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite → Cloudflare Pages |
| API + Orchestrator | Hono on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 (presigned URLs) |
| Job Queue | Cloudflare Queues |
| Compute | HuggingFace Spaces (Python) |

## Struktur

```
apps/
  web/          React + Vite frontend (Cloudflare Pages)
  api/          Cloudflare Worker — REST API + Queue consumer

packages/
  shared/       Zod schemas & TypeScript types (shared between web + api)

services/
  hf-studio/    HF Space: /infinity/render + /trendline/render
  xfarm-service/ HF Space: /api/bulk (XFarm RSS → carousel ZIP)

hf/
  agenxy.py         XFarm bulk engine (RSS fetch, image gen, carousel overlay)
  infinity.py       INFINITY pipeline (TTS, audio enhance, subtitle render)
  trendline_engine.py  Trendline animated chart renderer

infra/
  d1/migrations/  D1 SQL schema

app.py            HF Space entry point (unified: all 3 engines + Gradio UI)
requirements.txt  Python deps for HF Space
```

## Flow

1. User upload input (video/CSV) → web calls `POST /api/jobs` → gets presigned PUT URL
2. Web uploads file directly to R2 via presigned PUT
3. Web calls `POST /api/jobs/:id/start` → Worker enqueues job to Cloudflare Queue
4. Queue consumer calls HF Space endpoint with presigned GET (input) + PUT (output)
5. HF Space runs compute, uploads result to R2
6. Web polls `GET /api/jobs/:id` until `done`, then downloads via `/api/jobs/:id/download`

## Setup

### 1. Install deps

```bash
pnpm install
```

### 2. Create D1 database

```bash
wrangler d1 create xfarming
# Paste the returned database_id into apps/api/wrangler.toml
wrangler d1 execute xfarming --file=infra/d1/migrations/0001_init.sql
```

### 3. Set secrets

```bash
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_SECRET
wrangler secret put R2_ACCOUNT_ID
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put R2_BUCKET_NAME
wrangler secret put HF_STUDIO_BASE_URL   # e.g. https://farsyagpt-xfarm.hf.space
wrangler secret put HF_XFARM_BASE_URL    # same or separate Space
```

### 4. Dev

```bash
# API (Workers)
pnpm -C apps/api dev

# Web
pnpm -C apps/web dev
```

## Notes

- Output besar (mp4/zip) **wajib** di R2, tidak pernah di repo
- `node_modules/`, `dist/`, `.wrangler/`, `output/`, `*.mp4`, `*.zip` sudah di `.gitignore`
- Cookie session pakai `HttpOnly; Secure; SameSite=Lax` (JWT HS256, 14 hari)
- Aktivasi akun manual: `POST /api/admin/users/:id/activate` dengan header `x-admin-secret`
