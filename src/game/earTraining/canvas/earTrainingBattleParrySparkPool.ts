import type { ParrySparkSlot } from './earTrainingBattleDrawState';
import { getParryLingerAlpha } from './earTrainingBattleDrawState';

export const PARRY_SPARK_POOL_SIZE = 96;
export const PARRY_SPARK_DURATION_MS = 380;

const NORMAL_SPARK_COUNT = 16;
const CHAIN_SPARK_COUNT = 22;

const SPARK_COLORS = [
  '#ffffff',
  '#fef08a',
  '#fde047',
  '#fb923c',
  '#f97316',
  '#ef4444',
] as const;

export interface ParrySparkDrawState {
  x: number;
  y: number;
  alpha: number;
  size: number;
  dirX: number;
  dirY: number;
  streakLength: number;
}

export const createParrySparkPool = (): ParrySparkSlot[] =>
  Array.from({ length: PARRY_SPARK_POOL_SIZE }, (): ParrySparkSlot => ({
    active: false,
    startedAt: 0,
    durationMs: PARRY_SPARK_DURATION_MS,
    parryStartedAt: 0,
    originX: 0,
    originY: 0,
    dirX: 0,
    dirY: 0,
    travel: 0,
    size: 0,
    color: SPARK_COLORS[0],
  }));

const pickSparkColor = (): string => {
  const roll = Math.random();
  if (roll < 0.08) return SPARK_COLORS[5];
  return SPARK_COLORS[Math.floor(Math.random() * 5)];
};

export const spawnParrySparks = (
  pool: ParrySparkSlot[],
  x: number,
  y: number,
  startedAt: number,
  isChainParry: boolean,
): number => {
  const count = isChainParry ? CHAIN_SPARK_COUNT : NORMAL_SPARK_COUNT;
  const speedMin = isChainParry ? 160 : 120;
  const speedMax = isChainParry ? 320 : 260;
  const sizeMin = 2;
  const sizeMax = isChainParry ? 6 : 5;
  let spawned = 0;

  for (let index = 0; index < pool.length && spawned < count; index += 1) {
    const slot = pool[index];
    if (slot.active) continue;

    const angle = Math.random() * Math.PI * 2;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    slot.active = true;
    slot.startedAt = startedAt;
    slot.durationMs = PARRY_SPARK_DURATION_MS;
    slot.parryStartedAt = startedAt;
    slot.originX = x;
    slot.originY = y;
    slot.dirX = Math.cos(angle);
    slot.dirY = Math.sin(angle);
    slot.travel = speed * (PARRY_SPARK_DURATION_MS / 1000) * 0.72;
    slot.size = sizeMin + Math.random() * (sizeMax - sizeMin);
    slot.color = pickSparkColor();
    spawned += 1;
  }

  return spawned;
};

export const getParrySparkDrawState = (
  slot: ParrySparkSlot,
  now: number,
): ParrySparkDrawState | null => {
  if (!slot.active || now < slot.startedAt) return null;

  const elapsed = now - slot.startedAt;
  const t = Math.min(1, elapsed / slot.durationMs);
  if (t >= 1) return null;

  const moveT = 1 - (1 - t) ** 3;
  const x = slot.originX + slot.dirX * slot.travel * moveT;
  const y = slot.originY + slot.dirY * slot.travel * moveT;
  const alpha = getParryLingerAlpha(now, slot.parryStartedAt, 1 - t);
  const scale = 1 + (0.2 - 1) * t;
  const size = slot.size * scale;
  const streakLength = size * (1 - t * 0.7) * 2.8;

  return {
    x,
    y,
    alpha,
    size,
    dirX: slot.dirX,
    dirY: slot.dirY,
    streakLength,
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
    ctx.strokeStyle = slot.color;
    ctx.fillStyle = slot.color;
    ctx.lineWidth = Math.max(1, state.size * 0.85);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(state.x - state.dirX * state.streakLength, state.y - state.dirY * state.streakLength);
    ctx.lineTo(state.x, state.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(state.x, state.y, Math.max(0.8, state.size * 0.45), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};
