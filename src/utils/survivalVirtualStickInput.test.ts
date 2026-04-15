import {
  SURVIVAL_STICK_DEAD_ZONE_FRACTION,
  computeAnalogFromOffset,
  smoothAnalogToward,
} from './survivalVirtualStickInput';

describe('computeAnalogFromOffset', () => {
  const maxR = 44;
  const dz = SURVIVAL_STICK_DEAD_ZONE_FRACTION;

  it('ゼロ距離では (0,0)', () => {
    expect(computeAnalogFromOffset(0, 0, maxR, dz)).toEqual({ x: 0, y: 0 });
  });

  it('maxRadius<=0 では (0,0)', () => {
    expect(computeAnalogFromOffset(10, 0, 0, dz)).toEqual({ x: 0, y: 0 });
  });

  it('デッドゾーン内では (0,0)', () => {
    const dead = maxR * dz;
    const v = computeAnalogFromOffset(dead * 0.5, 0, maxR, dz);
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('最大半径で強度1・方向正規化', () => {
    const v = computeAnalogFromOffset(0, maxR, maxR, dz);
    expect(v.x).toBeCloseTo(0, 5);
    expect(v.y).toBeCloseTo(1, 5);
  });

  it('斜めで単位方向に近い強度1', () => {
    const v = computeAnalogFromOffset(maxR, maxR, maxR, dz);
    const len = Math.hypot(v.x, v.y);
    expect(len).toBeCloseTo(1, 5);
    expect(v.x).toBeCloseTo(v.y, 5);
  });

  it('デッドゾーン外で中間強度', () => {
    const dead = maxR * dz;
    const mid = dead + (maxR - dead) * 0.5;
    const v = computeAnalogFromOffset(mid, 0, maxR, dz);
    expect(v.y).toBe(0);
    expect(v.x).toBeCloseTo(0.5, 5);
  });
});

describe('smoothAnalogToward', () => {
  it('目標に向かって補間する', () => {
    const cur = { x: 0, y: 0 };
    const tgt = { x: 1, y: 0 };
    const next = smoothAnalogToward(cur, tgt, 1 / 60, 60);
    expect(next.x).toBeGreaterThan(0);
    expect(next.x).toBeLessThanOrEqual(1);
    expect(next.y).toBe(0);
  });

  it('既に一致していればそのまま', () => {
    const v = { x: 0.3, y: -0.2 };
    expect(smoothAnalogToward(v, v, 0.016, 16)).toEqual(v);
  });
});
