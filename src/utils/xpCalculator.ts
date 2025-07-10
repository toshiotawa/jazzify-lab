// XP 計算エンジン
// すべての倍率を受け取り、最終経験値を返す。将来的にサーバー側と共通化する場合は同一ロジックを保つこと。

export type MembershipRank = 'free' | 'standard' | 'premium' | 'platinum';
export type ScoreRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';

export interface XPCalcParams {
  membershipRank: MembershipRank;
  scoreRank: ScoreRank;
  playbackSpeed: number; // 0.5 ~ 1.0 (1.0 = 標準)
  transposed: boolean;   // true で 1.3x
  lessonBonusMultiplier?: number;   // レッスン曲 2x など
  missionBonusMultiplier?: number;  // ミッション報酬 1.3x など
  challengeBonusMultiplier?: number; // チャレンジ報酬
  seasonMultiplier?: number; // プロフィール next_season_xp_multiplier
}

// 基本 XP をスコアランクから算出
function baseXPFromRank(rank: ScoreRank): number {
  switch (rank) {
    case 'S': return 1000;
    case 'A': return 800;
    case 'B': return 600;
    case 'C': return 400;
    case 'D': return 200;
    default: return 100;
  }
}

// 会員ランク倍率
function rankMultiplier(rank: MembershipRank): number {
  switch (rank) {
    case 'premium': return 1.5;
    case 'platinum': return 2;
    default: return 1;
  }
}

// 再生速度倍率 (1.0 = 1, 0.75 = 0.75 etc.) 下限 0.3
function speedMultiplier(speed: number): number {
  return Math.max(0.3, speed);
}

export function calculateXP(params: XPCalcParams): number {
  const {
    membershipRank,
    scoreRank,
    playbackSpeed,
    transposed,
    lessonBonusMultiplier = 1,
    missionBonusMultiplier = 1,
    challengeBonusMultiplier = 1,
    seasonMultiplier = 1,
  } = params;

  const base = baseXPFromRank(scoreRank);
  const multi =
    rankMultiplier(membershipRank) *
    speedMultiplier(playbackSpeed) *
    (transposed ? 1.3 : 1) *
    lessonBonusMultiplier *
    missionBonusMultiplier *
    challengeBonusMultiplier *
    seasonMultiplier;

  return Math.round(base * multi);
}

// 次レベル到達に必要な XP
export function xpToNextLevel(currentLevel: number): number {
  if (currentLevel <= 10) return 2000;
  if (currentLevel <= 50) return 5000;
  return 20000;
}

export function levelAfterGain(level: number, xp: number, gained: number): { level: number; remainingXP: number; leveledUp: boolean } {
  let curLevel = level;
  let totalXP = xp + gained;
  let leveled = false;
  while (totalXP >= xpToNextLevel(curLevel)) {
    totalXP -= xpToNextLevel(curLevel);
    curLevel += 1;
    leveled = true;
  }
  return { level: curLevel, remainingXP: totalXP, leveledUp: leveled };
} 