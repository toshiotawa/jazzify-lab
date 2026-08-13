/** OSMD タイミング調整の下限（ms） */
export const OSMD_TIMING_ADJUSTMENT_MS_MIN = -300;

/** OSMD タイミング調整の上限（ms） */
export const OSMD_TIMING_ADJUSTMENT_MS_MAX = 300;

/** OSMD タイミング調整の刻み（ms） */
export const OSMD_TIMING_ADJUSTMENT_MS_STEP = 10;

/** OSMD タイミング調整のデフォルト（ms）。正本時刻統一後は 0（デバイス／聴感用のみ）。 */
export const OSMD_TIMING_ADJUSTMENT_MS_DEFAULT = 0;

export const EAR_TRAINING_OSMD_TIMING_ADJUSTMENT_STORAGE_KEY =
  'earTraining.osmd.timingAdjustmentMs';

export const clampEarTrainingOsmdTimingAdjustmentMs = (ms: number): number => {
  const clamped = Math.max(
    OSMD_TIMING_ADJUSTMENT_MS_MIN,
    Math.min(OSMD_TIMING_ADJUSTMENT_MS_MAX, Math.trunc(ms)),
  );
  const rounded = Math.round(clamped / OSMD_TIMING_ADJUSTMENT_MS_STEP)
    * OSMD_TIMING_ADJUSTMENT_MS_STEP;
  return Math.max(
    OSMD_TIMING_ADJUSTMENT_MS_MIN,
    Math.min(OSMD_TIMING_ADJUSTMENT_MS_MAX, rounded),
  );
};

export const timingAdjustmentMsToSec = (ms: number): number =>
  clampEarTrainingOsmdTimingAdjustmentMs(ms) / 1000;

/** 練習速度適用後の targetTime にユーザー調整を加算 */
export const resolveOsmdCalibratedTargetTimeSec = (
  speedScaledTargetTimeSec: number,
  timingAdjustmentMs: number,
): number => speedScaledTargetTimeSec + timingAdjustmentMsToSec(timingAdjustmentMs);

/**
 * 譜面プレイヘッド用タイムライン。判定より早い音声時刻から調整分を引き、
 * プレイヘッドが判定タイミングと同じ音符位置に来るようにする。
 */
export const resolveOsmdPlayheadTimelineSec = (
  phraseTimelineSec: number,
  timingAdjustmentMs: number,
): number => phraseTimelineSec - timingAdjustmentMsToSec(timingAdjustmentMs);

export const formatEarTrainingOsmdTimingAdjustmentLabel = (ms: number): string => {
  const clamped = clampEarTrainingOsmdTimingAdjustmentMs(ms);
  if (clamped > 0) {
    return `+${clamped}ms`;
  }
  return `${clamped}ms`;
};

export const loadEarTrainingOsmdTimingAdjustmentMs = (): number => {
  if (typeof window === 'undefined') {
    return OSMD_TIMING_ADJUSTMENT_MS_DEFAULT;
  }
  try {
    const raw = window.localStorage.getItem(EAR_TRAINING_OSMD_TIMING_ADJUSTMENT_STORAGE_KEY);
    if (raw === null) {
      return OSMD_TIMING_ADJUSTMENT_MS_DEFAULT;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      return OSMD_TIMING_ADJUSTMENT_MS_DEFAULT;
    }
    return clampEarTrainingOsmdTimingAdjustmentMs(parsed);
  } catch {
    return OSMD_TIMING_ADJUSTMENT_MS_DEFAULT;
  }
};

export const saveEarTrainingOsmdTimingAdjustmentMs = (ms: number): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(
      EAR_TRAINING_OSMD_TIMING_ADJUSTMENT_STORAGE_KEY,
      String(clampEarTrainingOsmdTimingAdjustmentMs(ms)),
    );
  } catch {
    // ignore quota / private mode
  }
};
