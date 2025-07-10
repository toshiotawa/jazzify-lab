import { getSupabaseClient, fetchWithCache, clearSupabaseCache } from '@/platform/supabaseClient';
import { MembershipRank } from '@/platform/supabaseSongs';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  rank: MembershipRank;
  level: number;
  xp: number;
  is_admin: boolean;
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await fetchWithCache('admin:users', async () =>
    await getSupabaseClient().from('profiles').select('id,email,nickname,rank,level,xp,is_admin').order('created_at',{ascending:false}),
    1000*30,
  );
  if (error) throw error;
  return data as UserProfile[];
}

export async function updateUserRank(id: string, rank: MembershipRank) {
  const { error } = await getSupabaseClient().from('profiles').update({ rank }).eq('id', id);
  if (error) throw error;
  clearSupabaseCache();
}

export async function setAdminFlag(id: string, isAdmin: boolean) {
  const { error } = await getSupabaseClient().from('profiles').update({ is_admin: isAdmin }).eq('id', id);
  if (error) throw error;
  clearSupabaseCache();
} 