import { getSupabaseClient, getCurrentUserIdCached } from '@/platform/supabaseClient';

export interface NotificationItem {
  id: string;
  user_id: string;      // recipient
  actor_id: string;
  type: 'diary_like' | 'diary_comment' | 'comment_thread_reply' | 'guild_post_like' | 'guild_post_comment';
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

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, actor_id, type, diary_id, comment_id, created_at, read')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  const actorIds = (data || []).map(n => n.actor_id);
  let actorMap = new Map<string, { nickname: string; avatar_url: string | null }>();
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  let query = supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
  if (ids && ids.length > 0) {
    query = query.in('id', ids);
  }
  await query.throwOnError();
}