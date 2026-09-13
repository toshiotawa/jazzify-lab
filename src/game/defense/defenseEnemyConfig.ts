/**
 * Defense enemy display / combat constants shared by simulation and rendering.
 * All helpers are pure and allocation-free (called per frame from the renderer).
 */
import type { DefenseDifficulty, DefenseEnemyType } from '@/game/defense/defenseTypes';
import { DEFENSE_PLAYER_Y } from '@/game/defense/defenseTypes';

export const DEFENSE_GROUND_Y = DEFENSE_PLAYER_Y + 20;
export const DEFENSE_ATTACK_LUNGE_SEC = 0.36;
export const DEFENSE_IMPACT_SEC = 0.3;
export const DEFENSE_IMPACT_HITBACK_SEC = 0.12;
export const DEFENSE_SLASH_SEC = 0.24;
export const DEFENSE_SKILL_POSE_FRAME_SEC = 0.08;
export const DEFENSE_SKILL_POSE_FRAME_COUNT = 6;
export const DEFENSE_FIREBALL_SPAWN_DELAY_SEC = 0.32;

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

export const DEFENSE_WAVE_COUNT = 4;

export const DEFENSE_WAVE_HP_MULT: readonly number[] = [1, 1.5, 2.2, 3];
export const DEFENSE_WAVE_SPAWN_INTERVAL_MULT: readonly number[] = [1, 0.85, 0.72, 0.6];

export const DEFENSE_HIT_FLASH_SEC = 0.15;
export const DEFENSE_SP_MAX = 5;
export const DEFENSE_FIREBALL_SPEED_PX = 520;
export const DEFENSE_FIREBALL_DAMAGE_MULT = 3;
export const DEFENSE_FIREBALL_HIT_RADIUS = 28;
export const DEFENSE_DAMAGE_POPUP_SEC = 0.6;

export const DEFENSE_WAVE_ROSTERS: readonly (readonly DefenseEnemyType[])[] = [
  ['slime', 'bat', 'mushroom', 'slime'],
  ['goblin', 'wolf', 'ghost', 'goblin'],
  ['skeleton', 'mimic', 'mushroom', 'slime'],
  ['golem', 'wolf', 'dragon', 'bat'],
];

const buildCumulativeWaveRosters = (): readonly (readonly DefenseEnemyType[])[] => {
  const cumulative: DefenseEnemyType[][] = [];
  for (let wave = 0; wave < DEFENSE_WAVE_ROSTERS.length; wave += 1) {
    const roster: DefenseEnemyType[] = [];
    for (let w = 0; w <= wave; w += 1) {
      const waveRoster = DEFENSE_WAVE_ROSTERS[w];
      if (waveRoster) {
        for (let i = 0; i < waveRoster.length; i += 1) {
          roster.push(waveRoster[i] ?? 'slime');
        }
      }
    }
    cumulative.push(roster);
  }
  return cumulative;
};

export const DEFENSE_WAVE_CUMULATIVE_ROSTERS = buildCumulativeWaveRosters();

interface DefenseEnemyTypeStats {
  readonly hpMult: number;
  readonly speedMult: number;
  readonly damageAdd: number;
  readonly intervalMult: number;
  readonly rangeMult: number;
  readonly knockbackMult: number;
}

