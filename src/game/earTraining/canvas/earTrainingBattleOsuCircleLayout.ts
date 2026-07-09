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
