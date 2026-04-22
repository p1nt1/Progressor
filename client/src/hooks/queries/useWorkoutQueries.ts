import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workouts as workoutsApi, ai } from '../../api/client';
import type { WorkoutSummary, WorkoutStats, ProgressionMilestone, ProgressionSummaryItem } from '../../types';

export const workoutKeys = {
  all: ['workouts'] as const,
  list: () => [...workoutKeys.all, 'list'] as const,
  detail: (id: string) => [...workoutKeys.all, 'detail', id] as const,
  review: (workoutId: string) => [...workoutKeys.all, 'review', workoutId] as const,
  progressionLog: (exerciseId?: number) => [...workoutKeys.all, 'progressionLog', exerciseId] as const,
  progressionSummary: () => [...workoutKeys.all, 'progressionSummary'] as const,
  lastWeights: (ids: number[]) => [...workoutKeys.all, 'lastWeights', ids] as const,
  stats: () => [...workoutKeys.all, 'stats'] as const,
};

export function useWorkouts() {
  return useQuery<WorkoutSummary[]>({
    queryKey: workoutKeys.list(),
    queryFn: async () => {
      const res = await workoutsApi.list();
      return res.data;
    },
  });
}

export function useWorkoutDetail(id: string | null) {
  return useQuery({
    queryKey: workoutKeys.detail(id!),
    queryFn: async () => {
      const res = await workoutsApi.get(id!);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useWorkoutReview(workoutId: string | null) {
  return useQuery({
    queryKey: workoutKeys.review(workoutId!),
    queryFn: async () => {
      const res = await ai.reviewWorkout(workoutId!);
      if (res.status === 204 || !res.data?.review) return null;
      return res.data;
    },
    enabled: !!workoutId,
    staleTime: Infinity, // reviews don't change
  });
}

export function useSaveAndCompleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const createRes = await workoutsApi.create(payload);
      const workoutId = createRes.data.id;
      const completeRes = await workoutsApi.complete(workoutId);
      return { suggestions: completeRes.data.suggestions || [], workoutId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workoutKeys.list() });
      qc.invalidateQueries({ queryKey: workoutKeys.progressionSummary() });
      qc.invalidateQueries({ queryKey: workoutKeys.stats() });
    },
  });
}

export function useProgressionLog(exerciseId?: number, enabled = true) {
  return useQuery<ProgressionMilestone[]>({
    queryKey: workoutKeys.progressionLog(exerciseId),
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 };
      if (exerciseId !== undefined) params.exerciseId = exerciseId;
      const res = await workoutsApi.progressionLog(exerciseId, 50);
      return res.data;
    },
    enabled,
  });
}

export function useProgressionSummary() {
  return useQuery<ProgressionSummaryItem[]>({
    queryKey: workoutKeys.progressionSummary(),
    queryFn: async () => {
      const res = await workoutsApi.progressionSummary();
      return res.data;
    },
  });
}

export function useLastWeights(exerciseIds: number[]) {
  return useQuery({
    queryKey: workoutKeys.lastWeights(exerciseIds),
    queryFn: async () => {
      const res = await workoutsApi.lastWeights(exerciseIds);
      return res.data as Record<number, { setNumber: number; weightKg: number; reps: number }[]>;
    },
    enabled: exerciseIds.length > 0,
  });
}

export function useWorkoutStats() {
  return useQuery<WorkoutStats>({
    queryKey: workoutKeys.stats(),
    queryFn: async () => {
      const res = await workoutsApi.stats();
      return res.data;
    },
  });
}

