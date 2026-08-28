import {
  computeCodeRunKeyboardHeight,
  computeCodeRunPixelScale,
  computeCodeRunVisibleCameraAxis,
} from '@/utils/codeRunLayout';

describe('codeRunLayout', () => {
  it('computes keyboard height within bounds', () => {
    expect(computeCodeRunKeyboardHeight(400)).toBe(76);
    expect(computeCodeRunKeyboardHeight(1000)).toBe(96);
    expect(computeCodeRunKeyboardHeight(800)).toBe(88);
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

  it('applies optional scale factor for mobile zoom-out', () => {
    const base = computeCodeRunPixelScale(480, 640, 960, 528, 'cover');
    const zoomed = computeCodeRunPixelScale(480, 640, 960, 528, 'cover', 0.8);
    expect(zoomed).toBeLessThan(base);
    expect(zoomed / base).toBeCloseTo(0.8, 1);
  });

  describe('computeCodeRunVisibleCameraAxis', () => {
    const VIEW = 960;
    const WORLD = 4800;
    const VISIBLE = 384;

    /** 見えている範囲の左端がワールドのどこかを返す。 */
    const visibleLeft = (camera: number): number => camera + (VIEW - VISIBLE) / 2;

    it('keeps the engine camera when the whole view is visible', () => {
      expect(computeCodeRunVisibleCameraAxis(720, 1000, VIEW, VIEW, WORLD)).toBe(720);
      expect(computeCodeRunVisibleCameraAxis(720, 1000, 1200, VIEW, WORLD)).toBe(720);
    });

    it('centers the player inside the cropped view', () => {
      const camera = computeCodeRunVisibleCameraAxis(0, 1000, VISIBLE, VIEW, WORLD);
      expect(visibleLeft(camera)).toBe(1000 - VISIBLE / 2);
    });

    it('follows the player where the engine camera is still clamped at 0', () => {
      const near = computeCodeRunVisibleCameraAxis(0, 300, VISIBLE, VIEW, WORLD);
      const far = computeCodeRunVisibleCameraAxis(0, 420, VISIBLE, VIEW, WORLD);
      expect(far).toBeGreaterThan(near);
    });

    it('does not scroll past the world edges', () => {
      const atStart = computeCodeRunVisibleCameraAxis(0, 20, VISIBLE, VIEW, WORLD);
      expect(visibleLeft(atStart)).toBe(0);

      const atEnd = computeCodeRunVisibleCameraAxis(0, WORLD - 10, VISIBLE, VIEW, WORLD);
      expect(visibleLeft(atEnd) + VISIBLE).toBe(WORLD);
    });

    it('clamps to the world start when the world is narrower than the visible area', () => {
      const camera = computeCodeRunVisibleCameraAxis(0, 100, VISIBLE, VIEW, 200);
      expect(visibleLeft(camera)).toBe(0);
    });
  });
});
