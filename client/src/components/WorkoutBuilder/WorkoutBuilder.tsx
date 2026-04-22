import { useState } from 'react';
import { MuscleGroup, MUSCLE_GROUP_FILTERS, MUSCLE_GROUP_META } from '../../helpers/workoutTypes.ts';
import { roundToHalf } from '../../helpers/workout.helpers.ts';
import type { WorkoutSet, Exercise } from '../../types';
import { Plus, X, PlusCircle } from 'lucide-react';
import './WorkoutBuilder.css';

export interface BuilderExercise {
  exerciseId: number;
  exerciseName: string;
  sets: WorkoutSet[];
}

interface ExerciseBuilderProps {
  exerciseList: Exercise[];
  selected: BuilderExercise[];
  muscleFilter: MuscleGroup;
  onMuscleFilterChange: (mg: MuscleGroup) => void;
  onAddExercise: (ex: Exercise) => void;
  onRemoveExercise: (idx: number) => void;
  onUpdateSet: (exIdx: number, setIdx: number, field: 'reps' | 'weightKg', value: number) => void;
  onAddSet: (exIdx: number) => void;
  onCreateExercise?: (data: { name: string; muscleGroup: string; isCompound: boolean }) => void;
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
  onCreateExercise,
  classPrefix = 'eb',
}: ExerciseBuilderProps) {
  const p = classPrefix;
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscleGroup, setNewMuscleGroup] = useState<string>(MuscleGroup.Chest);
  const [newIsCompound, setNewIsCompound] = useState(false);

  const filtered = (
    muscleFilter === MuscleGroup.All
      ? exerciseList
      : exerciseList.filter((e) => e.muscle_group === muscleFilter)
  ).filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()));

  const noResults = search.trim().length > 0 && filtered.length === 0;

  const handleCreate = () => {
    if (!newName.trim() || !onCreateExercise) return;
    onCreateExercise({ name: newName.trim(), muscleGroup: newMuscleGroup, isCompound: newIsCompound });
    setNewName('');
    setNewIsCompound(false);
    setShowCreateForm(false);
    setSearch('');
  };

  const openCreateWithSearch = () => {
    setNewName(search.trim());
    setNewMuscleGroup(muscleFilter !== MuscleGroup.All ? muscleFilter : MuscleGroup.Chest);
    setShowCreateForm(true);
  };

  return (
    <div className={`${p}__builder`}>
      {/* Muscle group filter */}
      <div className={`${p}__muscle-filter`}>
        {MUSCLE_GROUP_FILTERS.map((mg) => {
          const meta = MUSCLE_GROUP_META[mg];
          const IconComponent = meta.icon;
          return (
            <button
              key={mg}
              onClick={() => onMuscleFilterChange(mg)}
              className={`${p}__muscle-btn ${p}__muscle-btn--${mg} ${muscleFilter === mg ? `${p}__muscle-btn--active` : ''}`}
            >
              <IconComponent size={16} className={`${p}__muscle-btn-icon`} />
              <span className={`${p}__muscle-btn-label`}>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        type="text"
        className={`${p}__search-input`}
        placeholder="Search exercises…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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

        {/* No results — prompt to create */}
        {noResults && onCreateExercise && !showCreateForm && (
          <div className={`${p}__no-results`}>
            <p>No exercises match "<strong>{search}</strong>"</p>
            <button className={`${p}__create-btn`} onClick={openCreateWithSearch}>
              <PlusCircle size={14} /> Create "{search.trim()}"
            </button>
          </div>
        )}
      </div>

      {/* Create exercise form */}
      {onCreateExercise && !showCreateForm && !noResults && (
        <button className={`${p}__create-btn ${p}__create-btn--standalone`} onClick={() => { setNewName(''); setShowCreateForm(true); }}>
          <PlusCircle size={14} /> Create New Exercise
        </button>
      )}

      {showCreateForm && onCreateExercise && (
        <div className={`${p}__create-form`}>
          <input
            className={`${p}__create-input`}
            placeholder="Exercise name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <select
            className={`${p}__create-select`}
            value={newMuscleGroup}
            onChange={(e) => setNewMuscleGroup(e.target.value)}
          >
            {MUSCLE_GROUP_FILTERS.filter((mg) => mg !== MuscleGroup.All).map((mg) => (
              <option key={mg} value={mg}>{mg}</option>
            ))}
          </select>
          <label className={`${p}__create-compound-label`}>
            <input type="checkbox" checked={newIsCompound} onChange={(e) => setNewIsCompound(e.target.checked)} />
            Compound
          </label>
          <div className={`${p}__create-actions`}>
            <button className={`${p}__create-submit`} onClick={handleCreate} disabled={!newName.trim()}>
              <PlusCircle size={14} /> Add
            </button>
            <button className={`${p}__create-cancel`} onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Selected exercises */}
      {selected.length > 0 && (
        <div className={`${p}__selected-exercises`}>
          {selected.map((ex, exIdx) => (
            <div key={ex.exerciseId} className={`${p}__selected-exercise`}>
              <div className={`${p}__selected-header`}>
                <span className={`${p}__selected-name`}>{ex.exerciseName}</span>
                <button className={`${p}__remove-btn`} onClick={() => onRemoveExercise(exIdx)} aria-label="Remove">
                  <X size={14} />
                </button>
              </div>
              {ex.sets.map((s, setIdx) => (
                <div key={setIdx} className={`${p}__set-row`}>
                  <span className={`${p}__set-label`}>S{s.setNumber}</span>
                  <input
                    type="number"
                    className={`${p}__set-input`}
                    value={s.reps}
                    onFocus={(e) => e.target.select()}
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
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      onUpdateSet(exIdx, setIdx, 'weightKg', roundToHalf(parseFloat(e.target.value) || 0))
                    }
                  />
                  <span className={`${p}__set-unit`}>kg</span>
                </div>
              ))}
              <button className={`${p}__add-set-btn`} onClick={() => onAddSet(exIdx)}>
                <Plus size={12} /> Add Set
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
