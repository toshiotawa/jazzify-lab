import {
  easeCubicOut,
  lerp,
  PARRY_MAX_RADIUS_PX,
} from './earTrainingBattleDrawState';

/** OSU! ヒット円の半径（px）。従来パリィ円の最大拡大半径 */
export const OSU_CIRCLE_INNER_RADIUS_PX = PARRY_MAX_RADIUS_PX;
/** OSU! アプローチ外円の開始半径（最大パリィ円より外側） */
export const OSU_CIRCLE_OUTER_START_RADIUS_PX = PARRY_MAX_RADIUS_PX * 2;
/** OSU! 円の線幅（px）。パリィリングより細く */
export const OSU_CIRCLE_LINE_WIDTH = 3;
/** 下からスライドイン完了までの approach 進行割合 */
export const OSU_CIRCLE_ENTER_FRACTION = 0.2;
/** ヒット位置より下の開始オフセット（px） */
export const OSU_CIRCLE_ENTER_OFFSET_PX = 48;
export const OSU_CIRCLE_INNER_STROKE = 'rgba(251, 146, 60, 0.9)';
export const OSU_CIRCLE_OUTER_STROKE = 'rgba(255, 255, 255, 0.85)';
/** アプローチ外円の中心線半径がこの値で内円外周と接する（OSU! 同様） */
export const getOsuCircleOverlapOuterRadiusPx = (): number =>
  OSU_CIRCLE_INNER_RADIUS_PX + OSU_CIRCLE_LINE_WIDTH;

export interface OsuApproachCirclePerfTiming {
  judgedMs: number;
  approachStartMs: number;
}

/** フレーズ時刻と calibration 済み judged から performance.now 基準の OSU! 円タイミングを算出 */
export const resolveOsuApproachCirclePerfTiming = (
  judgedPhraseTimeSec: number,
  phraseTimeSec: number,
  approachLeadSec: number,
  perfNowMs: number = performance.now(),
): OsuApproachCirclePerfTiming => {
  const judgedMs = perfNowMs + (judgedPhraseTimeSec - phraseTimeSec) * 1000;
  return {
    judgedMs,
    approachStartMs: judgedMs - approachLeadSec * 1000,
  };
};

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

  const overlapOuterRadiusPx = getOsuCircleOverlapOuterRadiusPx();

  if (nowMs >= judgedMs) {
    return {
      visible: true,
      phase: 'locked',
      centerX,
      centerY,
      innerRadius: OSU_CIRCLE_INNER_RADIUS_PX,
      outerRadius: overlapOuterRadiusPx,
    };
  }

  // 線形補間: 外円の内側がヒット円外周に触れる位置まで縮小
  const outerRadius = lerp(
    OSU_CIRCLE_OUTER_START_RADIUS_PX,
    overlapOuterRadiusPx,
    approachT,
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
