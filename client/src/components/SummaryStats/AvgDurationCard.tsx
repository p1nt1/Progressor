import { Clock } from 'lucide-react';
import { StatCard } from './StatCard';
import type { WorkoutSummary } from '../../types';

interface Props { workouts: WorkoutSummary[] }

export function AvgDurationCard({ workouts }: Props) {
  const completed = workouts.filter(w => w.completed_at && w.started_at);

  const durations = completed.map(w => {
    const start = new Date(w.started_at).getTime();
    const end = new Date(w.completed_at!).getTime();
    return (end - start) / 60_000; // minutes
  }).filter(d => d > 0 && d < 300); // sanity: 0–5h

  const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  return <StatCard value={`${avg}m`} label="Avg duration" icon={<Clock size={13} />} accent="var(--icon-green)" />;
}

