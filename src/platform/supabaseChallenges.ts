import { getSupabaseClient, fetchWithCache, clearSupabaseCache, clearCacheByPattern } from '@/platform/supabaseClient';

export type ChallengeType = 'weekly' | 'monthly';
export type ChallengeCategory = 'diary' | 'song_clear' | 'fantasy';

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
  is_fantasy?: boolean;
  fantasy_stage_id?: string;
  key_offset: number;
  min_speed: number;
  min_rank: string;
  clears_required: number;
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
export async function addSongToChallenge(challengeId: string, songId: string | null, conditions: {
  key_offset?: number;
  min_speed?: number;
  min_rank?: string;
  clears_required?: number;
  notation_setting?: string;
  is_fantasy?: boolean;
  fantasy_stage_id?: string;
}) {
  const supabase = getSupabaseClient();
  
  const insertData = {
    challenge_id: challengeId,
    song_id: songId,
    key_offset: conditions.key_offset ?? 0,
    min_speed: conditions.min_speed ?? 1.0,
    min_rank: conditions.min_rank ?? 'B',
    clears_required: conditions.clears_required ?? 1,
    notation_setting: conditions.notation_setting ?? 'both',
    is_fantasy: conditions.is_fantasy ?? false,
    fantasy_stage_id: conditions.fantasy_stage_id === undefined ? null : conditions.fantasy_stage_id,
  };
  
  console.log('addSongToChallenge - 送信データ:', insertData);
  console.log('チェック制約の確認:', {
    is_fantasy: insertData.is_fantasy,
    fantasy_stage_id: insertData.fantasy_stage_id,
    song_id: insertData.song_id,
    制約1: insertData.is_fantasy === true && insertData.fantasy_stage_id !== null && insertData.song_id === null,
    制約2: insertData.is_fantasy === false && insertData.song_id !== null && insertData.fantasy_stage_id === null,
  });
  
  const { error } = await supabase.from('challenge_tracks').insert(insertData);
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
  clears_required?: number;
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
      clearCacheByPattern('.*challenges.*');
      callback();
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
} 