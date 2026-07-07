import {
  OSU_CIRCLE_INNER_STROKE,
  OSU_CIRCLE_LINE_WIDTH,
} from './earTrainingBattleOsuCircleTiming';

export const OSU_SHATTER_POOL_SIZE = 96;
export const OSU_SHATTER_DURATION_MS = 420;
export const OSU_SHATTER_FRAGMENT_COUNT = 14;
const OSU_SHATTER_ARC_SPAN = (Math.PI * 2) / OSU_SHATTER_FRAGMENT_COUNT * 0.72;
const OSU_SHATTER_DRIFT_MIN_PX_PER_SEC = 140;
const OSU_SHATTER_DRIFT_MAX_PX_PER_SEC = 260;

export interface OsuShatterSlot {
  active: boolean;
  startedAt: number;
  durationMs: number;
  originX: number;
  originY: number;
  midAngle: number;
  arcSpan: number;
  ringRadius: number;
  dirX: number;
  dirY: number;
  driftSpeed: number;
  spinRadPerMs: number;
}

export const createOsuCircleShatterPool = (): OsuShatterSlot[] =>
  Array.from({ length: OSU_SHATTER_POOL_SIZE }, (): OsuShatterSlot => ({
    active: false,
    startedAt: 0,
    durationMs: OSU_SHATTER_DURATION_MS,
    originX: 0,
    originY: 0,
    midAngle: 0,
    arcSpan: OSU_SHATTER_ARC_SPAN,
    ringRadius: 0,
    dirX: 0,
    dirY: 0,
    driftSpeed: 0,
    spinRadPerMs: 0,
  }));

export const spawnOsuCircleShatter = (
  pool: OsuShatterSlot[],
  originX: number,
  originY: number,
  ringRadius: number,
  startedAt: number,
): number => {
  let spawned = 0;
  for (let index = 0; index < OSU_SHATTER_FRAGMENT_COUNT; index += 1) {
    const slot = pool.find(candidate => !candidate.active);
    if (!slot) break;

    const midAngle = (Math.PI * 2 * index) / OSU_SHATTER_FRAGMENT_COUNT;
    slot.active = true;
    slot.startedAt = startedAt;
    slot.durationMs = OSU_SHATTER_DURATION_MS;
    slot.originX = originX;
    slot.originY = originY;
    slot.midAngle = midAngle;
    slot.arcSpan = OSU_SHATTER_ARC_SPAN;
    slot.ringRadius = ringRadius;
    slot.dirX = Math.cos(midAngle);
    slot.dirY = Math.sin(midAngle);
    slot.driftSpeed = OSU_SHATTER_DRIFT_MIN_PX_PER_SEC
      + Math.random() * (OSU_SHATTER_DRIFT_MAX_PX_PER_SEC - OSU_SHATTER_DRIFT_MIN_PX_PER_SEC);
    slot.spinRadPerMs = (Math.random() * 2 - 1) * 0.004;
    spawned += 1;
  }
  return spawned;
};

export const pruneOsuCircleShatter = (pool: OsuShatterSlot[], nowMs: number): void => {
  for (const slot of pool) {
    if (!slot.active) continue;
    if (nowMs - slot.startedAt >= slot.durationMs) {
      slot.active = false;
    }
  }
};

export const hasActiveOsuCircleShatter = (pool: OsuShatterSlot[], nowMs: number): boolean => {
  for (const slot of pool) {
    if (!slot.active) continue;
    if (nowMs - slot.startedAt < slot.durationMs) {
      return true;
    }
  }
  return false;
};

export const drawOsuCircleShatter = (
  ctx: CanvasRenderingContext2D,
  pool: OsuShatterSlot[],
  nowMs: number,
): void => {
  ctx.save();
  ctx.strokeStyle = OSU_CIRCLE_INNER_STROKE;
  ctx.lineWidth = OSU_CIRCLE_LINE_WIDTH;
  ctx.lineCap = 'round';

  for (const slot of pool) {
    if (!slot.active) continue;
    const age = nowMs - slot.startedAt;
    if (age >= slot.durationMs) continue;

    const t = age / slot.durationMs;
    const drift = slot.driftSpeed * (age / 1000);
    const cx = slot.originX + slot.dirX * drift;
    const cy = slot.originY + slot.dirY * drift;
    const spin = slot.spinRadPerMs * age;
    const alpha = 1 - t * t;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      slot.ringRadius,
      slot.midAngle - slot.arcSpan / 2 + spin,
      slot.midAngle + slot.arcSpan / 2 + spin,
    );
    ctx.stroke();
  }

  ctx.restore();
};
