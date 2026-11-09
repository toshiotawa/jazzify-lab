import { describe, expect, it, vi } from 'vitest';
import {
  applyPolyMidiMask,
  createPolyMidiGate,
  createPolyMidiMask,
  fillMaskFromEffeTuneLevels,
  fillMaskFromMidis,
  releasePolyMidiMask,
  stepPolyMidiGate,
  suppressWeakerNeighbors,
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
    levels[idx] = 0.5;
    fillMaskFromEffeTuneLevels(target, previous, levels, 21, 5);
    expect(target[60]).toBe(1);
    previous[60] = 0;
    fillMaskFromEffeTuneLevels(target, previous, levels, 21, 5);
    expect(target[60]).toBe(0);
  });
});

describe('suppressWeakerNeighbors', () => {
  it('隣より弱い半音を落とす', () => {
    const mask = createPolyMidiMask();
    const levels = new Float32Array(128);
    const drop = createPolyMidiMask();
    mask[64] = 1;
    mask[65] = 1;
    mask[67] = 1;
    levels[64] = 0.9;
    levels[65] = 0.72;
    levels[67] = 0.8;
    suppressWeakerNeighbors(mask, levels, drop);
    expect(mask[64]).toBe(1);
    expect(mask[65]).toBe(0);
    expect(mask[67]).toBe(1);
  });
});

describe('stepPolyMidiGate', () => {
  it('短い点滅では ON せず、消えてもすぐ OFF しない', () => {
    const gate = createPolyMidiGate();
    const detected = createPolyMidiMask();
    const on = vi.fn();
    const off = vi.fn();
    detected[60] = 1;
    stepPolyMidiGate(gate, detected, 1000, on, off, 45, 120);
    expect(on).not.toHaveBeenCalled();
    stepPolyMidiGate(gate, detected, 1046, on, off, 45, 120);
    expect(on).toHaveBeenCalledWith(60);
    detected[60] = 0;
    stepPolyMidiGate(gate, detected, 1100, on, off, 45, 120);
    expect(off).not.toHaveBeenCalled();
    stepPolyMidiGate(gate, detected, 1221, on, off, 45, 120);
    expect(off).toHaveBeenCalledWith(60);
  });
});
