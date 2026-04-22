import type { ProgressionMilestone, ProgressionSummaryItem } from '../../types';

interface MilestoneCardProps {
  item: ProgressionSummaryItem;
  isExpanded: boolean;
  log: ProgressionMilestone[];
  logLoading: boolean;
  onToggle: (exerciseId: number) => void;
}

export function MilestoneCard({ item, isExpanded, log, logLoading, onToggle }: MilestoneCardProps) {
  const starting = parseFloat(String(item.starting_weight));
  const current = parseFloat(String(item.current_weight));
  const totalGain = current - starting;
  const gainSign = totalGain >= 0 ? '+' : '';
  const gainClass = `mc__gain-badge${totalGain < 0 ? ' mc__gain-badge--neg' : totalGain === 0 ? ' mc__gain-badge--zero' : ''}`;

  const currentEntry = log.find((e) => e.is_current);
  // newest first
  const sortedLog = [...log].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="mc">
      <button className="mc__header" onClick={() => onToggle(item.exercise_id)}>
        <div className="mc__top">
          <span className="mc__name">{item.exercise_name}</span>
          <span className="mc__chevron">{isExpanded ? '▲' : '▼'}</span>
        </div>
        <div className="mc__weights">
          <div className="mc__weight-block">
            <span className="mc__weight-label">Start</span>
            <span className="mc__weight-value">{starting}kg</span>
          </div>
          <div className="mc__weight-arrow">→</div>
          <div className="mc__weight-block">
            <span className="mc__weight-label">Now</span>
            <span className="mc__weight-value mc__weight-value--now">{current}kg</span>
          </div>
          <span className={gainClass}>{gainSign}{totalGain.toFixed(2).replace(/\.?0+$/, '')}kg</span>
        </div>
      </button>

      {isExpanded && (
        <div className="mc__timeline">
          {logLoading && log.length === 0 ? (
            <div className="mc__loading">Loading…</div>
          ) : log.length === 0 ? (
            <div className="mc__loading">No milestone data yet.</div>
          ) : (
            <>
              {/* Next target banner — shown at the top if we know the current entry */}
              {currentEntry && (
                <div className="mc__next-target">
                  <div className="mc__next-target-left">
                    <span className="mc__next-target-icon">🎯</span>
                    <div>
                      <div className="mc__next-target-label">Next target</div>
                      <div className="mc__next-target-hint">Hit all sets with 10+ reps to unlock</div>
                    </div>
                  </div>
                  <span className="mc__next-target-weight">
                    {parseFloat(String(currentEntry.next_target_weight))}kg
                  </span>
                </div>
              )}

              {/* Full history timeline */}
              <div className="mc__entries">
                {sortedLog.map((entry, i) => {
                  const prev = parseFloat(String(entry.previous_weight));
                  const next = parseFloat(String(entry.new_weight));
                  const stepDiff = next - prev;
                  const cumulativeGain = next - starting;
                  return (
                    <div key={entry.id} className={`mc__entry ${entry.is_current ? 'mc__entry--current' : ''}`}>
                      <div className="mc__entry-dot" />
                      <div className="mc__entry-body">
                        <div className="mc__entry-headline">
                          <span className="mc__entry-new-weight">{next}kg</span>
                          {entry.is_current && <span className="mc__entry-current-tag">current</span>}
                          <span className="mc__entry-step">+{stepDiff.toFixed(2).replace(/\.?0+$/, '')}kg</span>
                        </div>
                        <div className="mc__entry-meta">
                          <span className="mc__entry-date">
                            {new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="mc__entry-from">from {prev}kg</span>
                          <span className="mc__entry-cumulative">+{cumulativeGain.toFixed(2).replace(/\.?0+$/, '')}kg total</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
