import { getSupabaseClient, getCurrentUserIdCached } from '@/platform/supabaseClient';
import { getMyGuildId } from '@/platform/supabaseGuilds';

export interface GuildPost {
  id: string;
  guild_id: string;
  user_id: string;
  content: string;
  created_at: string;
  nickname: string;
  avatar_url?: string;
  comments_count: number;
  likes_count: number;
}

export interface GuildComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  nickname: string;
  avatar_url?: string;
}

export async function fetchGuildPosts(guildId: string, limit = 50): Promise<GuildPost[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('guild_posts')
    .select('id, guild_id, user_id, content, created_at, author:profiles!guild_posts_user_id_fkey(nickname, avatar_url)')
    .eq('guild_id', guildId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  const postIds = (data || []).map((p: any) => p.id);
  let commentsMap = new Map<string, number>();
  let likesMap = new Map<string, number>();
  if (postIds.length > 0) {
    const [commentsAgg, likesAgg] = await Promise.all([
      supabase.from('guild_post_comments').select('post_id').in('post_id', postIds),
      supabase.from('guild_post_likes').select('post_id').in('post_id', postIds),
    ]);
    (commentsAgg.data || []).forEach((r: any) => commentsMap.set(r.post_id, (commentsMap.get(r.post_id) || 0) + 1));
    (likesAgg.data || []).forEach((r: any) => likesMap.set(r.post_id, (likesMap.get(r.post_id) || 0) + 1));
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    guild_id: row.guild_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    nickname: row.author?.nickname || 'User',
    avatar_url: row.author?.avatar_url || undefined,
    comments_count: commentsMap.get(row.id) || 0,
    likes_count: likesMap.get(row.id) || 0,
  }));
}

export async function fetchGuildPostsInfinite(params: { guildId: string; limit?: number; beforeCreatedAt?: string }): Promise<{ posts: GuildPost[]; nextCursor: string | null; hasMore: boolean; }>{
  const { guildId, limit = 10, beforeCreatedAt } = params;
  const supabase = getSupabaseClient();
  let query = supabase
    .from('guild_posts')
    .select('id, guild_id, user_id, content, created_at, author:profiles!guild_posts_user_id_fkey(nickname, avatar_url)')
    .eq('guild_id', guildId)
    .order('created_at', { ascending: false })
    .limit(limit * 2);
  if (beforeCreatedAt) {
    query = query.lt('created_at', beforeCreatedAt);
  }
  const { data, error } = await query;
  if (error) throw error;
  const baseRows = (data || []);
  const sliced = baseRows.slice(0, limit);
  const postIds = sliced.map((p: any) => p.id);
  let commentsMap = new Map<string, number>();
  let likesMap = new Map<string, number>();
  if (postIds.length > 0) {
    const [commentsAgg, likesAgg] = await Promise.all([
      supabase.from('guild_post_comments').select('post_id').in('post_id', postIds),
      supabase.from('guild_post_likes').select('post_id').in('post_id', postIds),
    ]);
    (commentsAgg.data || []).forEach((r: any) => commentsMap.set(r.post_id, (commentsMap.get(r.post_id) || 0) + 1));
    (likesAgg.data || []).forEach((r: any) => likesMap.set(r.post_id, (likesMap.get(r.post_id) || 0) + 1));
  }
  const posts: GuildPost[] = sliced.map((row: any) => ({
    id: row.id,
    guild_id: row.guild_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    nickname: row.author?.nickname || 'User',
    avatar_url: row.author?.avatar_url || undefined,
    comments_count: commentsMap.get(row.id) || 0,
    likes_count: likesMap.get(row.id) || 0,
  }));
  const nextCursor = posts.length > 0 ? posts[posts.length - 1].created_at : null;
  const hasMore = baseRows.length > sliced.length;
  return { posts, nextCursor, hasMore };
}

export async function createGuildPost(content: string, guildIdOverride?: string): Promise<string> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');
  const guildId = guildIdOverride || (await getMyGuildId());
  if (!guildId) throw new Error('ギルドに所属していません');
  const { data, error } = await supabase
    .from('guild_posts')
    .insert({ guild_id: guildId, user_id: userId, content })
    .select('id')
    .single();
  if (error) throw error;
  return data!.id as string;
}

export async function likeGuildPost(postId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');
  const { error } = await supabase
    .from('guild_post_likes')
    .insert({ post_id: postId, user_id: userId });
  if (error && error.code !== '23505') throw error; // ignore duplicate
}

export async function fetchGuildComments(postId: string): Promise<GuildComment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('guild_post_comments')
    .select('id, post_id, user_id, content, created_at, author:profiles!guild_post_comments_user_id_fkey(nickname, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    nickname: row.author?.nickname || 'User',
    avatar_url: row.author?.avatar_url || undefined,
  }));
}

export async function addGuildComment(postId: string, content: string): Promise<string> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');
  const { data, error } = await supabase
    .from('guild_post_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select('id')
    .single();
  if (error) throw error;
  return data!.id as string;
}

export async function deleteGuildPost(postId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');
  const { error } = await supabase
    .from('guild_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteGuildComment(commentId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserIdCached();
  if (!userId) throw new Error('ログインが必要です');
  const { error } = await supabase
    .from('guild_post_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);
  if (error) throw error;
}

