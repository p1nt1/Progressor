// ── Auth ────────────────────────────────────────────────────────────────────
export type AuthUser = {
  email: string;
  name: string;
  picture: string;
  sub: string;
};

export type SessionUser = {
  id: string;
  email: string;
  displayName: string | null;
  picture: string | null;
};

// ── Exercise ────────────────────────────────────────────────────────────────
export type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
  is_compound: boolean;
};

// ── Workout ─────────────────────────────────────────────────────────────────
export type WorkoutSet = {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
};

export type ActiveExercise = {
  exerciseName: string;
  exerciseId?: number;
  order: number;
  sets: WorkoutSet[];
};

export type ActivePlan = {
  name: string;
  type: string;
  exercises: ActiveExercise[];
  /** If set, advance splitRotationIndex to this value on workout completion */
  nextSplitRotationIndex?: number;
};

export type WorkoutSummary = {
  id: string;
  name: string;
  type: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
};

// ── AI Reviews ──────────────────────────────────────────────────────────
export type ExerciseReview = {
  exerciseName: string;
  verdict: 'improved' | 'maintained' | 'declined' | 'new';
  kgDiff: number | null;
  repsDiff: number | null;
  comment: string;
};

export type WorkoutReview = {
  type: string;
  review: {
    summary: string;
    exerciseReviews: ExerciseReview[];
    tip: string;
  };
};


// ── Template ─────────────────────────────────────────────────────────────────
export type TemplateSet = {
  setNumber: number;
  reps: number;
  weightKg: number;
};

export type TemplateExercise = {
  exerciseId: number;
  exerciseName: string;
  order: number;
  sets: TemplateSet[];
};

export type WorkoutTemplate = {
  id: number;
  name: string;
  type: string;
  exercises: TemplateExercise[];
  created_at: string;
  updated_at: string;
};

// ── Profile ──────────────────────────────────────────────────────────────────
export type ProfileData = {
  heightCm: number | null;
  weightKg: number | null;
  sex: string;
  dateOfBirth: string;
  experienceLevel: string;
  trainingGoal: string;
  trainingDaysPerWeek: number;
  selectedSplit: string;
  splitRotationIndex: number;
};

// ── UI / Theme ───────────────────────────────────────────────────────────────
export type Theme = 'dark' | 'light';

// ── Workout Detail ───────────────────────────────────────────────────────────
export type DetailSet = {
  id: number;
  set_number: number;
  reps: number;
  weight_kg: number;
  completed: boolean;
};

export type DetailExercise = {
  exercise_name: string;
  sets: DetailSet[];
};

export type WorkoutDetailData = {
  name: string;
  type: string;
  started_at: string;
  completed_at: string | null;
  completed_sets_count: number;
  total_sets_count: number;
  exercises?: DetailExercise[];
  ai_review?: WorkoutReview | null;
};

// ── Stats ────────────────────────────────────────────────────────────────────
export type OneRM = {
  exerciseId: number;
  exerciseName: string;
  estimated1RM: number;
};

export type WorkoutStats = {
  totalWorkouts: number;
  weekStreak: number;
  oneRMs: OneRM[];
};

// ── Builder ──────────────────────────────────────────────────────────────────
export type BuilderExercise = {
  exerciseId: number;
  exerciseName: string;
  sets: WorkoutSet[];
};

// ── Splits ───────────────────────────────────────────────────────────────────
export type SplitDay = {
  label: string;
  focus: string;
  color: string;
};

export type Split = {
  label: string;
  description: string;
  /** Maps training-days-per-week → ordered array of day keys */
  daysMap: Record<number, string[]>;
  days: Record<string, SplitDay>;
};
