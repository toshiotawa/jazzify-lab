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

  it('uses fit scale by default', () => {
    const fit = computeCodeRunPixelScale(960, 300, 960, 528, 'fit');
    const cover = computeCodeRunPixelScale(960, 300, 960, 528, 'cover');
    expect(fit).toBe(0.5);
    expect(cover).toBe(1);
  });

  it('cover scale fills the shorter axis', () => {
    const cover = computeCodeRunPixelScale(480, 270, 960, 528, 'cover');
    expect(cover).toBeGreaterThan(0);
  });
});
