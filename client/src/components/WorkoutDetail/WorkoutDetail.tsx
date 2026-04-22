import { typeBadgeClass, formatDuration, formatDate } from '../../helpers/workout.helpers.ts';
import type { WorkoutReview } from '../../types';
import { WorkoutReviewCard } from '../WorkoutReviewCard/WorkoutReviewCard.tsx';
import './WorkoutDetail.css';

interface DetailSet {
  id: number;
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe?: number | null;
  completed: boolean;
}

interface DetailExercise {
  exercise_name: string;
  sets: DetailSet[];
}

export interface WorkoutDetailData {
  name: string;
  type: string;
  started_at: string;
  completed_at: string | null;
  exercises?: DetailExercise[];
  ai_review?: WorkoutReview | null;
}

interface WorkoutDetailProps {
  workout: WorkoutDetailData;
  onBack: () => void;
}

export function WorkoutDetail({ workout, onBack }: WorkoutDetailProps) {
  return (
    <div className="wd">
      <button className="wd__back-btn" onClick={onBack}>← Back</button>

      <h2 className="wd__title">{workout.name}</h2>

      <div className="wd__meta">
        <span className="wd__chip wd__chip--date">
          📅 {formatDate(workout.started_at)}
        </span>
        <span className={typeBadgeClass(workout.type)}>{workout.type || 'custom'}</span>
        <span className="wd__chip wd__chip--duration">
          ⏱ {formatDuration(workout.started_at, workout.completed_at)}
        </span>
        <span className={`wd__chip ${workout.completed_at ? 'wd__chip--done' : 'wd__chip--progress'}`}>
          {workout.completed_at ? '✅ Completed' : '🔄 In progress'}
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
                  {s.rpe ? ` · RPE ${s.rpe}` : ''}
                  {' '}{s.completed ? '✅' : '❌'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {workout.ai_review && (
        <WorkoutReviewCard review={workout.ai_review} />
      )}
    </div>
  );
}

