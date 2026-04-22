import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profile as profileApi } from '../../api/client';
import type { ProfileData } from '../../types';
import { useAppDispatch } from '../../store/hooks';
import { setProfile } from '../../store/userSlice';

export const profileKeys = {
  all: ['profile'] as const,
  data: () => [...profileKeys.all, 'data'] as const,
};

// Transforms snake_case API response to camelCase ProfileData
function mapProfile(raw: Record<string, unknown>): ProfileData {
  return {
    heightCm: raw.height_cm !== null && raw.height_cm !== undefined ? Number(raw.height_cm) : null,
    weightKg: raw.weight_kg !== null && raw.weight_kg !== undefined ? Number(raw.weight_kg) : null,
    sex: raw.sex as string,
    dateOfBirth: raw.date_of_birth instanceof Date
      ? raw.date_of_birth.toISOString().slice(0, 10)
      : (raw.date_of_birth as string) ?? null,
    experienceLevel: raw.experience_level as string,
    trainingGoal: raw.training_goal as string,
    trainingDaysPerWeek: raw.training_days_per_week as number,
    selectedSplit: (raw.selected_split as string) ?? 'ppl',
    splitRotationIndex: (raw.split_rotation_index as number) ?? 0,
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
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: async (data: ProfileData) => {
      const res = await profileApi.save(data);
      return mapProfile(res.data);
    },
    onSuccess: (data) => {
      qc.setQueryData(profileKeys.data(), data);
      dispatch(setProfile(data));
    },
  });
}

export function usePatchSplitRotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (splitRotationIndex: number) => {
      await profileApi.patchSplitRotation(splitRotationIndex);
      return splitRotationIndex;
    },
    onSuccess: (splitRotationIndex) => {
      qc.setQueryData<ProfileData | null>(profileKeys.data(), (old) =>
        old ? { ...old, splitRotationIndex } : old
      );
    },
  });
}

