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

function getMonthStartDateStringUTC(baseDate?: Date): string {
  const now = baseDate ? new Date(baseDate) : new Date();
  const monthStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return monthStartUtc.toISOString().slice(0, 10);
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
  const supabase = getSupabaseClient();
  const month = targetMonth || getMonthStartDateStringUTC();
  // Try RPC first
  try {
    const { data, error } = await supabase
      .rpc('rpc_get_guild_ranking', { limit_count: limit, offset_count: offset, target_month: month });
    if (error) throw error;
    // XP0 ギルドを除外
    return ((data || []) as Array<{ guild_id: string; name: string; members_count: number; level: number; monthly_xp: number; rank_no: number }>).
      filter(r => Number(r.monthly_xp || 0) > 0);
  } catch (e) {
    console.warn('rpc_get_guild_ranking failed, fallback to client aggregation:', e);
    // Client-side aggregation fallback
    const { data: contribs, error: contribErr } = await supabase
      .from('guild_xp_contributions')
      .select('guild_id, gained_xp, month')
      .eq('month', month);
    if (contribErr) {
      console.warn('fetchGuildRanking contributions error:', contribErr);
      return [];
    }
    const xpByGuild = new Map<string, number>();
    (contribs || []).forEach((c: any) => {
      const cur = xpByGuild.get(c.guild_id) || 0;
      xpByGuild.set(c.guild_id, cur + Number(c.gained_xp || 0));
    });
    const entries = Array.from(xpByGuild.entries())
      .map(([guildId, monthly_xp]) => ({ guildId, monthly_xp }))
      .filter(e => e.monthly_xp > 0);
    entries.sort((a, b) => b.monthly_xp - a.monthly_xp);
    const sliced = entries.slice(offset, offset + limit);
    const guildIds = sliced.map(e => e.guildId);
    if (guildIds.length === 0) return [];
    const { data: guildsData, error: gErr } = await supabase
      .from('guilds')
      .select('id, name, level')
      .in('id', guildIds);
    if (gErr) {
      console.warn('fetchGuildRanking guilds error:', gErr);
      return [];
    }
    const guildMap = new Map((guildsData || []).map((g: any) => [g.id, g] as const));
    return sliced.map((e, idx) => {
      const g = guildMap.get(e.guildId);
      return {
        guild_id: e.guildId,
        name: g?.name || 'Guild',
        members_count: 0,
        level: g?.level ? Number(g.level) : 1,
        monthly_xp: e.monthly_xp,
        rank_no: offset + idx + 1,
      };
    });
  }
}

export async function fetchMyGuildRank(targetMonth?: string): Promise<number | null> {
  const supabase = getSupabaseClient();
  const month = targetMonth || getMonthStartDateStringUTC();
  try {
    const { data, error } = await supabase.rpc('rpc_get_my_guild_rank', { target_month: month });
    if (error) throw error;
    return (data as number) ?? null;
  } catch (e) {
    console.warn('rpc_get_my_guild_rank failed, fallback to client aggregation:', e);
    const myGuildId = await getMyGuildId();
    if (!myGuildId) return null;
    const { data, error } = await supabase
      .from('guild_xp_contributions')
      .select('guild_id, gained_xp')
      .eq('month', month);
    if (error) {
      console.warn('fetchMyGuildRank contributions error:', error);
      return null;
    }
    const sums = new Map<string, number>();
    (data || []).forEach((r: any) => {
      sums.set(r.guild_id, (sums.get(r.guild_id) || 0) + Number(r.gained_xp || 0));
    });
    const sorted = Array.from(sums.entries()).sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([gid]) => gid === myGuildId);
    return rank >= 0 ? rank + 1 : null;
  }
}

export async function fetchGuildMonthlyRanks(guildId: string, months = 12): Promise<Array<{ month: string; monthly_xp: number; rank_no: number }>> {
  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase
      .rpc('rpc_get_guild_monthly_ranks', { p_guild_id: guildId, months });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      month: r.month,
      monthly_xp: Number(r.monthly_xp || 0),
      rank_no: r.rank_no ?? null,
    }));
  } catch (e) {
    console.warn('rpc_get_guild_monthly_ranks failed, fallback to partial data:', e);
    // Fallback to contributions sum without rank
    const now = new Date();
    const monthsList: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      monthsList.push(d.toISOString().slice(0, 10));
    }
    const { data, error } = await supabase
      .from('guild_xp_contributions')
      .select('guild_id, month, gained_xp')
      .eq('guild_id', guildId)
      .in('month', monthsList);
    if (error) {
      console.warn('fetchGuildMonthlyRanks fallback error:', error);
      return monthsList.map(m => ({ month: m, monthly_xp: 0, rank_no: null as any }));
    }
    const sumByMonth = new Map<string, number>();
    (data || []).forEach((r: any) => {
      sumByMonth.set(r.month, (sumByMonth.get(r.month) || 0) + Number(r.gained_xp || 0));
    });
    return monthsList.map(m => ({ month: m, monthly_xp: sumByMonth.get(m) || 0, rank_no: null as any }));
  }
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

/**
 * Fetch per-member monthly XP for a guild (client-side aggregation).
 */
