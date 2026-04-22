import { typeBadgeClass, formatDuration, formatDate } from '../../helpers/workout.helpers.ts';
import type { WorkoutSummary } from '../../types';
import './WorkoutHistoryItem.css';

export interface WorkoutSummaryItem extends WorkoutSummary {
  completed_sets_count?: number;
  total_sets_count?: number;
}


interface WorkoutHistoryItemProps {
  workout: WorkoutSummaryItem;
  onClick: (id: string) => void;
}

export function WorkoutHistoryItem({ workout, onClick }: WorkoutHistoryItemProps) {
  const completed = Number(workout.completed_sets_count ?? 0);
  const total = Number(workout.total_sets_count ?? 0);
  const status = !workout.completed_at
    ? 'progress'
    : completed === 0
    ? 'failed'
    : completed < total
    ? 'incomplete'
    : 'done';

  const statusChip: Record<string, { cls: string; label: string }> = {
    done:       { cls: 'whi__chip--done',       label: '✓ Done' },
    incomplete: { cls: 'whi__chip--incomplete',  label: `◑ ${completed}/${total} sets` },
    failed:     { cls: 'whi__chip--failed',      label: '✗ Failed' },
    progress:   { cls: 'whi__chip--progress',    label: 'In progress' },
  };
  const { cls, label } = statusChip[status];

  return (
    <div className="whi" onClick={() => onClick(workout.id)}>
      <div className="whi__body">
        {/* Row 1: name + status */}
        <div className="whi__top-row">
          <span className="whi__name">{workout.name}</span>
          <span className={`whi__chip whi__status ${cls}`}>{label}</span>
        </div>
        {/* Row 2: meta chips */}
        <div className="whi__meta-row">
          <span className="whi__chip whi__chip--date">
            📅 {formatDate(workout.started_at)}
          </span>
          <span className={typeBadgeClass(workout.type)}>{workout.type || 'custom'}</span>
          <span className="whi__chip whi__chip--duration">
            ⏱ {formatDuration(workout.started_at, workout.completed_at)}
          </span>
        </div>
      </div>
      <span className="whi__chevron">›</span>
    </div>
  );
}
