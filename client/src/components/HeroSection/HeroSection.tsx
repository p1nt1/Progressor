import { useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkouts, useProfile } from '../../hooks/queries';
import { AiCoachCard } from '../AiCoachCard/AiCoachCard';
import { getTodaysWorkout, type SplitKey } from '../../helpers/splits';
import {
  ArrowRight,
  CheckCircle,
  Dumbbell,
  CalendarDays,
  Zap,
  Flame,
} from 'lucide-react';
import './HeroSection.css';

type Props = {
  onStartWorkout: () => void;
};

export function HeroSection({ onStartWorkout }: Props) {
  const { user } = useAuth();
  const { data: workoutList = [], isLoading: workoutsLoading } = useWorkouts();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const trainingDaysPerWeek = profile?.trainingDaysPerWeek ?? 4;
  const splitKey = (profile?.selectedSplit || 'ppl') as SplitKey;
  const rotationIndex = profile?.splitRotationIndex ?? 0;
  const todayWorkout = profile ? getTodaysWorkout(splitKey, trainingDaysPerWeek, rotationIndex) : null;

  const weekWorkouts = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return workoutList.filter((w) => w.completed_at && new Date(w.completed_at) >= monday);
  }, [workoutList]);

  const dataReady = !profileLoading && !workoutsLoading;
  const weekComplete = dataReady && weekWorkouts.length >= trainingDaysPerWeek;

  return (
    <section className={`hero ${weekComplete ? 'hero--completed' : ''}`}>
      {/* ── Gradient CTA area ── */}
      <div
        className="hero__cta"
        onClick={dataReady && !weekComplete ? onStartWorkout : undefined}
      >
        {/* Top row: greeting + ring */}
        <div className="hero__top">
          <div className="hero__text">
            <p className="hero__greeting">{greeting}</p>
            <h1 className="hero__name">{user?.displayName?.split(' ')[0] ?? 'Champ'}</h1>
          </div>
          <div className="hero__ring-wrap">
            <svg className="hero__ring" viewBox="0 0 64 64">
              <circle className="hero__ring-track" cx="32" cy="32" r="26" />
              <circle
                className="hero__ring-fill"
                cx="32" cy="32" r="26"
                strokeDasharray={`${Math.min(weekWorkouts.length / trainingDaysPerWeek, 1) * 163.4} 163.4`}
              />
            </svg>
            <div className="hero__ring-label">
              <span className="hero__ring-count">{weekWorkouts.length}</span>
              <span className="hero__ring-total">of {trainingDaysPerWeek}</span>
            </div>
          </div>
        </div>

        <div className="hero__divider" />

        {!dataReady ? null : weekComplete ? (
          <div className="hero__completed">
            <CheckCircle size={22} />
            <div>
              <h2 className="hero__workout-title">Week Complete! 🎉</h2>
              <p className="hero__workout-sub">Great job! Rest up and recover for next week.</p>
            </div>
          </div>
        ) : todayWorkout ? (
          <>
            <div className="hero__split-info">
              <span className="hero__split-badge" style={{ borderColor: todayWorkout.color, color: todayWorkout.color }}>
                <CalendarDays size={12} /> {todayWorkout.splitLabel}
              </span>
              <span className="hero__rotation">Day {todayWorkout.rotationDay} of {todayWorkout.totalRotation}</span>
            </div>
            <div className="hero__workout">
              <div className="hero__workout-left">
                <div className="hero__workout-icon" style={{ background: todayWorkout.color }}>
                  <Dumbbell size={20} />
                </div>
                <div>
                  <h2 className="hero__workout-title">{todayWorkout.label}</h2>
                  <p className="hero__workout-sub">{todayWorkout.focus}</p>
                </div>
              </div>
              <ArrowRight size={24} className="hero__arrow" />
            </div>
            <div className="hero__hint">
              <Zap size={13} />
              <span>AI will generate a workout plan for you</span>
            </div>
          </>
        ) : (
          <div className="hero__workout">
            <div className="hero__workout-left">
              <Flame size={22} className="hero__flame" />
              <div>
                <h2 className="hero__workout-title">Start Workout</h2>
                <p className="hero__workout-sub">Tap to begin a new session</p>
              </div>
            </div>
            <ArrowRight size={24} className="hero__arrow" />
          </div>
        )}
      </div>

      {/* ── AI Coach extension ── */}
      <AiCoachCard />
    </section>
  );
}

