import { Flame } from 'lucide-react';
import { StatCard } from './StatCard';
import type { WorkoutSummary } from '../../types';

interface Props { workouts: WorkoutSummary[] }

export function StreakCard({ workouts }: Props) {
  const streak = (() => {
    if (!workouts.length) return 0;
    const daySet = new Set(
      workouts.filter(w => w.completed_at).map(w => new Date(w.completed_at!).toDateString())
    );
    let count = 0;
    const d = new Date();
    while (daySet.has(d.toDateString())) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  return <StatCard value={streak} label="Day streak" icon={<Flame size={13} />} accent="var(--icon-amber)" />;
}

