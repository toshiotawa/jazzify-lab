import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_POLY_ONSET_CONFIG,
  createPolyMidiMask,
  createPolyOnsetTracker,
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

const PITCH_PLEASE_PIANO_THR = { on: 0.6, off: 0.36 };

describe('stepPolyOnsetTracker', () => {
  const step = (
    tracker: ReturnType<typeof createPolyOnsetTracker>,
    levels: Float32Array,
    on = vi.fn(),
    off = vi.fn(),
    expectedPitchClassMask = 0,
  ): void => {
    stepPolyOnsetTracker(
      tracker,
      levels,
      PITCH_PLEASE_THR,
      DEFAULT_POLY_ONSET_CONFIG,
      on,
      off,
      expectedPitchClassMask,
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

  it('期待音は 0.5 が 2 フレームで ON、非期待は ON しない', () => {
    const expectedMask = 1 << 4;
    const tracker = createPolyOnsetTracker();
    const on = vi.fn();
    const border = stubLevels([[64, 0.5]]);
    stepPolyOnsetTracker(
      tracker,
      border,
      PITCH_PLEASE_PIANO_THR,
      DEFAULT_POLY_ONSET_CONFIG,
      on,
      vi.fn(),
      expectedMask,
    );
    expect(on).not.toHaveBeenCalled();
    stepPolyOnsetTracker(
      tracker,
      border,
      PITCH_PLEASE_PIANO_THR,
      DEFAULT_POLY_ONSET_CONFIG,
      on,
      vi.fn(),
      expectedMask,
    );
    expect(on).toHaveBeenCalledWith(64);

    const nonExpected = createPolyOnsetTracker();
    const blocked = vi.fn();
    stepPolyOnsetTracker(
      nonExpected,
      border,
      PITCH_PLEASE_PIANO_THR,
      DEFAULT_POLY_ONSET_CONFIG,
      blocked,
      vi.fn(),
      0,
    );
    stepPolyOnsetTracker(
      nonExpected,
      border,
      PITCH_PLEASE_PIANO_THR,
      DEFAULT_POLY_ONSET_CONFIG,
      blocked,
      vi.fn(),
      0,
    );
    expect(blocked).not.toHaveBeenCalled();
  });

  it('期待音の再打鍵で OFF のあと ON する（マスク 0 では出ない）', () => {
    const expectedMask = 1 << 5;
    const midi = 77;
    const runRetrigger = (mask: number): { on: ReturnType<typeof vi.fn>; off: ReturnType<typeof vi.fn> } => {
      const tracker = createPolyOnsetTracker();
      const on = vi.fn();
      const off = vi.fn();
      stepPolyOnsetTracker(
        tracker,
        stubLevels([[midi, 0.95]]),
        PITCH_PLEASE_PIANO_THR,
        DEFAULT_POLY_ONSET_CONFIG,
        on,
        off,
        mask,
      );
      for (let frame = 0; frame < DEFAULT_POLY_ONSET_CONFIG.retriggerMinFrames; frame += 1) {
        stepPolyOnsetTracker(
          tracker,
          stubLevels([[midi, 0.5]]),
          PITCH_PLEASE_PIANO_THR,
          DEFAULT_POLY_ONSET_CONFIG,
          on,
          off,
          mask,
        );
      }
      stepPolyOnsetTracker(
        tracker,
        stubLevels([[midi, 0.2]]),
        PITCH_PLEASE_PIANO_THR,
        DEFAULT_POLY_ONSET_CONFIG,
        on,
        off,
        mask,
      );
      on.mockClear();
      off.mockClear();
      stepPolyOnsetTracker(
        tracker,
        stubLevels([[midi, 0.95]]),
        PITCH_PLEASE_PIANO_THR,
        DEFAULT_POLY_ONSET_CONFIG,
        on,
        off,
        mask,
      );
      return { on, off };
    };

    const withMask = runRetrigger(expectedMask);
    expect(withMask.off).toHaveBeenCalledWith(midi);
    expect(withMask.on).toHaveBeenCalledWith(midi);

    const withoutMask = runRetrigger(0);
    expect(withoutMask.off).not.toHaveBeenCalled();
    expect(withoutMask.on).not.toHaveBeenCalled();
  });

  it('録音抜粋: F5 の 0.56/0.61/0.50 のあと強い再打鍵を期待音で受理する', () => {
    const midi = 77;
    const mask = 1 << 5;
    const tracker = createPolyOnsetTracker();
    const on = vi.fn();
    const off = vi.fn();
    const sequence = [0.95, 0.56, 0.61, 0.5, 0.2, 0.95];
    for (const level of sequence) {
      for (let warm = 0; warm < (level === 0.2 ? DEFAULT_POLY_ONSET_CONFIG.retriggerMinFrames : 0); warm += 1) {
        stepPolyOnsetTracker(
          tracker,
          stubLevels([[midi, 0.5]]),
          PITCH_PLEASE_PIANO_THR,
          DEFAULT_POLY_ONSET_CONFIG,
          on,
          off,
          mask,
        );
      }
      stepPolyOnsetTracker(
        tracker,
        stubLevels([[midi, level]]),
        PITCH_PLEASE_PIANO_THR,
        DEFAULT_POLY_ONSET_CONFIG,
        on,
        off,
        mask,
      );
    }
    expect(off).toHaveBeenCalled();
    expect(on.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('録音抜粋: E5 の持続中に dip 後 1.0 で再打鍵する', () => {
    const midi = 76;
    const mask = 1 << 4;
    const tracker = createPolyOnsetTracker();
    const on = vi.fn();
    const off = vi.fn();
    const sequence = [0.95, 0.48, 0.62, 0.19, 0.26, 0.25, 1, 1];
    for (const level of sequence) {
      stepPolyOnsetTracker(
        tracker,
        stubLevels([[midi, level]]),
        PITCH_PLEASE_PIANO_THR,
        DEFAULT_POLY_ONSET_CONFIG,
        on,
        off,
        mask,
      );
    }
    expect(off).toHaveBeenCalledWith(midi);
    expect(on.mock.calls.filter((call) => call[0] === midi).length).toBeGreaterThanOrEqual(2);
  });
});
