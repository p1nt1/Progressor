import { useState } from 'react';
import { useWorkouts, useWorkoutDetail } from '../../hooks/queries';
import { WorkoutHistoryItem } from '../../components/WorkoutHistoryItem/WorkoutHistoryItem.tsx';
import { WorkoutDetail } from '../../components/WorkoutDetail/WorkoutDetail.tsx';
import { ClipboardList } from 'lucide-react';
import './HistoryPage.css';

export function HistoryPage() {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  const { data: list = [], isLoading: listLoading } = useWorkouts();
  const { data: selectedWorkout } = useWorkoutDetail(selectedWorkoutId);

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

  // ── History tab ───────────────────────────────────────────────────────
  return (
    <div className="workout-history">
      <h2 className="workout-history__title"><ClipboardList size={22} /> Workout History</h2>
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
    </div>
  );
}
