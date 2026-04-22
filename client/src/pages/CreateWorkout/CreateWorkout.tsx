import { useState, useEffect } from 'react';
import { useExercises, useSaveTemplate } from '../../hooks/queries';
import { useExerciseBuilder } from '../../hooks/useExerciseBuilder';
import { ai } from '../../api/client.ts';
import { WorkoutType, MuscleGroup, WORKOUT_TYPES } from '../../helpers/workoutTypes.ts';
import { WorkoutBuilder } from '../../components/WorkoutBuilder/WorkoutBuilder.tsx';
import { ExercisePreviewItem } from '../../components/ExercisePreviewItem/ExercisePreviewItem.tsx';
import './CreateWorkout.css';



export function CreateWorkout() {
  const { data: exerciseList = [] } = useExercises();
  const saveTemplateMutation = useSaveTemplate();
  const templateSaving = saveTemplateMutation.isPending;
  const { selected: selectedExercises, addExercise, removeExercise, updateSet: updateCustomSet, addSet: addSetToExercise, reset: resetExercises } = useExerciseBuilder();

  const [mode, setMode] = useState<'ai' | 'custom'>('ai');
  const [type, setType] = useState<WorkoutType>(WorkoutType.Push);
  const [generating, setGenerating] = useState(false);
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  // Custom workout state
  const [customName, setCustomName] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup>(MuscleGroup.All);


  // Clear saved feedback after 2s
  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await ai.generate(type);
      setAiPlan(res.data);
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  const handleSaveAiPlan = () => {
    if (!aiPlan) return;
    const planName = aiPlan.name || 'AI Workout';
    const planType = aiPlan.type || type;
    const exercises = (aiPlan.exercises || []).map((ex: any, i: number) => ({
      exerciseName: ex.exerciseName,
      exerciseId: ex.exerciseId,
      order: ex.order ?? i + 1,
      sets: (ex.sets || []).map((s: any) => ({
        setNumber: s.setNumber,
        reps: s.reps,
        weightKg: s.weightKg,
        completed: s.completed ?? false,
      })),
    }));
    saveTemplateMutation.mutate({ name: planName, type: planType, exercises });
    setAiPlan(null);
    setSaved(true);
  };

  const handleSaveCustom = () => {
    if (selectedExercises.length === 0 || !customName.trim()) return;
    const exercises = selectedExercises.map((ex, i) => ({
      exerciseName: ex.exerciseName,
      exerciseId: ex.exerciseId,
      order: i + 1,
      sets: ex.sets,
    }));
    saveTemplateMutation.mutate({ name: customName.trim(), type: WorkoutType.Custom, exercises });
    setCustomName('');
    resetExercises();
    setSaved(true);
  };


  return (
    <div className="workout-form">
      <h2 className="workout-form__title">Create Workout Plan</h2>

      {saved && (
        <div className="workout-form__saved-toast">✅ Workout saved! Go to Home to start it.</div>
      )}

      {/* Mode toggle */}
      <div className="workout-form__mode-toggle">
        <button
          className={`workout-form__mode-btn ${mode === 'ai' ? 'workout-form__mode-btn--active' : ''}`}
          onClick={() => setMode('ai')}
        >
          ✨ AI Generate
        </button>
        <button
          className={`workout-form__mode-btn ${mode === 'custom' ? 'workout-form__mode-btn--active' : ''}`}
          onClick={() => setMode('custom')}
        >
          🛠 Build Custom
        </button>
      </div>

      {/* ===== AI MODE ===== */}
      {mode === 'ai' && (
        <>
          {/* How it works info card */}
          <div className="ai-info-card">
            <div className="ai-info-card__header">
              <span className="ai-info-card__icon">🤖</span>
              <span className="ai-info-card__title">How AI generation works</span>
            </div>
            <ul className="ai-info-card__list">
              <li className="ai-info-card__item">
                <span className="ai-info-card__bullet">👤</span>
                <span>Your <strong>profile</strong> — age, weight, experience level and training goal shape exercise selection and rep ranges</span>
              </li>
              <li className="ai-info-card__item">
                <span className="ai-info-card__bullet">📋</span>
                <span>Your <strong>recent sessions</strong> — the last 50 sets you logged are used to suggest weights you can actually lift</span>
              </li>
              <li className="ai-info-card__item">
                <span className="ai-info-card__bullet">🏋️</span>
                <span>The <strong>workout type</strong> you pick below determines which muscle groups are targeted</span>
              </li>
              <li className="ai-info-card__item">
                <span className="ai-info-card__bullet">📈</span>
                <span>Compound lifts always come first, isolation movements finish the session</span>
              </li>
            </ul>
          </div>

          <div className="workout-form__types">
            {WORKOUT_TYPES.filter((t) => t !== WorkoutType.Custom).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`workout-form__type-btn ${type === t ? 'workout-form__type-btn--active' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="workout-form__generate-btn"
          >
            {generating ? '🤖 Generating...' : '✨ Generate AI Workout'}
          </button>

          {aiPlan && (
            <div className="workout-form__plan">
              <h3 className="workout-form__plan-name">{aiPlan.name}</h3>
              <p className="workout-form__plan-explanation">{aiPlan.explanation}</p>
              <div className="workout-form__plan-exercises">
                {aiPlan.exercises?.map((ex: any, i: number) => (
                  <ExercisePreviewItem
                    key={i}
                    order={i + 1}
                    exerciseName={ex.exerciseName}
                    sets={ex.sets ?? []}
                  />
                ))}
              </div>
              <button className="workout-form__save-btn" onClick={handleSaveAiPlan} disabled={templateSaving}>
                💾 Save Workout Plan
              </button>
            </div>
          )}
        </>
      )}

      {/* ===== CUSTOM MODE ===== */}
      {mode === 'custom' && (
        <div className="workout-form__custom">
          <input
            className="workout-form__custom-name"
            placeholder="Workout name (required)"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />

          <WorkoutBuilder
            exerciseList={exerciseList}
            selected={selectedExercises}
            muscleFilter={muscleFilter}
            onMuscleFilterChange={setMuscleFilter}
            onAddExercise={addExercise}
            onRemoveExercise={removeExercise}
            onUpdateSet={updateCustomSet}
            onAddSet={addSetToExercise}
          />

          {selectedExercises.length > 0 && (
            <button
              className="workout-form__save-btn"
              onClick={handleSaveCustom}
              disabled={templateSaving || !customName.trim()}
            >
              💾 Save Workout Plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
