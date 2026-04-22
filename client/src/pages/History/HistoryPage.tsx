import { useState } from 'react';
import { useWorkouts, useWorkoutDetail, useProgressionLog, useProgressionSummary } from '../../hooks/queries';
import { MilestoneCard } from '../../components/MilestoneCard/MilestoneCard.tsx';
import { WorkoutHistoryItem } from '../../components/WorkoutHistoryItem/WorkoutHistoryItem.tsx';
import { WorkoutDetail } from '../../components/WorkoutDetail/WorkoutDetail.tsx';
import type { ProgressionSummaryItem } from '../../types';
import './HistoryPage.css';

export function HistoryPage() {
  const [tab, setTab] = useState<'history' | 'milestones'>('history');
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  const { data: list = [], isLoading: listLoading } = useWorkouts();
  const { data: selectedWorkout } = useWorkoutDetail(selectedWorkoutId);
  const { data: progressionSummary = [], isLoading: progressionSummaryLoading } = useProgressionSummary();
  const { data: progressionLogAll = [] } = useProgressionLog(undefined, tab === 'milestones');
  const { data: progressionLogExercise = [] } = useProgressionLog(expandedExercise ?? undefined, expandedExercise !== null);

  // Merge all progression log entries
  const progressionLog = expandedExercise !== null
    ? [...progressionLogAll.filter((e) => e.exercise_id !== expandedExercise), ...progressionLogExercise]
    : progressionLogAll;

  const handleExerciseExpand = (exerciseId: number) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  if (listLoading) return <div className="workout-history__loading">Loading…</div>;

  // ── Workout detail view ────────────────────────────────────────────────────
  if (selectedWorkout) {
    return (
      <div className="workout-history">
        <WorkoutDetail
          workout={selectedWorkout}
          onBack={() => setSelectedWorkoutId(null)}
        />
      </div>
    );
  }

  // ── Tabbed view ────────────────────────────────────────────────────────────
  return (
    <div className="workout-history">
      {/* Tab bar */}
      <div className="history-tabs">
        <button
          className={`history-tabs__btn ${tab === 'history' ? 'history-tabs__btn--active' : ''}`}
          onClick={() => setTab('history')}
        >
          📋 History
        </button>
        <button
          className={`history-tabs__btn ${tab === 'milestones' ? 'history-tabs__btn--active' : ''}`}
          onClick={() => setTab('milestones')}
        >
          🏆 Milestones
          {progressionSummary.length > 0 && (
            <span className="history-tabs__badge">{progressionSummary.reduce((a: number, b: ProgressionSummaryItem) => a + Number(b.milestone_count), 0)}</span>
          )}
        </button>
      </div>

      {/* ── History tab ─────────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <>
          <h2 className="workout-history__title">Workout History</h2>
          {list.length === 0 ? (
            <p className="workout-history__empty">No workouts yet. Start your first one!</p>
          ) : (
            list.map((w) => (
              <WorkoutHistoryItem
                key={w.id}
                workout={w}
                onClick={(id) => setSelectedWorkoutId(id)}
              />
            ))
          )}
        </>
      )}

      {/* ── Milestones tab ──────────────────────────────────────────────────── */}
      {tab === 'milestones' && (
        <>
          <h2 className="workout-history__title">Strength Milestones</h2>
          {progressionSummaryLoading ? (
            <div className="workout-history__loading">Loading milestones…</div>
          ) : progressionSummary.length === 0 ? (
            <div className="milestones__empty">
              <span className="milestones__empty-icon">🏋️</span>
              <p>No milestones yet.</p>
              <p className="milestones__empty-sub">Complete workouts and hit your rep targets — every weight increase earns a milestone here.</p>
            </div>
          ) : (
            <div className="milestones__list">
              {progressionSummary.map((item: ProgressionSummaryItem) => (
                <MilestoneCard
                  key={item.exercise_id}
                  item={item}
                  isExpanded={expandedExercise === item.exercise_id}
                  log={progressionLog.filter((e) => e.exercise_id === item.exercise_id)}
                  logLoading={false}
                  onToggle={handleExerciseExpand}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
