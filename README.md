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

# xfarming (monorepo)

Stack:
- Frontend: React + Vite (Cloudflare Pages)
- API + Orchestrator: Cloudflare Workers + D1 + Queues
- Storage: Cloudflare R2 (S3 API presigned URLs)
- Compute: HuggingFace Spaces

## Struktur
- `apps/web` — frontend
- `apps/api` — Cloudflare Worker (API + Queue consumer)
- `packages/shared` — shared zod schemas/types
- `infra/d1/migrations` — D1 schema
- `services/hf-studio` — 1 HF Space gabungan (Infinity + Trendline) (placeholder)
- `services/xfarm-service` — XFarm (placeholder)

## Jalanin lokal (dev)

### 1) Install deps
```bash
pnpm -C . install
```

### 2) Jalankan API (Workers)
Masuk `apps/api/wrangler.toml` dan isi `database_id` + env vars.

Dev:
```bash
pnpm -C apps/api dev
```

### 3) Jalankan web
```bash
pnpm -C apps/web dev
```

Web akan proxy `/api/*` ke `http://localhost:8787`.

## Notes penting
- Output besar (mp4/zip) **wajib** disimpan di R2, bukan di repo.
- Flow job:
  1) Web create job → dapat presigned PUT untuk input (video/csv)
  2) Web upload input → start job (enqueue)
  3) Queue consumer call HF → HF upload output ke R2 via presigned PUT
  4) Web download via `/api/jobs/:id/download` (presigned GET)

