import { type LucideIcon, LayoutGrid, Shield, AlignJustify, ChevronsUp, Footprints, Dumbbell, Crosshair } from 'lucide-react';

export enum WorkoutType {
  Push           = 'push',
  Pull           = 'pull',
  Legs           = 'legs',
  Upper          = 'upper',
  Lower          = 'lower',
  FullBody       = 'full body'
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

/** All selectable workout types */
export const WORKOUT_TYPES: WorkoutType[] = [
  WorkoutType.Push,
  WorkoutType.Pull,
  WorkoutType.Legs,
  WorkoutType.Upper,
  WorkoutType.Lower,
  WorkoutType.FullBody
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
export const MUSCLE_GROUP_META: Record<MuscleGroup, { icon: LucideIcon; label: string }> = {
  [MuscleGroup.All]:       { icon: LayoutGrid,   label: 'All' },
  [MuscleGroup.Chest]:     { icon: Shield,        label: 'Chest' },
  [MuscleGroup.Back]:      { icon: AlignJustify,  label: 'Back' },
  [MuscleGroup.Shoulders]: { icon: ChevronsUp,    label: 'Shoulders' },
  [MuscleGroup.Legs]:      { icon: Footprints,    label: 'Legs' },
  [MuscleGroup.Arms]:      { icon: Dumbbell,      label: 'Arms' },
  [MuscleGroup.Core]:      { icon: Crosshair,     label: 'Core' },
};
