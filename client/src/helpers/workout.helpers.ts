import { WorkoutType } from './workoutTypes';
import type { WorkoutSet, ActiveExercise, Exercise } from '../types';

// ---------------------------------------------------------------------------
// roundToHalf
// Rounds a weight value to the nearest 0.5kg increment.
// e.g. 13.3 → 13.5, 12.1 → 12.0
// ---------------------------------------------------------------------------
export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

// ---------------------------------------------------------------------------
// typeBadgeClass
// Returns the CSS badge class for a given workout type.
// ---------------------------------------------------------------------------
const TYPED_WORKOUT_TYPES = new Set<string>(Object.values(WorkoutType));

export function typeBadgeClass(type: string): string {
  const t = (type || WorkoutType.Push).toLowerCase().replace(/\s+/g, '-');
  return `badge badge--${TYPED_WORKOUT_TYPES.has(type?.toLowerCase() ?? '') ? t : 'other'}`;
}

// ---------------------------------------------------------------------------
// createDefaultSets
// Builds the standard 3-set default for a new exercise.
// ---------------------------------------------------------------------------
export function createDefaultSets(count = 3, reps = 0, weightKg = 0): WorkoutSet[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    reps,
    weightKg,
    completed: false,
  }));
}

// ---------------------------------------------------------------------------
// mapToActiveExercises
// Normalises raw AI / template exercises into typed ActiveExercise[].
// Optionally resolves exercise IDs from a lookup list.
// ---------------------------------------------------------------------------
export function mapToActiveExercises(
  raw: Array<Record<string, unknown>>,
  exerciseList?: Exercise[],
): ActiveExercise[] {
  const lookup = exerciseList
    ? new Map(exerciseList.map((e) => [e.name.toLowerCase(), e]))
    : undefined;

  return raw.map((ex: Record<string, unknown>, i: number) => {
    const found = lookup?.get((ex.exerciseName as string)?.toLowerCase());
    return {
      exerciseName: (found?.name ?? ex.exerciseName) as string,
      exerciseId: (found?.id ?? ex.exerciseId) as number | undefined,
      order: (ex.order as number) ?? i + 1,
      sets: ((ex.sets || []) as Record<string, unknown>[]).map((s) => ({
        setNumber: s.setNumber as number,
        reps: s.reps as number,
        weightKg: s.weightKg as number,
        completed: (s.completed ?? false) as boolean,
      })),
    };
  });
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
