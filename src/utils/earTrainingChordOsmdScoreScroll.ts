export const OSMD_BATTLE_PLAYHEAD_PX = 120;

export interface OsmdMeasureBounds {
  left: number;
  right: number;
}

export interface OsmdMeasureJumpScrollInput {
  activeMeasureNumber: number;
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

const clamp = (value: number, min: number, max: number): number => (
  Math.max(min, Math.min(max, value))
);

/** 現在小節の中心を固定プレイヘッド位置へ合わせるオフセット（小節更新時のみジャンプ）。 */
export const computeOsmdMeasureJumpScrollOffset = (
  input: OsmdMeasureJumpScrollInput,
): OsmdMeasureJumpScrollResult => {
  const {
    activeMeasureNumber,
    measureCentersByNumber,
    playheadPx,
    effectiveScale,
    scoreWidth,
    viewportWidth,
  } = input;

  const measureNumber = Math.max(1, Math.floor(activeMeasureNumber));
  const xPos = measureCentersByNumber[measureNumber]
    ?? measureCentersByNumber[1]
    ?? viewportWidth / 2;

  const maxOffset = Math.max(0, scoreWidth * effectiveScale - viewportWidth);
  const offsetPx = clamp(xPos * effectiveScale - playheadPx, 0, maxOffset);

  return { offsetPx, xPos };
};
