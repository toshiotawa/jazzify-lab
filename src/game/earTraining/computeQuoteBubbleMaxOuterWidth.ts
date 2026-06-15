const QUOTE_BUBBLE_SCREEN_MARGIN_PX = 12;
const QUOTE_BUBBLE_MIN_OUTER_PX = 96;
const QUOTE_BUBBLE_MAX_OUTER_PX = 480;
const QUOTE_BUBBLE_MAX_SCENE_WIDTH_RATIO = 0.72;

/** 話者キャラの水平位置から吹き出しの最大外幅（px）を算出。Phaser / DOM 会話 UI 共通。 */
export const computeQuoteBubbleMaxOuterWidth = (
  sceneWidthPx: number,
  charCenterXPx: number,
): number => {
  const sceneW = Math.max(320, sceneWidthPx);
  const margin = QUOTE_BUBBLE_SCREEN_MARGIN_PX;
  const fit = 2 * Math.max(
    QUOTE_BUBBLE_MIN_OUTER_PX,
    Math.min(charCenterXPx, sceneW - charCenterXPx) - margin,
  );
  return Math.min(sceneW * QUOTE_BUBBLE_MAX_SCENE_WIDTH_RATIO, QUOTE_BUBBLE_MAX_OUTER_PX, fit);
};
