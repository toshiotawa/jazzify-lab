import {
  computeOsuCircleTiming,
  OSU_CIRCLE_INNER_STROKE,
  OSU_CIRCLE_LINE_WIDTH,
  OSU_CIRCLE_OUTER_STROKE,
} from './earTrainingBattleOsuCircleTiming';

export const OSU_CIRCLE_POOL_SIZE = 16;

export interface OsuCircleSlot {
  active: boolean;
  commandId: number;
  approachStartMs: number;
  judgedMs: number;
  centerX: number;
  targetY: number;
  dismissed: boolean;
}

export interface OsuCircleBurstPosition {
  centerX: number;
  targetY: number;
}

export interface SpawnOsuCircleParams {
  commandId: number;
  approachStartMs: number;
  judgedMs: number;
  centerX: number;
  targetY: number;
}

export interface OsuApproachCircleTimingUpdate {
  commandId: number;
  approachStartMs: number;
  judgedMs: number;
}

export const resyncOsuCircleTimings = (
  pool: OsuCircleSlot[],
  updates: readonly OsuApproachCircleTimingUpdate[],
): number => {
  let resynced = 0;
  for (const update of updates) {
    const slot = findOsuCircleByCommandId(pool, update.commandId);
    if (!slot || slot.dismissed) {
      continue;
    }
    slot.approachStartMs = update.approachStartMs;
    slot.judgedMs = update.judgedMs;
    resynced += 1;
  }
  return resynced;
};

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
): OsuCircleBurstPosition | null => {
  const slot = findOsuCircleByCommandId(pool, commandId);
  if (!slot) return null;
  const position: OsuCircleBurstPosition = {
    centerX: slot.centerX,
    targetY: slot.targetY,
  };
  slot.active = false;
  return position;
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

export const pruneOsuCircles = (pool: OsuCircleSlot[]): void => {
  for (const slot of pool) {
    if (!slot.active) continue;
    if (slot.dismissed) {
      slot.active = false;
    }
  }
};

export const hasActiveOsuCircles = (pool: OsuCircleSlot[], nowMs: number): boolean => {
  for (const slot of pool) {
    if (!slot.active || slot.dismissed) continue;
    const timing = computeOsuCircleTiming({
      nowMs,
      approachStartMs: slot.approachStartMs,
      judgedMs: slot.judgedMs,
      centerX: slot.centerX,
      targetY: slot.targetY,
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
      dismissed: slot.dismissed,
    });

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
