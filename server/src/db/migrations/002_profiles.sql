-- 002_profiles.sql

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  height_cm DECIMAL(5,1),
  weight_kg DECIMAL(5,1),
  sex VARCHAR(20),
  date_of_birth DATE,
  experience_level VARCHAR(20) DEFAULT 'intermediate',
  training_goal VARCHAR(30) DEFAULT 'hypertrophy',
  training_days_per_week SMALLINT DEFAULT 4,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

