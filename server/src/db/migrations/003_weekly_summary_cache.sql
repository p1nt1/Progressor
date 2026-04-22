-- 003_weekly_summary_cache.sql

CREATE TABLE IF NOT EXISTS weekly_summary_cache (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wsc_user ON weekly_summary_cache(user_id);

