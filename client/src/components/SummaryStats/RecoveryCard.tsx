import { Moon } from 'lucide-react';
import { StatCard } from './StatCard';
import type { WorkoutSummary } from '../../types';

interface Props { workouts: WorkoutSummary[] }

export function RecoveryCard({ workouts }: Props) {
  const completed = workouts.filter(w => w.completed_at);
  if (!completed.length) return <StatCard value="—" label="Rest days" icon={<Moon size={13} />} accent="var(--icon-blue, #3b82f6)" />;

  const lastDate = new Date(completed[0].completed_at!);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);

  const restDays = Math.floor((today.getTime() - lastDate.getTime()) / 86_400_000);

  return <StatCard value={restDays} label={restDays === 1 ? 'Rest day' : 'Rest days'} icon={<Moon size={13} />} accent="var(--icon-blue, #3b82f6)" />;
}

