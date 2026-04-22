// ---------------------------------------------------------------------------
// Shared domain types — client
// ---------------------------------------------------------------------------

// ── Auth ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

// ── Exercise ────────────────────────────────────────────────────────────────
export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  is_compound: boolean;
}

// ── Workout ─────────────────────────────────────────────────────────────────
export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe: number | null;
  completed: boolean;
}

export interface ActiveExercise {
  exerciseName: string;
  exerciseId?: number;
  order: number;
  sets: WorkoutSet[];
}

export interface ActivePlan {
  name: string;
  type: string;
  exercises: ActiveExercise[];
}

export interface WorkoutSummary {
  id: string;
  name: string;
  type: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
}

// ── AI Reviews ──────────────────────────────────────────────────────────
export interface ExerciseReview {
  exerciseName: string;
  verdict: 'improved' | 'maintained' | 'declined';
  comment: string;
}

export interface WorkoutReview {
  type: string;
  review: {
    summary: string;
    exerciseReviews: ExerciseReview[];
    tip: string;
  };
}

export interface ProgressionMilestone {
  id: number;
  exercise_id: number;
  exercise_name: string;
  previous_weight: number;
  new_weight: number;
  next_target_weight: number;
  is_current: boolean;
  reason: string;
  created_at: string;
}

export interface ProgressionSummaryItem {
  exercise_id: number;
  exercise_name: string;
  milestone_count: number;
  starting_weight: number;
  current_weight: number;
  last_progression_at: string;
}

// ── Template ─────────────────────────────────────────────────────────────────
export interface TemplateSet {
  setNumber: number;
  reps: number;
  weightKg: number;
}

export interface TemplateExercise {
  exerciseId: number;
  exerciseName: string;
  order: number;
  sets: TemplateSet[];
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  type: string;
  exercises: TemplateExercise[];
  created_at: string;
  updated_at: string;
}

// ── Profile ──────────────────────────────────────────────────────────────────
export interface ProfileData {
  heightCm: number | null;
  weightKg: number | null;
  sex: string;
  dateOfBirth: string;
  experienceLevel: string;
  trainingGoal: string;
  trainingDaysPerWeek: number;
}

// ── UI / Theme ───────────────────────────────────────────────────────────────
export type Theme = 'dark' | 'light';

// ── Stats ────────────────────────────────────────────────────────────────────
export interface OneRM {
  exerciseId: number;
  exerciseName: string;
  estimated1RM: number;
}

export interface WorkoutStats {
  totalWorkouts: number;
  weekStreak: number;
  oneRMs: OneRM[];
}
