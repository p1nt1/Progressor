import { Calendar } from 'lucide-react';
import type { WorkoutSummary } from '../../types';
import { useProfile } from '../../hooks/queries';
import './SummaryStats.css';

interface Props {
  workouts: WorkoutSummary[];
}

export function MonthlyConsistencyCard({ workouts }: Props) {
  const { data: profile } = useProfile();
  const trainingDaysPerWeek = profile?.trainingDaysPerWeek ?? 4;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfMonth = now.getDate();
  const weeksElapsed = Math.max(Math.ceil(dayOfMonth / 7), 1);
  const planned = weeksElapsed * trainingDaysPerWeek;

  const monthWorkouts = workouts.filter(w => w.completed_at && new Date(w.completed_at) >= monthStart).length;
  const pct = planned > 0 ? Math.min(Math.round((monthWorkouts / planned) * 100), 100) : 0;

  return (
    <div className="stat-card stat-card--wide" style={{ '--stat-accent': 'var(--color-accent)' } as React.CSSProperties}>
      <div className="stat-card__header">
        <Calendar size={14} />
        <span className="stat-card__label">Monthly consistency</span>
      </div>
      <div className="stat-card__progress-row">
        <span className="stat-card__value">{pct}%</span>
        <span className="stat-card__label">{monthWorkouts}/{planned} sessions</span>
      </div>
      <div className="stat-card__bar">
        <div className="stat-card__bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
