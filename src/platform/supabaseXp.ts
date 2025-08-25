import { getSupabaseClient } from '@/platform/supabaseClient';
import { requireUserId } from '@/platform/authHelpers';
import { MembershipRank } from '@/platform/supabaseSongs';

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
  const newTotalXp = currentXp + gained;
  const levelInfo = calcLevel(newTotalXp);

  // DB transaction: insert history then update profile
  const { error: histErr } = await supabase.from('xp_history').insert({
    user_id: userId,
    song_id: params.songId,
    gained_xp: gained,
    base_xp: params.baseXp,
    speed_multiplier: params.speedMultiplier,
    rank_multiplier: params.rankMultiplier,
    transpose_multiplier: params.transposeMultiplier,
    membership_multiplier: params.membershipMultiplier,
    mission_multiplier: missionMul,
    reason: params.reason || 'unknown',
  });
  if (histErr) throw histErr;

  const { error: profErr } = await supabase
    .from('profiles')
    .update({ xp: newTotalXp, level: levelInfo.level })
    .eq('id', userId);
  if (profErr) throw profErr;

  // 追加: ギルド貢献の記録（所属していれば、当月エントリとして追加）
  try {
    const { data: membership } = await supabase
      .from('guild_members')
      .select('guild_id, guilds!inner(guild_type)')
      .eq('user_id', userId)
      .maybeSingle();
    const guildId = (membership as any)?.guild_id as string | undefined;
    const guildType = (membership as any)?.guilds?.guild_type as string | undefined;
    if (guildId && gained > 0) {
      const now = new Date();
      const monthStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const monthStr = monthStartUtc.toISOString().slice(0, 10);
      await supabase
        .from('guild_xp_contributions')
        .insert({ guild_id: guildId, user_id: user.id, gained_xp: gained, month: monthStr });
      
      // チャレンジギルドの場合、ストリークを更新
      if (guildType === 'challenge') {
        const { updateUserStreak } = await import('@/platform/supabaseGuilds');
        await updateUserStreak(userId, guildId);
      }
    }
  } catch (e) {
    console.warn('guild_xp_contributions insert failed:', e);
  }

  return {
    gainedXp: gained,
    totalXp: newTotalXp,
    level: levelInfo.level,
    nextLevelXp: levelInfo.nextLevelXp,
  };
}