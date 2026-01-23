import { getSupabaseClient } from '@/platform/supabaseClient';

export interface RankingEntry {
  id: string;
  nickname: string;
  level: number;
  xp: number;
  rank: 'free' | 'standard' | 'standard_global' | 'premium' | 'platinum' | 'black';
  lessons_cleared: number;
  missions_completed: number;
  avatar_url?: string;
  twitter_handle?: string;
  selected_title?: string;
  fantasy_cleared_stages?: number;
}

export async function fetchLevelRanking(limit = 50, offset = 0): Promise<RankingEntry[]> {
  const supabase = getSupabaseClient();
  
  // プロフィール情報を取得（nickname=emailなどの自動生成ユーザーが混ざる可能性があるため余剰取得）
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, nickname, level, xp, rank, avatar_url, twitter_handle, selected_title, email')
    .not('nickname', 'is', null)
    .neq('nickname', '退会ユーザー') // 退会ユーザーを除外
    .not('email', 'like', '%@deleted.local') // 匿名化されたユーザーを除外
    .order('level', { ascending: false })
    .order('xp', { ascending: false })
    .range(offset, offset + (limit * 2) - 1);
  
  if (profilesError) throw profilesError;
  
  // 自動作成されたプロフィール（nickname = email）を除外
  const filteredProfiles = (profilesData ?? [])
    .filter((p) => p.nickname !== p.email)
    .slice(0, limit);
  
  if (filteredProfiles.length === 0) {
    return [];
  }
  
  const userIds = filteredProfiles.map(p => p.id);
  
  // レッスン完了数を集計
  const { data: lessonCounts, error: lessonError } = await supabase
    .from('user_lesson_progress')
    .select('user_id')
    .eq('completed', true)
    .in('user_id', userIds.length > 0 ? userIds : ['__never__']);
  
  if (lessonError) throw lessonError;
  
  // ミッション完了数を集計
  const { data: missionCounts, error: missionError } = await supabase
    .from('user_challenge_progress')
    .select('user_id, clear_count')
    .eq('completed', true)
    .in('user_id', userIds.length > 0 ? userIds : ['__never__']);
  
  if (missionError) throw missionError;
  
  // ファンタジーモード進捗情報を取得
  const { data: fantasyClears, error: fantasyError } = await supabase
    .from('fantasy_stage_clears')
    .select('user_id')
    .eq('clear_type', 'clear')
    .in('user_id', userIds.length > 0 ? userIds : ['__never__']);

  if (fantasyError) throw fantasyError;
  
  // ユーザーごとにカウントを集計
  const lessonCountMap = new Map<string, number>();
  (lessonCounts ?? []).forEach(record => {
    const count = lessonCountMap.get(record.user_id) || 0;
    lessonCountMap.set(record.user_id, count + 1);
  });
  
  const missionCountMap = new Map<string, number>();
  (missionCounts ?? []).forEach(record => {
    const count = missionCountMap.get(record.user_id) || 0;
    missionCountMap.set(record.user_id, count + record.clear_count);
  });
  
  // ファンタジー進捗情報のマップを作成
  const fantasyClearsMap = new Map<string, number>();
  (fantasyClears ?? []).forEach(record => {
    const count = fantasyClearsMap.get(record.user_id) || 0;
    fantasyClearsMap.set(record.user_id, count + 1);
  });
  
  // プロフィールデータと集計データを結合
  const result = filteredProfiles.map((p) => {
    const { email, ...profile } = p;
    return {
      ...profile,
      lessons_cleared: lessonCountMap.get(p.id) || 0,
      missions_completed: missionCountMap.get(p.id) || 0,
      fantasy_cleared_stages: fantasyClearsMap.get(p.id) || 0,
    };
  });
  
  return result as RankingEntry[];
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
    .select('user_id, clear_count, profiles(nickname, avatar_url, level, rank, email)')
    .eq('challenge_id', missionId)
    .eq('completed', true)
    .order('clear_count', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  // 退会ユーザーを除外
  return (data ?? [])
    .map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      if (!profile) return null;
      if (profile.nickname === '退会ユーザー') return null;
      if (profile.email?.endsWith('@deleted.local')) return null;
      if (profile.nickname === null) return null;
      if (profile.level === null) return null;
      if (profile.rank === null) return null;

      return {
        user_id: d.user_id,
        clear_count: d.clear_count,
        nickname: profile.nickname,
        avatar_url: profile.avatar_url ?? undefined,
        level: profile.level,
        rank: profile.rank,
      } satisfies MissionRankingEntry;
    })
    .filter((d): d is MissionRankingEntry => d !== null);
}

// ===== RPC based helpers for accurate global rank and paginated pages =====
export async function fetchLevelRankingByView(limit = 50, offset = 0): Promise<RankingEntry[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .rpc('rpc_get_level_ranking', { limit_count: limit, offset_count: offset });
    if (error) throw error;
    const rows = (data ?? []) as any[];
    return rows.map((r) => ({
      id: r.id,
      nickname: r.nickname,
      level: r.level,
      xp: r.xp,
      rank: r.rank,
      lessons_cleared: r.lessons_cleared ?? 0,
      missions_cleared: undefined, // keep shape stable
      missions_completed: r.missions_completed ?? 0,
      avatar_url: r.avatar_url ?? undefined,
      twitter_handle: r.twitter_handle ?? undefined,
      selected_title: r.selected_title ?? undefined,
      fantasy_cleared_stages: r.fantasy_cleared_stages !== null && r.fantasy_cleared_stages !== undefined ? Number(r.fantasy_cleared_stages) : 0,
    })) as unknown as RankingEntry[];
  } catch (e) {
    console.warn('rpc_get_level_ranking が利用できないためフォールバックを使用します:', e);
    // Fallback: 非RPC版
    return fetchLevelRanking(limit, offset);
  }
}

export async function fetchUserGlobalRank(userId: string): Promise<number | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .rpc('rpc_get_user_global_rank', { target_user_id: userId });
    if (error) throw error;
    return (data as number | null) ?? null;
  } catch (e) {
    console.warn('rpc_get_user_global_rank が利用できないためフォールバック（null）を返します:', e);
    return null;
  }
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
    fantasy_cleared_stages: r.fantasy_cleared_stages !== null && r.fantasy_cleared_stages !== undefined ? Number(r.fantasy_cleared_stages) : 0,
  })) as unknown as RankingEntry[];
}

export async function fetchUserLessonRank(userId: string): Promise<number | null> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_user_lesson_rank', { target_user_id: userId });
  if (error) throw error;
  return (data as number | null) ?? null;
}
