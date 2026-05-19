# hf-studio (HuggingFace Space)

Satu Space untuk 2 engine:

- `POST /infinity/render`
- `POST /trendline/render`

Kontrak request (dari Cloudflare Queue consumer):

```json
{
  "job_id": "xxx",
  "input_url": "https://... (presigned GET dari R2, optional untuk xfarm)",
  "upload_url": "https://... (presigned PUT ke R2)",
  "payload": {}
}
```

Saat ini masih **placeholder** (upload mp4 kosong) untuk ngetes plumbing end-to-end.

Next step:
- copy/port engine INFINITY + Trendline ke sini
- output mp4 beneran diupload ke `upload_url`

