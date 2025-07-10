import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';

export type ChallengeType = 'weekly' | 'monthly';

export interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description?: string | null;
  start_date: string; // ISO yyyy-mm-dd
  end_date: string;   // ISO yyyy-mm-dd
  reward_multiplier: number;
  diary_count?: number | null; // optional – for future use
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