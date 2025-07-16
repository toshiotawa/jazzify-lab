import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';

export interface MissionSong {
  song_id: string;
  key_offset: number;
  min_speed: number;
  min_rank: string;
  clears_required: number;
  notation_setting: string;
  songs?: { id: string; title: string; artist?: string };
}

export interface Mission {
  id: string;
  type: 'weekly' | 'monthly';
  diary_count?: number | null;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  clears_required?: number | null;
  reward_multiplier: number;
  songs?: MissionSong[];
}

export interface UserMissionProgress {
  challenge_id: string;
  clear_count: number;
  completed: boolean;
}

export async function fetchActiveMonthlyMissions(): Promise<Mission[]> {
  const today = new Date().toISOString().substring(0,10);
  const key = `missions:monthly:${today}`;
  const { data, error } = await fetchWithCache(key, async () =>
    await getSupabaseClient()
      .from('challenges')
      .select('*, challenge_tracks(*, songs(id,title,artist))')
      .eq('type','monthly')
      .lte('start_date', today)
      .gte('end_date', today),
    1000*30,
  );
  if (error) throw error;
  return data as Mission[];
}

export async function fetchMissionSongs(missionId: string): Promise<MissionSong[]> {
  const { data, error } = await getSupabaseClient()
    .from('challenge_tracks')
    .select('*, songs(id,title,artist)')
    .eq('challenge_id', missionId);
  if (error) throw error;
  return data as MissionSong[];
}

export async function incrementDiaryProgress(missionId: string) {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc('increment_diary_progress',{ _user_id:user.id, _mission_id:missionId });
  clearSupabaseCache();
}

export async function fetchUserMissionProgress(): Promise<UserMissionProgress[]> {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return [];
  const key = `user_mission_progress:${user.id}`;
  const { data, error } = await fetchWithCache(key, async () =>
    await supabase.from('user_challenge_progress').select('*').eq('user_id', user.id),
    1000*10,
  );
  if (error) throw error;
  return data as UserMissionProgress[];
}

export async function claimReward(missionId: string) {
  const supabase = getSupabaseClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_challenge_progress')
    .update({ completed: true })
    .eq('user_id', user.id)
    .eq('challenge_id', missionId);

  const { data: prof } = await supabase.from('profiles').select('next_season_xp_multiplier').eq('id', user.id).single();
  const current = prof?.next_season_xp_multiplier ?? 1;
  const updated = Math.max(current, 1.3);
  await supabase.from('profiles').update({ next_season_xp_multiplier: updated }).eq('id', user.id);
  clearSupabaseCache();
}
