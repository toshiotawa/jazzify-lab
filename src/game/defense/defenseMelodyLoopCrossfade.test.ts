import { describe, expect, it } from 'vitest';

import { applyMelodyLoopCrossfade } from '@/game/defense/defenseMelodyLoopCrossfade';

describe('defenseMelodyLoopCrossfade', () => {
  it('does not force the first sample to silence', () => {
    const data = new Float32Array(4410).fill(0);
    data[0] = 0.8;
    data[data.length - 1] = 0.2;
    applyMelodyLoopCrossfade(data, 44100);
    expect(data[0]).toBeGreaterThan(0.1);
  });

  it('preserves a boundary transient after overlap processing', () => {
    const data = new Float32Array(4410).fill(0);
    const overlapFrames = Math.round(44100 * 0.015);
    data[0] = 0.9;
    data[1] = 0.7;
    data[data.length - overlapFrames] = 0.3;
    applyMelodyLoopCrossfade(data, 44100);
    expect(data[0]).toBeGreaterThan(0.2);
    expect(data[1]).toBeGreaterThan(0.05);
  });
});
