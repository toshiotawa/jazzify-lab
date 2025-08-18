import { getSupabaseClient } from '@/platform/supabaseClient';

export interface Guild {
  id: string;
  name: string;
  leader_id: string;
  level: number;
  total_xp: number;
  members_count: number;
}

export interface GuildMember {
  user_id: string;
  nickname: string;
  avatar_url?: string;
  level: number;
  rank: string;
  role: 'leader' | 'member';
}

export interface GuildInvitation {
  id: string;
  guild_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  guild_name?: string;
  inviter_nickname?: string;
}

export interface GuildJoinRequest {
  id: string;
  guild_id: string;
  requester_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requester_nickname?: string;
}

export async function getMyGuild(): Promise<Guild | null> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.guild_id) return null;

  // guild row + members_count
  const { data: guildRow, error } = await supabase
    .from('guilds')
    .select('id, name, leader_id, level, total_xp')
    .eq('id', membership.guild_id)
    .single();
  if (error) throw error;

  const { count: membersCount } = await supabase
    .from('guild_members')
    .select('*', { count: 'exact', head: true })
    .eq('guild_id', membership.guild_id);

  return {
    id: guildRow.id,
    name: guildRow.name,
    leader_id: guildRow.leader_id,
    level: guildRow.level,
    total_xp: Number(guildRow.total_xp || 0),
    members_count: membersCount || 0,
  };
}

export async function getGuildMembers(guildId: string): Promise<GuildMember[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('guild_members')
    .select('user_id, role, profiles(nickname, avatar_url, level, rank)')
    .eq('guild_id', guildId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    user_id: row.user_id,
    nickname: row.profiles?.nickname || 'User',
    avatar_url: row.profiles?.avatar_url || undefined,
    level: row.profiles?.level || 1,
    rank: row.profiles?.rank || 'free',
    role: (row.role as 'leader' | 'member') || 'member',
  }));
}

export async function createGuild(name: string): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_guild_create', { p_name: name });
  if (error) throw error;
  return data as string;
}

export async function inviteUserToMyGuild(inviteeId: string): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_guild_invite', { p_invitee_id: inviteeId });
  if (error) throw error;
  return data as string;
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc('rpc_guild_cancel_invitation', { p_invitation_id: invitationId });
  if (error) throw error;
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc('rpc_guild_accept_invitation', { p_invitation_id: invitationId });
  if (error) throw error;
}

export async function rejectInvitation(invitationId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc('rpc_guild_reject_invitation', { p_invitation_id: invitationId });
  if (error) throw error;
}

export async function requestJoin(guildId: string): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_guild_request_join', { p_gid: guildId });
  if (error) throw error;
  return data as string;
}

export async function approveJoinRequest(requestId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc('rpc_guild_approve_request', { p_request_id: requestId });
  if (error) throw error;
}

export async function rejectJoinRequest(requestId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc('rpc_guild_reject_request', { p_request_id: requestId });
  if (error) throw error;
}

export async function kickMember(memberUserId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .rpc('rpc_guild_kick_member', { p_member_user_id: memberUserId });
  if (error) throw error;
}

export async function fetchGuildRanking(limit = 50, offset = 0, targetMonth?: string): Promise<Array<{ guild_id: string; name: string; members_count: number; level: number; monthly_xp: number; rank_no: number }>> {
  const params: Record<string, any> = { limit_count: limit, offset_count: offset };
  if (targetMonth) params.target_month = targetMonth;
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_guild_ranking', params as any);
  if (error) throw error;
  return (data || []).map((r: any) => ({
    guild_id: r.guild_id,
    name: r.name,
    members_count: Number(r.members_count) || 0,
    level: Number(r.level) || 1,
    monthly_xp: Number(r.monthly_xp) || 0,
    rank_no: Number(r.rank_no) || 0,
  }));
}

export async function fetchMyGuildRank(targetMonth?: string): Promise<number | null> {
  const params: Record<string, any> = {};
  if (targetMonth) params.target_month = targetMonth;
  const { data, error } = await getSupabaseClient().rpc('rpc_get_my_guild_rank', params as any);
  if (error) throw error;
  return (data as number | null) ?? null;
}

export async function fetchGuildMonthlyRanks(guildId: string, months = 12): Promise<Array<{ month: string; monthly_xp: number; rank_no: number }>> {
  const { data, error } = await getSupabaseClient()
    .rpc('rpc_get_guild_monthly_ranks', { p_guild_id: guildId, months });
  if (error) throw error;
  return (data || []).map((r: any) => ({ month: r.month, monthly_xp: Number(r.monthly_xp) || 0, rank_no: Number(r.rank_no) || 0 }));
}

export async function fetchPendingInvitationsForMe(): Promise<GuildInvitation[]> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('guild_invitations')
    .select('id, guild_id, inviter_id, invitee_id, status, guilds(name), inviter:profiles(nickname)')
    .eq('invitee_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    guild_id: row.guild_id,
    inviter_id: row.inviter_id,
    invitee_id: row.invitee_id,
    status: row.status,
    guild_name: row.guilds?.name,
    inviter_nickname: row.inviter?.nickname,
  }));
}

export async function fetchJoinRequestsForMyGuild(): Promise<GuildJoinRequest[]> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // find my guild where I am leader
  const { data: myGuild } = await supabase
    .from('guilds')
    .select('id')
    .eq('leader_id', user.id)
    .maybeSingle();
  if (!myGuild?.id) return [];
  const { data, error } = await supabase
    .from('guild_join_requests')
    .select('id, guild_id, requester_id, status, requester:profiles(nickname)')
    .eq('guild_id', myGuild.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    guild_id: row.guild_id,
    requester_id: row.requester_id,
    status: row.status,
    requester_nickname: row.requester?.nickname,
  }));
}

export async function searchGuilds(keyword: string): Promise<Guild[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('guilds')
    .select('id, name, leader_id, level, total_xp');
  if (keyword && keyword.trim().length > 0) {
    query = query.ilike('name', `%${keyword.trim()}%`);
  }
  query = query.order('level', { ascending: false }).limit(50);

  const { data, error } = await query;
  if (error) throw error;

  const result: Guild[] = [];
  for (const g of data || []) {
    const { count } = await supabase
      .from('guild_members')
      .select('*', { count: 'exact', head: true })
      .eq('guild_id', g.id);
    result.push({
      id: g.id,
      name: g.name,
      leader_id: g.leader_id,
      level: g.level,
      total_xp: Number(g.total_xp || 0),
      members_count: count || 0,
    });
  }
  return result;
}

export async function getGuildIdOfUser(userId: string): Promise<string | null> {
  const { data } = await getSupabaseClient()
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.guild_id ?? null;
}

export async function getMyGuildId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return getGuildIdOfUser(user.id);
}

export async function getPendingInvitationToUser(targetUserId: string): Promise<GuildInvitation | null> {
  const supabase = getSupabaseClient();
  const myGuildId = await getMyGuildId();
  if (!myGuildId) return null;
  const { data, error } = await supabase
    .from('guild_invitations')
    .select('id, guild_id, inviter_id, invitee_id, status')
    .eq('guild_id', myGuildId)
    .eq('invitee_id', targetUserId)
    .eq('status', 'pending')
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? ({
    id: data.id,
    guild_id: data.guild_id,
    inviter_id: data.inviter_id,
    invitee_id: data.invitee_id,
    status: data.status,
  } as GuildInvitation) : null;
}

