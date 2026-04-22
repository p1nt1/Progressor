import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workouts as workoutsApi } from '../../api/client';
import type { WorkoutSummary, WorkoutStats } from '../../types';

export const workoutKeys = {
  all: ['workouts'] as const,
  list: () => [...workoutKeys.all, 'list'] as const,
  detail: (id: string) => [...workoutKeys.all, 'detail', id] as const,
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


export function useSaveAndCompleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const createRes = await workoutsApi.create(payload);
      const workoutId = createRes.data.id;
      await workoutsApi.complete(workoutId);
      return { workoutId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}


export function usePrefillLastWeights() {
  return useMutation({
    mutationFn: async (exerciseIds: number[]) => {
      if (exerciseIds.length === 0) return {} as Record<number, { setNumber: number; weightKg: number; reps: number }[]>;
      const res = await workoutsApi.lastWeights(exerciseIds);
      return res.data as Record<number, { setNumber: number; weightKg: number; reps: number }[]>;
    },
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

