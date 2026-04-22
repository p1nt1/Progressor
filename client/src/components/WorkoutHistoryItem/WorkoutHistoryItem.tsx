import { formatDuration, formatDate } from '../../helpers/workout.helpers.ts';
import type { WorkoutSummary } from '../../types';
import { Calendar, Timer, Check, X, Dumbbell, ChevronRight } from 'lucide-react';
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

  const statusConfig: Record<string, { cls: string; iconCls: string; label: string; icon: JSX.Element }> = {
    done:       { cls: 'whi__chip--done',       iconCls: 'whi__icon--done',       label: 'Done',        icon: <Check size={16} strokeWidth={3} /> },
    incomplete: { cls: 'whi__chip--incomplete',  iconCls: 'whi__icon--incomplete', label: `${completed}/${total}`, icon: <Dumbbell size={16} /> },
    failed:     { cls: 'whi__chip--failed',      iconCls: 'whi__icon--failed',     label: 'Failed',      icon: <X size={16} strokeWidth={3} /> },
    progress:   { cls: 'whi__chip--progress',    iconCls: 'whi__icon--progress',   label: 'In progress', icon: <Dumbbell size={16} /> },
  };
  const { cls, iconCls, label, icon } = statusConfig[status];

  return (
    <div className={`whi whi--${status}`} onClick={() => onClick(workout.id)}>
      <div className={`whi__status-icon ${iconCls}`}>
        {icon}
      </div>
      <div className="whi__body">
        <div className="whi__top-row">
          <span className="whi__name">{workout.name}</span>
          <span className={`whi__chip whi__status ${cls}`}>{label}</span>
        </div>
        <div className="whi__meta-row">
          <span className="whi__meta-item">
            <Calendar size={12} /> {formatDate(workout.started_at)}
          </span>
          <span className="whi__meta-sep">·</span>
          <span className="whi__meta-item whi__meta-item--type">
            {workout.type || 'unknown'}
          </span>
          <span className="whi__meta-sep">·</span>
          <span className="whi__meta-item whi__meta-item--duration">
            <Timer size={12} /> {formatDuration(workout.started_at, workout.completed_at)}
          </span>
        </div>
      </div>
      <ChevronRight size={18} className="whi__chevron" />
    </div>
  );
}
