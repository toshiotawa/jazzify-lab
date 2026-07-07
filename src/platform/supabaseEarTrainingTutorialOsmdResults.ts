import { getSupabaseClient, clearSupabaseCache } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';

interface RecordEarTrainingTutorialOsmdSceneResultParams {
  lessonSongId: string;
  scriptId: string;
  sceneIndex: number;
  requiredLoops: number;
  noteHitRatio: number;
}

export async function recordEarTrainingTutorialOsmdSceneResult(
  params: RecordEarTrainingTutorialOsmdSceneResultParams,
): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();

  const { error } = await supabase.rpc('record_ear_training_tutorial_osmd_scene_result', {
    p_user_id: userId,
    p_lesson_song_id: params.lessonSongId,
    p_script_id: params.scriptId,
    p_scene_index: params.sceneIndex,
    p_required_loops: params.requiredLoops,
    p_note_hit_ratio: params.noteHitRatio,
  });

  if (error) {
    throw new Error(`OSMDチュートリアル結果の保存に失敗しました: ${error.message}`);
  }

  clearSupabaseCache();
}
