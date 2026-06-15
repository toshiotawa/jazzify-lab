export const OSMD_BATTLE_PLAYHEAD_PX = 120;

export interface OsmdMeasureBounds {
  left: number;
  right: number;
}

export interface OsmdScoreScrollInput {
  phraseTimeSec: number;
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
  measureCentersByNumber: Readonly<Record<number, number>>;
  measureDurationSec: number;
  maxMeasure: number;
  playheadPx: number;
  effectiveScale: number;
  scoreWidth: number;
  viewportWidth: number;
}

export interface OsmdScoreScrollResult {
  offsetPx: number;
  activeMeasureNumber: number;
  xPos: number;
}

const clamp = (value: number, min: number, max: number): number => (
  Math.max(min, Math.min(max, value))
);

const resolveActiveMeasureNumber = (
  phraseTimeSec: number,
  measureDurationSec: number,
  maxMeasure: number,
): number => {
  if (measureDurationSec <= 0) {
    return 1;
  }
  const rawMeasure = Math.floor(Math.max(0, phraseTimeSec) / measureDurationSec) + 1;
  return clamp(rawMeasure, 1, Math.max(1, maxMeasure));
};

const resolveMeasureX = (
  activeMeasureNumber: number,
  timeInMeasure: number,
  measureDurationSec: number,
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>,
  measureCentersByNumber: Readonly<Record<number, number>>,
  viewportWidth: number,
): number => {
  const bounds = measureBoundsByNumber[activeMeasureNumber]
    ?? measureBoundsByNumber[1];
  if (bounds && measureDurationSec > 0) {
    const t = clamp(timeInMeasure / measureDurationSec, 0, 1);
    return bounds.left + t * (bounds.right - bounds.left);
  }

  const center = measureCentersByNumber[activeMeasureNumber]
    ?? measureCentersByNumber[1]
    ?? viewportWidth / 2;
  return center;
};

export const computeOsmdScoreScrollOffset = (input: OsmdScoreScrollInput): OsmdScoreScrollResult => {
  const {
    phraseTimeSec,
    measureBoundsByNumber,
    measureCentersByNumber,
    measureDurationSec,
    maxMeasure,
    playheadPx,
    effectiveScale,
    scoreWidth,
    viewportWidth,
  } = input;

  const safeMaxMeasure = Math.max(1, maxMeasure);
  const activeMeasureNumber = phraseTimeSec < 0
    ? 1
    : resolveActiveMeasureNumber(phraseTimeSec, measureDurationSec, safeMaxMeasure);
  const timeInMeasure = phraseTimeSec < 0
    ? 0
    : Math.max(0, phraseTimeSec - (activeMeasureNumber - 1) * measureDurationSec);

  const xPos = resolveMeasureX(
    activeMeasureNumber,
    timeInMeasure,
    measureDurationSec,
    measureBoundsByNumber,
    measureCentersByNumber,
    viewportWidth,
  );

  const maxOffset = Math.max(0, scoreWidth * effectiveScale - viewportWidth);
  const offsetPx = clamp(xPos * effectiveScale - playheadPx, 0, maxOffset);

  return {
    offsetPx,
    activeMeasureNumber,
    xPos,
  };
};
