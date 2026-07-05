import { getSupabaseClient, fetchWithCache, clearSupabaseCache, getCurrentUserIdCached, clearCacheByPattern } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';
import type { ClearConditions } from '@/types';
import {
  areAllClearRequiredLessonSongsCompleted,
  isClearRequiredLessonSong,
  isLessonSongRequirementCompleted,
} from '@/utils/lessonRequirementProgress';

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
  const userId = await requireUserId();

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
  clearConditions: ClearConditions | Record<string, unknown>,
  options?: {
    sourceType?: 'song' | 'fantasy' | 'ear_training' | 'survival' | 'balloon_rush';
    lessonSongId?: string;
  }
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();

  // レッスン課題のタイプに応じて、適切なIDを使用
  // lesson_songs.idで管理する課題（ファンタジー/耳コピ）はlessonSongIdを使用
  const progressSongId = options?.sourceType !== 'song' && options?.lessonSongId
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
  const userId = await requireUserId();

  // レッスンに必要な実習課題の数を取得（楽曲とファンタジーステージ両方）
  const { data: requirements, error: reqError } = await supabase
    .from('lesson_songs')
    .select('id, song_id, fantasy_stage_id, is_fantasy, is_survival, is_survival_tutorial, is_balloon_rush, is_ear_training, is_ear_training_tutorial, ear_training_stage_id, is_clear_required')
    .eq('lesson_id', lessonId);

  if (reqError || !requirements) return false;
  if (requirements.length === 0) return true; // 実習課題がない場合は完了扱い

  const required = requirements.filter(isClearRequiredLessonSong);
  if (required.length === 0) return true;

  // ユーザーの進捗を取得（lesson_songs.idで管理）
  const { data: progress, error: progError } = await supabase
    .from('user_lesson_requirements_progress')
    .select('lesson_song_id, is_completed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('is_completed', true);

  if (progError) return false;

  return required.every(req =>
    (progress ?? []).some(p => isLessonSongRequirementCompleted(req, { ...p, song_id: null })),
  );
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
  const userId = await requireUserId();

  // レッスンの実習課題を取得（ファンタジーステージも含む）
  const { data: requirements, error: reqError } = await supabase
    .from('lesson_songs')
    .select(`
      *,
      songs (id, title, artist),
      fantasy_stage:fantasy_stages (*),
      ear_training_stage:ear_training_stages (*),
      balloon_rush_stage:balloon_rush_stages (
        id, slug, title, title_en, time_limit_sec, pop_quota, stage_type,
        production_staff_hint_mode, production_keyboard_hint_mode, hide_chord_names_in_battle
      )
    `)
    .eq('lesson_id', lessonId)
    .order('order_index', { ascending: true });

  if (reqError) throw new Error(`実習課題の取得に失敗しました: ${reqError.message}`);

  // ユーザーの進捗を取得
  const progress = await fetchLessonRequirementsProgress(lessonId);

  const allCompleted = requirements
    ? areAllClearRequiredLessonSongsCompleted(requirements, progress)
    : true;

  return {
    requirements: requirements || [],
    progress,
    allCompleted
  };
}

const REQ_BATCH_SIZE = 80;

async function fetchRequirementsInBatches(
  userId: string,
  lessonIds: string[],
  forceRefresh: boolean,
  ttl: number,
): Promise<LessonRequirementProgress[]> {
  const supabase = getSupabaseClient();
  const allData: LessonRequirementProgress[] = [];

  const batches: string[][] = [];
  for (let i = 0; i < lessonIds.length; i += REQ_BATCH_SIZE) {
    batches.push(lessonIds.slice(i, i + REQ_BATCH_SIZE));
  }

  await Promise.all(batches.map(async (batch, idx) => {
    const cacheKey = `lesson_req_progress:${userId}:b${idx}:${batch.length}:${batch[0]}`;
    if (forceRefresh) clearCacheByPattern(cacheKey);

    const { data, error } = await fetchWithCache(
      cacheKey,
      async () => await supabase
        .from('user_lesson_requirements_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', batch),
      ttl,
    );
    if (error) throw new Error(`実習課題の進捗取得に失敗しました: ${error.message}`);
    if (data) allData.push(...data);
  }));

  return allData;
}

/**
 * 複数のレッスンの実習課題進捗を一括で取得（パフォーマンス向上）
 */
export async function fetchMultipleLessonRequirementsProgress(lessonIds: string[]): Promise<Record<string, LessonRequirementProgress[]>> {
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');
  if (lessonIds.length === 0) return {};

  const sorted = lessonIds.slice().sort();
  const allData = await fetchRequirementsInBatches(userId, sorted, false, 1000 * 30);

  const result: Record<string, LessonRequirementProgress[]> = {};
  sorted.forEach(id => { result[id] = []; });
  allData.forEach(progress => {
    if (result[progress.lesson_id]) {
      result[progress.lesson_id].push(progress);
    }
  });

  return result;
} 

/**
 * 画面上の全レッスンIDで1回だけ要件進捗を取得するための集約API
 * - 30s TTL。RealtimeのUPDATE/INSERT/DELETEで該当キーだけ無効化を推奨
 * - 大量のレッスンIDでもバッチ分割でURL長制限を回避
 */
export async function fetchAggregatedRequirementsProgress(
  lessonIds: string[],
  { forceRefresh = false }: { forceRefresh?: boolean } = {}
): Promise<Record<string, LessonRequirementProgress[]>> {
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');
  if (lessonIds.length === 0) return {};

  const sorted = lessonIds.slice().sort();
  const allData = await fetchRequirementsInBatches(userId, sorted, forceRefresh, 1000 * 30);

  const result: Record<string, LessonRequirementProgress[]> = {};
  sorted.forEach(id => { result[id] = []; });
  allData.forEach(p => {
    if (!result[p.lesson_id]) result[p.lesson_id] = [];
    result[p.lesson_id].push(p);
  });
  return result;
}
