import { getSupabaseClient, fetchWithCache, clearSupabaseCache, clearCacheByPattern } from '@/platform/supabaseClient';

export type ChallengeType = 'weekly' | 'monthly';
export type ChallengeCategory = 'diary' | 'fantasy_clear' | 'survival_clear';
export type ChallengeAudienceType = 'domestic' | 'global' | 'both';

export interface Challenge {
  id: string;
  type: ChallengeType;
  category: ChallengeCategory;
  title: string;
  title_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  audience_type: ChallengeAudienceType;
  start_date: string;
  end_date: string;
  reward_multiplier: number;
  diary_count?: number | null;
}

export async function listChallenges(opts?: {
  type?: ChallengeType;
  activeOnly?: boolean;
}): Promise<Challenge[]> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().substring(0, 10);
  const cacheKey = `challenges:${opts?.type ?? 'all'}:${opts?.activeOnly ?? false}`;

  const { data, error } = await fetchWithCache(cacheKey, async () => {
    let query = supabase.from('challenges').select('*').neq('category', 'song_clear');
    if (opts?.type) query = query.eq('type', opts.type);
    if (opts?.activeOnly) query = query.lte('start_date', today).gte('end_date', today);
    return await query.order('start_date', { ascending: false });
  }, 1000 * 30);

  if (error) throw error;
  return data as Challenge[];
}

export async function getChallengeById(challengeId: string): Promise<Challenge> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (error) throw error;
  return data as Challenge;
}

export async function createChallenge(payload: Omit<Challenge, 'id'>): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('challenges').insert(payload).select('id').single();
  if (error) throw error;
  clearSupabaseCache();
  return data.id as string;
}

export async function updateChallenge(id: string, payload: Partial<Omit<Challenge, 'id'>>) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('challenges').update(payload).eq('id', id);
  if (error) throw error;
  clearSupabaseCache();
}

export async function deleteChallenge(id: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('challenges').delete().eq('id', id);
  if (error) throw error;
  clearSupabaseCache();
}

export function subscribeChallenges(callback: () => void) {
  const supabase = getSupabaseClient();
  const channel = supabase.channel('realtime:challenges')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => {
      clearCacheByPattern('.*challenges.*');
      callback();
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
