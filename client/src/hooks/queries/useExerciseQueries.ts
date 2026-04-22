import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exercises as exercisesApi } from '../../api/client';
import type { Exercise } from '../../types';

export const exerciseKeys = {
  all: ['exercises'] as const,
  list: () => [...exerciseKeys.all, 'list'] as const,
};

export function useExercises() {
  return useQuery<Exercise[]>({
    queryKey: exerciseKeys.list(),
    queryFn: async () => {
      const res = await exercisesApi.list();
      return res.data;
    },
    staleTime: 10 * 60 * 1000, // exercises rarely change
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; muscleGroup: string; isCompound: boolean }) => {
      const res = await exercisesApi.create(data);
      return res.data as Exercise;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
  });
}
