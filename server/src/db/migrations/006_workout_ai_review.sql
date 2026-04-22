-- Add ai_review column to store the cached AI comparison per workout
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS ai_review JSONB DEFAULT NULL;

