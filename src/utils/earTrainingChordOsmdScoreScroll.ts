export const OSMD_BATTLE_PLAYHEAD_PX = 120;

export interface OsmdMeasureBounds {
  left: number;
  right: number;
}

export interface OsmdMeasureJumpScrollInput {
  activeMeasureNumber: number;
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
  measureCentersByNumber: Readonly<Record<number, number>>;
  playheadPx: number;
  effectiveScale: number;
  scoreWidth: number;
  viewportWidth: number;
}

export interface OsmdMeasureJumpScrollResult {
  offsetPx: number;
  xPos: number;
}

export interface OsmdActiveMeasureHighlightInput {
  activeMeasureNumber: number;
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
  playheadPx: number;
  effectiveScale: number;
}

export interface OsmdActiveMeasureHighlightResult {
  leftPx: number;
  widthPx: number;
  visible: boolean;
}

const clamp = (value: number, min: number, max: number): number => (
  Math.max(min, Math.min(max, value))
);

/** 現在小節の左端（小節線付近）を固定プレイヘッド位置へ合わせるオフセット（小節更新時のみジャンプ）。 */
export const computeOsmdMeasureJumpScrollOffset = (
  input: OsmdMeasureJumpScrollInput,
): OsmdMeasureJumpScrollResult => {
  const {
    activeMeasureNumber,
    measureBoundsByNumber,
    measureCentersByNumber,
    playheadPx,
    effectiveScale,
    scoreWidth,
    viewportWidth,
  } = input;

  const measureNumber = Math.max(1, Math.floor(activeMeasureNumber));
  const bounds = measureBoundsByNumber[measureNumber] ?? measureBoundsByNumber[1];
  const xPos = bounds?.left
    ?? measureCentersByNumber[measureNumber]
    ?? measureCentersByNumber[1]
    ?? viewportWidth / 2;

  const maxOffset = Math.max(0, scoreWidth * effectiveScale - viewportWidth);
  const offsetPx = clamp(xPos * effectiveScale - playheadPx, 0, maxOffset);

  return { offsetPx, xPos };
};

/** 固定プレイヘッド位置から現在小節幅ぶんの半透明ハイライト矩形（小節更新時のみ再計算）。 */
export const computeOsmdActiveMeasureHighlight = (
  input: OsmdActiveMeasureHighlightInput,
): OsmdActiveMeasureHighlightResult => {
  const {
    activeMeasureNumber,
    measureBoundsByNumber,
    playheadPx,
    effectiveScale,
  } = input;

  const measureNumber = Math.max(1, Math.floor(activeMeasureNumber));
  const bounds = measureBoundsByNumber[measureNumber] ?? measureBoundsByNumber[1];
  if (!bounds) {
    return { leftPx: playheadPx, widthPx: 0, visible: false };
  }

  const measureWidth = bounds.right - bounds.left;
  if (!Number.isFinite(measureWidth) || measureWidth <= 0) {
    return { leftPx: playheadPx, widthPx: 0, visible: false };
  }

  return {
    leftPx: playheadPx,
    widthPx: measureWidth * effectiveScale,
    visible: true,
  };
};
