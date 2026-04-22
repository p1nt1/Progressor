import type { WorkoutReview } from '../../types';
import './WorkoutReviewCard.css';

const VERDICT_LABEL: Record<string, string> = {
  improved:   'Improved',
  maintained: 'Maintained',
  declined:   'Declined',
  new:        'New',
};

const VERDICT_CLASS: Record<string, string> = {
  improved:   'review-card__verdict--improved',
  maintained: 'review-card__verdict--maintained',
  declined:   'review-card__verdict--declined',
  new:        'review-card__verdict--new',
};

function DiffPill({ value, unit }: { value: number; unit: 'kg' | 'reps' }) {
  if (value === 0) return null;
  const positive = value > 0;
  return (
    <span className={`review-card__diff-pill ${positive ? 'review-card__diff-pill--up' : 'review-card__diff-pill--down'}`}>
      {positive ? '+' : ''}{value} {unit}
    </span>
  );
}

export function WorkoutReviewCard({ review, onDismiss, variant }: { review: WorkoutReview; onDismiss?: () => void; variant?: 'hero' }) {
  const { type, review: data } = review;

  if (!data || typeof data === 'string') return null;

  return (
    <div className={`review-card${variant === 'hero' ? ' review-card--hero' : ''}`}>
      <div className="review-card__header">
        <span className="review-card__type">{type}</span>
        {onDismiss && (
          <button className="review-card__dismiss" onClick={onDismiss}>✕</button>
        )}
      </div>

      <p className="review-card__summary">{data.summary}</p>

      {data.exerciseReviews?.length > 0 && (
        <div className="review-card__exercises">
          {data.exerciseReviews.map((er, i) => (
            <div key={i} className={`review-card__exercise ${VERDICT_CLASS[er.verdict] || ''}`}>
              {/* Row 1: name + verdict badge */}
              <div className="review-card__exercise-row1">
                <span className="review-card__exercise-name">{er.exerciseName}</span>
                <span className={`review-card__verdict-badge ${VERDICT_CLASS[er.verdict] || ''}`}>
                  {VERDICT_LABEL[er.verdict] || er.verdict}
                </span>
              </div>
              {/* Row 2: diff pills (only when data exists) */}
              {(er.kgDiff !== null || er.repsDiff !== null) && (
                <div className="review-card__exercise-row2">
                  {er.kgDiff !== null && <DiffPill value={er.kgDiff} unit="kg" />}
                  {er.repsDiff !== null && <DiffPill value={er.repsDiff} unit="reps" />}
                </div>
              )}
              {/* Row 3: comment */}
              {er.comment && <p className="review-card__exercise-comment">{er.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {data.tip && (
        <div className="review-card__tip">
          <span className="review-card__tip-icon">💡</span>
          <span>{data.tip}</span>
        </div>
      )}
    </div>
  );
}
