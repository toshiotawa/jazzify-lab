const QUOTE_BUBBLE_SCREEN_MARGIN_PX = 12;
const QUOTE_BUBBLE_MIN_OUTER_PX = 96;
const QUOTE_BUBBLE_MAX_OUTER_PX = 480;
const QUOTE_BUBBLE_MAX_SCENE_WIDTH_RATIO = 0.72;

export const DIALOGUE_QUOTE_FONT_PX = 26;
export const DIALOGUE_QUOTE_TARGET_FULLWIDTH_CHARS = 15;
export const DIALOGUE_QUOTE_HORIZONTAL_PADDING_PX = 32;
export const DIALOGUE_QUOTE_TAIL_ANCHOR_OFFSET_PX = 24;

export type DialogueQuoteBubbleAlign = 'left' | 'right';

export interface DialogueQuoteBubbleLayout {
  anchorLeftPx?: number;
  anchorRightPx?: number;
  maxWidthPx: number;
}

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

const dialogueQuoteTargetOuterPx = (): number =>
  DIALOGUE_QUOTE_TARGET_FULLWIDTH_CHARS * DIALOGUE_QUOTE_FONT_PX
  + DIALOGUE_QUOTE_HORIZONTAL_PADDING_PX;

const dialogueQuoteMinOuterPx = (): number =>
  DIALOGUE_QUOTE_FONT_PX * 5 + DIALOGUE_QUOTE_HORIZONTAL_PADDING_PX;

/**
 * 会話 UI 用: 左右端の話者は中央方向へ広げ、最大で全角15文字相当まで入る。
 * 画面端からはみ出さないよう anchor と maxWidth を非対称に算出する。
 */
export const computeDialogueQuoteBubbleLayout = (
  sceneWidthPx: number,
  charCenterXPx: number,
  align: DialogueQuoteBubbleAlign,
): DialogueQuoteBubbleLayout => {
  const sceneW = Math.max(320, sceneWidthPx);
  const margin = QUOTE_BUBBLE_SCREEN_MARGIN_PX;
  const targetOuter = dialogueQuoteTargetOuterPx();
  const minOuter = dialogueQuoteMinOuterPx();

  if (align === 'left') {
    const anchorLeft = Math.max(margin, charCenterXPx - DIALOGUE_QUOTE_TAIL_ANCHOR_OFFSET_PX);
    const maxWidth = Math.min(targetOuter, sceneW - margin - anchorLeft);
    return {
      anchorLeftPx: anchorLeft,
      maxWidthPx: Math.max(minOuter, maxWidth),
    };
  }

  const anchorRight = Math.max(
    margin,
    sceneW - charCenterXPx - DIALOGUE_QUOTE_TAIL_ANCHOR_OFFSET_PX,
  );
  const maxWidth = Math.min(targetOuter, sceneW - margin - anchorRight);
  return {
    anchorRightPx: anchorRight,
    maxWidthPx: Math.max(minOuter, maxWidth),
  };
};
