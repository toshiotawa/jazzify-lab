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
  best_survival_time?: number;
  survival_best_difficulty?: string;
  survival_stages_cleared?: number;
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
  
  // サバイバルモードハイスコアを取得
  const { data: survivalScores, error: survivalError } = await supabase
    .from('survival_high_scores')
    .select('user_id, survival_time_seconds, difficulty')
    .in('user_id', userIds.length > 0 ? userIds : ['__never__'])
    .order('survival_time_seconds', { ascending: false });
  
  // サバイバルスコアのエラーは無視（テーブルが存在しない可能性があるため）
  if (survivalError) {
    console.warn('survival_high_scores fetch failed:', survivalError);
  }
  
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
  
  // サバイバルスコア情報のマップを作成（ユーザーごとの最高タイムと難易度）
  const survivalMap = new Map<string, { time: number; difficulty: string }>();
  (survivalScores ?? []).forEach(record => {
    // 最高スコアのみを保持（降順でソート済みなので最初のレコードが最高）
    if (!survivalMap.has(record.user_id)) {
      survivalMap.set(record.user_id, {
        time: Number(record.survival_time_seconds) || 0,
        difficulty: record.difficulty,
      });
    }
  });
  
  // プロフィールデータと集計データを結合
  const result = filteredProfiles.map((p) => {
    const { email, ...profile } = p;
    const survivalData = survivalMap.get(p.id);
    return {
      ...profile,
      lessons_cleared: lessonCountMap.get(p.id) || 0,
      missions_completed: missionCountMap.get(p.id) || 0,
      fantasy_cleared_stages: fantasyClearsMap.get(p.id) || 0,
      best_survival_time: survivalData?.time ?? 0,
      survival_best_difficulty: survivalData?.difficulty,
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
    .map((d): MissionRankingEntry | null => {
      if (typeof d.user_id !== 'string') return null;
      if (typeof d.clear_count !== 'number') return null;

      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      if (!profile) return null;
      if (profile.nickname === '退会ユーザー') return null;
      if (typeof profile.email === 'string' && profile.email.endsWith('@deleted.local')) return null;
      if (typeof profile.nickname !== 'string') return null;
      if (typeof profile.level !== 'number') return null;
      if (typeof profile.rank !== 'string') return null;

      const base: MissionRankingEntry = {
        user_id: d.user_id,
        clear_count: d.clear_count,
        nickname: profile.nickname,
        level: profile.level,
        rank: profile.rank,
      };

      if (typeof profile.avatar_url === 'string' && profile.avatar_url.length > 0) {
        return { ...base, avatar_url: profile.avatar_url };
      }
      return base;
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
      best_survival_time: r.best_survival_time !== null && r.best_survival_time !== undefined ? Number(r.best_survival_time) : 0,
      survival_best_difficulty: r.survival_best_difficulty ?? undefined,
      survival_stages_cleared: r.survival_stages_cleared !== null && r.survival_stages_cleared !== undefined ? Number(r.survival_stages_cleared) : 0,
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

// ===== サバイバルランキング =====

export interface SurvivalRankingEntry {
  user_id: string;
  nickname: string;
  avatar_url?: string;
  level: number;
  rank: string;
  twitter_handle?: string;
  selected_title?: string;
  character_id?: string;
  character_name?: string;
  character_avatar_url?: string;
  survival_time_seconds: number;
  final_level: number;
  enemies_defeated: number;
}

export async function fetchSurvivalRanking(
  difficulty: string,
  characterId: string | null = null,
  limit = 50,
  offset = 0
): Promise<SurvivalRankingEntry[]> {
  const params: Record<string, unknown> = {
    p_difficulty: difficulty,
    limit_count: limit,
    offset_count: offset,
  };
  if (characterId) {
    params.p_character_id = characterId;
  }
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_survival_ranking', params);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    user_id: r.user_id as string,
    nickname: r.nickname as string,
    avatar_url: (r.avatar_url as string) || undefined,
    level: Number(r.level) || 0,
    rank: (r.rank as string) || 'free',
    twitter_handle: (r.twitter_handle as string) || undefined,
    selected_title: (r.selected_title as string) || undefined,
    character_id: (r.character_id as string) || undefined,
    character_name: (r.character_name as string) || undefined,
    character_avatar_url: (r.character_avatar_url as string) || undefined,
    survival_time_seconds: Number(r.survival_time_seconds) || 0,
    final_level: Number(r.final_level) || 0,
    enemies_defeated: Number(r.enemies_defeated) || 0,
  }));
}

export async function fetchUserSurvivalRank(
  difficulty: string,
  characterId: string | null,
  userId: string
): Promise<number | null> {
  const params: Record<string, unknown> = {
    p_difficulty: difficulty,
    target_user_id: userId,
  };
  if (characterId) {
    params.p_character_id = characterId;
  }
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_user_survival_rank', params);
  if (error) throw error;
  return (data as number | null) ?? null;
}

// ===== デイリーチャレンジランキング =====

export interface DailyChallengeRankingEntry {
  user_id: string;
  nickname: string;
  avatar_url?: string;
  level: number;
  rank: string;
  selected_title?: string;
  best_score: number;
  play_count: number;
}

export async function fetchDailyChallengeRanking(
  difficulty: string,
  limit = 50,
  offset = 0,
): Promise<DailyChallengeRankingEntry[]> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_daily_challenge_highscore_ranking', {
      p_difficulty: difficulty,
      limit_count: limit,
      offset_count: offset,
    });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    user_id: r.user_id as string,
    nickname: r.nickname as string,
    avatar_url: (r.avatar_url as string) || undefined,
    level: Number(r.level) || 0,
    rank: (r.rank as string) || 'free',
    selected_title: (r.selected_title as string) || undefined,
    best_score: Number(r.best_score) || 0,
    play_count: Number(r.play_count) || 0,
  }));
}

export async function fetchUserDailyChallengeRank(
  difficulty: string,
  userId: string,
): Promise<number | null> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_user_daily_challenge_highscore_rank', {
      p_difficulty: difficulty,
      target_user_id: userId,
    });
  if (error) throw error;
  return (data as number | null) ?? null;
}
