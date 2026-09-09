/**
 * Defense enemy display / combat constants shared by simulation and rendering.
 * All helpers are pure and allocation-free (called per frame from the renderer).
 */
import type { DefenseEnemyType } from '@/game/defense/defenseTypes';
import { DEFENSE_PLAYER_Y } from '@/game/defense/defenseTypes';

export const DEFENSE_GROUND_Y = DEFENSE_PLAYER_Y + 20;
export const DEFENSE_ATTACK_LUNGE_SEC = 0.36;
export const DEFENSE_IMPACT_SEC = 0.3;
export const DEFENSE_IMPACT_HITBACK_SEC = 0.12;

const LUNGE_DIST = 22;
const LUNGE_HEIGHT = 14;
const FLYING_Y_OFFSET = 90;
const WALK_FRAME_SEC = 0.25;

export const DEFENSE_ENEMY_TYPES: readonly DefenseEnemyType[] = [
  'slime',
  'bat',
  'goblin',
  'skeleton',
  'ghost',
  'mushroom',
  'wolf',
  'golem',
  'mimic',
  'dragon',
];

/** Draw order: back (large) → front (small). */
export const DEFENSE_ENEMY_DRAW_ORDER: readonly DefenseEnemyType[] = [
  'dragon',
  'golem',
  'mimic',
  'wolf',
  'skeleton',
  'mushroom',
  'goblin',
  'slime',
  'ghost',
  'bat',
];

interface DefenseEnemyTypeConfig {
  /** Display height in map units. */
  readonly spriteHeight: number;
  /** Source texture width / height. */
  readonly aspectRatio: number;
  readonly isFlying: boolean;
}

export const DEFENSE_ENEMY_CONFIG: Record<DefenseEnemyType, DefenseEnemyTypeConfig> = {
  slime: { spriteHeight: 40, aspectRatio: 256 / 159, isFlying: false },
  bat: { spriteHeight: 40, aspectRatio: 256 / 228, isFlying: true },
  goblin: { spriteHeight: 56, aspectRatio: 247 / 256, isFlying: false },
  skeleton: { spriteHeight: 60, aspectRatio: 161 / 256, isFlying: false },
  ghost: { spriteHeight: 56, aspectRatio: 229 / 256, isFlying: true },
  mushroom: { spriteHeight: 56, aspectRatio: 233 / 256, isFlying: false },
  wolf: { spriteHeight: 52, aspectRatio: 256 / 165, isFlying: false },
  golem: { spriteHeight: 84, aspectRatio: 250 / 256, isFlying: false },
  mimic: { spriteHeight: 52, aspectRatio: 256 / 229, isFlying: false },
  dragon: { spriteHeight: 96, aspectRatio: 256 / 220, isFlying: false },
};

export const getDefenseEnemyCenterY = (type: DefenseEnemyType): number => {
  const config = DEFENSE_ENEMY_CONFIG[type];
  if (config.isFlying) {
    return DEFENSE_GROUND_Y - FLYING_Y_OFFSET;
  }
  return DEFENSE_GROUND_Y - config.spriteHeight / 2;
};

export const isDefenseEnemyAttacking = (
  attackHitPending: boolean,
  elapsedSec: number,
  attackStartedAt: number,
): boolean => (
  attackHitPending || (attackStartedAt > 0 && elapsedSec - attackStartedAt < DEFENSE_ATTACK_LUNGE_SEC)
);

const lungeProgress = (attackElapsed: number): number => {
  const p = attackElapsed / DEFENSE_ATTACK_LUNGE_SEC;
  return p <= 0 || p > 1 ? 0 : p;
};

/** Horizontal lunge toward the player (negative = left). Returns 0 outside the lunge window. */
export const getDefenseEnemyAttackDx = (attackElapsed: number): number => {
  const p = lungeProgress(attackElapsed);
  return p === 0 ? 0 : -LUNGE_DIST * Math.sin(Math.PI * p);
};

/** Arc: rises during the first half of the lunge, returns along the ground on the way back. */
export const getDefenseEnemyAttackDy = (attackElapsed: number, flying: boolean): number => {
  const p = lungeProgress(attackElapsed);
  if (p === 0) return 0;
  const height = flying ? LUNGE_HEIGHT * 0.5 : LUNGE_HEIGHT;
  return -height * Math.sin(Math.PI * Math.min(1, p * 2));
};

export type DefenseEnemyFrame = 'idle' | 'move';

export const pickDefenseEnemyFrame = (
  elapsedSec: number,
  slotIndex: number,
  moving: boolean,
  flying: boolean,
  attacking: boolean,
): DefenseEnemyFrame => {
  if (attacking) {
    return 'move';
  }
  if (flying || moving) {
    const phase = Math.floor((elapsedSec + slotIndex * 0.1) / WALK_FRAME_SEC) % 2;
    return phase === 0 ? 'idle' : 'move';
  }
  return 'idle';
};

export const getDefenseFlyingBobOffset = (elapsedSec: number, slotIndex: number): number => (
  Math.sin(elapsedSec * 4 + slotIndex) * 4
);

/** Fixed spark directions (radians) for the impact effect. */
export const DEFENSE_IMPACT_SPARK_ANGLES: readonly number[] = [
  0,
  Math.PI / 3,
  (2 * Math.PI) / 3,
  Math.PI,
  (4 * Math.PI) / 3,
  (5 * Math.PI) / 3,
];
