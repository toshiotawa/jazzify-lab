import { fetchTrainingActivityDays } from '@/platform/supabaseTraining';
import {
  getLocalDateKey,
  isTodayTrainingStreakUpdated,
  resolveUserTimezone,
} from '@/utils/trainingActivity';
import type { Profile } from '@/types';

export const loadTodayTrainingStreakUpdated = async (
  profile: Pick<Profile, 'timezone' | 'country'> | null | undefined,
): Promise<boolean> => {
  if (!profile) {
    return false;
  }
  try {
    const timezone = resolveUserTimezone(profile);
    const days = await fetchTrainingActivityDays(timezone);
    const todayKey = getLocalDateKey(new Date(), timezone);
    return isTodayTrainingStreakUpdated(new Set(days), todayKey);
  } catch {
    return false;
  }
};
