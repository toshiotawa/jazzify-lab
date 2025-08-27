import { getSupabaseClient } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';
import { log } from '@/utils/logger';

// 経験値テーブル: レベル1-10 => 2,000 XP / lvl, 11-50 => 50,000, 51+ => 100,000
export function calcLevel(totalXp: number): { level: number; remainder: number; nextLevelXp: number } {
  let level = 1;
  let xp = totalXp;

  const consume = (needed: number) => {
    if (xp >= needed) {
      xp -= needed;
      level += 1;
      return true;
    }
    return false;
  };

  // Lv1-10 (9 gaps)
  for (let i = 1; i < 10; i++) {
    if (!consume(2000)) return { level, remainder: xp, nextLevelXp: 2000 };
  }

  // Lv11-50 (40 gaps)
  for (let i = 10; i < 50; i++) {
    if (!consume(50000)) return { level, remainder: xp, nextLevelXp: 50000 };
  }

  // Lv51+ (infinite)
  const per = 100000;
  while (consume(per)) {
    // loop until not enough xp
  }
  return { level, remainder: xp, nextLevelXp: per };
}

interface AddXpParams {
  songId: string | null;
  baseXp: number;
  speedMultiplier: number;
  rankMultiplier: number;
  transposeMultiplier: number;
  membershipMultiplier: number;
  missionMultiplier?: number;
  reason?: string;
}

export async function addXp(params: AddXpParams) {
  const supabase = getSupabaseClient();
  const userId = await requireUserId();

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, next_season_xp_multiplier')
    .eq('id', userId)
    .single();
  const currentXp = profile?.xp ?? 0;
  const seasonMul = profile?.next_season_xp_multiplier ?? 1;
  const missionMul = params.missionMultiplier ?? 1;
  const gained = Math.round(
    params.baseXp * params.speedMultiplier * params.rankMultiplier * params.transposeMultiplier * params.membershipMultiplier * missionMul * seasonMul,
  );
  // Use RPC to update profile XP and insert xp_history atomically (RLS-safe)
  const { data: rpcData, error: rpcError } = await supabase.rpc('add_xp', {
    _user_id: userId,
    _gained_xp: gained,
    _reason: params.reason || 'unknown',
    _song_id: params.songId,
    _mission_multiplier: missionMul,
  });
  if (rpcError) throw rpcError;

  const newTotalXp = (rpcData as any)?.new_xp as number | undefined;
  const newLevel = (rpcData as any)?.new_level as number | undefined;

  const levelInfo = calcLevel(typeof newTotalXp === 'number' ? newTotalXp : currentXp);

  // Optional: update streak for challenge guilds (best-effort, ignore errors)
  try {
    const { data: membership } = await supabase
      .from('guild_members')
      .select('guild_id, guilds!inner(guild_type)')
      .eq('user_id', userId)
      .maybeSingle();
    const guildId = (membership as unknown as { guild_id?: string })?.guild_id;
    const guildType = (membership as any)?.guilds?.guild_type as string | undefined;
    if (guildId && guildType === 'challenge' && gained > 0) {
      const { updateUserStreak } = await import('@/platform/supabaseGuilds');
      await updateUserStreak(userId, guildId);
    }
  } catch (e) {
    log.warn('guild streak update failed', e);
  }

  return {
    gainedXp: gained,
    totalXp: typeof newTotalXp === 'number' ? newTotalXp : currentXp + gained,
    level: typeof newLevel === 'number' ? newLevel : levelInfo.level,
    nextLevelXp: levelInfo.nextLevelXp,
  };
}