export const OSMD_BATTLE_PLAYHEAD_PX = 120;

export interface OsmdMeasureBounds {
  left: number;
  right: number;
  noteLeft?: number;
  noteRight?: number;
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
  scrollOffsetPx: number;
}

export interface OsmdActiveMeasureHighlightResult {
  leftPx: number;
  widthPx: number;
  visible: boolean;
}

const clamp = (value: number, min: number, max: number): number => (
  Math.max(min, Math.min(max, value))
);

const resolveScrollAnchorX = (
  bounds: OsmdMeasureBounds | undefined,
  measureCentersByNumber: Readonly<Record<number, number>>,
  measureNumber: number,
  viewportWidth: number,
): number => {
  if (bounds) {
    if (typeof bounds.noteLeft === 'number' && Number.isFinite(bounds.noteLeft)) {
      return bounds.noteLeft;
    }
    return bounds.left;
  }
  return measureCentersByNumber[measureNumber]
    ?? measureCentersByNumber[1]
    ?? viewportWidth / 2;
};

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
  const xPos = resolveScrollAnchorX(bounds, measureCentersByNumber, measureNumber, viewportWidth);

  const maxOffset = Math.max(0, scoreWidth * effectiveScale - viewportWidth);
  const offsetPx = clamp(xPos * effectiveScale - playheadPx, 0, maxOffset);

  return { offsetPx, xPos };
};

/** 手動スクロールの相対オフセットを、合成後オフセットが [0, maxOffset] に収まるようクランプする。 */
export const clampOsmdManualScrollOffset = (input: {
  baseOffsetPx: number;
  manualOffsetPx: number;
  scoreWidth: number;
  effectiveScale: number;
  viewportWidth: number;
}): number => {
  const maxOffset = Math.max(0, input.scoreWidth * input.effectiveScale - input.viewportWidth);
  return Math.min(Math.max(input.manualOffsetPx, -input.baseOffsetPx), maxOffset - input.baseOffsetPx);
};

/** スクロールオフセットを反映した画面上の小節ハイライト矩形（小節更新時のみ再計算）。 */
export const computeOsmdActiveMeasureHighlight = (
  input: OsmdActiveMeasureHighlightInput,
): OsmdActiveMeasureHighlightResult => {
  const {
    activeMeasureNumber,
    measureBoundsByNumber,
    playheadPx,
    effectiveScale,
    scrollOffsetPx,
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
    leftPx: bounds.left * effectiveScale - scrollOffsetPx,
    widthPx: measureWidth * effectiveScale,
    visible: true,
  };
};
