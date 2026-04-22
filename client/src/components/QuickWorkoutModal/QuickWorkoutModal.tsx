import { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { useExercises } from '../../hooks/queries';
import { useExerciseBuilder } from '../../hooks/useExerciseBuilder';
import { setActivePlan } from '../../store/workoutSlice';
import { MuscleGroup } from '../../helpers/workoutTypes.ts';
import { detectWorkoutType } from '../../helpers/workout.helpers';
import { WorkoutBuilder } from '../WorkoutBuilder/WorkoutBuilder.tsx';
import './QuickWorkoutModal.css';

export function QuickWorkoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { data: exerciseList = [] } = useExercises();
  const [name, setName] = useState('');
  const { selected, addExercise, removeExercise, updateSet, addSet, reset } = useExerciseBuilder();
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup>(MuscleGroup.All);

  if (!open) return null;

  const handleStart = () => {
    if (selected.length === 0) return;

    const muscleGroups = selected.map((ex) => {
      const found = exerciseList.find((e) => e.id === ex.exerciseId);
      return (found?.muscle_group ?? MuscleGroup.Core) as MuscleGroup;
    });
    const detectedType = detectWorkoutType(muscleGroups);

    dispatch(setActivePlan({
      name: name || 'Quick Workout',
      type: detectedType,
      exercises: selected.map((ex, i) => ({
        exerciseName: ex.exerciseName,
        exerciseId: ex.exerciseId,
        order: i + 1,
        sets: ex.sets,
      })),
    }));
    setName('');
    reset();
    onClose();
  };

  return (
    <div className="qw-overlay" onClick={onClose}>
      <div className="qw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qw-modal__header">
          <h2 className="qw-modal__title">⚡ Quick Workout</h2>
          <button className="qw-modal__close" onClick={onClose}>✕</button>
        </div>

        <input
          className="qw-modal__name"
          placeholder="Workout name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <WorkoutBuilder
          exerciseList={exerciseList}
          selected={selected}
          muscleFilter={muscleFilter}
          onMuscleFilterChange={setMuscleFilter}
          onAddExercise={addExercise}
          onRemoveExercise={removeExercise}
          onUpdateSet={updateSet}
          onAddSet={addSet}
        />

        <button
          className="qw-modal__start"
          disabled={selected.length === 0}
          onClick={handleStart}
        >
          🚀 Start Workout ({selected.length} exercise{selected.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}
