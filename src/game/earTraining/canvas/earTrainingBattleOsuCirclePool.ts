import {
  computeOsuCircleTiming,
  OSU_CIRCLE_LINE_WIDTH,
} from './earTrainingBattleOsuCircleTiming';
import {
  getOsuCircleInnerStroke,
  getOsuCircleOuterStroke,
  OSU_CIRCLE_OUTER_LINE_WIDTH,
} from './earTrainingBattleOsuCircleColors';

export const OSU_CIRCLE_POOL_SIZE = 16;
const OSU_NOTE_LABEL_FONT = '700 17px "Avenir Next", "Segoe UI", sans-serif';
const OSU_NOTE_LABEL_LINE_HEIGHT = 18;
const OSU_NOTE_LABEL_COLOR = '#fff7ed';
const OSU_NOTE_LABEL_SHADOW = 'rgba(0, 0, 0, 0.55)';

export interface OsuCircleSlot {
  active: boolean;
  commandId: number;
  approachStartMs: number;
  judgedMs: number;
  centerX: number;
  targetY: number;
  dismissed: boolean;
  layoutIndex: number;
  noteLabels: string[];
  colorIndex: number;
}

export interface OsuCircleBurstPosition {
  centerX: number;
  targetY: number;
  colorIndex: number;
}

export interface SpawnOsuCircleParams {
  commandId: number;
  approachStartMs: number;
  judgedMs: number;
  centerX: number;
  targetY: number;
  layoutIndex?: number;
  noteLabels?: readonly string[];
  colorIndex?: number;
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
    layoutIndex: 0,
    noteLabels: [],
    colorIndex: 0,
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
    slot.layoutIndex = params.layoutIndex ?? 0;
    slot.noteLabels = params.noteLabels ? Array.from(params.noteLabels) : [];
    slot.colorIndex = params.colorIndex ?? 0;
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
    colorIndex: slot.colorIndex,
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

const resolveNextOsuCircleCommandId = (
  pool: OsuCircleSlot[],
  nowMs: number,
): number | null => {
  let nextCommandId: number | null = null;
  let nextJudgedMs = Number.POSITIVE_INFINITY;
  for (const slot of pool) {
    if (!slot.active || slot.dismissed) continue;
    if (slot.judgedMs >= nextJudgedMs) continue;
    const timing = computeOsuCircleTiming({
      nowMs,
      approachStartMs: slot.approachStartMs,
      judgedMs: slot.judgedMs,
      centerX: slot.centerX,
      targetY: slot.targetY,
      dismissed: slot.dismissed,
    });
    if (!timing.visible) continue;
    nextJudgedMs = slot.judgedMs;
    nextCommandId = slot.commandId;
  }
  return nextCommandId;
};

const drawNoteLabels = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  labels: readonly string[],
  alpha: number,
): void => {
  if (labels.length === 0) return;
  const totalHeight = (labels.length - 1) * OSU_NOTE_LABEL_LINE_HEIGHT;
  let y = centerY - totalHeight / 2;
  ctx.font = OSU_NOTE_LABEL_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = alpha;
  ctx.shadowColor = OSU_NOTE_LABEL_SHADOW;
  ctx.shadowBlur = 3;
  ctx.fillStyle = OSU_NOTE_LABEL_COLOR;
  for (const label of labels) {
    ctx.fillText(label, centerX, y);
    y += OSU_NOTE_LABEL_LINE_HEIGHT;
  }
  ctx.shadowBlur = 0;
};

export const drawOsuCircles = (
  ctx: CanvasRenderingContext2D,
  pool: OsuCircleSlot[],
  nowMs: number,
): void => {
  const nextCommandId = resolveNextOsuCircleCommandId(pool, nowMs);

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

    const isNext = slot.commandId === nextCommandId;
    const emphasis = isNext ? 1 : 0.78;
    const innerStroke = getOsuCircleInnerStroke(slot.colorIndex);
    const outerStroke = getOsuCircleOuterStroke(slot.colorIndex);

    ctx.save();
    ctx.globalAlpha = emphasis;
    ctx.lineWidth = OSU_CIRCLE_LINE_WIDTH;
    ctx.strokeStyle = innerStroke;
    ctx.beginPath();
    ctx.arc(timing.centerX, timing.centerY, timing.innerRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = emphasis;
    ctx.lineWidth = OSU_CIRCLE_OUTER_LINE_WIDTH;
    ctx.strokeStyle = outerStroke;
    ctx.beginPath();
    ctx.arc(timing.centerX, timing.centerY, timing.outerRadius, 0, Math.PI * 2);
    ctx.stroke();

    drawNoteLabels(ctx, timing.centerX, timing.centerY, slot.noteLabels, emphasis);
    ctx.restore();
  }
};
