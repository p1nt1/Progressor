-- 001_init.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all tables to allow re-running migration
DROP TABLE IF EXISTS progression_log CASCADE;
DROP TABLE IF EXISTS sets CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS muscle_group CASCADE;
DROP TYPE IF EXISTS workout_type CASCADE;

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise muscle groups
CREATE TYPE muscle_group AS ENUM ('chest','back','shoulders','legs','arms','core');

-- Exercises catalog
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  muscle_group muscle_group NOT NULL,
  is_compound BOOLEAN DEFAULT false
);

-- Workout type
CREATE TYPE workout_type AS ENUM ('push','pull','legs','upper','lower','custom');

-- Workouts
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type workout_type DEFAULT 'custom',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);
CREATE INDEX idx_workouts_user ON workouts(user_id);

-- Workout exercises (join table with ordering)
CREATE TABLE workout_exercises (
  id SERIAL PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INT NOT NULL REFERENCES exercises(id),
  "order" SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_we_workout ON workout_exercises(workout_id);

-- Sets
CREATE TABLE sets (
  id SERIAL PRIMARY KEY,
  workout_exercise_id INT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number SMALLINT NOT NULL,
  reps SMALLINT,
  weight_kg DECIMAL(6,2),
  rpe DECIMAL(3,1),
  completed BOOLEAN DEFAULT false
);
CREATE INDEX idx_sets_we ON sets(workout_exercise_id);

-- Progression log
CREATE TABLE progression_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id INT NOT NULL REFERENCES exercises(id),
  previous_weight DECIMAL(6,2),
  new_weight DECIMAL(6,2),
  reason VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_prog_user_ex ON progression_log(user_id, exercise_id);

-- Seed exercises
INSERT INTO exercises (name, muscle_group, is_compound) VALUES

  -- ── CHEST ─────────────────────────────────────────────────────────────────
  ('Bench Press',                    'chest', true),
  ('Incline Dumbbell Press',         'chest', true),
  ('Flat Dumbbell Press',            'chest', true),
  ('Decline Bench Press',            'chest', true),
  ('Machine Chest Press',            'chest', true),
  ('Push-Ups',                       'chest', true),
  ('Dips (Chest)',                   'chest', true),
  ('Cable Flyes',                    'chest', false),
  ('Pec Deck / Machine Fly',         'chest', false),
  ('Low-to-High Cable Fly',          'chest', false),
  ('High-to-Low Cable Fly',          'chest', false),

  -- ── BACK ──────────────────────────────────────────────────────────────────
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

  -- ── SHOULDERS ─────────────────────────────────────────────────────────────
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

  -- ── LEGS ──────────────────────────────────────────────────────────────────
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
  ('Abductor Machine',               'legs', false),

  -- ── ARMS ──────────────────────────────────────────────────────────────────
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
  ('Diamond Push-Ups',               'arms', true),
  ('Tricep Kickbacks',               'arms', false),

  -- ── CORE ──────────────────────────────────────────────────────────────────
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

