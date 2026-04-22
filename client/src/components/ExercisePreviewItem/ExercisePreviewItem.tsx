import type { TemplateSet } from '../../types';
import './ExercisePreviewItem.css';

/** @deprecated Use TemplateSet from types instead */
export type PreviewSet = TemplateSet;

export interface ExercisePreviewItemProps {
  order: number;
  exerciseName: string;
  sets: TemplateSet[];
}

export function ExercisePreviewItem({ order, exerciseName, sets }: ExercisePreviewItemProps) {
  return (
    <div className="ex-preview">
      <div className="ex-preview__order">{order}</div>
      <div className="ex-preview__body">
        <span className="ex-preview__name">{exerciseName}</span>
        <div className="ex-preview__sets">
          {sets.map((s) => (
            <span key={s.setNumber} className="ex-preview__set-chip">
              {s.reps} reps × {s.weightKg}kg
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

