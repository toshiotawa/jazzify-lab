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

  // 認証ユーザー情報（メール取得用）
  const { data: authData } = await supabase.auth.getUser();

  // プロファイル取得（存在しない場合は作成）
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, next_season_xp_multiplier')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    const email = authData?.user?.email ?? `${userId}@local.invalid`;
    const nickname = email.split('@')[0] || 'Player';
    const { error: createErr } = await supabase.from('profiles').insert({
      id: userId,
      email,
      nickname,
      rank: 'free',
      xp: 0,
      level: 1,
      is_admin: false,
    });
    if (createErr) throw createErr;
  }

  // bigint の可能性があるため数値へ正規化
  const currentXp = Number((profile as any)?.xp ?? 0);
  // 倍率の安全正規化（0やNaNを防ぎ、下限1.0/必要に応じて下限値を設定）
  const seasonMulRaw = Number((profile as any)?.next_season_xp_multiplier ?? 1);
  const seasonMul = Number.isFinite(seasonMulRaw) ? Math.max(1, seasonMulRaw) : 1;
  const missionMulRaw = params.missionMultiplier ?? 1;
  const missionMul = Number.isFinite(missionMulRaw) ? Math.max(1, Number(missionMulRaw)) : 1;
  const speedMulRaw = params.speedMultiplier;
  const speedMul = Number.isFinite(speedMulRaw) ? Math.max(0.3, Number(speedMulRaw)) : 1;
  const rankMulRaw = params.rankMultiplier;
  const rankMul = Number.isFinite(rankMulRaw) ? Math.max(1, Number(rankMulRaw)) : 1;
  const transposeMulRaw = params.transposeMultiplier;
  const transposeMul = Number.isFinite(transposeMulRaw) ? Math.max(1, Number(transposeMulRaw)) : 1;
  const membershipMulRaw = params.membershipMultiplier;
  const membershipMul = Number.isFinite(membershipMulRaw) ? Math.max(1, Number(membershipMulRaw)) : 1;

  const gained = Math.round(
    params.baseXp * speedMul * rankMul * transposeMul * membershipMul * missionMul * seasonMul,
  );
  const newTotalXp = currentXp + gained;
  const levelInfo = calcLevel(newTotalXp);

  // DB transaction: insert history then update profile
  const { error: histErr } = await supabase.from('xp_history').insert({
    user_id: userId,
    song_id: params.songId,
    gained_xp: gained,
    base_xp: params.baseXp,
    speed_multiplier: speedMul,
    rank_multiplier: rankMul,
    transpose_multiplier: transposeMul,
    membership_multiplier: membershipMul,
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
        .insert({ guild_id: guildId, user_id: userId, gained_xp: gained, month: monthStr });
      
      // チャレンジギルドの場合、ストリークを更新
      if (guildType === 'challenge') {
        const { updateUserStreak } = await import('@/platform/supabaseGuilds');
        await updateUserStreak(userId, guildId);
      }
    }
  } catch (e) {
    log.warn('guild_xp_contributions insert failed:', e);
  }

  return {
    gainedXp: gained,
    totalXp: newTotalXp,
    level: levelInfo.level,
    nextLevelXp: levelInfo.nextLevelXp,
  };
}