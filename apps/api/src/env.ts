export type Env = {
  DB: D1Database;
  JOBS: Queue;

  APP_ORIGIN: string;
  JWT_SECRET: string;
  ADMIN_SECRET: string;

  // Worker's own public URL (for webhook callbacks from HF Space)
  WORKER_BASE_URL: string; // e.g. https://xfarming-api.farsyagpt.workers.dev

  // Supabase Storage (S3-compatible, free tier 1GB)
  SUPABASE_URL: string;           // e.g. https://xxxx.supabase.co
  SUPABASE_S3_ACCESS_KEY: string; // Storage → S3 Access Keys
  SUPABASE_S3_SECRET_KEY: string;
  SUPABASE_BUCKET: string;        // e.g. "xfarming"

  // HF Space — unified compute (Infinity + Trendline + XFarm)
  HF_STUDIO_BASE_URL: string;     // e.g. https://farsyagpt-xfarm.hf.space
  HF_XFARM_BASE_URL: string;      // same Space or separate
};
