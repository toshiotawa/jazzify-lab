import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_POLY_ONSET_CONFIG,
  createPolyMidiMask,
  createPolyOnsetTracker,
  fillLevelsFromEffeTune,
  releasePolyMidiMask,
  resetPolyOnsetTracker,
  stepPolyOnsetTracker,
} from '../polyPitchActiveSet';

const PITCH_PLEASE_THR = { on: 0.7, off: 0.42 };

const stubLevels = (entries: readonly (readonly [number, number])[]): Float32Array => {
  const levels = new Float32Array(128);
  for (const [midi, level] of entries) {
    levels[midi] = level;
  }
  return levels;
};

describe('releasePolyMidiMask', () => {
  it('オンの鍵をすべて OFF する', () => {
    const mask = createPolyMidiMask();
    mask[60] = 1;
    const off = vi.fn();
    releasePolyMidiMask(mask, off);
    expect(off).toHaveBeenCalledWith(60);
    expect(mask[60]).toBe(0);
  });
});

describe('fillLevelsFromEffeTune', () => {
  it('5 cent ビンの最大値を鍵レベルにする', () => {
    const levels = new Float32Array(128);
    const spec = new Float32Array(440);
    const idx = 2 + (60 - 21) * 5;
    spec[idx] = 0.55;
    fillLevelsFromEffeTune(levels, spec, 21, 5);
    expect(levels[60]).toBeCloseTo(0.55);
  });
});

describe('stepPolyOnsetTracker', () => {
  const step = (
    tracker: ReturnType<typeof createPolyOnsetTracker>,
    levels: Float32Array,
    on = vi.fn(),
    off = vi.fn(),
  ): void => {
    stepPolyOnsetTracker(
      tracker,
      levels,
      PITCH_PLEASE_THR,
      DEFAULT_POLY_ONSET_CONFIG,
      on,
      off,
    );
  };

  it('強いレベルは 1 フレームで ON する', () => {
    const tracker = createPolyOnsetTracker();
    const on = vi.fn();
    const off = vi.fn();
    step(tracker, stubLevels([[60, 0.95]]), on, off);
    expect(on).toHaveBeenCalledWith(60);
    expect(off).not.toHaveBeenCalled();
  });

  it('閾値付近は slowConfirmFrames 待ってから ON する', () => {
    const tracker = createPolyOnsetTracker();
    const on = vi.fn();
    const off = vi.fn();
    const border = stubLevels([[60, 0.75]]);
    for (let i = 0; i < DEFAULT_POLY_ONSET_CONFIG.slowConfirmFrames - 1; i += 1) {
      step(tracker, border, on, off);
    }
    expect(on).not.toHaveBeenCalled();
    step(tracker, border, on, off);
    expect(on).toHaveBeenCalledWith(60);
  });

  it('ON 中に確率が揺れても再打鍵 note-on を出さない', () => {
    const tracker = createPolyOnsetTracker();
    const on = vi.fn();
    const off = vi.fn();
    step(tracker, stubLevels([[60, 0.95]]), on, off);
    on.mockClear();
    off.mockClear();
    for (let i = 0; i < 12; i += 1) {
      step(tracker, stubLevels([[60, 0.55]]), on, off);
    }
    step(tracker, stubLevels([[60, 0.95]]), on, off);
    expect(on).not.toHaveBeenCalled();
    expect(off).not.toHaveBeenCalled();
  });

  it('1 フレームの欠落だけではすぐ OFF しない', () => {
    const tracker = createPolyOnsetTracker();
    const on = vi.fn();
    const off = vi.fn();
    step(tracker, stubLevels([[60, 0.95]]), on, off);
    off.mockClear();
    step(tracker, stubLevels([[60, 0.2]]), on, off);
    expect(off).not.toHaveBeenCalled();
    for (let i = 0; i < DEFAULT_POLY_ONSET_CONFIG.releaseFrames - 2; i += 1) {
      step(tracker, stubLevels([[60, 0.2]]), on, off);
      expect(off).not.toHaveBeenCalled();
    }
    step(tracker, stubLevels([[60, 0.2]]), on, off);
    expect(off).toHaveBeenCalledWith(60);
  });

  it('先に鳴っている隣より弱い同時立ち上がりだけ落とす', () => {
    const tracker = createPolyOnsetTracker();
    const on = vi.fn();
    const off = vi.fn();
    for (let i = 0; i < 6; i += 1) {
      step(tracker, stubLevels([[64, 0.95]]), on, off);
    }
    on.mockClear();
    step(tracker, stubLevels([[64, 0.6], [65, 0.85]]), on, off);
    expect(on).not.toHaveBeenCalledWith(65);
    on.mockClear();
    for (let i = 0; i < DEFAULT_POLY_ONSET_CONFIG.neighborYoungFrames + 2; i += 1) {
      step(tracker, stubLevels([[64, 0.6]]), on, off);
    }
    step(tracker, stubLevels([[64, 0.55], [65, 0.95]]), on, off);
    expect(on).toHaveBeenCalledWith(65);
  });

  it('reset で状態をクリアする', () => {
    const tracker = createPolyOnsetTracker();
    const on = vi.fn();
    const off = vi.fn();
    step(tracker, stubLevels([[60, 0.95]]), on, off);
    resetPolyOnsetTracker(tracker);
    expect(tracker.emitted[60]).toBe(0);
  });
});
