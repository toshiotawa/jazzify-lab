import {
  computeXPositionFromTimeMapping,
  type TimeMappingEntry
} from '../timeMappingScroll';

describe('computeXPositionFromTimeMapping', () => {
  const mapping: TimeMappingEntry[] = [
    { timeMs: 0, xPosition: 0 },
    { timeMs: 1000, xPosition: 100 },
    { timeMs: 2000, xPosition: 250 }
  ];
  const loopMs = 4000;
  const sw = 500;

  it('returns 0 before first marker', () => {
    expect(computeXPositionFromTimeMapping(mapping, -100, loopMs, sw)).toBe(0);
    expect(computeXPositionFromTimeMapping(mapping, -0.001, loopMs, sw)).toBe(0);
  });

  it('interpolates within a segment (binary path)', () => {
    expect(computeXPositionFromTimeMapping(mapping, 500, loopMs, sw)).toBe(50);
    expect(computeXPositionFromTimeMapping(mapping, 1500, loopMs, sw)).toBe(175);
  });

  it('extrapolates after last marker toward sheet width', () => {
    expect(computeXPositionFromTimeMapping(mapping, 3000, loopMs, sw)).toBe(375);
  });

  it('returns last x when no remaining time after last marker', () => {
    const m: TimeMappingEntry[] = [
      { timeMs: 0, xPosition: 10 },
      { timeMs: 1000, xPosition: 200 }
    ];
    expect(computeXPositionFromTimeMapping(m, 1500, 1000, sw)).toBe(200);
  });

  it('handles single-point mapping', () => {
    const one: TimeMappingEntry[] = [{ timeMs: 500, xPosition: 50 }];
    expect(computeXPositionFromTimeMapping(one, 400, loopMs, sw)).toBe(0);
    expect(computeXPositionFromTimeMapping(one, 2500, loopMs, sw)).toBeCloseTo(50 + (2000 / 3500) * (sw - 50), 5);
  });

  it('returns 0 for empty mapping', () => {
    expect(computeXPositionFromTimeMapping([], 0, loopMs, sw)).toBe(0);
  });
});
