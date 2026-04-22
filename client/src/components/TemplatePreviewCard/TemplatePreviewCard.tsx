import { typeBadgeClass } from '../../helpers/workout.helpers';
import type { PreviewSet} from '../ExercisePreviewItem/ExercisePreviewItem.tsx';
import {ExercisePreviewItem} from '../ExercisePreviewItem/ExercisePreviewItem.tsx';
import './TemplatePreviewCard.css';

interface PreviewExercise {
  exerciseName: string;
  sets: PreviewSet[];
}

interface Template {
  name: string;
  type: string;
  exercises: PreviewExercise[];
}

interface TemplatePreviewCardProps {
  template: Template;
  onStart: () => void;
  onClose: () => void;
}

export function TemplatePreviewCard({ template, onStart, onClose }: TemplatePreviewCardProps) {
  return (
    <div className="tpl-preview">
      {/* Header */}
      <div className="tpl-preview__header">
        <div className="tpl-preview__title-row">
          <h3 className="tpl-preview__title">{template.name}</h3>
          <button className="tpl-preview__close" onClick={onClose} aria-label="Close preview">✕</button>
        </div>
        <div className="tpl-preview__meta">
          <span className={typeBadgeClass(template.type)}>{template.type}</span>
          <span className="tpl-preview__count">
            {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="tpl-preview__exercises">
        {template.exercises.map((ex, i) => (
          <ExercisePreviewItem
            key={i}
            order={i + 1}
            exerciseName={ex.exerciseName}
            sets={ex.sets}
          />
        ))}
      </div>

      {/* CTA */}
      <button className="tpl-preview__start" onClick={onStart}>
        🚀 Start Workout
      </button>
    </div>
  );
}

