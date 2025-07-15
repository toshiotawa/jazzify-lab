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
}

export async function fetchLevelRanking(limit = 100): Promise<RankingEntry[]> {
  const supabase = getSupabaseClient();
  // lessons_cleared は後で集計列として追加予定、現状0
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, level, xp, rank, avatar_url, twitter_handle')
    .order('level', { ascending: false })
    .order('xp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((p) => ({ ...p, lessons_cleared: 0 })) as RankingEntry[];
} 