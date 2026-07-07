import { getSupabaseClient } from '@/platform/supabaseClient';
import {
  collectAssignmentInputSnapshot,
  type AssignmentInputSnapshot,
} from '@/utils/analytics/assignmentInputSnapshot';
import { trackEvent } from '@/utils/analytics/ga';

export interface RecordAssignmentStartParams {
  lessonId: string;
  lessonSongId: string;
  isPractice: boolean;
}

const persistAssignmentStart = async (
  userId: string,
  params: RecordAssignmentStartParams,
  inputSnapshot: AssignmentInputSnapshot,
): Promise<void> => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('record_assignment_start', {
    p_user_id: userId,
    p_lesson_song_id: params.lessonSongId,
    p_lesson_id: params.lessonId,
    p_platform: 'web',
    p_is_practice: params.isPractice,
    p_input_method: inputSnapshot.inputMethod,
    p_midi_api_available: inputSnapshot.midiApiAvailable,
    p_midi_device_count: inputSnapshot.midiDeviceCount,
    p_midi_connected: inputSnapshot.midiConnected,
  });

  if (error) {
    throw error;
  }
};

export const recordAssignmentStart = async (
  userId: string,
  params: RecordAssignmentStartParams,
): Promise<void> => {
  const inputSnapshot = await collectAssignmentInputSnapshot();
  await persistAssignmentStart(userId, params, inputSnapshot);
};

export const recordAssignmentStartFireAndForget = (
  userId: string,
  params: RecordAssignmentStartParams,
): void => {
  void (async () => {
    try {
      const inputSnapshot = await collectAssignmentInputSnapshot();
      await persistAssignmentStart(userId, params, inputSnapshot);
      trackEvent('assignment_start', {
        lesson_id: params.lessonId,
        lesson_song_id: params.lessonSongId,
        platform: 'web',
        is_practice: params.isPractice,
        input_method: inputSnapshot.inputMethod,
        midi_api_available: inputSnapshot.midiApiAvailable,
        midi_device_count: inputSnapshot.midiDeviceCount,
        midi_connected: inputSnapshot.midiConnected,
      });
    } catch {
      /* analytics must not block UX */
    }
  })();
};
