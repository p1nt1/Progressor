import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { setActivePlan } from '../../store/workoutSlice';
import { useProfile, useExercises } from '../../hooks/queries';
import { getTodaysWorkout, type SplitKey } from '../../helpers/splits';
import type { ActiveExercise } from '../../types';
import { mapToActiveExercises } from '../../helpers/workout.helpers';
import { ai } from '../../api/client';
import {
  X, Rocket,
  RefreshCw, Loader2,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import './SplitWorkoutModal.css';

/** Map internal split dayKey → DB workout_type enum value */
const DB_WORKOUT_TYPE_MAP: Record<string, string> = {
  push: 'push',
  pull: 'pull',
  legs: 'legs',
  upper: 'upper',
  upperA: 'upper',
  upperB: 'upper',
  lower: 'lower',
  lowerA: 'lower',
  lowerB: 'lower',
  fbA: 'full body',
  fbB: 'full body',
  fbC: 'full body',
  chestBack: 'upper',
  shouldersArms: 'upper',
  chestShoulders: 'push',
  chest: 'push',
  back: 'pull',
  shoulders: 'push',
  arms: 'upper',
};

function toDbWorkoutType(dayKey: string): string {
  return DB_WORKOUT_TYPE_MAP[dayKey] ?? 'push';
}


type Props = {
  open: boolean;
  onClose: () => void;
}

export function SplitWorkoutModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: profile } = useProfile();
  const { data: exerciseList = [] } = useExercises();
  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const hasGeneratedRef = useRef(false);

  const splitKey = (profile?.selectedSplit || 'ppl') as SplitKey;
  const daysPerWeek = profile?.trainingDaysPerWeek ?? 4;
  const rotationIndex = profile?.splitRotationIndex ?? 0;

  const today = profile ? getTodaysWorkout(splitKey, daysPerWeek, rotationIndex) : null;
  const dbType = today ? toDbWorkoutType(today.dayKey) : 'push';

  const generateExercises = useCallback(async () => {
    if (!today) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setError('');
    try {
      const res = await ai.generate(dbType, today.focus, { signal: controller.signal });
      const aiPlan = res.data;
      if (aiPlan.exercises?.length) {
        setExercises(mapToActiveExercises(aiPlan.exercises, exerciseList));
      } else {
        setError('AI returned no exercises. Try again.');
      }
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e?.name === 'CanceledError' || controller.signal.aborted) return;
      console.error('AI generate error:', err);
      setError('Failed to generate workout. Try again.');
    } finally {
      if (!controller.signal.aborted) setGenerating(false);
    }
  }, [dbType, today, exerciseList]);

  // Auto-generate when modal opens
  useEffect(() => {
    if (open && profile && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      generateExercises();
    }
    if (!open) {
      hasGeneratedRef.current = false;
    }
  }, [open, profile, generateExercises]);

  // Clean up abort controller on close
  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
    }
  }, [open]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const scrollContainer = document.querySelector('.app-layout__content') as HTMLElement | null;
    const body = document.body;

    if (scrollContainer) scrollContainer.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      if (scrollContainer) scrollContainer.style.overflow = '';
      body.style.overflow = '';
    };
  }, [open]);

  if (!open || !profile || !today) return null;

  const handleClose = () => {
    setExercises([]);
    setError('');
    onClose();
  };

  const handleStart = () => {
    dispatch(setActivePlan({
      name: `${today.label} — Day ${today.rotationDay}`,
      type: dbType,
      exercises,
      // Rotation index will be saved on workout completion, not start
      nextSplitRotationIndex: rotationIndex + 1,
    }));


    handleClose();
    document.querySelector('.app-layout__content')?.scrollTo({ top: 0, behavior: 'instant' });
    navigate('/workout');
  };

  return (
    <div className="sw-overlay" onClick={handleClose}>
      <div className="sw-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sw-modal__header">
          <div>
            <p className="sw-modal__split-label">{today.splitLabel}</p>
            <h2 className="sw-modal__title">{today.label}</h2>
          </div>
          <button className="sw-modal__close" onClick={handleClose}><X size={20} /></button>
        </div>

        {/* Focus banner */}
        <div className="sw-modal__focus" style={{ borderLeftColor: today.color }}>
          <span className="sw-modal__focus-text">{today.focus}</span>
          <span className="sw-modal__rotation">Day {today.rotationDay} of {today.totalRotation}</span>
        </div>

        {/* Exercise list — AI generated */}
        <div className="sw-modal__exercises">
          {generating ? (
            <div className="sw-modal__loading">
              <Loader2 size={24} className="sw-modal__spinner" />
              <span>Generating your workout…</span>
            </div>
          ) : error ? (
            <div className="sw-modal__error">
              <span>{error}</span>
              <button className="sw-modal__retry-btn" onClick={generateExercises}>
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          ) : (
            exercises.map((ex, i) => (
              <div key={i} className="sw-modal__exercise">
                <span className="sw-modal__exercise-order">{i + 1}</span>
                <div className="sw-modal__exercise-info">
                  <span className="sw-modal__exercise-name">{ex.exerciseName}</span>
                  <span className="sw-modal__exercise-sets">{ex.sets.length} sets × {ex.sets[0]?.reps} reps</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Start button */}
        <button
          className="sw-modal__start"
          onClick={handleStart}
          disabled={generating || exercises.length === 0}
        >
          <Rocket size={18} /> Start {today.label} workout
        </button>
      </div>
    </div>
  );
}

