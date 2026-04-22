import { StatCard } from './StatCard';
import type { WorkoutSummary } from '../../types';

interface Props { workouts: WorkoutSummary[] }

export function TotalSessionsCard({ workouts }: Props) {
  const total = workouts.filter(w => w.completed_at).length;
  return <StatCard value={total} label="Total sessions" accent="var(--color-primary)" />;
}

