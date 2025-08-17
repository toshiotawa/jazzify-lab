import { getSupabaseClient } from '@/platform/supabaseClient';
import { fetchWithCache } from '@/platform/supabaseClient';

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

// 短時間の連打切替対策: ランキング用キャッシュTTL
const RANKING_TTL_MS = 1000 * 30; // 30秒
const RANKING_USER_TTL_MS = 1000 * 60; // 60秒（ユーザー単体順位）

export async function fetchLevelRanking(limit = 50, offset = 0): Promise<RankingEntry[]> {
  const supabase = getSupabaseClient();
  
  // プロフィール情報を取得（nickname=emailなどの自動生成ユーザーが混ざる可能性があるため余剰取得）
  const { data: profilesData, error: profilesError } = await fetchWithCache<any[]>(
    `ranking:profiles:${limit}:${offset}`,
    async () => await supabase
      .from('profiles')
      .select('id, nickname, level, xp, rank, avatar_url, twitter_handle, selected_title, email')
      .not('nickname', 'is', null)
      .order('level', { ascending: false })
      .order('xp', { ascending: false })
      .range(offset, offset + (limit * 2) - 1) as any,
    RANKING_TTL_MS
  );
  
  if (profilesError) throw profilesError;
  
  // 自動作成されたプロフィール（nickname = email）を除外
  const filteredProfiles = (profilesData ?? [])
    .filter((p) => p.nickname !== p.email)
    .slice(0, limit);
  
  if (filteredProfiles.length === 0) {
    return [];
  }
  
  const userIds = filteredProfiles.map(p => p.id);
  const joinedIds = userIds.slice().sort().join(',');
  
  // レッスン完了数を集計
  const { data: lessonCounts, error: lessonError } = await fetchWithCache<any[]>(
    `ranking:lessons_completed:${joinedIds}`,
    async () => await supabase
      .from('user_lesson_progress')
      .select('user_id')
      .eq('completed', true)
      .in('user_id', userIds) as any,
    RANKING_TTL_MS
  );
  
  if (lessonError) throw lessonError;
  
  // ミッション完了数を集計
  const { data: missionCounts, error: missionError } = await fetchWithCache<any[]>(
    `ranking:missions_completed:${joinedIds}`,
    async () => await supabase
      .from('user_challenge_progress')
      .select('user_id, clear_count')
      .eq('completed', true)
      .in('user_id', userIds) as any,
    RANKING_TTL_MS
  );
  
  if (missionError) throw missionError;
  
  // ファンタジーモード進捗情報を取得
  const { data: fantasyProgress, error: fantasyError } = await fetchWithCache<any[]>(
    `ranking:fantasy_progress:${joinedIds}`,
    async () => await supabase
      .from('fantasy_user_progress')
      .select('user_id, current_stage_number')
      .in('user_id', userIds) as any,
    RANKING_TTL_MS
  );
  
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
  const fantasyProgressMap = new Map<string, string>();
  (fantasyProgress ?? []).forEach(record => {
    fantasyProgressMap.set(record.user_id, record.current_stage_number);
  });
  
  // プロフィールデータと集計データを結合
  const result = filteredProfiles.map((p) => {
    const { email, ...profile } = p;
    return {
      ...profile,
      lessons_cleared: lessonCountMap.get(p.id) || 0,
      missions_completed: missionCountMap.get(p.id) || 0,
      fantasy_current_stage: fantasyProgressMap.get(p.id),
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
  const { data, error } = await fetchWithCache<any[]>(
    `ranking:mission:basic:${missionId}:${limit}:${offset}`,
    async () => await supabase
      .from('user_challenge_progress')
      .select('user_id, clear_count, profiles(nickname, avatar_url, level, rank)')
      .eq('challenge_id', missionId)
      .eq('completed', true)
      .order('clear_count', { ascending: false })
      .range(offset, offset + limit - 1) as any,
    RANKING_TTL_MS
  );
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
export async function fetchLevelRankingByView(limit = 50, offset = 0): Promise<RankingEntry[]> {
  const cacheKey = `ranking:level:view:${limit}:${offset}`;
  const { data, error } = await fetchWithCache<any[]>(
    cacheKey,
    async () => await getSupabaseClient()
      .rpc('rpc_get_level_ranking', { limit_count: limit, offset_count: offset }) as any,
    RANKING_TTL_MS
  );
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
    fantasy_current_stage: r.fantasy_current_stage !== null && r.fantasy_current_stage !== undefined ? String(r.fantasy_current_stage) : undefined,
  })) as unknown as RankingEntry[];
}

export async function fetchUserGlobalRank(userId: string): Promise<number | null> {
  const cacheKey = `ranking:user_global_rank:${userId}`;
  const { data, error } = await fetchWithCache<number | null>(
    cacheKey,
    async () => await getSupabaseClient()
      .rpc('rpc_get_user_global_rank', { target_user_id: userId }) as any,
    RANKING_USER_TTL_MS
  );
  if (error) throw error;
  return (data as number | null) ?? null;
}

export async function fetchMissionRankingByRpc(missionId: string, limit = 50, offset = 0): Promise<MissionRankingEntry[]> {
  const cacheKey = `ranking:mission:${missionId}:${limit}:${offset}`;
  const { data, error } = await fetchWithCache<MissionRankingEntry[]>(
    cacheKey,
    async () => await getSupabaseClient()
      .rpc('rpc_get_mission_ranking', { mission_id: missionId, limit_count: limit, offset_count: offset }) as any,
    RANKING_TTL_MS
  );
  if (error) throw error;
  return (data ?? []) as MissionRankingEntry[];
}

export async function fetchUserMissionRank(missionId: string, userId: string): Promise<number | null> {
  const cacheKey = `ranking:user_mission_rank:${missionId}:${userId}`;
  const { data, error } = await fetchWithCache<number | null>(
    cacheKey,
    async () => await getSupabaseClient()
      .rpc('rpc_get_user_mission_rank', { mission_id: missionId, target_user_id: userId }) as any,
    RANKING_USER_TTL_MS
  );
  if (error) throw error;
  return (data as number | null) ?? null;
}

export async function fetchLessonRankingByRpc(limit = 50, offset = 0): Promise<RankingEntry[]> {
  const cacheKey = `ranking:lesson:view:${limit}:${offset}`;
  const { data, error } = await fetchWithCache<any[]>(
    cacheKey,
    async () => await getSupabaseClient()
      .rpc('rpc_get_lesson_ranking', { limit_count: limit, offset_count: offset }) as any,
    RANKING_TTL_MS
  );
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
  const cacheKey = `ranking:user_lesson_rank:${userId}`;
  const { data, error } = await fetchWithCache<number | null>(
    cacheKey,
    async () => await getSupabaseClient()
      .rpc('rpc_get_user_lesson_rank', { target_user_id: userId }) as any,
    RANKING_USER_TTL_MS
  );
  if (error) throw error;
  return (data as number | null) ?? null;
}
