import { getSupabaseClient } from '@/platform/supabaseClient';
import { trackEvent } from '@/utils/analytics/ga';

export interface RecordAssignmentStartParams {
  lessonId: string;
  lessonSongId: string;
  isPractice: boolean;
}

export const recordAssignmentStart = async (
  userId: string,
  params: RecordAssignmentStartParams,
): Promise<void> => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('record_assignment_start', {
    p_user_id: userId,
    p_lesson_song_id: params.lessonSongId,
    p_lesson_id: params.lessonId,
    p_platform: 'web',
    p_is_practice: params.isPractice,
  });

  if (error) {
    throw error;
  }
};

export const recordAssignmentStartFireAndForget = (
  userId: string,
  params: RecordAssignmentStartParams,
): void => {
  void recordAssignmentStart(userId, params).catch(() => {
    /* analytics must not block UX */
  });

  trackEvent('assignment_start', {
    lesson_id: params.lessonId,
    lesson_song_id: params.lessonSongId,
    platform: 'web',
    is_practice: params.isPractice,
  });
};
