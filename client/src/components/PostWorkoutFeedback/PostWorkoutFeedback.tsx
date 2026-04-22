import { useState } from 'react';
import { SkipForward, Send } from 'lucide-react';
import './PostWorkoutFeedback.css';

const FEEDBACK_OPTIONS = [
  { value: 1, emoji: '😩', label: 'Awful' },
  { value: 2, emoji: '😕', label: 'Rough' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '💪', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Great' },
] as const;

type Props = {
  onSubmit: (rating: number) => void;
  onSkip: () => void;
};

export function PostWorkoutFeedback({ onSubmit, onSkip }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="feedback-overlay">
      <div className="feedback-overlay__content">
        <div className="feedback-overlay__label">Session Complete</div>
        <div className="feedback-overlay__title">How did you feel?</div>

        <div className="feedback-overlay__scale">
          {FEEDBACK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`feedback-overlay__option ${selected === opt.value ? 'feedback-overlay__option--selected' : ''}`}
              onClick={() => setSelected(opt.value)}
            >
              <span className="feedback-overlay__emoji">{opt.emoji}</span>
              <span className="feedback-overlay__option-label">{opt.label}</span>
            </button>
          ))}
        </div>

        <button
          className="feedback-overlay__submit"
          disabled={!selected}
          onClick={() => selected && onSubmit(selected)}
        >
          <Send size={14} /> Submit
        </button>
        <button className="feedback-overlay__skip" onClick={onSkip}>
          <SkipForward size={14} /> Skip
        </button>
      </div>
    </div>
  );
}
