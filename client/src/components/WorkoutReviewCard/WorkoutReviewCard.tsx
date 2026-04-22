import type { WorkoutReview } from '../../types';
import './WorkoutReviewCard.css';


const VERDICT_EMOJI: Record<string, string> = {
  improved: '📈',
  maintained: '➡️',
  declined: '📉',
};

const VERDICT_CLASS: Record<string, string> = {
  improved: 'review-card__verdict--improved',
  maintained: 'review-card__verdict--maintained',
  declined: 'review-card__verdict--declined',
};

export function WorkoutReviewCard({ review, onDismiss }: { review: WorkoutReview; onDismiss?: () => void }) {
  const { type, review: data } = review;

  if (!data || typeof data === 'string') return null;

  return (
    <div className="review-card">
      <div className="review-card__header">
        <h2 className="review-card__title">🤖 AI Workout Review</h2>
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
              <div className="review-card__exercise-header">
                <span className="review-card__exercise-name">{er.exerciseName}</span>
                <span className="review-card__exercise-verdict">
                  {VERDICT_EMOJI[er.verdict] || ''} {er.verdict}
                </span>
              </div>
              <p className="review-card__exercise-comment">{er.comment}</p>
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

