import { useWorkoutStats } from '../../hooks/queries';
import { Trophy } from 'lucide-react';

export function OneRMCard() {
  const { data: stats } = useWorkoutStats();
  const oneRMs = stats?.oneRMs ?? [];

  if (oneRMs.length === 0) return null;

  return (
    <div className="stat-card stat-card--wide onerm-card" style={{ '--stat-accent': 'var(--icon-amber)' } as React.CSSProperties}>
      <div className="stat-card__header">
        <Trophy size={14} />
        <span className="stat-card__label">Estimated 1RM — Top Lifts</span>
      </div>
      <div className="onerm-card__grid">
        {oneRMs.map((lift) => (
          <div key={lift.exerciseId} className="onerm-card__item">
            <span className="onerm-card__value">{lift.estimated1RM} <span className="onerm-card__unit">kg</span></span>
            <span className="onerm-card__name">{lift.exerciseName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

