import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profile as profileApi, ai as aiApi } from '../../api/client';
import type { ProfileData } from '../../types';

export const profileKeys = {
  all: ['profile'] as const,
  data: () => [...profileKeys.all, 'data'] as const,
  weeklySummary: () => [...profileKeys.all, 'weeklySummary'] as const,
};

// Transforms snake_case API response to camelCase ProfileData
function mapProfile(raw: any): ProfileData {
  return {
    heightCm: raw.height_cm,
    weightKg: raw.weight_kg,
    sex: raw.sex,
    dateOfBirth: raw.date_of_birth,
    experienceLevel: raw.experience_level,
    trainingGoal: raw.training_goal,
    trainingDaysPerWeek: raw.training_days_per_week,
  };
}

export function useProfile(enabled = true) {
  return useQuery<ProfileData | null>({
    queryKey: profileKeys.data(),
    queryFn: async () => {
      const res = await profileApi.get();
      return res.data ? mapProfile(res.data) : null;
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProfileData) => {
      const res = await profileApi.save(data);
      return mapProfile(res.data);
    },
    onSuccess: (data) => {
      qc.setQueryData(profileKeys.data(), data);
    },
  });
}

export function useWeeklySummary() {
  return useQuery<string>({
    queryKey: profileKeys.weeklySummary(),
    queryFn: async () => {
      const res = await aiApi.weeklySummary();
      return res.data.summary;
    },
    staleTime: 30 * 60 * 1000, // 30 min
    retry: false,
  });
}

