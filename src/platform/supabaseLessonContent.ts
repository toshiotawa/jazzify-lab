import { getSupabaseClient, fetchWithCache } from '@/platform/supabaseClient';
import type { LessonMediaLocaleScope } from '@/types';
import { filterLessonMediaByLocale, type FetchLessonMediaOptions } from '@/utils/lessonMediaLocale';

export type { FetchLessonMediaOptions } from '@/utils/lessonMediaLocale';

export interface LessonVideo {
  id: string;
  lesson_id: string;
  vimeo_url: string;
  order_index: number;
  video_url?: string;
  r2_key?: string;
  content_type?: string;
  locale_scope?: LessonMediaLocaleScope;
  created_at?: string;
  updated_at?: string;
}

export interface LessonRequirement {
  lesson_id: string;
  song_id: string;
  clear_conditions?: {
    key: number;
    speed: number;
    rank: string;
    count: number;
    notation_setting: string;
    requires_days?: boolean;  // 日数条件かどうか（true: 日数でカウント、false: 回数でカウント）
    daily_count?: number;  // 1日あたりの必要クリア回数（requires_days が true の場合に使用）
  };
}

export interface LessonAttachment {
  id: string;
  lesson_id: string;
  file_name: string;
  url: string;
  r2_key: string;
  content_type?: string;
  size?: number;
  order_index: number;
  platinum_only: boolean;
  locale_scope?: LessonMediaLocaleScope;
}

/**
 * レッスンの動画一覧を取得
 * @param options.audience `user` のとき表示言語に応じて locale_scope で絞り込み（既定は `all`＝管理画面互換）
 */
export async function fetchLessonVideos(lessonId: string, options?: FetchLessonMediaOptions): Promise<LessonVideo[]> {
  const audience = options?.audience ?? 'all';
  const useEnglishUi = options?.useEnglishUi ?? false;
  const localeKey = audience === 'all' ? 'all' : useEnglishUi ? 'en' : 'ja';
  const cacheKey = `lesson_videos:${lessonId}:${localeKey}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => {
      const q = getSupabaseClient()
        .from('lesson_videos')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });
      return await q;
    },
    1000 * 60 * 10 // 10分キャッシュ
  );

  if (error) throw new Error(`動画データの取得に失敗しました: ${error.message}`);
  const rows = data || [];
  if (audience === 'user') {
    return filterLessonMediaByLocale(rows, useEnglishUi);
  }
  return rows;
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
export async function addLessonRequirement(requirement: LessonRequirement): Promise<void> {
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
  updates: Partial<{ vimeo_url: string; order_index: number; locale_scope: LessonMediaLocaleScope }>
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

export async function fetchLessonAttachments(lessonId: string, options?: FetchLessonMediaOptions): Promise<LessonAttachment[]> {
  const audience = options?.audience ?? 'all';
  const useEnglishUi = options?.useEnglishUi ?? false;
  const localeKey = audience === 'all' ? 'all' : useEnglishUi ? 'en' : 'ja';
  const cacheKey = `lesson_attachments:${lessonId}:${localeKey}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => {
      const q = getSupabaseClient()
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });
      return await q;
    },
    1000 * 60 * 10
  );
  if (error) {
    // テーブル未作成などで relation が無い場合は空配列でフォールバック
    const errorCode = (error as { code?: string } | null)?.code;
    const errorMessage = error.message ?? '';
    if (errorCode === '42P01' || (errorMessage.includes('relation') && errorMessage.includes('lesson_attachments'))) {
      return [];
    }
    throw new Error(`添付ファイルの取得に失敗しました: ${error.message}`);
  }
  const rows = data || [];
  if (audience === 'user') {
    return filterLessonMediaByLocale(rows, useEnglishUi);
  }
  return rows;
}

export interface AddLessonAttachmentParams {
  lesson_id: string;
  file_name: string;
  url: string;
  r2_key: string;
  content_type?: string;
  size?: number;
  order_index?: number;
  platinum_only?: boolean;
  locale_scope?: LessonMediaLocaleScope;
}

export interface UpdateLessonAttachmentParams {
  platinum_only?: boolean;
  order_index?: number;
  file_name?: string;
  locale_scope?: LessonMediaLocaleScope;
}

export async function addLessonAttachment(params: AddLessonAttachmentParams): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_attachments')
    .insert({
      lesson_id: params.lesson_id,
      file_name: params.file_name,
      url: params.url,
      r2_key: params.r2_key,
      content_type: params.content_type,
      size: params.size,
      order_index: params.order_index ?? 0,
      platinum_only: params.platinum_only ?? false,
      locale_scope: params.locale_scope ?? 'both',
    });
  if (error) throw new Error(`添付ファイルの登録に失敗しました: ${error.message}`);
}

export async function deleteLessonAttachment(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_attachments')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`添付ファイルの削除に失敗しました: ${error.message}`);
}

export async function updateLessonAttachment(id: string, params: UpdateLessonAttachmentParams): Promise<void> {
  const payload: Record<string, unknown> = {};

  if (typeof params.platinum_only === 'boolean') {
    payload.platinum_only = params.platinum_only;
  }
  if (typeof params.order_index === 'number') {
    payload.order_index = params.order_index;
  }
  if (typeof params.file_name === 'string') {
    payload.file_name = params.file_name;
  }
  if (params.locale_scope !== undefined) {
    payload.locale_scope = params.locale_scope;
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  const { error } = await getSupabaseClient()
    .from('lesson_attachments')
    .update(payload)
    .eq('id', id);

  if (error) throw new Error(`添付ファイルの更新に失敗しました: ${error.message}`);
}

export async function addLessonVideoR2(
  lessonId: string,
  payload: {
    url: string;
    r2_key: string;
    content_type: string;
    order_index?: number;
    locale_scope?: LessonMediaLocaleScope;
  }
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_videos')
    .insert({
      lesson_id: lessonId,
      vimeo_url: payload.r2_key, // 後方互換: 既存実装のBunny Video ID欄を流用していたため
      order_index: payload.order_index ?? 0,
      // 拡張カラム
      video_url: payload.url,
      r2_key: payload.r2_key,
      content_type: payload.content_type,
      locale_scope: payload.locale_scope ?? 'both',
    });
  if (error) throw new Error(`動画の登録に失敗しました: ${error.message}`);
}

export async function deleteLessonVideoRecord(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('lesson_videos')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`動画レコードの削除に失敗しました: ${error.message}`);
} 