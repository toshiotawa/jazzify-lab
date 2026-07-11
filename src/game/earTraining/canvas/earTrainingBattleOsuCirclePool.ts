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
const OSU_NOTE_LABEL_FONT = '700 21px "Avenir Next", "Segoe UI", sans-serif';
/** 横並びラベル間の余白（px） */
const OSU_NOTE_LABEL_GAP = 6;
const OSU_NOTE_LABEL_COLOR = '#fff7ed';
const OSU_NOTE_LABEL_SHADOW = 'rgba(0, 0, 0, 0.55)';
/** drawNoteLabels 用の幅キャッシュ（毎フレームの配列確保を避ける） */
const scratchLabelWidths: number[] = [];

export interface OsuCircleSlot {
  active: boolean;
  commandId: number;
  approachStartPhraseSec: number;
  judgedPhraseSec: number;
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
  approachStartPhraseSec: number;
  judgedPhraseSec: number;
  centerX: number;
  targetY: number;
  layoutIndex?: number;
  noteLabels?: readonly string[];
  colorIndex?: number;
}

export interface OsuApproachCircleTimingUpdate {
  commandId: number;
  approachStartPhraseSec: number;
  judgedPhraseSec: number;
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
    slot.approachStartPhraseSec = update.approachStartPhraseSec;
    slot.judgedPhraseSec = update.judgedPhraseSec;
    resynced += 1;
  }
  return resynced;
};

export const createOsuCirclePool = (): OsuCircleSlot[] =>
  Array.from({ length: OSU_CIRCLE_POOL_SIZE }, (): OsuCircleSlot => ({
    active: false,
    commandId: -1,
    approachStartPhraseSec: 0,
    judgedPhraseSec: 0,
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
    slot.approachStartPhraseSec = params.approachStartPhraseSec;
    slot.judgedPhraseSec = params.judgedPhraseSec;
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

export const hasActiveOsuCircles = (pool: OsuCircleSlot[], nowPhraseSec: number): boolean => {
  for (const slot of pool) {
    if (!slot.active || slot.dismissed) continue;
    const timing = computeOsuCircleTiming({
      nowPhraseSec,
      approachStartPhraseSec: slot.approachStartPhraseSec,
      judgedPhraseSec: slot.judgedPhraseSec,
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
  nowPhraseSec: number,
): number | null => {
  let nextCommandId: number | null = null;
  let nextJudgedPhraseSec = Number.POSITIVE_INFINITY;
  for (const slot of pool) {
    if (!slot.active || slot.dismissed) continue;
    if (slot.judgedPhraseSec >= nextJudgedPhraseSec) continue;
    const timing = computeOsuCircleTiming({
      nowPhraseSec,
      approachStartPhraseSec: slot.approachStartPhraseSec,
      judgedPhraseSec: slot.judgedPhraseSec,
      centerX: slot.centerX,
      targetY: slot.targetY,
      dismissed: slot.dismissed,
    });
    if (!timing.visible) continue;
    nextJudgedPhraseSec = slot.judgedPhraseSec;
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
  ctx.font = OSU_NOTE_LABEL_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  scratchLabelWidths.length = labels.length;
  let totalWidth = 0;
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const width = label === undefined ? 0 : ctx.measureText(label).width;
    scratchLabelWidths[i] = width;
    totalWidth += width;
    if (i > 0) totalWidth += OSU_NOTE_LABEL_GAP;
  }
  let x = centerX - totalWidth / 2;
  ctx.globalAlpha = alpha;
  ctx.shadowColor = OSU_NOTE_LABEL_SHADOW;
  ctx.shadowBlur = 3;
  ctx.fillStyle = OSU_NOTE_LABEL_COLOR;
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const width = scratchLabelWidths[i] ?? 0;
    if (label === undefined) continue;
    ctx.fillText(label, x, centerY);
    x += width + OSU_NOTE_LABEL_GAP;
  }
  ctx.shadowBlur = 0;
};

export const drawOsuCircles = (
  ctx: CanvasRenderingContext2D,
  pool: OsuCircleSlot[],
  nowPhraseSec: number,
): void => {
  const nextCommandId = resolveNextOsuCircleCommandId(pool, nowPhraseSec);

  for (const slot of pool) {
    if (!slot.active || slot.dismissed) continue;

    const timing = computeOsuCircleTiming({
      nowPhraseSec,
      approachStartPhraseSec: slot.approachStartPhraseSec,
      judgedPhraseSec: slot.judgedPhraseSec,
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
