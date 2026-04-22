import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks.ts';
import { useExercises, useWorkouts, useSaveAndCompleteWorkout, usePrefillLastWeights, usePatchSplitRotation } from '../../hooks/queries';
import {
  toggleSetInPlan,
  updateSetInPlan,
  clearActivePlan,
  setWorkoutReview,
  setReviewLoading,
  setActivePlan,
  tickRestTimer,
  skipRestTimer,
} from '../../store/workoutSlice.ts';
import { ai } from '../../api/client';
import { roundToHalf } from '../../helpers/workout.helpers.ts';
import { Timer, Play, Pause, Check, Circle, FlagTriangleRight, SkipForward } from 'lucide-react';
import { PostWorkoutFeedback } from '../../components/PostWorkoutFeedback/PostWorkoutFeedback';
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
  const { activePlan, restTimer } = useAppSelector((s) => s.workout);
  const { data: exerciseList = [] } = useExercises();
  const { data: workoutList = [] } = useWorkouts();
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackRating = useRef<number | null>(null);
  const [startTime] = useState(() => Date.now());
  const pausedAt = useRef<number | null>(null);
  const accumulatedPause = useRef(0);
  const prefilled = useRef(false);

  const saveAndComplete = useSaveAndCompleteWorkout();
  const prefillMutation = usePrefillLastWeights();
  const patchSplitRotation = usePatchSplitRotation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Pre-fill weights from last session once on mount
  useEffect(() => {
    if (activePlan && !prefilled.current) {
      prefilled.current = true;
      const exerciseIds = activePlan.exercises
        .map((ex) => ex.exerciseId)
        .filter((id): id is number => id !== undefined);
      if (exerciseIds.length === 0) return;
      prefillMutation.mutate(exerciseIds, {
        onSuccess: (lastWeightsMap: Record<number, { setNumber: number; weightKg: number; reps: number }[]>) => {
          const updatedExercises = activePlan.exercises.map((ex) => {
            const lastSets = ex.exerciseId ? lastWeightsMap[ex.exerciseId] : undefined;
            if (!lastSets?.length) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) => {
                if (s.weightKg !== 0 || s.reps !== 0) return s;
                const match = lastSets.find((ls) => ls.setNumber === s.setNumber) ?? lastSets.at(-1)!;
                return { ...s, weightKg: match.weightKg, reps: match.reps };
              }),
            };
          });
          dispatch(setActivePlan({ ...activePlan, exercises: updatedExercises }));
        },
      });
    }
  }, [activePlan, dispatch]);

  // Workout elapsed timer
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime - accumulatedPause.current) / 1000));
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

  const exerciseMap = useMemo(() => {
    const map: Record<string, number> = {};
    exerciseList.forEach((e) => (map[e.name] = e.id));
    return map;
  }, [exerciseList]);

  const handleFinish = useCallback(() => {
    setShowFeedback(true);
  }, []);

  const doFinish = useCallback((rating: number | null) => {
    if (!activePlan) return;
    setShowFeedback(false);
    feedbackRating.current = rating;
    const payload = {
      name: activePlan.name,
      type: activePlan.type,
      startedAt: new Date(startTime).toISOString(),
      exercises: activePlan.exercises.map((ex) => ({
        exerciseId: ex.exerciseId || exerciseMap[ex.exerciseName] || 1,
        order: ex.order,
        sets: (ex.sets || []).map((s) => ({
          setNumber: s.setNumber,
          reps: s.reps,
          weightKg: s.weightKg,
          completed: s.completed,
        })),
      })),
    };
    saveAndComplete.mutate(payload, {
      onSuccess: ({ workoutId }) => {
        if (activePlan.nextSplitRotationIndex !== undefined) {
          patchSplitRotation.mutate(activePlan.nextSplitRotationIndex);
        }
        dispatch(clearActivePlan());
        const hasPreviousOfSameType = workoutList.some(
          (w) => w.completed_at && w.type === activePlan!.type
        );
        if (hasPreviousOfSameType) {
          dispatch(setReviewLoading(true));
          ai.reviewWorkout(workoutId, feedbackRating.current ?? undefined)
            .then((res) => {
              if (res.status === 204 || !res.data?.review) {
                dispatch(setReviewLoading(false));
              } else {
                dispatch(setWorkoutReview(res.data));
              }
            })
            .catch(() => dispatch(setReviewLoading(false)));
        }
        navigate('/');
      },
    });
  }, [activePlan, exerciseMap, saveAndComplete, workoutList, dispatch, navigate, patchSplitRotation, startTime]);

  if (!activePlan || !activePlan.exercises) return null;

  return (
    <div className="active-workout">
      {/* Post-Workout Feedback Modal */}
      {showFeedback && (
        <PostWorkoutFeedback
          onSubmit={(rating) => doFinish(rating)}
          onSkip={() => doFinish(null)}
        />
      )}

      {/* Rest Timer Overlay */}
      {restTimer && (
        <div className="rest-timer-overlay">
          <div className="rest-timer-overlay__content">
            <div className="rest-timer-overlay__label">Rest</div>
            <div className="rest-timer-overlay__countdown">{formatTime(restTimer.seconds)}</div>
            <button className="rest-timer-overlay__skip" onClick={() => dispatch(skipRestTimer())}>
              <SkipForward size={16} /> Skip
            </button>
          </div>
        </div>
      )}

      <h2 className="active-workout__title">{activePlan.name}</h2>
      <div className="active-workout__timer-row">
        <div className={`active-workout__timer ${paused ? 'active-workout__timer--paused' : ''}`}>
          <Timer size={26} /> {formatTime(elapsed)}
        </div>
        <button
          className={`active-workout__pause-btn ${paused ? 'active-workout__pause-btn--paused' : ''}`}
          onClick={togglePause}
        >
          {paused ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}
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
                onFocus={(e) => e.target.select()}
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
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  dispatch(updateSetInPlan({ exIdx, setIdx, field: 'weightKg', value: roundToHalf(parseFloat(e.target.value) || 0) }))
                }
              />
              <span className="active-workout__unit">kg</span>
              <button
                onClick={() => dispatch(toggleSetInPlan({ exIdx, setIdx }))}
                className={`active-workout__toggle ${s.completed ? 'active-workout__toggle--done' : 'active-workout__toggle--pending'}`}
              >
                {s.completed ? <Check size={14} /> : <Circle size={14} />}
              </button>
            </div>
          ))}
        </div>
      ))}

      <button onClick={handleFinish} disabled={saveAndComplete.isPending} className="active-workout__finish-btn">
        {saveAndComplete.isPending ? 'Saving...' : <><FlagTriangleRight size={16} /> Finish Workout</>}
      </button>
    </div>
  );
}
