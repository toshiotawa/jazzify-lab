import type { ParrySparkSlot } from './earTrainingBattleDrawState';
import {
  getParryEffectRadiusAtAge,
  getParryLingerAlpha,
  PARRY_MOTION_END_MS,
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
  dirX: number;
  dirY: number;
  streakLength: number;
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
    wobblePhase: 0,
    wobbleAmp: 0,
    tangentSkew: 0,
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
    slot.timeOffsetMs = (Math.random() - 0.5) * 90;
    slot.radiusScale = 0.76 + Math.random() * 0.48;
    slot.wobblePhase = Math.random() * Math.PI * 2;
    slot.wobbleAmp = 2 + Math.random() * 10;
    slot.tangentSkew = (Math.random() - 0.5) * 0.55;
    spawned += 1;
  }

  return spawned;
};

export const getParrySparkDrawState = (
  slot: ParrySparkSlot,
  now: number,
): ParrySparkDrawState | null => {
  if (!slot.active || now < slot.startedAt) return null;

  const age = now - slot.parryStartedAt + slot.timeOffsetMs;
  if (age >= slot.durationMs) return null;
  if (age < 0) return null;

  const baseRadius = getParryEffectRadiusAtAge(age) * slot.radiusScale;
  const wobble = Math.sin(age * 0.014 + slot.wobblePhase) * slot.wobbleAmp;
  const radius = Math.max(0, baseRadius + wobble);
  const tanX = -slot.dirY;
  const tanY = slot.dirX;
  const skew = slot.tangentSkew * radius * 0.18;
  const x = slot.centerX + slot.dirX * radius + tanX * skew;
  const y = slot.centerY + slot.dirY * radius + tanY * skew;
  const fadeT = age / slot.durationMs;
  const alpha = getParryLingerAlpha(now, slot.parryStartedAt, 1 - fadeT * 0.4);
  const size = slot.size * (1 - fadeT * 0.35);
  const streakLength = size * (1 - fadeT * 0.5) * 1.6;

  return {
    x,
    y,
    alpha,
    size,
    dirX: slot.dirX,
    dirY: slot.dirY,
    streakLength,
    color: PARRY_SPARK_COLOR,
  };
};

export const pruneParrySparks = (pool: ParrySparkSlot[], now: number): void => {
  for (const slot of pool) {
    if (!slot.active) continue;
    if (now >= slot.startedAt + slot.durationMs) {
      slot.active = false;
    }
  }
};

export const hasActiveParrySparks = (pool: ParrySparkSlot[]): boolean =>
  pool.some(slot => slot.active);

export const drawParrySparks = (
  ctx: CanvasRenderingContext2D,
  pool: ParrySparkSlot[],
  now: number,
): void => {
  for (const slot of pool) {
    const state = getParrySparkDrawState(slot, now);
    if (!state || state.alpha <= 0) continue;

    ctx.save();
    ctx.globalAlpha = state.alpha;
    ctx.strokeStyle = state.color;
    ctx.fillStyle = state.color;
    ctx.lineWidth = Math.max(1, state.size * 0.85);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(state.x - state.dirX * state.streakLength, state.y - state.dirY * state.streakLength);
    ctx.lineTo(state.x, state.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(state.x, state.y, Math.max(0.6, state.size * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};
