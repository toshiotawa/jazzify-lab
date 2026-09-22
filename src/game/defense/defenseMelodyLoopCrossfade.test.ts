import { describe, expect, it } from 'vitest';

import { applyMelodyLoopCrossfade } from '@/game/defense/defenseMelodyLoopCrossfade';

describe('defenseMelodyLoopCrossfade', () => {
  it('preserves head attack unchanged', () => {
    const data = new Float32Array(4410).fill(0);
    data[0] = 0.8;
    data[1] = 0.6;
    applyMelodyLoopCrossfade(data, 44100);
    expect(data[0]).toBeCloseTo(0.8, 5);
    expect(data[1]).toBeCloseTo(0.6, 5);
  });

  it('preserves silent tail unchanged', () => {
    const data = new Float32Array(4410).fill(0);
    data[0] = 0.9;
    const overlapFrames = Math.round(44100 * 0.015);
    for (let index = data.length - overlapFrames; index < data.length; index += 1) {
      data[index] = 0;
    }
    applyMelodyLoopCrossfade(data, 44100);
    expect(data[0]).toBeCloseTo(0.9, 5);
    for (let index = data.length - overlapFrames; index < data.length; index += 1) {
      expect(data[index]).toBe(0);
    }
  });

  it('preserves interior samples unchanged', () => {
    const data = new Float32Array(4410).fill(0.75);
    applyMelodyLoopCrossfade(data, 44100);
    expect(data[2205]).toBe(0.75);
  });
});
