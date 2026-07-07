import {
  computeOsuCircleTiming,
  OSU_CIRCLE_INNER_STROKE,
  OSU_CIRCLE_LINE_WIDTH,
  OSU_CIRCLE_OUTER_STROKE,
} from './earTrainingBattleOsuCircleTiming';

export const OSU_CIRCLE_POOL_SIZE = 16;
export const OSU_CIRCLE_BURST_LINGER_MS = 120;

export interface OsuCircleSlot {
  active: boolean;
  commandId: number;
  approachStartMs: number;
  judgedMs: number;
  centerX: number;
  targetY: number;
  burstAtMs?: number;
  dismissed: boolean;
}

export interface SpawnOsuCircleParams {
  commandId: number;
  approachStartMs: number;
  judgedMs: number;
  centerX: number;
  targetY: number;
}

export const createOsuCirclePool = (): OsuCircleSlot[] =>
  Array.from({ length: OSU_CIRCLE_POOL_SIZE }, (): OsuCircleSlot => ({
    active: false,
    commandId: -1,
    approachStartMs: 0,
    judgedMs: 0,
    centerX: 0,
    targetY: 0,
    dismissed: false,
  }));

export const spawnOsuCircle = (
  pool: OsuCircleSlot[],
  params: SpawnOsuCircleParams,
): boolean => {
  for (const slot of pool) {
    if (slot.active) continue;
    slot.active = true;
    slot.commandId = params.commandId;
    slot.approachStartMs = params.approachStartMs;
    slot.judgedMs = params.judgedMs;
    slot.centerX = params.centerX;
    slot.targetY = params.targetY;
    slot.burstAtMs = undefined;
    slot.dismissed = false;
    return true;
  }
  return false;
};

export const findOsuCircleByCommandId = (
  pool: OsuCircleSlot[],
  commandId: number,
): OsuCircleSlot | undefined => pool.find(
  slot => slot.active && slot.commandId === commandId,
);

export const burstOsuCircle = (
  pool: OsuCircleSlot[],
  commandId: number,
  nowMs: number,
): OsuCircleSlot | null => {
  const slot = findOsuCircleByCommandId(pool, commandId);
  if (!slot) return null;
  slot.burstAtMs = nowMs;
  return slot;
};

export const dismissOsuCircle = (
  pool: OsuCircleSlot[],
  commandId: number,
): boolean => {
  const slot = findOsuCircleByCommandId(pool, commandId);
  if (!slot) return false;
  slot.dismissed = true;
  return true;
};

export const pruneOsuCircles = (pool: OsuCircleSlot[], nowMs: number): void => {
  for (const slot of pool) {
    if (!slot.active) continue;
    if (slot.dismissed) {
      slot.active = false;
      continue;
    }
    if (slot.burstAtMs !== undefined && nowMs >= slot.burstAtMs + OSU_CIRCLE_BURST_LINGER_MS) {
      slot.active = false;
    }
  }
};

export const hasActiveOsuCircles = (pool: OsuCircleSlot[], nowMs: number): boolean => {
  for (const slot of pool) {
    if (!slot.active) continue;
    if (slot.dismissed) continue;
    if (slot.burstAtMs !== undefined) {
      if (nowMs < slot.burstAtMs + OSU_CIRCLE_BURST_LINGER_MS) {
        return true;
      }
      continue;
    }
    const timing = computeOsuCircleTiming({
      nowMs,
      approachStartMs: slot.approachStartMs,
      judgedMs: slot.judgedMs,
      centerX: slot.centerX,
      targetY: slot.targetY,
      burstAtMs: slot.burstAtMs,
      dismissed: slot.dismissed,
    });
    if (timing.visible) {
      return true;
    }
  }
  return false;
};

export const drawOsuCircles = (
  ctx: CanvasRenderingContext2D,
  pool: OsuCircleSlot[],
  nowMs: number,
): void => {
  for (const slot of pool) {
    if (!slot.active || slot.dismissed) continue;

    const timing = computeOsuCircleTiming({
      nowMs,
      approachStartMs: slot.approachStartMs,
      judgedMs: slot.judgedMs,
      centerX: slot.centerX,
      targetY: slot.targetY,
      burstAtMs: slot.burstAtMs,
      dismissed: slot.dismissed,
    });

    if (slot.burstAtMs !== undefined) {
      const burstAge = nowMs - slot.burstAtMs;
      if (burstAge >= OSU_CIRCLE_BURST_LINGER_MS) continue;
      const burstT = burstAge / OSU_CIRCLE_BURST_LINGER_MS;
      const burstAlpha = 1 - burstT;
      const burstScale = 1 + burstT * 0.6;
      ctx.save();
      ctx.globalAlpha = burstAlpha;
      ctx.strokeStyle = OSU_CIRCLE_INNER_STROKE;
      ctx.lineWidth = OSU_CIRCLE_LINE_WIDTH;
      ctx.beginPath();
      ctx.arc(
        slot.centerX,
        slot.targetY,
        timing.innerRadius * burstScale,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (!timing.visible) continue;

    ctx.save();
    ctx.lineWidth = OSU_CIRCLE_LINE_WIDTH;

    ctx.strokeStyle = OSU_CIRCLE_INNER_STROKE;
    ctx.beginPath();
    ctx.arc(timing.centerX, timing.centerY, timing.innerRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = OSU_CIRCLE_OUTER_STROKE;
    ctx.beginPath();
    ctx.arc(timing.centerX, timing.centerY, timing.outerRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
};
