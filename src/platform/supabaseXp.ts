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

  const missionMul = params.missionMultiplier ?? 1;

  // サーバー側で一貫して計算・更新するRPCを使用
  const { data, error } = await supabase.rpc('add_xp_v2', {
    _user_id: userId,
    _base_xp: Math.max(0, Math.floor(params.baseXp)),
    _speed_multiplier: params.speedMultiplier,
    _rank_multiplier: params.rankMultiplier,
    _transpose_multiplier: params.transposeMultiplier,
    _membership_multiplier: params.membershipMultiplier,
    _mission_multiplier: missionMul,
    _season_multiplier: null,
    _reason: params.reason || 'unknown',
    _song_id: params.songId,
  });
  if (error) throw error;

  const gained = Number((data as any)?.gained_xp ?? 0);
  const newTotal = Number((data as any)?.new_xp ?? 0);
  const newLevel = Number((data as any)?.new_level ?? 1);
  const levelInfo = calcLevel(newTotal);

  return {
    gainedXp: gained,
    totalXp: newTotal,
    level: newLevel,
    nextLevelXp: levelInfo.nextLevelXp,
  };
}