import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templates as templatesApi } from '../../api/client';
import type { WorkoutTemplate, ActiveExercise } from '../../types';

export const templateKeys = {
  all: ['templates'] as const,
  list: () => [...templateKeys.all, 'list'] as const,
};

export function useTemplates() {
  return useQuery<WorkoutTemplate[]>({
    queryKey: templateKeys.list(),
    queryFn: async () => {
      const res = await templatesApi.list();
      return res.data;
    },
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; type: string; exercises: ActiveExercise[] }) => {
      const res = await templatesApi.create(data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templateKeys.list() });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await templatesApi.remove(id);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templateKeys.list() });
    },
  });
}

