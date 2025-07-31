import { getSupabaseClient, fetchWithCache, clearSupabaseCache, clearCacheByKey } from '@/platform/supabaseClient';
import { MembershipRank } from '@/platform/supabaseSongs';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  rank: MembershipRank;
  level: number;
  xp: number;
  is_admin: boolean;
}

// ユーザーキャッシュキー生成関数
export const USERS_CACHE_KEY = () => 'admin:users';

/**
 * 全ユーザーを取得します。
 * @param {Object} options オプション
 * @param {boolean} options.forceRefresh キャッシュを無視して最新データを取得
 * @returns {Promise<UserProfile[]>}
 */
export async function fetchAllUsers({ forceRefresh = false } = {}): Promise<UserProfile[]> {
  const cacheKey = USERS_CACHE_KEY();

  if (forceRefresh) {
    // キャッシュをバイパスして直接取得
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('id,email,nickname,rank,level,xp,is_admin')
      .order('created_at', { ascending: false });

    if (error) {
      // console.error('Error fetching all users:', error);
      throw error;
    }

    // 新しいデータでキャッシュを更新
    clearCacheByKey(cacheKey);
    
    return data as UserProfile[];
  }

  const { data, error } = await fetchWithCache(cacheKey, async () =>
    await getSupabaseClient().from('profiles').select('id,email,nickname,rank,level,xp,is_admin').order('created_at',{ascending:false}),
    1000*30,
  );
  if (error) throw error;
  return data as UserProfile[];
}

export async function updateUserRank(id: string, rank: MembershipRank) {
  const { error } = await getSupabaseClient().from('profiles').update({ rank }).eq('id', id);
  if (error) throw error;
  clearSupabaseCache();
}

export async function setAdminFlag(id: string, isAdmin: boolean) {
  const { error } = await getSupabaseClient().from('profiles').update({ is_admin: isAdmin }).eq('id', id);
  if (error) throw error;
  clearSupabaseCache();
} 