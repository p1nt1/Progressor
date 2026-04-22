import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { ActivePlan, WorkoutReview, WorkoutSet } from '../types';

// ── State ────────────────────────────────────────────────────────────────────
interface WorkoutState {
  activePlan: ActivePlan | null;
  workoutReview: WorkoutReview | null;
  reviewLoading: boolean;
  restTimer: { seconds: number } | null;
}

const initialState: WorkoutState = {
  activePlan: null,
  workoutReview: null,
  reviewLoading: false,
  restTimer: null,
};

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    setActivePlan(state, action: PayloadAction<ActivePlan | null>) {
      state.activePlan = action.payload;
    },
    clearActivePlan(state) {
      state.activePlan = null;
      state.restTimer = null;
    },
    setReviewLoading(state, action: PayloadAction<boolean>) {
      state.reviewLoading = action.payload;
    },
    setWorkoutReview(state, action: PayloadAction<WorkoutReview | null>) {
      state.workoutReview = action.payload;
      state.reviewLoading = false;
    },
    clearReview(state) {
      state.workoutReview = null;
    },
    updateSetInPlan(state, action: PayloadAction<{ exIdx: number; setIdx: number; field: keyof WorkoutSet; value: number | boolean | null }>) {
      const { exIdx, setIdx, field, value } = action.payload;
      if (state.activePlan) {
        const set = state.activePlan.exercises[exIdx].sets[setIdx];
        (set[field] as typeof value) = value;
      }
    },
    toggleSetInPlan(state, action: PayloadAction<{ exIdx: number; setIdx: number }>) {
      const { exIdx, setIdx } = action.payload;
      if (state.activePlan) {
        const set = state.activePlan.exercises[exIdx].sets[setIdx];
        set.completed = !set.completed;
        if (set.completed) {
          state.restTimer = { seconds: 90 };
        }
      }
    },
    tickRestTimer(state) {
      if (state.restTimer) {
        if (state.restTimer.seconds <= 1) {
          state.restTimer = null;
        } else {
          state.restTimer.seconds -= 1;
        }
      }
    },
    skipRestTimer(state) {
      state.restTimer = null;
    },
  },
});

export const {
  setActivePlan,
  clearActivePlan,
  setReviewLoading,
  setWorkoutReview,
  clearReview,
  updateSetInPlan,
  toggleSetInPlan,
  tickRestTimer,
  skipRestTimer,
} = workoutSlice.actions;

export default workoutSlice.reducer;
