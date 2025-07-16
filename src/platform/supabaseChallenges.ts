import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';

export type ChallengeType = 'weekly' | 'monthly';
export type ChallengeCategory = 'diary' | 'song_clear';

export interface Challenge {
  id: string;
  type: ChallengeType;
  category: ChallengeCategory;
  title: string;
  description?: string | null;
  start_date: string; // ISO yyyy-mm-dd
  end_date: string;   // ISO yyyy-mm-dd
  reward_multiplier: number;
  diary_count?: number | null;
  song_clear_count?: number | null;
}

export interface ChallengeSong {
  challenge_id: string;
  song_id: string;
  key_offset: number;
  min_speed: number;
  min_rank: string;
  min_clear_count: number;
  notation_setting: string;
  song?: {
    id: string;
    title: string;
    artist?: string;
  };
}

/**
 * List challenges
 * @param opts optional filters { type, activeOnly }
 */
export async function listChallenges(opts?: {
  type?: ChallengeType;
  activeOnly?: boolean;
}): Promise<Challenge[]> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().substring(0, 10);
  const cacheKey = `challenges:${opts?.type ?? 'all'}:${opts?.activeOnly ?? false}`;

  const { data, error } = await fetchWithCache(cacheKey, async () => {
    let query = supabase.from('challenges').select('*');
    if (opts?.type) query = query.eq('type', opts.type);
    if (opts?.activeOnly) query = query.lte('start_date', today).gte('end_date', today);
    return await query.order('start_date', { ascending: false });
  }, 1000 * 30);

  if (error) throw error;
  return data as Challenge[];
}

/**
 * Get challenge with songs
 */
export async function getChallengeWithSongs(challengeId: string): Promise<Challenge & { songs: ChallengeSong[] }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      challenge_tracks(
        *,
        songs(id, title, artist)
      )
    `)
    .eq('id', challengeId)
    .single();
  
  if (error) throw error;
  return data as Challenge & { songs: ChallengeSong[] };
}

/**
 * Insert a new challenge (admin only)
 */
export async function createChallenge(payload: Omit<Challenge, 'id'>): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('challenges').insert(payload).select('id').single();
  if (error) throw error;
  clearSupabaseCache();
  return data!.id as string;
}

/**
 * Update existing challenge (admin only)
 */
export async function updateChallenge(id: string, payload: Partial<Omit<Challenge, 'id'>>) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('challenges').update(payload).eq('id', id);
  if (error) throw error;
  clearSupabaseCache();
}

/**
 * Delete challenge (admin only)
 */
export async function deleteChallenge(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('challenges').delete().eq('id', id);
  if (error) throw error;
  clearSupabaseCache();
}

/**
 * Add song to challenge (admin only)
 */
export async function addSongToChallenge(challengeId: string, songId: string, conditions: {
  key_offset?: number;
  min_speed?: number;
  min_rank?: string;
  min_clear_count?: number;
  notation_setting?: string;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('challenge_tracks').insert({
    challenge_id: challengeId,
    song_id: songId,
    key_offset: conditions.key_offset ?? 0,
    min_speed: conditions.min_speed ?? 1.0,
    min_rank: conditions.min_rank ?? 'B',
    min_clear_count: conditions.min_clear_count ?? 1,
    notation_setting: conditions.notation_setting ?? 'both',
  });
  if (error) throw error;
  clearSupabaseCache();
}

/**
 * Update challenge song conditions (admin only)
 */
export async function updateChallengeSong(challengeId: string, songId: string, conditions: {
  key_offset?: number;
  min_speed?: number;
  min_rank?: string;
  min_clear_count?: number;
  notation_setting?: string;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('challenge_tracks')
    .update(conditions)
    .eq('challenge_id', challengeId)
    .eq('song_id', songId);
  if (error) throw error;
  clearSupabaseCache();
}

/**
 * Remove song from challenge (admin only)
 */
export async function removeSongFromChallenge(challengeId: string, songId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('challenge_tracks')
    .delete()
    .eq('challenge_id', challengeId)
    .eq('song_id', songId);
  if (error) throw error;
  clearSupabaseCache();
}

/**
 * Get all songs for challenge
 */
export async function getChallengeSongs(challengeId: string): Promise<ChallengeSong[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('challenge_tracks')
    .select(`
      *,
      songs(id, title, artist)
    `)
    .eq('challenge_id', challengeId);
  
  if (error) throw error;
  return data as ChallengeSong[];
}

/**
 * Subscribe to realtime changes for challenges table.
 * Returns unsubscribe function.
 */
export function subscribeChallenges(callback: () => void) {
  const supabase = getSupabaseClient();
  const channel = supabase.channel('realtime:challenges')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => {
      clearSupabaseCache();
      callback();
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
} 