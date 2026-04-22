import { useState } from 'react';
import { workouts as workoutsApi } from '../api/client';
import { createDefaultSets } from '../helpers/workout.helpers';
import type { BuilderExercise } from '../components/WorkoutBuilder/WorkoutBuilder';

/**
 * Shared hook for managing a list of selected exercises with sets.
 * Used by both QuickWorkoutModal and CreateWorkout (custom mode).
 */
export function useExerciseBuilder() {
  const [selected, setSelected] = useState<BuilderExercise[]>([]);

  const addExercise = async (ex: { id: number; name: string }) => {
    if (selected.find((s) => s.exerciseId === ex.id)) return;
    let sets = createDefaultSets();
    try {
      const res = await workoutsApi.lastWeights([ex.id]);
      const lastSets: { setNumber: number; weightKg: number; reps: number }[] = res.data[ex.id];
      if (lastSets?.length) {
        sets = lastSets.map((ls) => ({
          setNumber: ls.setNumber,
          reps: ls.reps,
          weightKg: ls.weightKg,
          completed: false,
        }));
      }
    } catch { /* fall back to defaults */ }
    setSelected((prev) => [...prev, { exerciseId: ex.id, exerciseName: ex.name, sets }]);
  };

  const removeExercise = (idx: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weightKg', value: number) => {
    setSelected((prev) =>
      prev.map((ex, ei) =>
        ei !== exIdx ? ex : {
          ...ex,
          sets: ex.sets.map((s, si) => si !== setIdx ? s : { ...s, [field]: value }),
        },
      ),
    );
  };

  const addSet = (exIdx: number) => {
    setSelected((prev) =>
      prev.map((ex, ei) =>
        ei !== exIdx ? ex : {
          ...ex,
          sets: [
            ...ex.sets,
            {
              setNumber: ex.sets.length + 1,
              reps: ex.sets.at(-1)?.reps ?? 0,
              weightKg: ex.sets.at(-1)?.weightKg ?? 0,
              completed: false,
            },
          ],
        },
      ),
    );
  };

  const reset = () => setSelected([]);

  return { selected, addExercise, removeExercise, updateSet, addSet, reset };
}

