import { computeQuoteBubbleMaxOuterWidth } from './computeQuoteBubbleMaxOuterWidth';

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
