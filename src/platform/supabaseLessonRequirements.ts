import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';

export interface LessonRequirementProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  song_id: string;
  clear_count: number;
  clear_dates: string[]; // Date strings in ISO format
  best_rank?: string;
  last_cleared_at?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 特定のレッスンの実習課題の進捗を取得
 */
export async function fetchLessonRequirementsProgress(lessonId: string): Promise<LessonRequirementProgress[]> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');

  const cacheKey = `lesson_requirements_progress:${user.id}:${lessonId}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('user_lesson_requirements_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId),
    1000 * 60 * 5 // 5分キャッシュ
  );

  if (error) throw new Error(`実習課題の進捗取得に失敗しました: ${error.message}`);
  return data || [];
}

/**
 * 実習課題の進捗を更新（ゲーム結果から呼び出される）
 */
export async function updateLessonRequirementProgress(
  lessonId: string,
  songId: string,
  rank: string,
  clearConditions: any
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');

  const { data, error } = await supabase.rpc('update_lesson_requirement_progress', {
    p_user_id: user.id,
    p_lesson_id: lessonId,
    p_song_id: songId,
    p_rank: rank,
    p_clear_conditions: clearConditions
  });

  if (error) throw new Error(`実習課題の進捗更新に失敗しました: ${error.message}`);
  
  // キャッシュをクリア
  clearSupabaseCache();
  
  return data || false;
}

/**
 * レッスンのすべての実習課題が完了しているかチェック
 */
export async function checkAllRequirementsCompleted(lessonId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');

  // レッスンに必要な実習課題の数を取得
  const { data: requirements, error: reqError } = await supabase
    .from('lesson_songs')
    .select('song_id')
    .eq('lesson_id', lessonId);

  if (reqError || !requirements) return false;
  if (requirements.length === 0) return true; // 実習課題がない場合は完了扱い

  // ユーザーの進捗を取得
  const { data: progress, error: progError } = await supabase
    .from('user_lesson_requirements_progress')
    .select('song_id, is_completed')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .eq('is_completed', true);

  if (progError) return false;

  // すべての実習課題が完了しているかチェック
  const completedSongIds = new Set(progress?.map(p => p.song_id) || []);
  return requirements.every(req => completedSongIds.has(req.song_id));
}

/**
 * 実習課題の進捗情報を詳細に取得（表示用）
 */
export async function fetchDetailedRequirementsProgress(lessonId: string): Promise<{
  requirements: any[];
  progress: LessonRequirementProgress[];
  allCompleted: boolean;
}> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');

  // レッスンの実習課題を取得
  const { data: requirements, error: reqError } = await supabase
    .from('lesson_songs')
    .select(`
      *,
      songs (id, title, artist)
    `)
    .eq('lesson_id', lessonId);

  if (reqError) throw new Error(`実習課題の取得に失敗しました: ${reqError.message}`);

  // ユーザーの進捗を取得
  const progress = await fetchLessonRequirementsProgress(lessonId);

  // すべて完了しているかチェック
  const allCompleted = requirements ? 
    requirements.every(req => 
      progress.some(p => p.song_id === req.song_id && p.is_completed)
    ) : true;

  return {
    requirements: requirements || [],
    progress,
    allCompleted
  };
} 