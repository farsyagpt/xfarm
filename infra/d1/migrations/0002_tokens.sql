-- Add token balance to users
ALTER TABLE users ADD COLUMN tokens INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Token transactions log
CREATE TABLE IF NOT EXISTS token_txns (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  delta       INTEGER NOT NULL,   -- positive = topup, negative = spend
  reason      TEXT NOT NULL,      -- 'topup' | 'job_infinity' | 'job_trendline' | 'job_xfarm'
  job_id      TEXT,
  created_at  TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_txns_user ON token_txns (user_id, created_at DESC);
