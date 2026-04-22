export interface AuthUser {
  id: string;
  googleSub: string;
  email: string;
  displayName: string | null;
}

export interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
  isCompound: boolean;
}

export interface WorkoutSet {
  id?: number;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  completed: boolean;
}

export interface WorkoutExercise {
  id?: number;
  exerciseId: number;
  exerciseName?: string;
  order: number;
  sets: WorkoutSet[];
}

export interface Workout {
  id?: string;
  userId: string;
  name: string;
  type: string;
  startedAt?: string;
  completedAt?: string | null;
  notes?: string;
  exercises: WorkoutExercise[];
}


