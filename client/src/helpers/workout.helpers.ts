import { WorkoutType, MuscleGroup } from './workoutTypes';

// ---------------------------------------------------------------------------
// roundToHalf
// Rounds a weight value to the nearest 0.5kg increment.
// e.g. 13.3 → 13.5, 12.1 → 12.0
// ---------------------------------------------------------------------------
export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

// ---------------------------------------------------------------------------
// detectWorkoutType
// Infers the workout type from a list of muscle groups trained.
// ---------------------------------------------------------------------------
export function detectWorkoutType(muscleGroups: (MuscleGroup | string)[]): WorkoutType {
  const counts: Record<string, number> = {};
  muscleGroups.forEach((g) => (counts[g] = (counts[g] || 0) + 1));

  const chest     = counts[MuscleGroup.Chest]     || 0;
  const back      = counts[MuscleGroup.Back]      || 0;
  const shoulders = counts[MuscleGroup.Shoulders] || 0;
  const legs      = counts[MuscleGroup.Legs]      || 0;
  const arms      = counts[MuscleGroup.Arms]      || 0;
  const core      = counts[MuscleGroup.Core]      || 0;

  const upper = chest + back + shoulders + arms;
  const lower = legs + core;

  if (legs > 0 && upper === 0)                                           return WorkoutType.Legs;
  if ((chest > 0 || shoulders > 0) && back === 0 && legs === 0)         return WorkoutType.Push;
  if (back > 0 && chest === 0 && legs === 0)                             return WorkoutType.Pull;
  if (upper > 0 && lower === 0)                                          return WorkoutType.Upper;
  if (lower > 0 && upper === 0)                                          return WorkoutType.Lower;
  return WorkoutType.Custom;
}

// ---------------------------------------------------------------------------
// typeBadgeClass
// Returns the CSS badge class for a given workout type.
// ---------------------------------------------------------------------------
const TYPED_WORKOUT_TYPES = new Set<string>(Object.values(WorkoutType).filter((t) => t !== WorkoutType.Custom));

export function typeBadgeClass(type: string): string {
  const t = (type || WorkoutType.Custom).toLowerCase();
  return `badge badge--${TYPED_WORKOUT_TYPES.has(t) ? t : WorkoutType.Custom}`;
}

// ---------------------------------------------------------------------------
// createDefaultSets
// Builds the standard 3-set default for a new exercise.
// ---------------------------------------------------------------------------
export interface DefaultSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe: null;
  completed: boolean;
}

export function createDefaultSets(count = 3, reps = 0, weightKg = 0): DefaultSet[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    reps,
    weightKg,
    rpe: null,
    completed: false,
  }));
}

// ---------------------------------------------------------------------------
// formatDuration
// Human-readable duration between two ISO timestamps.
// ---------------------------------------------------------------------------
export function formatDuration(startedAt: string | null | undefined, completedAt?: string | null): string {
  if (!startedAt) return '—';
  const end = completedAt ? new Date(completedAt) : new Date();
  const mins = Math.round((end.getTime() - new Date(startedAt).getTime()) / 60000);
  if (!isFinite(mins) || mins < 0) return '—';
  if (mins < 1) return '< 1m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ---------------------------------------------------------------------------
// formatDate
// Short locale date string (e.g. "Mon, 21 Apr").
// ---------------------------------------------------------------------------
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}
