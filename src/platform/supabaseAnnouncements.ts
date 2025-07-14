import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  link_url?: string | null;
  link_text?: string | null;
  is_active: boolean;
  priority: number; // 表示優先度 (小さいほど上位)
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  link_url?: string;
  link_text?: string;
  is_active?: boolean;
  priority?: number;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  link_url?: string | null;
  link_text?: string | null;
  is_active?: boolean;
  priority?: number;
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
 * アクティブなお知らせのみ取得（ユーザー向け）
 */
export async function fetchActiveAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await fetchWithCache(
    'announcements:active',
    async () => await getSupabaseClient()
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false }),
    1000 * 60 * 2 // 2分キャッシュ
  );

  if (error) throw new Error(`お知らせの取得に失敗しました: ${error.message}`);
  return data || [];
}

/**
 * お知らせを作成
 */
export async function createAnnouncement(data: CreateAnnouncementData): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('ログインが必要です');

  const { error } = await supabase
    .from('announcements')
    .insert({
      ...data,
      created_by: user.id,
      is_active: data.is_active ?? true,
      priority: data.priority ?? 1,
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

/**
 * 最新のお知らせ1件を取得（ダッシュボード用）
 */
export async function fetchLatestAnnouncement(): Promise<Announcement | null> {
  const { data, error } = await getSupabaseClient()
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`最新お知らせの取得に失敗しました: ${error.message}`);
  return data;
} 