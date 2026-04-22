import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import { useExercises } from '../../hooks/queries';
import {
  toggleSetInPlan,
  updateSetInPlan,
  saveAndCompleteWorkout,
  fetchWorkoutReview,
  tickRestTimer,
  skipRestTimer,
  prefillActivePlanWithLastWeights,
} from '../../store/workoutSlice.ts';
import { roundToHalf } from '../../helpers/workout.helpers.ts';
import './ActiveWorkoutPage.css';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

export function ActiveWorkoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { activePlan, saving, restTimer } = useAppSelector((s) => s.workout);
  const { data: exerciseList = [] } = useExercises();
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const startTime = useRef(Date.now());
  const pausedAt = useRef<number | null>(null);
  const accumulatedPause = useRef(0);
  const prefilled = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Pre-fill weights from last session once on mount
  useEffect(() => {
    if (activePlan && !prefilled.current) {
      prefilled.current = true;
      dispatch(prefillActivePlanWithLastWeights(activePlan));
    }
  }, [activePlan, dispatch]);

  // Workout elapsed timer
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current - accumulatedPause.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  // Rest timer countdown
  useEffect(() => {
    if (!restTimer) return;
    const id = setInterval(() => {
      dispatch(tickRestTimer());
    }, 1000);
    return () => clearInterval(id);
  }, [restTimer, dispatch]);

  const togglePause = useCallback(() => {
    if (paused) {
      accumulatedPause.current += Date.now() - (pausedAt.current || Date.now());
      pausedAt.current = null;
    } else {
      pausedAt.current = Date.now();
    }
    setPaused((p) => !p);
  }, [paused]);

  if (!activePlan || !activePlan.exercises) return null;

  const exerciseMap: Record<string, number> = {};
  exerciseList.forEach((e) => (exerciseMap[e.name] = e.id));

  const handleFinish = () => {
    const payload = {
      name: activePlan.name,
      type: activePlan.type,
      startedAt: new Date(startTime.current).toISOString(),
      exercises: activePlan.exercises.map((ex) => ({
        exerciseId: (ex as any).exerciseId || exerciseMap[ex.exerciseName] || 1,
        order: ex.order,
        sets: (ex.sets || []).map((s) => ({
          setNumber: s.setNumber,
          reps: s.reps,
          weightKg: s.weightKg,
          rpe: s.rpe || null,
          completed: s.completed,
        })),
      })),
    };
    dispatch(saveAndCompleteWorkout(payload)).then((action: any) => {
      if (action.payload?.workoutId) {
        dispatch(fetchWorkoutReview(action.payload.workoutId));
      }
      navigate('/');
    });
  };

  return (
    <div className="active-workout">
      {/* Rest Timer Overlay */}
      {restTimer && (
        <div className="rest-timer-overlay">
          <div className="rest-timer-overlay__content">
            <div className="rest-timer-overlay__label">Rest</div>
            <div className="rest-timer-overlay__countdown">{formatTime(restTimer.seconds)}</div>
            <button className="rest-timer-overlay__skip" onClick={() => dispatch(skipRestTimer())}>
              Skip →
            </button>
          </div>
        </div>
      )}

      <h2 className="active-workout__title">{activePlan.name}</h2>
      <div className="active-workout__timer-row">
        <div className={`active-workout__timer ${paused ? 'active-workout__timer--paused' : ''}`}>
          ⏱ {formatTime(elapsed)}
        </div>
        <button
          className={`active-workout__pause-btn ${paused ? 'active-workout__pause-btn--paused' : ''}`}
          onClick={togglePause}
        >
          {paused ? '▶️ Resume' : '⏸ Pause'}
        </button>
      </div>

      {activePlan.exercises.map((ex, exIdx) => (
        <div key={exIdx} className="active-workout__exercise">
          <div className="active-workout__exercise-name">{ex.exerciseName}</div>
          {(ex.sets || []).map((s, setIdx) => (
            <div key={setIdx} className={`active-workout__set-row ${s.completed ? 'active-workout__set-row--done' : ''}`}>
              <span className="active-workout__set-label">Set {s.setNumber}</span>
              <input
                type="number"
                className="active-workout__input active-workout__input--reps"
                value={s.reps}
                onChange={(e) =>
                  dispatch(updateSetInPlan({ exIdx, setIdx, field: 'reps', value: parseInt(e.target.value) || 0 }))
                }
              />
              <span className="active-workout__unit">reps</span>
              <span className="active-workout__separator">×</span>
              <input
                type="number"
                className="active-workout__input"
                value={s.weightKg}
                step={0.5}
                min={0}
                onChange={(e) =>
                  dispatch(updateSetInPlan({ exIdx, setIdx, field: 'weightKg', value: roundToHalf(parseFloat(e.target.value) || 0) }))
                }
              />
              <span className="active-workout__unit">kg</span>
              <button
                onClick={() => dispatch(toggleSetInPlan({ exIdx, setIdx }))}
                className={`active-workout__toggle ${s.completed ? 'active-workout__toggle--done' : 'active-workout__toggle--pending'}`}
              >
                {s.completed ? '✓' : '○'}
              </button>
            </div>
          ))}
        </div>
      ))}

      <button onClick={handleFinish} disabled={saving} className="active-workout__finish-btn">
        {saving ? 'Saving...' : '🏁 Finish Workout'}
      </button>
    </div>
  );
}
