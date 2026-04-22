import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { workouts as workoutsApi, ai } from '../api/client';
import type { ActivePlan, WorkoutReview } from '../types';

// ── State ────────────────────────────────────────────────────────────────────
interface WorkoutState {
  activePlan: ActivePlan | null;
  saving: boolean;
  workoutReview: WorkoutReview | null;
  reviewLoading: boolean;
  restTimer: { seconds: number } | null;
}

const initialState: WorkoutState = {
  activePlan: null,
  saving: false,
  workoutReview: null,
  reviewLoading: false,
  restTimer: null,
};

// ── Async thunks (kept in Redux because they mutate activePlan lifecycle) ───
export const saveAndCompleteWorkout = createAsyncThunk(
  'workout/saveAndComplete',
  async (payload: any) => {
    const createRes = await workoutsApi.create(payload);
    const workoutId = createRes.data.id;
    await workoutsApi.complete(workoutId);
    return { workoutId };
  },
);

export const fetchWorkoutReview = createAsyncThunk(
  'workout/fetchReview',
  async (workoutId: string) => {
    const res = await ai.reviewWorkout(workoutId);
    if (res.status === 204 || !res.data?.review) return null;
    return res.data as WorkoutReview;
  },
);

export const prefillActivePlanWithLastWeights = createAsyncThunk(
  'workout/prefillLastWeights',
  async (plan: ActivePlan) => {
    const exerciseIds = plan.exercises
      .map((ex) => ex.exerciseId)
      .filter((id): id is number => id !== undefined);
    if (exerciseIds.length === 0) return plan;

    const res = await workoutsApi.lastWeights(exerciseIds);
    const lastWeightsMap: Record<number, { setNumber: number; weightKg: number; reps: number }[]> = res.data;

    const updatedExercises = plan.exercises.map((ex) => {
      const lastSets = ex.exerciseId ? lastWeightsMap[ex.exerciseId] : undefined;
      if (!lastSets?.length) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => {
          if (s.weightKg !== 0 || s.reps !== 0) return s;
          const match = lastSets.find((ls) => ls.setNumber === s.setNumber) ?? lastSets.at(-1)!;
          return { ...s, weightKg: match.weightKg, reps: match.reps };
        }),
      };
    });
    return { ...plan, exercises: updatedExercises };
  },
);

// ── Slice ────────────────────────────────────────────────────────────────────
const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    setActivePlan(state, action: PayloadAction<ActivePlan | null>) {
      state.activePlan = action.payload;
    },
    clearReview(state) {
      state.workoutReview = null;
    },
    updateSetInPlan(state, action: PayloadAction<{ exIdx: number; setIdx: number; field: string; value: any }>) {
      const { exIdx, setIdx, field, value } = action.payload;
      if (state.activePlan) {
        (state.activePlan.exercises[exIdx].sets[setIdx] as any)[field] = value;
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
  extraReducers: (builder) => {
    builder
      .addCase(saveAndCompleteWorkout.pending, (state) => { state.saving = true; })
      .addCase(saveAndCompleteWorkout.fulfilled, (state) => {
        state.saving = false;
        state.activePlan = null;
        state.restTimer = null;
      })
      .addCase(saveAndCompleteWorkout.rejected, (state) => { state.saving = false; })
      .addCase(fetchWorkoutReview.pending, (state) => { state.reviewLoading = true; })
      .addCase(fetchWorkoutReview.fulfilled, (state, action) => {
        state.reviewLoading = false;
        state.workoutReview = action.payload ?? null;
      })
      .addCase(fetchWorkoutReview.rejected, (state) => { state.reviewLoading = false; })
      .addCase(prefillActivePlanWithLastWeights.fulfilled, (state, action) => {
        state.activePlan = action.payload;
      });
  },
});

export const {
  setActivePlan,
  clearReview,
  updateSetInPlan,
  toggleSetInPlan,
  tickRestTimer,
  skipRestTimer,
} = workoutSlice.actions;

export default workoutSlice.reducer;
