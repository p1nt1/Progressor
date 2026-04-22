import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bootstrap as bootstrapApi } from '../../api/client';
import { workoutKeys } from './useWorkoutQueries';
import { templateKeys } from './useTemplateQueries';
import { profileKeys } from './useProfileQueries';
import { useAppDispatch } from '../../store/hooks';
import { setProfile, setProfileLoading } from '../../store/userSlice';

function mapProfile(raw: Record<string, unknown> | null) {
  if (!raw) return null;
  return {
    heightCm: raw.height_cm as number | null,
    weightKg: raw.weight_kg as number | null,
    sex: raw.sex as string,
    dateOfBirth: raw.date_of_birth as string,
    experienceLevel: raw.experience_level as string,
    trainingGoal: raw.training_goal as string,
    trainingDaysPerWeek: raw.training_days_per_week as number,
    selectedSplit: (raw.selected_split as string) ?? 'ppl',
    splitRotationIndex: (raw.split_rotation_index as number) ?? 0,
  };
}

/**
 * Fetches all initial page data in a single server-side aggregated request,
 * then seeds the React Query cache so individual queries are already populated.
 */
export function useBootstrap(enabled = true) {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: ['bootstrap'],
    queryFn: async () => {
      dispatch(setProfileLoading(true));
      const res = await bootstrapApi.load();
      const { profile, templates, workouts, stats } = res.data;

      const mappedProfile = mapProfile(profile);

      // Seed the cache — individual queries will read from here instead of refetching
      qc.setQueryData(profileKeys.data(), mappedProfile);
      qc.setQueryData(templateKeys.list(), templates);
      qc.setQueryData(workoutKeys.list(), workouts);
      qc.setQueryData(workoutKeys.stats(), stats);

      // Sync profile into Redux for global access
      dispatch(setProfile(mappedProfile));

      return res.data;
    },
    enabled,
    staleTime: 30 * 1000, // treat as fresh for 30s to avoid duplicate fetches on mount
  });
}