export async function fetchGuildMemberMonthlyXp(guildId: string, targetMonth?: string): Promise<Array<{ user_id: string; monthly_xp: number }>> {
  const supabase = getSupabaseClient();
  const month = targetMonth || getMonthStartDateStringUTC();
  const { data, error } = await supabase
    .from('guild_xp_contributions')
    .select('user_id, gained_xp')
    .eq('guild_id', guildId)
    .eq('month', month);
  if (error) {
    console.warn('fetchGuildMemberMonthlyXp error:', error);
    return [];
  }
  const map = new Map<string, number>();
  (data || []).forEach((r: any) => {
    map.set(r.user_id, (map.get(r.user_id) || 0) + Number(r.gained_xp || 0));
  });
  return Array.from(map.entries()).map(([user_id, monthly_xp]) => ({ user_id, monthly_xp }));
}

/**
 * 指定ギルドにおける自分の累計貢献XP（全期間）を返す
 */
export async function fetchMyGuildContributionTotal(guildId: string): Promise<number> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data, error } = await supabase
    .from('guild_xp_contributions')
    .select('gained_xp')
    .eq('guild_id', guildId)
    .eq('user_id', user.id);
  if (error) {
    console.warn('fetchMyGuildContributionTotal error:', error);
    return 0;
  }
  return (data || []).reduce((acc: number, r: any) => acc + Number(r.gained_xp || 0), 0);
}

/**
 * 指定ギルド・指定月の貢献メンバー一覧（プロフィール付き）
 * - 1以上貢献したメンバーのみ
 * - contributed_xp を保持（UIではMVP用のみ表示に利用）
 */
export async function fetchGuildContributorsWithProfiles(
  guildId: string,
  targetMonth: string,
): Promise<Array<{ user_id: string; nickname: string; avatar_url?: string; level: number; rank: string; contributed_xp: number }>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('guild_xp_contributions')
    .select('user_id, gained_xp')
    .eq('guild_id', guildId)
    .eq('month', targetMonth);
  if (error) {
    console.warn('fetchGuildContributorsWithProfiles error:', error);
    return [];
  }
  const xpByUser = new Map<string, number>();
  (data || []).forEach((r: any) => {
    const prev = xpByUser.get(r.user_id) || 0;
    xpByUser.set(r.user_id, prev + Number(r.gained_xp || 0));
  });
  const entries = Array.from(xpByUser.entries())
    .map(([user_id, contributed_xp]) => ({ user_id, contributed_xp }))
    .filter((e) => e.contributed_xp >= 1)
    .sort((a, b) => b.contributed_xp - a.contributed_xp);
  if (entries.length === 0) return [];
  const userIds = entries.map((e) => e.user_id);
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, level, rank')
    .in('id', userIds);
  if (pErr) {
    console.warn('fetchGuildContributorsWithProfiles profiles error:', pErr);
    return entries.map((e) => ({ user_id: e.user_id, nickname: 'User', level: 1, rank: 'free', contributed_xp: e.contributed_xp }));
  }
  const map = new Map((profiles || []).map((p: any) => [p.id, p] as const));
  return entries.map((e) => {
    const prof = map.get(e.user_id);
    return {
      user_id: e.user_id,
      nickname: prof ? (prof.nickname || 'User') : '退会済みユーザー',
      avatar_url: prof?.avatar_url || undefined,
      level: prof?.level || 1,
      rank: prof?.rank || 'free',
      contributed_xp: e.contributed_xp,
    };
  });
}

/**
 * 指定ギルドの指定月のランキング順位を返す（RPCが無ければクライアント集計）
 */
export async function fetchGuildRankForMonth(guildId: string, targetMonth: string): Promise<number | null> {
  const supabase = getSupabaseClient();
  try {
    // もしサーバー側にギルドIDと月を受け取るRPCがあればこちらを使う（存在しない可能性が高いのでコメントアウト）
    // const { data, error } = await supabase.rpc('rpc_get_guild_rank_for', { p_guild_id: guildId, target_month: targetMonth });
    // if (error) throw error;
    // return (data as number) ?? null;
    throw new Error('no_rpc');
  } catch (_e) {
    // Fallback: クライアント集計
    const { data, error } = await supabase
      .from('guild_xp_contributions')
      .select('guild_id, gained_xp')
      .eq('month', targetMonth);
    if (error) {
      console.warn('fetchGuildRankForMonth contributions error:', error);
      return null;
    }
    const sums = new Map<string, number>();
    (data || []).forEach((r: any) => {
      sums.set(r.guild_id, (sums.get(r.guild_id) || 0) + Number(r.gained_xp || 0));
    });
    const sorted = Array.from(sums.entries()).sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([gid]) => gid === guildId);
    return rank >= 0 ? rank + 1 : null;
  }
}

/**
 * 指定ギルド・指定月の総獲得XPを返す
 */
export async function fetchGuildMonthlyXpSingle(guildId: string, targetMonth: string): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('guild_xp_contributions')
    .select('gained_xp')
    .eq('guild_id', guildId)
    .eq('month', targetMonth);
  if (error) {
    console.warn('fetchGuildMonthlyXpSingle error:', error);
    return 0;
  }
  return (data || []).reduce((acc: number, r: any) => acc + Number(r.gained_xp || 0), 0);
}

