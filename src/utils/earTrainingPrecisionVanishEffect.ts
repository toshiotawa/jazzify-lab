export interface VanishEffectRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const computePrecisionVanishEffectCenter = (
  rect: VanishEffectRect,
  isShortNote: boolean,
): { cx: number; cy: number } => {
  const cx = rect.x + rect.width * 0.5;
  const cy = isShortNote
    ? rect.y + rect.height * 0.5
    : rect.y + Math.min(8, rect.height * 0.12);
  return { cx, cy };
};
