import { typeBadgeClass, formatDuration, formatDate } from '../../helpers/workout.helpers.ts';
import type { WorkoutDetailData } from '../../types';
import { WorkoutReviewCard } from '../WorkoutReviewCard/WorkoutReviewCard.tsx';
import { Calendar, Timer, Check, X, ArrowLeft } from 'lucide-react';
import './WorkoutDetail.css';

export type { WorkoutDetailData };

interface WorkoutDetailProps {
  workout: WorkoutDetailData;
  onBack: () => void;
}

export function WorkoutDetail({ workout, onBack }: WorkoutDetailProps) {
  return (
    <div className="wd">
      <button className="wd__back-btn" onClick={onBack}><ArrowLeft size={15} /> Back</button>

      <h2 className="wd__title">{workout.name}</h2>

      <div className="wd__meta">
        <span className="wd__chip wd__chip--date">
          <Calendar size={11} /> {formatDate(workout.started_at)}
        </span>
        <span className={typeBadgeClass(workout.type)}>{workout.type || 'unknown'}</span>
        <span className="wd__chip wd__chip--duration">
          <Timer size={11} /> {formatDuration(workout.started_at, workout.completed_at)}
        </span>
      </div>

      <div className="wd__exercises">
        {workout.exercises?.map((ex, i) => (
          <div key={i} className="wd__exercise">
            <div className="wd__exercise-name">{ex.exercise_name}</div>
            {ex.sets.map((s) => (
              <div key={s.id} className="wd__set">
                <span className="wd__set-label">Set {s.set_number}</span>
                <span className="wd__set-detail">
                  {s.reps} reps × {s.weight_kg}kg
                  {' '}{s.completed ? <Check size={12} className="wd__set-check" /> : <X size={12} className="wd__set-cross" />}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {workout.ai_review && <WorkoutReviewCard review={workout.ai_review} />}
    </div>
  );
}
