import type { ParrySparkSlot } from './earTrainingBattleDrawState';
import {
  getParryEffectRadiusAtAge,
  getParryLingerAlpha,
  PARRY_MOTION_END_MS,
  PARRY_SPARK_RADIUS_SCALE_MAX,
  PARRY_SPARK_RADIUS_SCALE_MIN,
  PARRY_SPARK_TIME_OFFSET_MS,
} from './earTrainingBattleDrawState';

export const PARRY_SPARK_POOL_SIZE = 128;
export const PARRY_SPARK_DURATION_MS = PARRY_MOTION_END_MS;

const NORMAL_SPARK_COUNT = 28;
const CHAIN_SPARK_COUNT = 40;
export const PARRY_SPARK_COLOR = '#fb923c';

export interface ParrySparkDrawState {
  x: number;
  y: number;
  alpha: number;
  size: number;
  color: string;
}

export const createParrySparkPool = (): ParrySparkSlot[] =>
  Array.from({ length: PARRY_SPARK_POOL_SIZE }, (): ParrySparkSlot => ({
    active: false,
    startedAt: 0,
    durationMs: PARRY_SPARK_DURATION_MS,
    parryStartedAt: 0,
    centerX: 0,
    centerY: 0,
    dirX: 0,
    dirY: 0,
    size: 0,
    timeOffsetMs: 0,
    radiusScale: 1,
  }));

export const spawnParrySparks = (
  pool: ParrySparkSlot[],
  x: number,
  y: number,
  startedAt: number,
  isChainParry: boolean,
): number => {
  const count = isChainParry ? CHAIN_SPARK_COUNT : NORMAL_SPARK_COUNT;
  const sizeMin = 1.5;
  const sizeMax = isChainParry ? 4 : 3.5;
  let spawned = 0;

  for (let index = 0; index < pool.length && spawned < count; index += 1) {
    const slot = pool[index];
    if (slot.active) continue;

    const angle = Math.random() * Math.PI * 2;
    slot.active = true;
    slot.startedAt = startedAt;
    slot.durationMs = PARRY_SPARK_DURATION_MS;
    slot.parryStartedAt = startedAt;
    slot.centerX = x;
    slot.centerY = y;
    slot.dirX = Math.cos(angle);
    slot.dirY = Math.sin(angle);
    slot.size = sizeMin + Math.random() * (sizeMax - sizeMin);
    slot.timeOffsetMs = (Math.random() * 2 - 1) * PARRY_SPARK_TIME_OFFSET_MS;
    slot.radiusScale = PARRY_SPARK_RADIUS_SCALE_MIN
      + Math.random() * (PARRY_SPARK_RADIUS_SCALE_MAX - PARRY_SPARK_RADIUS_SCALE_MIN);
    spawned += 1;
  }

  return spawned;
};

export const getParrySparkDrawState = (
  slot: ParrySparkSlot,
  visualNow: number,
): ParrySparkDrawState | null => {
  if (!slot.active) return null;

  const age = visualNow - slot.parryStartedAt + slot.timeOffsetMs;
  if (age >= slot.durationMs || age < 0) return null;

  const radius = getParryEffectRadiusAtAge(age) * slot.radiusScale;
  const x = slot.centerX + slot.dirX * radius;
  const y = slot.centerY + slot.dirY * radius;
  const fadeT = age / slot.durationMs;
  const alpha = getParryLingerAlpha(visualNow, slot.parryStartedAt, 1 - fadeT * 0.4);
  const size = slot.size * (1 - fadeT * 0.35);

  return {
    x,
    y,
    alpha,
    size,
    color: PARRY_SPARK_COLOR,
  };
};

export const pruneParrySparks = (pool: ParrySparkSlot[], visualNow: number): void => {
  for (const slot of pool) {
    if (!slot.active) continue;
    const age = visualNow - slot.parryStartedAt + slot.timeOffsetMs;
    if (age >= slot.durationMs) {
      slot.active = false;
    }
  }
};

export const hasActiveParrySparks = (pool: ParrySparkSlot[]): boolean =>
  pool.some(slot => slot.active);

export const drawParrySparks = (
  ctx: CanvasRenderingContext2D,
  pool: ParrySparkSlot[],
  visualNow: number,
): void => {
  for (const slot of pool) {
    const state = getParrySparkDrawState(slot, visualNow);
    if (!state || state.alpha <= 0) continue;

    ctx.save();
    ctx.globalAlpha = state.alpha;
    ctx.fillStyle = state.color;
    ctx.beginPath();
    ctx.arc(state.x, state.y, Math.max(0.6, state.size * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};
