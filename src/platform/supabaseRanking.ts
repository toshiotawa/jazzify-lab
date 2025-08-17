import { getSupabaseClient } from '@/platform/supabaseClient';

export interface RankingEntry {
  id: string;
  nickname: string;
  level: number;
  xp: number;
  rank: 'free' | 'standard' | 'premium' | 'platinum';
  lessons_cleared: number;
  missions_completed: number;
  avatar_url?: string;
  twitter_handle?: string;
  selected_title?: string;
  fantasy_current_stage?: string;
}

export async function fetchLevelRanking(limit = 50, offset = 0): Promise<RankingEntry[]> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_level_ranking', { limit_count: limit, offset_count: offset });
  if (error) throw error;
  const rows = (data ?? []) as any[];
  return rows.map((r) => ({
    id: r.id,
    nickname: r.nickname,
    level: r.level,
    xp: Number(r.xp),
    rank: r.rank,
    lessons_cleared: r.lessons_cleared ?? 0,
    missions_completed: r.missions_completed ?? 0,
    avatar_url: r.avatar_url ?? undefined,
    twitter_handle: r.twitter_handle ?? undefined,
    selected_title: r.selected_title ?? undefined,
    fantasy_current_stage:
      r.fantasy_current_stage !== null && r.fantasy_current_stage !== undefined
        ? String(r.fantasy_current_stage)
        : undefined,
  }));
}
export interface MissionRankingEntry {
  user_id: string;
  clear_count: number;
  nickname: string;
  avatar_url?: string;
  level: number;
  rank: string;
}

export async function fetchMissionRanking(missionId: string, limit = 50, offset = 0): Promise<MissionRankingEntry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_challenge_progress')
    .select('user_id, clear_count, profiles(nickname, avatar_url, level, rank)')
    .eq('challenge_id', missionId)
    .eq('completed', true)
    .order('clear_count', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []).map((d: any) => ({
    user_id: d.user_id,
    clear_count: d.clear_count,
    nickname: d.profiles.nickname,
    avatar_url: d.profiles.avatar_url,
    level: d.profiles.level,
    rank: d.profiles.rank,
  }));
}

// ===== RPC based helpers for accurate global rank and paginated pages =====
export async function fetchUserGlobalRank(userId: string): Promise<number | null> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_user_global_rank', { target_user_id: userId });
  if (error) throw error;
  return (data as number | null) ?? null;
}

export async function fetchMissionRankingByRpc(missionId: string, limit = 50, offset = 0): Promise<MissionRankingEntry[]> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_mission_ranking', { mission_id: missionId, limit_count: limit, offset_count: offset });
  if (error) throw error;
  return (data ?? []) as MissionRankingEntry[];
}

export async function fetchUserMissionRank(missionId: string, userId: string): Promise<number | null> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_user_mission_rank', { mission_id: missionId, target_user_id: userId });
  if (error) throw error;
  return (data as number | null) ?? null;
}

export async function fetchLessonRankingByRpc(limit = 50, offset = 0): Promise<RankingEntry[]> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_lesson_ranking', { limit_count: limit, offset_count: offset });
  if (error) throw error;
  const rows = (data ?? []) as any[];
  return rows.map((r) => ({
    id: r.id,
    nickname: r.nickname,
    level: r.level,
    xp: Number(r.xp),
    rank: r.rank,
    lessons_cleared: r.lessons_cleared ?? 0,
    missions_completed: r.missions_completed ?? 0,
    avatar_url: r.avatar_url ?? undefined,
    twitter_handle: r.twitter_handle ?? undefined,
    selected_title: r.selected_title ?? undefined,
    fantasy_current_stage: r.fantasy_current_stage !== null && r.fantasy_current_stage !== undefined ? String(r.fantasy_current_stage) : undefined,
  })) as unknown as RankingEntry[];
}

export async function fetchUserLessonRank(userId: string): Promise<number | null> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_user_lesson_rank', { target_user_id: userId });
  if (error) throw error;
  return (data as number | null) ?? null;
}
