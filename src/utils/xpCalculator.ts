// XP 計算エンジン
// すべての倍率を受け取り、最終経験値を返す。将来的にサーバー側と共通化する場合は同一ロジックを保つこと。

export type MembershipRank = 'free' | 'standard' | 'standard_global' | 'premium' | 'platinum' | 'black';
export type ScoreRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';

export interface XPCalcParams {
  membershipRank: MembershipRank;
  scoreRank: ScoreRank;
  playbackSpeed: number; // 0.5 ~ 1.0 (1.0 = 標準)
  transposed: boolean;   // true で 1.3x
  lessonBonusMultiplier?: number;   // レッスン曲ボーナス（現在は1.0）
  missionBonusMultiplier?: number;  // ミッション報酬ボーナス（現在は1.0）
  challengeBonusMultiplier?: number; // チャレンジ報酬
  seasonMultiplier?: number; // プロフィール next_season_xp_multiplier
  guildMultiplier?: number; // 追加: ギルドボーナス
}

export interface XPDetailed {
  base: number;
  multipliers: {
    membership: number;
    speed: number;
    transpose: number;
    lesson: number;
    mission: number;
    challenge: number;
    season: number;
    guild?: number;
  };
  total: number;
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
    case 'premium':
      return 1.5;
    case 'platinum':
    case 'black':
      return 2;
    default:
      return 1;
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
    guildMultiplier = 1,
  } = params;

  const base = baseXPFromRank(scoreRank);
  const membershipBonus = rankMultiplier(membershipRank) - 1;
  const speedBonus = speedMultiplier(playbackSpeed) - 1;
  const transposeBonus = transposed ? 0.3 : 0;
  const lessonBonus = lessonBonusMultiplier - 1;
  const missionBonus = missionBonusMultiplier - 1;
  const challengeBonus = challengeBonusMultiplier - 1;
  const seasonBonus = seasonMultiplier - 1;
  const guildBonus = guildMultiplier - 1;

  const totalBonus = membershipBonus + speedBonus + transposeBonus + lessonBonus + missionBonus + challengeBonus + seasonBonus + guildBonus;

  return Math.round(base * (1 + totalBonus));
}

export function calculateXPDetailed(params: XPCalcParams): XPDetailed {
  const {
    membershipRank,
    scoreRank,
    playbackSpeed,
    transposed,
    lessonBonusMultiplier = 1,
    missionBonusMultiplier = 1,
    challengeBonusMultiplier = 1,
    seasonMultiplier = 1,
    guildMultiplier = 1,
  } = params;

  const base = baseXPFromRank(scoreRank);
  const membership = rankMultiplier(membershipRank);
  const speed = speedMultiplier(playbackSpeed);
  const transpose = transposed ? 1.3 : 1;
  const lesson = lessonBonusMultiplier;
  const mission = missionBonusMultiplier;
  const challenge = challengeBonusMultiplier;
  const season = seasonMultiplier;
  const guild = guildMultiplier;

  // 加算方式
  const membershipBonus = membership - 1;
  const speedBonus = speed - 1;
  const transposeBonus = transpose - 1;
  const lessonBonus = lesson - 1;
  const missionBonus = mission - 1;
  const challengeBonus = challenge - 1;
  const seasonBonus = season - 1;
  const guildBonus = guild - 1;

  const totalBonus = membershipBonus + speedBonus + transposeBonus + lessonBonus + missionBonus + challengeBonus + seasonBonus + guildBonus;

  const total = Math.round(base * (1 + totalBonus));

  return {
    base,
    multipliers: { membership, speed, transpose, lesson, mission, challenge, season, guild },
    total
  };
}

// 次レベル到達に必要な XP
export function xpToNextLevel(currentLevel: number): number {
  if (currentLevel < 10) return 2000;
  if (currentLevel < 50) return 50000;
  return 100000;
}

// 現在のレベルでの経験値の余り（繰り上がらない分）を計算
export function currentLevelXP(level: number, totalXP: number): number {
  let remainingXP = totalXP;
  let currentLevel = 1;
  
  // レベル1からcurrentLevelまでの必要経験値を引いていく
  while (currentLevel < level) {
    const requiredXP = xpToNextLevel(currentLevel);
    remainingXP -= requiredXP;
    currentLevel++;
  }
  
  return Math.max(0, remainingXP);
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