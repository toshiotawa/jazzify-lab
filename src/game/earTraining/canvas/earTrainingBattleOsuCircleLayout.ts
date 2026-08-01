/** 同一胸元への重なりを避ける決定論的オフセット（フレーズ内 index 固定） */

export interface OsuCircleAnchorOffset {
  offsetX: number;
  offsetY: number;
}

const LAYOUT_PATTERN: readonly OsuCircleAnchorOffset[] = [
  { offsetX: 0, offsetY: 0 },
  { offsetX: -22, offsetY: -10 },
  { offsetX: 22, offsetY: -10 },
  { offsetX: -14, offsetY: 14 },
  { offsetX: 14, offsetY: 14 },
  { offsetX: -28, offsetY: 0 },
  { offsetX: 28, offsetY: 0 },
  { offsetX: 0, offsetY: -18 },
];

/** Canvas Y 下向き。鍵盤に隠れないよう targetY の上限（下端方向）を抑える。 */
export const clampOsuCircleTargetYAbovePiano = (
  targetY: number,
  viewportHeight: number,
  pianoOverlayHeight: number,
  minClearanceAbovePiano: number,
): number => {
  if (!(viewportHeight > 0) || !(pianoOverlayHeight >= 0) || !(minClearanceAbovePiano >= 0)) {
    return targetY;
  }
  const maxY = viewportHeight - pianoOverlayHeight - minClearanceAbovePiano;
  if (!(maxY > 0)) {
    return targetY;
  }
  return Math.min(targetY, maxY);
};

export const resolveOsuCircleAnchorOffset = (layoutIndex: number): OsuCircleAnchorOffset => {
  const safeIndex = Math.max(0, Math.floor(layoutIndex));
  return LAYOUT_PATTERN[safeIndex % LAYOUT_PATTERN.length];
};

export const applyOsuCircleAnchorOffset = (
  centerX: number,
  targetY: number,
  layoutIndex: number,
): { centerX: number; targetY: number } => {
  const offset = resolveOsuCircleAnchorOffset(layoutIndex);
  return {
    centerX: centerX + offset.offsetX,
    targetY: targetY + offset.offsetY,
  };
};
