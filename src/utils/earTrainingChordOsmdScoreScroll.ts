export const OSMD_BATTLE_PLAYHEAD_PX = 120;
/** 追従スクロールでプレイヘッドを固定する画面左からの位置（iOS `precisionFollowPlayheadPx` と同一）。 */
export const OSMD_PRECISION_FOLLOW_PLAYHEAD_PX = 36;
/** 1 小節フィット時の最小縮小率（iOS `precisionMinFitScale` と同一）。 */
const OSMD_PRECISION_MIN_FIT_SCALE = 0.35;

export type EarTrainingOsmdScrollMode = 'measureJump' | 'continuousFollow';

export interface OsmdScrollLayout {
  /** プレイヘッド固定位置（画面左からの px）。0 のとき小節左端をビューポート左端に合わせる。 */
  playheadPx: number;
  /** true のとき小節の左端（小節線）をアンカーにする（false は音符左端を優先）。 */
  anchorToMeasureLeft: boolean;
  /** true のとき現在小節がビューポート幅に収まるよう effectiveScale を縮小する。 */
  fitActiveMeasureWidth: boolean;
  scrollMode: EarTrainingOsmdScrollMode;
}

/** リズムバトル既定（中央寄り・fit なし・小節ジャンプ）。 */
export const OSMD_SCROLL_LAYOUT_BATTLE_DEFAULT: OsmdScrollLayout = {
  playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
  anchorToMeasureLeft: false,
  fitActiveMeasureWidth: false,
  scrollMode: 'measureJump',
};

/** 精密モード・小節ジャンプ（左端アンカー・1 小節フィット）。 */
const OSMD_SCROLL_LAYOUT_PRECISION_JUMP: OsmdScrollLayout = {
  playheadPx: 0,
  anchorToMeasureLeft: true,
  fitActiveMeasureWidth: true,
  scrollMode: 'measureJump',
};

/** 精密モード・追従スクロール（プレイヘッド固定・fit なし）。 */
const OSMD_SCROLL_LAYOUT_PRECISION_FOLLOW: OsmdScrollLayout = {
  playheadPx: OSMD_PRECISION_FOLLOW_PLAYHEAD_PX,
  anchorToMeasureLeft: false,
  fitActiveMeasureWidth: false,
  scrollMode: 'continuousFollow',
};

