import { getSupabaseClient } from '@/platform/supabaseClient';

export interface RankingEntry {
  id: string;
  nickname: string;
  level: number;
  xp: number;
  rank: 'free' | 'standard' | 'premium' | 'platinum';
  lessons_cleared: number;
  avatar_url?: string;
  twitter_handle?: string;
  selected_title?: string;
}

export async function fetchLevelRanking(limit = 100): Promise<RankingEntry[]> {
  const supabase = getSupabaseClient();
  // lessons_cleared は後で集計列として追加予定、現状0
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, level, xp, rank, avatar_url, twitter_handle, selected_title, email')
    .not('nickname', 'is', null)
    .order('level', { ascending: false })
    .order('xp', { ascending: false })
    .limit(limit * 2); // 余裕をもって多めに取得してフィルタリング後に制限
  if (error) throw error;
  
  // 自動作成されたプロフィール（nickname = email）を除外し、emailフィールドを削除
  const filteredData = (data ?? [])
    .filter((p) => p.nickname !== p.email) // ニックネームがメールアドレスと異なるもののみ
    .slice(0, limit) // 指定された件数に制限
    .map((p) => {
      const { email, ...profile } = p;
      return { ...profile, lessons_cleared: 0 };
    });
  
  return filteredData as RankingEntry[];
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
