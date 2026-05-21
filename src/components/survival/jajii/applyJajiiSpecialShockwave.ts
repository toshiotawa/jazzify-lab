/**
 * ジャ爺位置を中心としたゲージ必殺相当のダメージ・演出適用。
 * Web `SurvivalGameScreen` のプレイヤー必殺分岐と整合させる。
 */

import type { SurvivalGameState } from '@/components/survival/SurvivalTypes';
import type { ShockwaveEffect } from '@/components/survival/SurvivalTypes';
import { SPECIAL_ATTACK_RADIUS_MULTIPLIER } from '@/components/survival/SurvivalTypes';
import {
  buildSpecialShockwaveAt,
  calculateBMeleeDamage,
  calculateDamage,
  createDamageText,
  getConditionalSkillMultipliers,
  checkLuck,
} from '@/components/survival/SurvivalGameEngine';
import { applyPlayerMeleeToBossBattle } from '@/components/survival/boss/SurvivalBossEngine';
import type { BossBattleState } from '@/components/survival/boss/SurvivalBossTypes';

const bufferLikeLevel = (
  effects: SurvivalGameState['player']['statusEffects'],
  type: string,
): number => {
  const e = effects.find((x) => x.type === type);
  return e?.level ?? 0;
};

export interface ApplyJajiiSpecialParams {
  readonly draft: SurvivalGameState;
  readonly jajiiX: number;
  readonly jajiiY: number;
  readonly radiusMultiplier: number;
  readonly isBossStage: boolean;
  readonly bossBattle: BossBattleState | null | undefined;
  readonly queueShockwave: (wave: ShockwaveEffect) => void;
}

/** draft と bossBattle をミュータブル更新し、視覚用 shockwave を queue に積む */
export const applyJajiiGaugeSpecialAtWorld = (p: ApplyJajiiSpecialParams): void => {
  const { draft, jajiiX, jajiiY, radiusMultiplier, isBossStage, bossBattle, queueShockwave } = p;
  const player = draft.player;
  const baseRange = 80;
  const bonusRange = player.skills.bRangeBonus * 20;
  const specRange = (baseRange + bonusRange) * SPECIAL_ATTACK_RADIUS_MULTIPLIER * radiusMultiplier;

  queueShockwave(
    buildSpecialShockwaveAt(jajiiX, jajiiY, player, radiusMultiplier, {
      suppressCameraShake: true,
      source: 'jajii',
      idPrefix: 'jajii_special',
    }),
  );

  draft.enemyProjectiles = draft.enemyProjectiles.filter((proj) => {
    const dx = proj.x - jajiiX;
    const dy = proj.y - jajiiY;
    return Math.sqrt(dx * dx + dy * dy) >= specRange;
  });

  const knockbackForce = 150 + player.skills.bKnockbackBonus * 50;

  if (isBossStage && bossBattle?.active) {
    const condMultBoss = getConditionalSkillMultipliers(player);
    const bossDamage = Math.floor(calculateBMeleeDamage(player.stats.bAtk) * condMultBoss.atkMultiplier);
    const meleeRes = applyPlayerMeleeToBossBattle(
      bossBattle,
      jajiiX,
      jajiiY,
      specRange,
      bossDamage,
      player.x,
      player.y,
      true,
    );
    if (meleeRes.bossDamage > 0) {
      draft.damageTexts.push(
        createDamageText(bossBattle.boss.x, bossBattle.boss.y - 30, meleeRes.bossDamage, false),
      );
    }
    for (const m of meleeRes.minionKills) {
      draft.damageTexts.push(createDamageText(m.x, m.y - 10, bossDamage, false));
    }
    if (meleeRes.drops.length > 0) {
      draft.items = [...draft.items, ...meleeRes.drops];
    }
  }

  draft.enemies = draft.enemies.map((enemy) => {
    const dx = enemy.x - jajiiX;
    const dy = enemy.y - jajiiY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= specRange) return enemy;

    const condMultB = getConditionalSkillMultipliers(player);
    const baseBDamage = Math.floor(calculateBMeleeDamage(player.stats.bAtk) * condMultB.atkMultiplier);
    const luckResultB = checkLuck(player.stats.luck);
    const bufLv = bufferLikeLevel(player.statusEffects, 'buffer');
    const damage = calculateDamage(
      baseBDamage,
      0,
      enemy.stats.def,
      player.statusEffects.some((e) => e.type === 'buffer'),
      enemy.statusEffects.some((e) => e.type === 'debuffer'),
      bufLv,
      bufferLikeLevel(enemy.statusEffects, 'debuffer'),
      player.stats.cAtk,
      luckResultB.doubleDamage,
    );
    const knockbackX = dist > 0 ? (dx / dist) * knockbackForce : 0;
    const knockbackY = dist > 0 ? (dy / dist) * knockbackForce : 0;
    draft.damageTexts.push(
      createDamageText(
        enemy.x,
        enemy.y,
        damage,
        luckResultB.doubleDamage,
        luckResultB.doubleDamage ? '#ffd700' : undefined,
      ),
    );
    return {
      ...enemy,
      stats: { ...enemy.stats, hp: Math.max(0, enemy.stats.hp - damage) },
      knockbackVelocity: { x: knockbackX, y: knockbackY },
    };
  });
};
