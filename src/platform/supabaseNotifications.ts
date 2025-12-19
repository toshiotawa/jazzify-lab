import { getSupabaseClient, getCurrentUserIdCached, fetchWithCache, clearCacheByPattern } from '@/platform/supabaseClient';

export interface NotificationItem {
  id: string;
  user_id: string;      // recipient
  actor_id: string;
  type: 'diary_like' | 'diary_comment' | 'comment_thread_reply';
  diary_id?: string | null;
  comment_id?: string | null;
  created_at: string;
  read: boolean;
  actor_nickname?: string;
  actor_avatar_url?: string | null;
}

export async function fetchLatestNotifications(limit = 10): Promise<NotificationItem[]> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserIdCached();
  if (!userId) return [];

  const cacheKey = `notifications:latest:${userId}:limit=${limit}`;
  const { data, error } = await fetchWithCache(
    cacheKey,
    async () => await supabase
      .from('notifications')
      .select('id, user_id, actor_id, type, diary_id, comment_id, created_at, read')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
    1000 * 20 // 20s TTL
  );
  if (error) throw error;
  // 空のINクエリ防止
  const actorIds = (data || []).map(n => n.actor_id);
  const actorMap = new Map<string, { nickname: string; avatar_url: string | null }>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .in('id', actorIds);
    (profiles || []).forEach(p => actorMap.set(p.id as string, { nickname: p.nickname || 'User', avatar_url: p.avatar_url || null }));
  }

  return (data || []).map(n => ({
    ...n,
    actor_nickname: actorMap.get(n.actor_id)?.nickname,
    actor_avatar_url: actorMap.get(n.actor_id)?.avatar_url ?? null,
  }));
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserIdCached();
  if (!userId) return;
  let query = supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  if (ids && ids.length > 0) {
    query = query.in('id', ids);
  }
  await query.throwOnError();
  // 既読化したので、通知のキャッシュを無効化
  clearCacheByPattern(new RegExp(`^notifications:latest:${userId}:`));
}