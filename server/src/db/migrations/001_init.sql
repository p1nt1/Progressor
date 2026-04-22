-- 001_init.sql  –  single-file schema + seed data

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tear down in dependency order so we can re-run safely
DROP TABLE IF EXISTS sets CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS workout_templates CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS muscle_group CASCADE;
DROP TYPE IF EXISTS workout_type CASCADE;

-- ─── TYPES ──────────────────────────────────────────────────────────────────

CREATE TYPE muscle_group AS ENUM ('chest','back','shoulders','legs','arms','core');
CREATE TYPE workout_type AS ENUM ('push','pull','legs','upper','lower','full body');

-- ─── USERS ──────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cognito_sub VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  display_name VARCHAR(255),
  username VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROFILES ───────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  height_cm DECIMAL(5,1),
  weight_kg DECIMAL(5,1),
  sex VARCHAR(20),
  date_of_birth DATE,
  experience_level VARCHAR(20) DEFAULT 'intermediate',
  training_goal VARCHAR(30) DEFAULT 'hypertrophy',
  training_days_per_week SMALLINT DEFAULT 4,
  selected_split VARCHAR(20) DEFAULT 'ppl',
  split_rotation_index SMALLINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user ON profiles(user_id);

-- ─── EXERCISES ──────────────────────────────────────────────────────────────

CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  muscle_group muscle_group NOT NULL,
  is_compound BOOLEAN DEFAULT false
);

-- ─── WORKOUTS ───────────────────────────────────────────────────────────────

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type workout_type DEFAULT 'push',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  ai_review JSONB DEFAULT NULL
);

CREATE INDEX idx_workouts_user ON workouts(user_id);
CREATE INDEX idx_workouts_user_completed ON workouts(user_id, completed_at DESC);

-- ─── WORKOUT EXERCISES ─────────────────────────────────────────────────────

CREATE TABLE workout_exercises (
  id SERIAL PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INT NOT NULL REFERENCES exercises(id),
  "order" SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_we_workout ON workout_exercises(workout_id);

-- ─── SETS ───────────────────────────────────────────────────────────────────

CREATE TABLE sets (
  id SERIAL PRIMARY KEY,
  workout_exercise_id INT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number SMALLINT NOT NULL,
  reps SMALLINT,
  weight_kg DECIMAL(6,2),
  completed BOOLEAN DEFAULT false
);

CREATE INDEX idx_sets_we ON sets(workout_exercise_id);

-- ─── WORKOUT TEMPLATES ─────────────────────────────────────────────────────

CREATE TABLE workout_templates (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'push',
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_templates_user ON workout_templates(user_id);

-- ─── SEED EXERCISES ─────────────────────────────────────────────────────────

INSERT INTO exercises (name, muscle_group, is_compound) VALUES

  -- CHEST
  ('Bench Press',                    'chest', true),
  ('Incline Dumbbell Press',         'chest', true),
  ('Flat Dumbbell Press',            'chest', true),
  ('Decline Bench Press',            'chest', true),
  ('Machine Chest Press',            'chest', true),
  ('Push-Ups',                       'chest', true),
  ('Dips (Chest)',                   'chest', true),
  ('Cable Flyes',                    'chest', false),
  ('Pec Deck / Machine Fly',        'chest', false),
  ('Low-to-High Cable Fly',         'chest', false),
  ('High-to-Low Cable Fly',         'chest', false),

  -- BACK
  ('Deadlift',                       'back', true),
  ('Barbell Row',                    'back', true),
  ('T-Bar Row',                      'back', true),
  ('Single-Arm Dumbbell Row',        'back', true),
  ('Chest-Supported Row',            'back', true),
  ('Pendlay Row',                    'back', true),
  ('Pull-Ups',                       'back', true),
  ('Lat Pulldown',                   'back', false),
  ('Close-Grip Lat Pulldown',        'back', true),
  ('Seated Cable Row',               'back', true),
  ('Straight-Arm Pulldown',          'back', false),
  ('Hyperextensions',                'back', false),
  ('Shrugs',                         'back', false),

  -- SHOULDERS
  ('Overhead Press',                 'shoulders', true),
  ('Dumbbell Shoulder Press',        'shoulders', true),
  ('Arnold Press',                   'shoulders', true),
  ('Machine Shoulder Press',         'shoulders', true),
  ('Upright Row',                    'shoulders', true),
  ('Lateral Raises',                 'shoulders', false),
  ('Cable Lateral Raise',            'shoulders', false),
  ('Dumbbell Front Raise',           'shoulders', false),
  ('Face Pulls',                     'shoulders', false),
  ('Rear Delt Flyes',                'shoulders', false),

  -- LEGS
  ('Barbell Squat',                  'legs', true),
  ('Hack Squat',                     'legs', true),
  ('Goblet Squat',                   'legs', true),
  ('Bulgarian Split Squat',          'legs', true),
  ('Walking Lunges',                 'legs', true),
  ('Reverse Lunges',                 'legs', true),
  ('Step-Ups',                       'legs', true),
  ('Leg Press',                      'legs', true),
  ('Romanian Deadlift',              'legs', true),
  ('Sumo Deadlift',                  'legs', true),
  ('Hip Thrust',                     'legs', true),
  ('Leg Curl',                       'legs', false),
  ('Leg Extension',                  'legs', false),
  ('Nordic Hamstring Curl',          'legs', false),
  ('Glute Bridge',                   'legs', false),
  ('Calf Raises',                    'legs', false),
  ('Seated Calf Raise',              'legs', false),
  ('Abductor Machine',              'legs', false),

  -- ARMS
  ('Barbell Curl',                   'arms', false),
  ('EZ Bar Curl',                    'arms', false),
  ('Preacher Curl',                  'arms', false),
  ('Hammer Curl',                    'arms', false),
  ('Incline Dumbbell Curl',          'arms', false),
  ('Cable Curl',                     'arms', false),
  ('Concentration Curl',             'arms', false),
  ('Reverse Curl',                   'arms', false),
  ('Wrist Curls',                    'arms', false),
  ('Tricep Pushdown',                'arms', false),
  ('Skull Crushers',                 'arms', false),
  ('Overhead Tricep Extension',      'arms', false),
  ('Cable Overhead Tricep Extension','arms', false),
  ('Close-Grip Bench Press',         'arms', true),
  ('Dips (Triceps)',                 'arms', true),
  ('Diamond Push-Ups',              'arms', true),
  ('Tricep Kickbacks',              'arms', false),

  -- CORE
  ('Plank',                          'core', false),
  ('Side Plank',                     'core', false),
  ('Dead Bug',                       'core', false),
  ('Ab Wheel Rollout',               'core', false),
  ('Cable Crunch',                   'core', false),
  ('Hanging Leg Raise',              'core', false),
  ('Leg Raise',                      'core', false),
  ('Sit-Ups',                        'core', false),
  ('Bicycle Crunch',                 'core', false),
  ('Russian Twist',                  'core', false),
  ('Pallof Press',                   'core', false),
  ('Dragon Flag',                    'core', false),
  ('Woodchop',                       'core', false),
  ('Landmine Rotation',              'core', false);
