import { getSupabaseClient, fetchWithCache, clearSupabaseCache, getCurrentUserIdCached } from '@/platform/supabaseClient';

export interface LessonRequirementProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  song_id: string | null;
  lesson_song_id?: string | null;
  clear_count: number;
  clear_dates: string[]; // Date strings in ISO format
  best_rank?: string;
  last_cleared_at?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  daily_progress?: Record<string, { count: number; completed: boolean }>; // 日ごとの進捗
}

/**
 * 特定のレッスンの実習課題の進捗を取得
 */
export async function fetchLessonRequirementsProgress(lessonId: string): Promise<LessonRequirementProgress[]> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');

  const cacheKey = `lesson_requirements_progress:${userId}:${lessonId}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('user_lesson_requirements_progress')
      .select('*')
      .eq('user_id', userId)
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
  clearConditions: any,
  options?: {
    sourceType?: 'song' | 'fantasy';
    lessonSongId?: string;
  }
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');

  // レッスン課題のタイプに応じて、適切なIDを使用
  // ファンタジーステージの場合は、lessonSongIdを使用（song_idカラムに格納）
  const progressSongId = options?.sourceType === 'fantasy' && options?.lessonSongId 
    ? options.lessonSongId 
    : songId;
    
  const { data, error } = await supabase.rpc('update_lesson_requirement_progress', {
    p_user_id: userId,
    p_lesson_id: lessonId,
    p_song_id: progressSongId,
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
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');

  // レッスンに必要な実習課題の数を取得（楽曲とファンタジーステージ両方）
  const { data: requirements, error: reqError } = await supabase
    .from('lesson_songs')
    .select('id, song_id, fantasy_stage_id, is_fantasy')
    .eq('lesson_id', lessonId);

  if (reqError || !requirements) return false;
  if (requirements.length === 0) return true; // 実習課題がない場合は完了扱い

  // ユーザーの進捗を取得（lesson_songs.idで管理）
  const { data: progress, error: progError } = await supabase
    .from('user_lesson_requirements_progress')
    .select('song_id, is_completed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('is_completed', true);

  if (progError) return false;

  // すべての実習課題が完了しているかチェック
  // song_idフィールドにはlesson_songs.idが格納されているので、それを使用
  const completedIds = new Set(progress?.map(p => p.song_id) || []);
  return requirements.every(req => completedIds.has(req.id));
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
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');

  // レッスンの実習課題を取得（ファンタジーステージも含む）
  const { data: requirements, error: reqError } = await supabase
    .from('lesson_songs')
    .select(`
      *,
      songs (id, title, artist),
      fantasy_stage:fantasy_stages (*)
    `)
    .eq('lesson_id', lessonId);

  if (reqError) throw new Error(`実習課題の取得に失敗しました: ${reqError.message}`);

  // ユーザーの進捗を取得
  const progress = await fetchLessonRequirementsProgress(lessonId);

  // すべて完了しているかチェック
  const allCompleted = requirements ? 
    requirements.every(req => 
      progress.some(p => {
        // ファンタジーステージの場合はlesson_song_idで比較
        if (req.is_fantasy) {
          return p.lesson_song_id === req.id && p.is_completed;
        }
        // 通常の楽曲の場合はsong_idで比較
        return p.song_id === req.song_id && p.is_completed;
      })
    ) : true;

  return {
    requirements: requirements || [],
    progress,
    allCompleted
  };
}

/**
 * 複数のレッスンの実習課題進捗を一括で取得（パフォーマンス向上）
 */
export async function fetchMultipleLessonRequirementsProgress(lessonIds: string[]): Promise<Record<string, LessonRequirementProgress[]>> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');
  if (lessonIds.length === 0) return {};

  const cacheKey = `multiple_lesson_requirements_progress:${userId}:${lessonIds.sort().join(',')}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('user_lesson_requirements_progress')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds),
    1000 * 60 * 5 // 5分キャッシュ
  );

  if (error) throw new Error(`実習課題の進捗取得に失敗しました: ${error.message}`);
  
  // レッスンIDごとにグループ化
  const result: Record<string, LessonRequirementProgress[]> = {};
  lessonIds.forEach(lessonId => {
    result[lessonId] = [];
  });
  
  (data || []).forEach(progress => {
    if (result[progress.lesson_id]) {
      result[progress.lesson_id].push(progress);
    }
  });
  
  return result;
} 