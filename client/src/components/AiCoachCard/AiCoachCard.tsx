import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { WorkoutReviewCard } from '../WorkoutReviewCard/WorkoutReviewCard';
import './AiCoachCard.css';

export function AiCoachCard() {
  const { workoutReview, reviewLoading } = useAppSelector((s) => s.workout);
  const [collapsed, setCollapsed] = useState(true);
  const { pathname } = useLocation();

  const hasReview = reviewLoading || (!!workoutReview && typeof workoutReview.review !== 'string');

  // Auto-expand when a review arrives
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hasReview) setCollapsed(false);
  }, [hasReview]);

  // Collapse when navigating to a different page
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(true);
  }, [pathname]);

  // Don't render when there's nothing to show
  if (!hasReview) return null;

  return (
    <section className="ai-coach">
      <button
        className="ai-coach__header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls="ai-coach-body"
      >
        <span className="ai-coach__header-left">
          <Bot size={16} className="ai-coach__icon" />
          <span className="ai-coach__title">
            Coach Insights
            {!reviewLoading && (
              <span className="ai-coach__badge-new">New</span>
            )}
          </span>
        </span>
        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {!collapsed && (
        <div className="ai-coach__body" id="ai-coach-body">
          {reviewLoading ? (
            <div className="ai-coach__shimmer-wrap">
              <div className="ai-coach__shimmer ai-coach__shimmer--line" />
              <div className="ai-coach__shimmer ai-coach__shimmer--line ai-coach__shimmer--short" />
              <div className="ai-coach__shimmer ai-coach__shimmer--line ai-coach__shimmer--shorter" />
              <p className="ai-coach__loading">Generating your workout review…</p>
            </div>
          ) : workoutReview ? (
            <WorkoutReviewCard review={workoutReview} variant="hero" />
          ) : null}
        </div>
      )}
    </section>
  );
}
