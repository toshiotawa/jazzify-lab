/** B列近接に相当するヒット判定（風船用） — Web SurvivalGameScreen と同式 */
import type { PlayerState } from '@/components/survival/SurvivalTypes';

import {
  calculateBMeleeDamage,
  calculateDamage,
  checkLuck,
  getConditionalSkillMultipliers,
  getDirectionVector,
} from '@/components/survival/SurvivalGameEngine';

export interface XY {
  readonly x: number;
  readonly y: number;
}

export interface ShockwaveBurst {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly maxRadius: number;
  readonly startPerfMs: number;
}

/** ヒット半径内の balloon id（プレイヤー正面180°のみ totalRange、その他は baseRange）。 */
export const findBalloonsHitByMelee = (
  player: PlayerState,
  balloons: readonly { readonly id: string; readonly x: number; readonly y: number; readonly popped?: boolean }[],
): readonly string[] => {
  const baseRange = 80;
  const totalRange = baseRange + player.skills.bRangeBonus * 20;
  const dirVec = getDirectionVector(player.direction);
  const attackX = player.x + dirVec.x * 40;
  const attackY = player.y + dirVec.y * 40;

  const hit: string[] = [];
  for (const b of balloons) {
    if (b.popped) continue;
    const dx = b.x - attackX;
    const dy = b.y - attackY;
    const dist = Math.hypot(dx, dy);

    const toEnemyX = b.x - player.x;
    const toEnemyY = b.y - player.y;
    const dotProduct = toEnemyX * dirVec.x + toEnemyY * dirVec.y;
    const isInFront = dotProduct > 0;
    const effectiveRange = isInFront ? totalRange : baseRange;

    if (dist < effectiveRange) {
      hit.push(b.id);
    }
  }

  return hit;
};

/** 視覚用の衝撃波 */
export const createMeleeShockwaveBurst = (
  player: PlayerState,
  perfNowMs: number,
): ShockwaveBurst => {
  const baseRange = 80;
  const bonusRange = player.skills.bRangeBonus * 20;
  const totalRange = baseRange + bonusRange;
  const dirVec = getDirectionVector(player.direction);
  const attackX = player.x + dirVec.x * 40;
  const attackY = player.y + dirVec.y * 40;
  return {
    id: `br_brst_${perfNowMs}_${Math.random().toString(36).slice(2, 8)}`,
    x: attackX,
    y: attackY,
    maxRadius: totalRange,
    startPerfMs: perfNowMs,
  };
};

/** ワンショットで確実に破裂させるために生存と同等の的近接ダメを計算 */
export const meleeDamageVsBalloon = (player: PlayerState): number => {
  const condMultBTap = getConditionalSkillMultipliers(player);
  const baseBDamage = Math.floor(calculateBMeleeDamage(player.stats.bAtk) * condMultBTap.atkMultiplier);
  const luckResultBTap = checkLuck(player.stats.luck);
  const bufferEffect = player.statusEffects.find(e => e.type === 'buffer');
  const resolvedBufferLevel =
    typeof bufferEffect?.level === 'number' && Number.isFinite(bufferEffect.level) ? bufferEffect.level : 0;

  return calculateDamage(
    baseBDamage,
    0,
    0,
    player.statusEffects.some(e => e.type === 'buffer'),
    false,
    resolvedBufferLevel,
    0,
    player.stats.cAtk,
    luckResultBTap.doubleDamage,
  );
};

export const knockVelocityFromBalloonBurst = (
  balloon: XY,
  player: XY,
  knockbackForce: number,
): { readonly vx: number; readonly vy: number } => {
  const dx = player.x - balloon.x;
  const dy = player.y - balloon.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-3) return { vx: 0, vy: 0 };
  return {
    vx: (dx / dist) * knockbackForce,
    vy: (dy / dist) * knockbackForce,
  };
};
