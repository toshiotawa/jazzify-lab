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
}

export async function fetchLevelRanking(limit = 100): Promise<RankingEntry[]> {
  const supabase = getSupabaseClient();
  
  // プロフィール情報を取得
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, nickname, level, xp, rank, avatar_url, twitter_handle, selected_title, email')
    .not('nickname', 'is', null)
    .order('level', { ascending: false })
    .order('xp', { ascending: false })
    .limit(limit * 2); // 余裕をもって多めに取得してフィルタリング後に制限
  
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
    .in('user_id', userIds);
  
  if (lessonError) throw lessonError;
  
  // ミッション完了数を集計
  const { data: missionCounts, error: missionError } = await supabase
    .from('user_challenge_progress')
    .select('user_id, clear_count')
    .eq('completed', true)
    .in('user_id', userIds);
  
  if (missionError) throw missionError;
  
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
  
  // プロフィールデータと集計データを結合
  const result = filteredProfiles.map((p) => {
    const { email, ...profile } = p;
    return {
      ...profile,
      lessons_cleared: lessonCountMap.get(p.id) || 0,
      missions_completed: missionCountMap.get(p.id) || 0,
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

export async function fetchMissionRanking(missionId: string, limit = 100): Promise<MissionRankingEntry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_challenge_progress')
    .select('user_id, clear_count, profiles(nickname, avatar_url, level, rank)')
    .eq('challenge_id', missionId)
    .eq('completed', true)
    .order('clear_count', { ascending: false })
    .limit(limit);
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
