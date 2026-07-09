/** フレーズ区間ごとに循環するパステル系 OSU! 円色（4 パターン） */
export const OSU_CIRCLE_PASTEL_COLORS = [
  '#f9a8d4',
  '#93c5fd',
  '#86efac',
  '#d8b4fe',
] as const;

export const OSU_CIRCLE_COLOR_PATTERN_COUNT = OSU_CIRCLE_PASTEL_COLORS.length;

/** アプローチ外円の不透明度（内円は不透明・同色） */
export const OSU_CIRCLE_OUTER_STROKE_ALPHA = 0.55;

/** アプローチ外円は内円より細く */
export const OSU_CIRCLE_OUTER_LINE_WIDTH = 2;

const clampPositiveInt = (value: number): number => (
  Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1
);

/**
 * ループ内の小節位置から色 index を決定する。
 * phraseSectionMeasures=1 なら 1 小節ごとに色が変わる。
 */
export const resolveOsuCircleColorIndex = (
  measureNumber: number,
  loopMeasures: number,
  phraseSectionMeasures = 1,
): number => {
  const safeLoop = clampPositiveInt(loopMeasures);
  const safeSection = clampPositiveInt(phraseSectionMeasures);
  const measureInLoop = (Math.max(1, Math.trunc(measureNumber)) - 1) % safeLoop;
  const sectionIndex = Math.floor(measureInLoop / safeSection);
  return sectionIndex % OSU_CIRCLE_COLOR_PATTERN_COUNT;
};

export const getOsuCircleInnerStroke = (colorIndex: number): string => {
  const index = ((colorIndex % OSU_CIRCLE_COLOR_PATTERN_COUNT) + OSU_CIRCLE_COLOR_PATTERN_COUNT)
    % OSU_CIRCLE_COLOR_PATTERN_COUNT;
  return OSU_CIRCLE_PASTEL_COLORS[index];
};

export const getOsuCircleOuterStroke = (colorIndex: number): string => {
  const hex = getOsuCircleInnerStroke(colorIndex);
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${OSU_CIRCLE_OUTER_STROKE_ALPHA})`;
};
