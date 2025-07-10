import { getSupabaseClient } from '@/platform/supabaseClient';

export interface Mission {
  id: string;
  diary_count?: number | null;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  min_clear_count?: number | null;
}

export interface UserMissionProgress {
  challenge_id: string;
  clear_count: number;
  completed: boolean;
}

export async function fetchActiveMonthlyMissions(): Promise<Mission[]> {
  const today = new Date().toISOString().substring(0,10);
  const { data, error } = await getSupabaseClient()
    .from('challenges')
    .select('*')
    .eq('type','monthly')
    .lte('start_date', today)
    .gte('end_date', today);
  if (error) throw error;
  return data as Mission[];
}

export async function incrementDiaryProgress(missionId: string) {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc('increment_diary_progress',{ _user_id:user.id, _mission_id:missionId });
}

export async function fetchWeeklyChallenges() {
  const today = new Date().toISOString().substring(0,10);
  const { data, error } = await getSupabaseClient()
    .from('challenges')
    .select('*')
    .eq('type','weekly')
    .lte('start_date', today)
    .gte('end_date', today);
  if (error) throw error;
  return data as Mission[];
}

export async function fetchUserMissionProgress(): Promise<UserMissionProgress[]> {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('user_challenge_progress')
    .select('*')
    .eq('user_id', user.id);
  if (error) throw error;
  return data as UserMissionProgress[];
}

export async function claimReward(missionId: string) {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return;
  // mark completed true (if not) and maybe set multiplier; simplified here
  await supabase.from('user_challenge_progress')
    .update({ completed: true })
    .eq('user_id', user.id)
    .eq('challenge_id', missionId);

  // update profile multiplier
  const { data: prof } = await supabase.from('profiles').select('next_season_xp_multiplier').eq('id', user.id).single();
  const current = prof?.next_season_xp_multiplier ?? 1;
  const updated = Math.max(current, 1.3);
  await supabase.from('profiles').update({ next_season_xp_multiplier: updated }).eq('id', user.id);
} 