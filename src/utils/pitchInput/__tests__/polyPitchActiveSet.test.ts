import { describe, expect, it, vi } from 'vitest';
import {
  applyPolyMidiMask,
  createPolyMidiMask,
  fillMaskFromEffeTuneLevels,
  fillMaskFromMidis,
  releasePolyMidiMask,
} from '../polyPitchActiveSet';

describe('applyPolyMidiMask', () => {
  it('新しく鳴った音だけ ON し、消えた音だけ OFF する', () => {
    const mask = createPolyMidiMask();
    const next = createPolyMidiMask();
    const on = vi.fn();
    const off = vi.fn();
    fillMaskFromMidis(next, [60, 64]);
    applyPolyMidiMask(mask, next, on, off);
    expect(on.mock.calls.map((c) => c[0])).toEqual([60, 64]);
    expect(off).not.toHaveBeenCalled();

    fillMaskFromMidis(next, [64, 67]);
    applyPolyMidiMask(mask, next, on, off);
    expect(off).toHaveBeenCalledWith(60);
    expect(on).toHaveBeenCalledWith(67);
  });

  it('release はオンの鍵をすべて OFF する', () => {
    const mask = createPolyMidiMask();
    mask[60] = 1;
    const off = vi.fn();
    releasePolyMidiMask(mask, off);
    expect(off).toHaveBeenCalledWith(60);
    expect(mask[60]).toBe(0);
  });
});

describe('fillMaskFromEffeTuneLevels', () => {
  it('オン中の鍵はオフ閾値まで維持する', () => {
    const previous = createPolyMidiMask();
    previous[60] = 1;
    const target = createPolyMidiMask();
    const levels = new Float32Array(440);
    const idx = 2 + (60 - 21) * 5;
    levels[idx] = 0.4;
    fillMaskFromEffeTuneLevels(target, previous, levels, 21, 5);
    expect(target[60]).toBe(1);
    previous[60] = 0;
    fillMaskFromEffeTuneLevels(target, previous, levels, 21, 5);
    expect(target[60]).toBe(0);
  });
});
