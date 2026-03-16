import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  link_url?: string | null;
  link_text?: string | null;
  title_en?: string | null;
  content_en?: string | null;
  link_text_en?: string | null;
  publish_ja: boolean;
  publish_en: boolean;
  is_active: boolean;
  priority: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  target_audience?: 'default' | 'global';
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  link_url?: string;
  link_text?: string;
  title_en?: string | null;
  content_en?: string | null;
  link_text_en?: string | null;
  publish_ja?: boolean;
  publish_en?: boolean;
  is_active?: boolean;
  priority?: number;
  target_audience?: 'default' | 'global';
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  link_url?: string | null;
  link_text?: string | null;
  title_en?: string | null;
  content_en?: string | null;
  link_text_en?: string | null;
  publish_ja?: boolean;
  publish_en?: boolean;
  is_active?: boolean;
  priority?: number;
  target_audience?: 'default' | 'global';
}

/**
 * 全てのお知らせを取得（管理画面用）
 */
export async function fetchAllAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await fetchWithCache(
    'announcements:all',
    async () => await getSupabaseClient()
      .from('announcements')
      .select('*, profiles!created_by(nickname)')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false }),
    1000 * 60 * 5 // 5分キャッシュ
  );

  if (error) throw new Error(`お知らせの取得に失敗しました: ${error.message}`);
  return data || [];
}

/**
 * アクティブなお知らせを言語ベースで取得（ユーザー向け）
 * @param locale 'ja' | 'en' - ユーザーの言語設定
 */
export async function fetchActiveAnnouncements(locale: 'ja' | 'en' = 'ja'): Promise<Announcement[]> {
  const publishCol = locale === 'en' ? 'publish_en' : 'publish_ja';
  const cacheKey = `announcements:active:${locale}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await getSupabaseClient()
      .from('announcements')
      .select('*')
      .eq(publishCol, true)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false }),
    1000 * 60 * 5,
  );

  if (error) throw new Error(`Failed to fetch announcements: ${error.message}`);
  return data || [];
}

/**
 * お知らせを作成
 */
export async function createAnnouncement(data: CreateAnnouncementData): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();

  const { error } = await supabase
    .from('announcements')
    .insert({
      ...data,
      created_by: userId,
      is_active: data.is_active ?? true,
      priority: data.priority ?? 1,
      publish_ja: data.publish_ja ?? true,
      publish_en: data.publish_en ?? false,
      target_audience: data.target_audience ?? 'default',
    });

  if (error) throw new Error(`お知らせの作成に失敗しました: ${error.message}`);
  clearSupabaseCache();
}

/**
 * お知らせを更新
 */
export async function updateAnnouncement(
  id: string, 
  data: UpdateAnnouncementData
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('announcements')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(`お知らせの更新に失敗しました: ${error.message}`);
  clearSupabaseCache();
}

/**
 * お知らせを削除
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`お知らせの削除に失敗しました: ${error.message}`);
  clearSupabaseCache();
}

/**
 * お知らせの表示状態を切り替え
 */
export async function toggleAnnouncementStatus(id: string, isActive: boolean): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('announcements')
    .update({ 
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(`お知らせの状態更新に失敗しました: ${error.message}`);
  clearSupabaseCache();
}

/**
 * お知らせの優先度を更新
 */
export async function updateAnnouncementPriority(id: string, priority: number): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('announcements')
    .update({ 
      priority,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(`優先度の更新に失敗しました: ${error.message}`);
  clearSupabaseCache();
} 