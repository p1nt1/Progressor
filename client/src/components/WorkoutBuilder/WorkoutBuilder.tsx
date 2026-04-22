import { MuscleGroup, MUSCLE_GROUP_FILTERS } from '../../helpers/workoutTypes.ts';
import { MUSCLE_GROUP_META } from '../../helpers/workoutTypes.ts';
import { roundToHalf } from '../../helpers/workout.helpers.ts';
import './WorkoutBuilder.css';

export interface BuilderSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe: null;
  completed: boolean;
}

export interface BuilderExercise {
  exerciseId: number;
  exerciseName: string;
  sets: BuilderSet[];
}

interface ExerciseOption {
  id: number;
  name: string;
  muscle_group: string;
  is_compound: boolean;
}

interface ExerciseBuilderProps {
  exerciseList: ExerciseOption[];
  selected: BuilderExercise[];
  muscleFilter: MuscleGroup;
  onMuscleFilterChange: (mg: MuscleGroup) => void;
  onAddExercise: (ex: ExerciseOption) => void;
  onRemoveExercise: (idx: number) => void;
  onUpdateSet: (exIdx: number, setIdx: number, field: 'reps' | 'weightKg', value: number) => void;
  onAddSet: (exIdx: number) => void;
  /** CSS class prefix for namespacing styles (default: 'eb') */
  classPrefix?: string;
}

export function WorkoutBuilder({
  exerciseList,
  selected,
  muscleFilter,
  onMuscleFilterChange,
  onAddExercise,
  onRemoveExercise,
  onUpdateSet,
  onAddSet,
  classPrefix = 'eb',
}: ExerciseBuilderProps) {
  const p = classPrefix;

  const filtered =
    muscleFilter === MuscleGroup.All
      ? exerciseList
      : exerciseList.filter((e) => e.muscle_group === muscleFilter);

  return (
    <div className={`${p}__builder`}>
      {/* Muscle group filter */}
      <div className={`${p}__muscle-filter`}>
        {MUSCLE_GROUP_FILTERS.map((mg) => {
          const meta = MUSCLE_GROUP_META[mg];
          return (
            <button
              key={mg}
              onClick={() => onMuscleFilterChange(mg)}
              className={`${p}__muscle-btn ${p}__muscle-btn--${mg} ${muscleFilter === mg ? `${p}__muscle-btn--active` : ''}`}
            >
              <span className={`${p}__muscle-btn-icon`}>{meta.icon}</span>
              <span className={`${p}__muscle-btn-label`}>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Exercise list */}
      <div className={`${p}__exercise-list`}>
        {filtered.map((ex) => (
          <div
            key={ex.id}
            className={`${p}__exercise-option ${selected.find((s) => s.exerciseId === ex.id) ? `${p}__exercise-option--selected` : ''}`}
            onClick={() => onAddExercise(ex)}
          >
            <span className={`${p}__exercise-option-name`}>{ex.name}</span>
            <span className={`${p}__exercise-option-badge`}>
              {ex.is_compound ? 'compound' : 'isolation'}
            </span>
          </div>
        ))}
      </div>

      {/* Selected exercises */}
      {selected.length > 0 && (
        <div className={`${p}__selected-exercises`}>
          {selected.map((ex, exIdx) => (
            <div key={ex.exerciseId} className={`${p}__selected-exercise`}>
              <div className={`${p}__selected-header`}>
                <span className={`${p}__selected-name`}>{ex.exerciseName}</span>
                <button className={`${p}__remove-btn`} onClick={() => onRemoveExercise(exIdx)}>
                  ✕
                </button>
              </div>
              {ex.sets.map((s, setIdx) => (
                <div key={setIdx} className={`${p}__set-row`}>
                  <span className={`${p}__set-label`}>S{s.setNumber}</span>
                  <input
                    type="number"
                    className={`${p}__set-input`}
                    value={s.reps}
                    onChange={(e) =>
                      onUpdateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)
                    }
                  />
                  <span className={`${p}__set-unit`}>reps </span>
                  <input
                    type="number"
                    className={`${p}__set-input`}
                    value={s.weightKg}
                    step={0.5}
                    min={0}
                    onChange={(e) =>
                      onUpdateSet(exIdx, setIdx, 'weightKg', roundToHalf(parseFloat(e.target.value) || 0))
                    }
                  />
                  <span className={`${p}__set-unit`}>kg</span>
                </div>
              ))}
              <button className={`${p}__add-set-btn`} onClick={() => onAddSet(exIdx)}>
                + Add Set
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

