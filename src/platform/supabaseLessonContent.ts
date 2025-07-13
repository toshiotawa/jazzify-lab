import { getSupabaseClient, fetchWithCache } from '@/platform/supabaseClient';

export interface LessonVideo {
  id: string;
  lesson_id: string;
  bunny_video_id: string;
  order_index: number;
}

export interface LessonRequirement {
  lesson_id: string;
  song_id: string;
  key_offset: number;
  min_speed: number;
  min_rank: string;
  min_clear_count: number;
  notation_setting: string;
}

/**
 * レッスンの動画一覧を取得
 */
export async function fetchLessonVideos(lessonId: string): Promise<LessonVideo[]> {
  const cacheKey = `lesson_videos:${lessonId}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await getSupabaseClient()
      .from('lesson_videos')
      .select('id, lesson_id, vimeo_url as bunny_video_id, order_index')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true }),
    1000 * 60 * 10 // 10分キャッシュ
  );

  if (error) throw new Error(`動画データの取得に失敗しました: ${error.message}`);
  return data || [];
}

/**
 * レッスンの課題曲一覧を取得
 */
export async function fetchLessonRequirements(lessonId: string): Promise<LessonRequirement[]> {
  const cacheKey = `lesson_requirements:${lessonId}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await getSupabaseClient()
      .from('lesson_songs')
      .select('*')
      .eq('lesson_id', lessonId),
    1000 * 60 * 10 // 10分キャッシュ
  );

  if (error) throw new Error(`課題データの取得に失敗しました: ${error.message}`);
  return data || [];
}

/**
 * レッスンに動画を追加
 */
export async function addLessonVideo(
  lessonId: string,
  vimeoUrl: string,
  orderIndex: number
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_videos')
    .insert({
      lesson_id: lessonId,
      vimeo_url: vimeoUrl,
      order_index: orderIndex,
    });

  if (error) throw new Error(`動画の追加に失敗しました: ${error.message}`);
}

/**
 * レッスンに課題曲を追加
 */
export async function addLessonRequirement(requirement: Omit<LessonRequirement, 'id'>): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_songs')
    .insert(requirement);

  if (error) throw new Error(`課題の追加に失敗しました: ${error.message}`);
}

/**
 * レッスン動画を更新
 */
export async function updateLessonVideo(
  videoId: string,
  updates: Partial<Pick<LessonVideo, 'vimeo_url' | 'order_index'>>
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_videos')
    .update(updates)
    .eq('id', videoId);

  if (error) throw new Error(`動画の更新に失敗しました: ${error.message}`);
}

/**
 * レッスン動画を削除
 */
export async function deleteLessonVideo(videoId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_videos')
    .delete()
    .eq('id', videoId);

  if (error) throw new Error(`動画の削除に失敗しました: ${error.message}`);
}

/**
 * レッスン課題を削除
 */
export async function deleteLessonRequirement(lessonId: string, songId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_songs')
    .delete()
    .eq('lesson_id', lessonId)
    .eq('song_id', songId);

  if (error) throw new Error(`課題の削除に失敗しました: ${error.message}`);
} 