const DEFENSE_ENEMY_STATS: Record<DefenseEnemyType, DefenseEnemyTypeStats> = {
  slime: { hpMult: 1.0, speedMult: 0.85, damageAdd: 0, intervalMult: 1.0, rangeMult: 1.0, knockbackMult: 1.1 },
  bat: { hpMult: 0.6, speedMult: 1.6, damageAdd: 0, intervalMult: 0.8, rangeMult: 1.0, knockbackMult: 1.3 },
  goblin: { hpMult: 1.0, speedMult: 1.1, damageAdd: 0, intervalMult: 0.9, rangeMult: 1.0, knockbackMult: 1.0 },
  skeleton: { hpMult: 1.5, speedMult: 0.9, damageAdd: 0, intervalMult: 1.0, rangeMult: 1.0, knockbackMult: 0.9 },
  ghost: { hpMult: 0.6, speedMult: 1.3, damageAdd: 0, intervalMult: 1.2, rangeMult: 1.0, knockbackMult: 1.2 },
  mushroom: { hpMult: 1.2, speedMult: 0.7, damageAdd: 0, intervalMult: 1.3, rangeMult: 1.0, knockbackMult: 0.9 },
  wolf: { hpMult: 1.0, speedMult: 1.5, damageAdd: 0, intervalMult: 0.7, rangeMult: 1.0, knockbackMult: 1.0 },
  golem: { hpMult: 2.0, speedMult: 0.6, damageAdd: 1, intervalMult: 1.5, rangeMult: 1.0, knockbackMult: 0.45 },
  mimic: { hpMult: 1.5, speedMult: 1.0, damageAdd: 0, intervalMult: 1.0, rangeMult: 1.0, knockbackMult: 0.7 },
  dragon: { hpMult: 2.5, speedMult: 0.8, damageAdd: 1, intervalMult: 1.2, rangeMult: 1.4, knockbackMult: 0.5 },
};

interface ResolvedDefenseEnemyStats {
  readonly hp: number;
  readonly speedPxPerSec: number;
  readonly damage: number;
  readonly attackIntervalSec: number;
  readonly attackRangePx: number;
  readonly knockbackMult: number;
}

export const getDefenseWaveIndex = (
  elapsedSec: number,
  surviveSeconds: number,
): number => {
  if (surviveSeconds <= 0) return 0;
  const waveDurationSec = surviveSeconds / DEFENSE_WAVE_COUNT;
  const index = Math.floor(elapsedSec / waveDurationSec);
  return Math.min(DEFENSE_WAVE_COUNT - 1, Math.max(0, index));
};

export const pickDefenseWaveEnemyType = (
  waveIndex: number,
  spawnCount: number,
  cumulative = false,
): DefenseEnemyType => {
  const rosters = cumulative ? DEFENSE_WAVE_CUMULATIVE_ROSTERS : DEFENSE_WAVE_ROSTERS;
  const roster = rosters[waveIndex] ?? rosters[0] ?? ['slime'];
  return roster[spawnCount % roster.length] ?? 'slime';
};

export const getDefenseWaveHpMult = (waveIndex: number): number => (
  DEFENSE_WAVE_HP_MULT[waveIndex] ?? DEFENSE_WAVE_HP_MULT[DEFENSE_WAVE_HP_MULT.length - 1] ?? 1
);

export const getDefenseWaveSpawnIntervalMult = (waveIndex: number): number => (
  DEFENSE_WAVE_SPAWN_INTERVAL_MULT[waveIndex]
    ?? DEFENSE_WAVE_SPAWN_INTERVAL_MULT[DEFENSE_WAVE_SPAWN_INTERVAL_MULT.length - 1]
    ?? 1
);

export const getDefenseSlashDamage = (waveIndex: number, scaling: boolean): number => (
  scaling ? waveIndex + 1 : 1
);

export const resolveDefenseEnemyStats = (
  type: DefenseEnemyType,
  difficulty: DefenseDifficulty,
  hpMult = 1,
): ResolvedDefenseEnemyStats => {
  const stats = DEFENSE_ENEMY_STATS[type];
  return {
    hp: Math.max(1, Math.round(difficulty.enemyHp * stats.hpMult * hpMult)),
    speedPxPerSec: difficulty.enemySpeedPxPerSec * stats.speedMult,
    damage: difficulty.enemyDamage + stats.damageAdd,
    attackIntervalSec: difficulty.attackIntervalSec * stats.intervalMult,
    attackRangePx: difficulty.attackRangePx * stats.rangeMult,
    knockbackMult: stats.knockbackMult,
  };
};

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
