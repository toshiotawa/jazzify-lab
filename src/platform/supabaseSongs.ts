import { getSupabaseClient } from '@/platform/supabaseClient';

export interface Song {
  id: string;
  title: string;
  artist?: string;
  bpm?: number;
  difficulty?: number;
  data: any;
  min_rank: 'free' | 'standard' | 'premium' | 'platinum';
  is_public: boolean;
}

export async function fetchSongs(): Promise<Song[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Song[];
}

export async function addSong(song: Omit<Song, 'id' | 'is_public'>): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('songs').insert({ ...song, is_public: true });
  if (error) throw error;
}

export async function deleteSong(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('songs').delete().eq('id', id);
  if (error) throw error;
}

const rankOrder = ['free', 'standard', 'premium', 'platinum'] as const;
export type MembershipRank = typeof rankOrder[number];

export function rankAllowed(userRank: MembershipRank, songRank: MembershipRank) {
  return rankOrder.indexOf(userRank) >= rankOrder.indexOf(songRank);
}

export async function fetchAccessibleSongs(userRank: MembershipRank): Promise<Song[]> {
  const all = await fetchSongs();
  return all.filter(s => rankAllowed(userRank, s.min_rank as MembershipRank));
} 