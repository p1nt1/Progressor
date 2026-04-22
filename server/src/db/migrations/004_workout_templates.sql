-- 004_workout_templates.sql

CREATE TABLE IF NOT EXISTS workout_templates (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'custom',
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_templates_user ON workout_templates(user_id);

