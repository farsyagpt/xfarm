export type Env = {
  DB: D1Database;
  JOBS: Queue;

  APP_ORIGIN: string;
  JWT_SECRET: string;
  ADMIN_SECRET: string;

  // R2 S3 API creds (buat presigned URLs)
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;

  // HF Studio (gabungan Infinity + Trendline)
  HF_STUDIO_BASE_URL: string;

  // XFarm (Space terpisah)
  HF_XFARM_BASE_URL: string;
};
