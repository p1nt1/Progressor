// ---------------------------------------------------------------------------
// Workout domain enums and constants
// ---------------------------------------------------------------------------

export enum WorkoutType {
  Push   = 'push',
  Pull   = 'pull',
  Legs   = 'legs',
  Upper  = 'upper',
  Lower  = 'lower',
  Custom = 'custom',
}

export enum MuscleGroup {
  All       = 'all',
  Chest     = 'chest',
  Back      = 'back',
  Shoulders = 'shoulders',
  Legs      = 'legs',
  Arms      = 'arms',
  Core      = 'core',
}

/** All selectable workout types (excludes 'all' filter) */
export const WORKOUT_TYPES: WorkoutType[] = [
  WorkoutType.Push,
  WorkoutType.Pull,
  WorkoutType.Legs,
  WorkoutType.Upper,
  WorkoutType.Lower,
  WorkoutType.Custom,
];

/** Muscle group filter list, including the 'all' catch-all */
export const MUSCLE_GROUP_FILTERS: MuscleGroup[] = [
  MuscleGroup.All,
  MuscleGroup.Chest,
  MuscleGroup.Back,
  MuscleGroup.Shoulders,
  MuscleGroup.Legs,
  MuscleGroup.Arms,
  MuscleGroup.Core,
];

/** Icon and display label for each muscle group — shared across all filter UIs */
export const MUSCLE_GROUP_META: Record<MuscleGroup, { icon: string; label: string }> = {
  [MuscleGroup.All]:       { icon: '💪', label: 'All' },
  [MuscleGroup.Chest]:     { icon: '🫁', label: 'Chest' },
  [MuscleGroup.Back]:      { icon: '🔙', label: 'Back' },
  [MuscleGroup.Shoulders]: { icon: '🏋️', label: 'Shoulders' },
  [MuscleGroup.Legs]:      { icon: '🦵', label: 'Legs' },
  [MuscleGroup.Arms]:      { icon: '💪', label: 'Arms' },
  [MuscleGroup.Core]:      { icon: '⚡', label: 'Core' },
};

