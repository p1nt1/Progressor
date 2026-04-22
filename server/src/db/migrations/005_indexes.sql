-- 005_indexes.sql
-- Composite index to speed up history, stats, and set-history queries
-- that filter by user_id and completed_at

CREATE INDEX IF NOT EXISTS idx_workouts_user_completed
  ON workouts(user_id, completed_at DESC);

