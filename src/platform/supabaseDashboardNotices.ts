import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';
import type {
  DashboardNoticeActionKind,
  DashboardNoticeTabTarget,
} from '@/utils/dashboardNoticeNavigation';

export type DashboardNoticePlatform = 'ios' | 'web';

export interface DashboardNotice {
  id: string;
  platform: DashboardNoticePlatform;
  locale: 'ja' | 'en';
  title: string;
  body: string;
  action_label: string;
  action_kind: DashboardNoticeActionKind;
  action_target: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDashboardNoticeData {
  platform: DashboardNoticePlatform;
  locale: 'ja' | 'en';
  title: string;
  body: string;
  action_label: string;
  action_kind: DashboardNoticeActionKind;
  action_target: string;
  is_published?: boolean;
  sort_order?: number;
}

export type UpdateDashboardNoticeData = Partial<CreateDashboardNoticeData>;

export async function fetchPublishedDashboardNotice(
  platform: DashboardNoticePlatform,
  locale: 'ja' | 'en',
): Promise<DashboardNotice | null> {
  const cacheKey = `dashboard_notices:published:${platform}:${locale}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () =>
      await getSupabaseClient()
        .from('dashboard_notices')
        .select('*')
        .eq('platform', platform)
        .eq('locale', locale)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    1000 * 60 * 5,
  );

  if (error) {
    throw new Error(`Failed to fetch dashboard notice: ${error.message}`);
  }
  return data ?? null;
}

export async function fetchAllDashboardNotices(): Promise<DashboardNotice[]> {
  const { data, error } = await fetchWithCache(
    'dashboard_notices:all',
    async () =>
      await getSupabaseClient()
        .from('dashboard_notices')
        .select('*')
        .order('platform')
        .order('locale')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
    1000 * 60 * 2,
  );

  if (error) {
    throw new Error(`ダッシュボード案内の取得に失敗しました: ${error.message}`);
  }
  return data ?? [];
}

export async function createDashboardNotice(data: CreateDashboardNoticeData): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('dashboard_notices')
    .insert({
      ...data,
      is_published: data.is_published ?? false,
      sort_order: data.sort_order ?? 0,
    });

  if (error) {
    throw new Error(`ダッシュボード案内の作成に失敗しました: ${error.message}`);
  }
  clearSupabaseCache();
}

export async function updateDashboardNotice(
  id: string,
  data: UpdateDashboardNoticeData,
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('dashboard_notices')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`ダッシュボード案内の更新に失敗しました: ${error.message}`);
  }
  clearSupabaseCache();
}

export async function deleteDashboardNotice(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('dashboard_notices')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`ダッシュボード案内の削除に失敗しました: ${error.message}`);
  }
  clearSupabaseCache();
}

export async function toggleDashboardNoticePublished(
  id: string,
  isPublished: boolean,
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('dashboard_notices')
    .update({
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`公開状態の更新に失敗しました: ${error.message}`);
  }
  clearSupabaseCache();
}

/** Admin form validation helper */
export const DASHBOARD_NOTICE_TAB_TARGETS: readonly DashboardNoticeTabTarget[] = [
  'account',
  'quest',
  'play',
  'training',
  'top',
] as const;