export const resolveOsmdScrollLayout = (mode: EarTrainingOsmdScrollMode): OsmdScrollLayout => (
  mode === 'continuousFollow'
    ? OSMD_SCROLL_LAYOUT_PRECISION_FOLLOW
    : OSMD_SCROLL_LAYOUT_PRECISION_JUMP
);

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
  /** true のとき音符左端ではなく小節線（bounds.left）をアンカーにする。 */
  anchorToMeasureLeft?: boolean;
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
  anchorToMeasureLeft: boolean,
): number => {
  if (bounds) {
    if (anchorToMeasureLeft) {
      return bounds.left;
    }
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
    anchorToMeasureLeft = false,
  } = input;

  const measureNumber = Math.max(1, Math.floor(activeMeasureNumber));
  const bounds = measureBoundsByNumber[measureNumber] ?? measureBoundsByNumber[1];
  const xPos = resolveScrollAnchorX(
    bounds,
    measureCentersByNumber,
    measureNumber,
    viewportWidth,
    anchorToMeasureLeft,
  );

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

/** カウントイン中（phraseTimelineSec < 0）の小節 1 内プレイヘッド進捗 0..1。 */
export const computeOsmdCountInPlayheadProgress = (
  phraseTimelineSec: number,
  countInDurationSec: number,
): number => {
  if (phraseTimelineSec >= 0 || countInDurationSec <= 0) {
    return 0;
  }
  const progress = (phraseTimelineSec + countInDurationSec) / countInDurationSec;
  return Math.max(0, Math.min(1, progress));
};

/** 小節内プレイヘッド進捗 0..1（カウントイン／本編共通）。 */
export const computeOsmdMeasurePlayheadProgress = (input: {
  phraseTimelineSec: number;
  activeMeasureNumber: number;
  measureDurationSec: number;
  countInDurationSec: number;
}): number => {
  const {
    phraseTimelineSec,
    activeMeasureNumber,
    measureDurationSec,
    countInDurationSec,
  } = input;
  if (phraseTimelineSec < 0) {
    return computeOsmdCountInPlayheadProgress(phraseTimelineSec, countInDurationSec);
  }
  const safeMeasureDurationSec = Math.max(1e-6, measureDurationSec);
  const measureNumber = Math.max(1, Math.floor(activeMeasureNumber));
  const timeInMeasure = phraseTimelineSec - (measureNumber - 1) * safeMeasureDurationSec;
  return Math.max(0, Math.min(1, timeInMeasure / safeMeasureDurationSec));
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

/** 1 小節フィット時、現在小節がビューポート幅に収まるよう cssScale を縮小した実効スケール。 */
export const computeOsmdEffectiveScaleForMeasure = (input: {
  cssScale: number;
  bounds: OsmdMeasureBounds | undefined;
  viewportWidth: number;
  fitActiveMeasureWidth: boolean;
  minFitScale?: number;
}): number => {
  const {
    cssScale,
    bounds,
    viewportWidth,
    fitActiveMeasureWidth,
    minFitScale = OSMD_PRECISION_MIN_FIT_SCALE,
  } = input;
  if (!fitActiveMeasureWidth || !bounds) {
    return cssScale;
  }
  const measureWidth = bounds.right - bounds.left;
  if (!Number.isFinite(measureWidth) || measureWidth <= 0 || cssScale <= 0 || viewportWidth <= 0) {
    return cssScale;
  }
  const fitScale = viewportWidth / (measureWidth * cssScale);
  const clampedFit = Math.min(1, Math.max(minFitScale, fitScale));
  return cssScale * clampedFit;
};

/** phrase タイムライン秒 → 小節番号（1..maxMeasureNumber）と小節内進捗 0..1。 */
export const computeOsmdMeasureNumberAndProgress = (input: {
  phraseTimelineSec: number;
  measureDurationSec: number;
  maxMeasureNumber: number;
}): { measureNumber: number; progress: number } => {
  const safeDuration = Math.max(1e-6, input.measureDurationSec);
  const clampedTime = Math.max(0, input.phraseTimelineSec);
  const cappedMax = Math.max(1, Math.floor(input.maxMeasureNumber));
  const rawMeasure = Math.floor(clampedTime / safeDuration) + 1;
  const measureNumber = Math.min(cappedMax, Math.max(1, rawMeasure));
  const timeInMeasure = clampedTime - (measureNumber - 1) * safeDuration;
  const progress = Math.max(0, Math.min(1, timeInMeasure / safeDuration));
  return { measureNumber, progress };
};

/** 小節番号と進捗から譜面座標 X（scale 前）を算出する。 */
export const computeOsmdContinuousScoreX = (input: {
  measureNumber: number;
  progress: number;
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
}): number => {
  const bounds = input.measureBoundsByNumber[input.measureNumber]
    ?? input.measureBoundsByNumber[1];
  if (!bounds) {
    return 0;
  }
  const measureWidth = bounds.right - bounds.left;
  if (!Number.isFinite(measureWidth) || measureWidth <= 0) {
    return bounds.left;
  }
  const clampedProgress = Math.min(1, Math.max(0, input.progress));
  return bounds.left + clampedProgress * measureWidth;
};

export type OsmdContinuousFollowPhase = 'countIn' | 'scrolling' | 'tail';

export interface OsmdContinuousFollowScrollInput {
  phraseTimelineSec: number;
  measureDurationSec: number;
  countInDurationSec: number;
  maxMeasureNumber: number;
  measureBoundsByNumber: Readonly<Record<number, OsmdMeasureBounds>>;
  playheadPx: number;
  effectiveScale: number;
  scoreWidth: number;
  viewportWidth: number;
}

export interface OsmdContinuousFollowScrollResult {
  phase: OsmdContinuousFollowPhase;
  scrollOffsetPx: number;
  activeMeasureNumber: number;
  measureProgress: number;
  xPos: number;
  /** true のときプレイヘッドは playheadPx に固定（スクロール中）。false は譜面に追従して移動。 */
  playheadFixed: boolean;
}

/** 追従スクロール: カウントイン・中間・末尾の3フェーズで scroll / playhead を決定する（iOS と同一）。 */
export const computeOsmdContinuousFollowScroll = (
  input: OsmdContinuousFollowScrollInput,
): OsmdContinuousFollowScrollResult => {
  const maxOffset = Math.max(0, input.scoreWidth * input.effectiveScale - input.viewportWidth);

  if (input.phraseTimelineSec < 0 && input.countInDurationSec > 0) {
    const progress = computeOsmdCountInPlayheadProgress(
      input.phraseTimelineSec,
      input.countInDurationSec,
    );
    const bounds = input.measureBoundsByNumber[1];
    const xPos = bounds?.left ?? 0;
    return {
      phase: 'countIn',
      scrollOffsetPx: 0,
      activeMeasureNumber: 1,
      measureProgress: progress,
      xPos,
      playheadFixed: false,
    };
  }

  const { measureNumber, progress } = computeOsmdMeasureNumberAndProgress({
    phraseTimelineSec: input.phraseTimelineSec,
    measureDurationSec: input.measureDurationSec,
    maxMeasureNumber: input.maxMeasureNumber,
  });
  const xPos = computeOsmdContinuousScoreX({
    measureNumber,
    progress,
    measureBoundsByNumber: input.measureBoundsByNumber,
  });
  const rawOffset = xPos * input.effectiveScale - input.playheadPx;
  const clampedOffset = Math.min(Math.max(rawOffset, 0), maxOffset);

  if (clampedOffset < maxOffset - 0.001) {
    return {
      phase: 'scrolling',
      scrollOffsetPx: clampedOffset,
      activeMeasureNumber: measureNumber,
      measureProgress: progress,
      xPos,
      playheadFixed: true,
    };
  }

  return {
    phase: 'tail',
    scrollOffsetPx: maxOffset,
    activeMeasureNumber: measureNumber,
    measureProgress: progress,
    xPos,
    playheadFixed: false,
  };
};
