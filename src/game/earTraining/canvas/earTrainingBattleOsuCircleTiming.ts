import {
  easeCubicOut,
  lerp,
  PARRY_MERGE_RADIUS_PX,
  PARRY_RING_LINE_WIDTH,
} from './earTrainingBattleDrawState';

/** OSU! ヒット円の半径（px） */
export const OSU_CIRCLE_INNER_RADIUS_PX = PARRY_MERGE_RADIUS_PX;
/** OSU! アプローチ外円の開始半径（内円の 2 倍） */
export const OSU_CIRCLE_OUTER_START_RADIUS_PX = OSU_CIRCLE_INNER_RADIUS_PX * 2;
/** 下からスライドイン完了までの approach 進行割合 */
export const OSU_CIRCLE_ENTER_FRACTION = 0.2;
/** ヒット位置より下の開始オフセット（px） */
export const OSU_CIRCLE_ENTER_OFFSET_PX = 48;
export const OSU_CIRCLE_INNER_STROKE = 'rgba(251, 146, 60, 0.9)';
export const OSU_CIRCLE_OUTER_STROKE = 'rgba(255, 255, 255, 0.85)';
export const OSU_CIRCLE_LINE_WIDTH = PARRY_RING_LINE_WIDTH;

export type OsuCirclePhase = 'hidden' | 'approach' | 'locked' | 'burst' | 'dismissed';

export interface OsuCircleTimingInput {
  nowMs: number;
  approachStartMs: number;
  judgedMs: number;
  centerX: number;
  targetY: number;
  burstAtMs?: number;
  dismissed?: boolean;
}

export interface OsuCircleTimingState {
  visible: boolean;
  phase: OsuCirclePhase;
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const computeOsuCircleTiming = (input: OsuCircleTimingInput): OsuCircleTimingState => {
  const {
    nowMs,
    approachStartMs,
    judgedMs,
    centerX,
    targetY,
    burstAtMs,
    dismissed = false,
  } = input;

  if (dismissed) {
    return {
      visible: false,
      phase: 'dismissed',
      centerX,
      centerY: targetY,
      innerRadius: OSU_CIRCLE_INNER_RADIUS_PX,
      outerRadius: OSU_CIRCLE_INNER_RADIUS_PX,
    };
  }

  if (burstAtMs !== undefined && nowMs >= burstAtMs) {
    return {
      visible: false,
      phase: 'burst',
      centerX,
      centerY: targetY,
      innerRadius: OSU_CIRCLE_INNER_RADIUS_PX,
      outerRadius: OSU_CIRCLE_INNER_RADIUS_PX,
    };
  }

  if (nowMs < approachStartMs) {
    return {
      visible: false,
      phase: 'hidden',
      centerX,
      centerY: targetY,
      innerRadius: OSU_CIRCLE_INNER_RADIUS_PX,
      outerRadius: OSU_CIRCLE_OUTER_START_RADIUS_PX,
    };
  }

  const beatMs = judgedMs - approachStartMs;
  const approachT = beatMs > 0
    ? clamp01((nowMs - approachStartMs) / beatMs)
    : 1;
  const enterT = clamp01(approachT / OSU_CIRCLE_ENTER_FRACTION);
  const centerY = lerp(
    targetY + OSU_CIRCLE_ENTER_OFFSET_PX,
    targetY,
    easeCubicOut(enterT),
  );

  if (nowMs >= judgedMs) {
    return {
      visible: true,
      phase: 'locked',
      centerX,
      centerY,
      innerRadius: OSU_CIRCLE_INNER_RADIUS_PX,
      outerRadius: OSU_CIRCLE_INNER_RADIUS_PX,
    };
  }

  const outerRadius = lerp(
    OSU_CIRCLE_OUTER_START_RADIUS_PX,
    OSU_CIRCLE_INNER_RADIUS_PX,
    easeCubicOut(approachT),
  );

  return {
    visible: true,
    phase: 'approach',
    centerX,
    centerY,
    innerRadius: OSU_CIRCLE_INNER_RADIUS_PX,
    outerRadius,
  };
};
