// ギルドボーナス計算ユーティリティ

export interface GuildBonusBreakdown {
  levelBonus: number; // 例: 0.034 => +3.4%
  memberBonus: number; // 例: 0.2 => +20%
  totalMultiplier: number; // 例: 1.234
}

/**
 * ギルドレベルと当月貢献メンバー数からギルドボーナスを算出
 * - レベル倍率: レベル1ごとに+0.1% (0.001)
 * - メンバー倍率: 当月XP>=1のメンバー人数 x +10% (0.1) 上限+50% (0.5)
 * - 合算方式: levelBonus + memberBonus を加算し、1に足す
 */
export function computeGuildBonus(level: number, contributedMemberCount: number): GuildBonusBreakdown {
  const safeLevel = Math.max(0, Math.floor(level || 0));
  const levelBonus = safeLevel * 0.001; // +0.1%/Lv
  const memberBonus = Math.min(0.5, Math.max(0, Math.floor(contributedMemberCount || 0)) * 0.1);
  const totalMultiplier = 1 + levelBonus + memberBonus;
  return { levelBonus, memberBonus, totalMultiplier };
}

/** 数値倍率から "+1.20x (+20.00%)" のような表記を返す */
export function formatMultiplier(multiplier: number): string {
  const percent = (multiplier - 1) * 100;
  return `+${multiplier.toFixed(2)}x (+${percent.toFixed(2)}%)`;
}

/** ボーナス内訳 "(Lv +x.xx, Mem +y.yy)" のような短い表示 */
export function formatBonusBreakdown(levelBonus: number, memberBonus: number): string {
  const lvPct = (levelBonus * 100).toFixed(2);
  const memPct = (memberBonus * 100).toFixed(0);
  return `(Lv +${lvPct}%, Mem +${memPct}%)`;
}

