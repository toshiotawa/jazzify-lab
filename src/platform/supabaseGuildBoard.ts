import { getSupabaseClient } from '@/platform/supabaseClient';
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
    .select('id, guild_id, user_id, content, created_at, profiles(nickname, avatar_url)')
    .eq('guild_id', guildId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  const postIds = (data || []).map((p: any) => p.id);
  const [commentsAgg, likesAgg] = await Promise.all([
    supabase.from('guild_post_comments').select('post_id').in('post_id', postIds),
    supabase.from('guild_post_likes').select('post_id').in('post_id', postIds),
  ]);
  const commentsMap = new Map<string, number>();
  (commentsAgg.data || []).forEach((r: any) => commentsMap.set(r.post_id, (commentsMap.get(r.post_id) || 0) + 1));
  const likesMap = new Map<string, number>();
  (likesAgg.data || []).forEach((r: any) => likesMap.set(r.post_id, (likesMap.get(r.post_id) || 0) + 1));

  return (data || []).map((row: any) => ({
    id: row.id,
    guild_id: row.guild_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    nickname: row.profiles?.nickname || 'User',
    avatar_url: row.profiles?.avatar_url || undefined,
    comments_count: commentsMap.get(row.id) || 0,
    likes_count: likesMap.get(row.id) || 0,
  }));
}

export async function createGuildPost(content: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');
  const guildId = await getMyGuildId();
  if (!guildId) throw new Error('ギルドに所属していません');
  const { data, error } = await supabase
    .from('guild_posts')
    .insert({ guild_id: guildId, user_id: user.id, content })
    .select('id')
    .single();
  if (error) throw error;
  return data!.id as string;
}

export async function likeGuildPost(postId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');
  const { error } = await supabase
    .from('guild_post_likes')
    .insert({ post_id: postId, user_id: user.id });
  if (error && error.code !== '23505') throw error; // ignore duplicate
}

export async function fetchGuildComments(postId: string): Promise<GuildComment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('guild_post_comments')
    .select('id, post_id, user_id, content, created_at, profiles(nickname, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    nickname: row.profiles?.nickname || 'User',
    avatar_url: row.profiles?.avatar_url || undefined,
  }));
}

export async function addGuildComment(postId: string, content: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');
  const { data, error } = await supabase
    .from('guild_post_comments')
    .insert({ post_id: postId, user_id: user.id, content })
    .select('id')
    .single();
  if (error) throw error;
  return data!.id as string;
}

