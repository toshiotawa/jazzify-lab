import {
  computeDialogueQuoteBubbleLayout,
  computeQuoteBubbleMaxOuterWidth,
  DIALOGUE_QUOTE_FONT_PX,
  DIALOGUE_QUOTE_HORIZONTAL_PADDING_PX,
  DIALOGUE_QUOTE_TARGET_FULLWIDTH_CHARS,
} from './computeQuoteBubbleMaxOuterWidth';

describe('computeQuoteBubbleMaxOuterWidth', () => {
  it('画面端に近い話者でも最小幅を下回らない', () => {
    expect(computeQuoteBubbleMaxOuterWidth(390, 48)).toBeGreaterThanOrEqual(96);
  });

  it('中央寄りの話者では scene 幅の 72% 上限まで広がる', () => {
    expect(computeQuoteBubbleMaxOuterWidth(800, 400)).toBe(480);
  });

  it('左端の話者は右側余白に合わせて幅が決まる', () => {
    const width = computeQuoteBubbleMaxOuterWidth(800, 184);
    expect(width).toBe(344);
  });
});

describe('computeDialogueQuoteBubbleLayout', () => {
  const targetOuter =
    DIALOGUE_QUOTE_TARGET_FULLWIDTH_CHARS * DIALOGUE_QUOTE_FONT_PX
    + DIALOGUE_QUOTE_HORIZONTAL_PADDING_PX;

  it('右端のジャ爺は中央方向へ広がり、対称計算より大幅に広い', () => {
    const partnerCenterX = 299;
    const symmetric = computeQuoteBubbleMaxOuterWidth(390, partnerCenterX);
    const layout = computeDialogueQuoteBubbleLayout(390, partnerCenterX, 'right');

    expect(layout.maxWidthPx).toBeGreaterThan(symmetric);
    expect(layout.anchorRightPx).toBeGreaterThan(0);
    expect(layout.maxWidthPx + (layout.anchorRightPx ?? 0)).toBeLessThanOrEqual(390 - 12);
  });

  it('左端のファイも中央方向へ広がり、全角15文字相当まで確保できる', () => {
    const layout = computeDialogueQuoteBubbleLayout(800, 184, 'left');

    expect(layout.maxWidthPx).toBe(targetOuter);
    expect((layout.anchorLeftPx ?? 0) + layout.maxWidthPx).toBeLessThanOrEqual(800 - 12);
  });

  it('狭い画面では端からはみ出さず、15文字相当より狭くなる', () => {
    const layout = computeDialogueQuoteBubbleLayout(390, 91, 'left');

    expect(layout.maxWidthPx).toBeLessThan(targetOuter);
    expect((layout.anchorLeftPx ?? 0) + layout.maxWidthPx).toBeLessThanOrEqual(390 - 12);
    expect(layout.maxWidthPx - DIALOGUE_QUOTE_HORIZONTAL_PADDING_PX)
      .toBeGreaterThan(DIALOGUE_QUOTE_FONT_PX * 8);
  });
});
