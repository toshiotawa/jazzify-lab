import {
  computeCodeRunKeyboardHeight,
  computeCodeRunPixelScale,
} from '@/utils/codeRunLayout';

describe('codeRunLayout', () => {
  it('computes keyboard height within bounds', () => {
    expect(computeCodeRunKeyboardHeight(400)).toBe(150);
    expect(computeCodeRunKeyboardHeight(1000)).toBe(190);
    expect(computeCodeRunKeyboardHeight(800)).toBe(176);
  });

  it('fit scale never overflows the container', () => {
    const fit = computeCodeRunPixelScale(960, 300, 960, 528, 'fit');
    expect(fit).toBeLessThanOrEqual(300 / 528);
    expect(960 * fit).toBeLessThanOrEqual(960);
    expect(528 * fit).toBeLessThanOrEqual(300);
  });

  it('fit scale leaves little empty space on the limiting axis', () => {
    // 853x632 は en-blog の埋め込み（横長マップ）想定サイズ
    const fit = computeCodeRunPixelScale(853, 632, 960, 528, 'fit');
    expect(960 * fit).toBeGreaterThan(853 * 0.95);
  });

  it('cover scale fills both axes', () => {
    const cover = computeCodeRunPixelScale(480, 640, 960, 528, 'cover');
    expect(960 * cover).toBeGreaterThanOrEqual(480);
    expect(528 * cover).toBeGreaterThanOrEqual(640 * 0.95);
  });

  it('cover is never smaller than fit', () => {
    const fit = computeCodeRunPixelScale(853, 632, 960, 528, 'fit');
    const cover = computeCodeRunPixelScale(853, 632, 960, 528, 'cover');
    expect(cover).toBeGreaterThanOrEqual(fit);
  });
});
