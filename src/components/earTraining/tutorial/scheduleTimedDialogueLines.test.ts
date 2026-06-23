import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  computeOsmdTimedLineDelayMs,
  scheduleDialogueInterval,
} from './scheduleTimedDialogueLines';

describe('scheduleDialogueInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires lines at interval', () => {
    const lines: string[] = [];
    const handle = scheduleDialogueInterval({
      lines: [{ ja: 'a', en: 'A' }, { ja: 'b', en: 'B' }],
      intervalSeconds: 4,
      isEnglishCopy: false,
      onLine: text => lines.push(text),
    });
    expect(lines).toEqual(['a']);
    vi.advanceTimersByTime(4000);
    expect(lines).toEqual(['a', 'b']);
    handle.cancel();
  });
});

describe('computeOsmdTimedLineDelayMs', () => {
  it('schedules count-in beat 2 at one beat duration', () => {
    const delay = computeOsmdTimedLineDelayMs(
      {
        bpm: 120,
        beatsPerMeasure: 4,
        countInBeats: 4,
        loopMeasures: 4,
        phraseLoopDurationSec: 8,
        timedLines: [],
        isEnglishCopy: false,
        onLine: () => undefined,
      },
      { phase: 'count_in', beat: 2, text: { ja: 'x', en: 'x' } },
      0,
    );
    expect(delay).toBe(500);
  });

  it('matches at.loop:0 only when loopIndex is 0 (per-loop reschedule)', () => {
    const params = {
      bpm: 100,
      beatsPerMeasure: 4,
      countInBeats: 0,
      loopMeasures: 4,
      phraseLoopDurationSec: 9.6,
      timedLines: [],
      isEnglishCopy: false,
      onLine: () => undefined,
      skipCountInForLoop: () => true,
    };
    const line = { at: { loop: 0, measure: 2, beat: 1 }, text: { ja: 'm2', en: 'm2' } };
    expect(computeOsmdTimedLineDelayMs(params, line, 0)).toBe(2400);
    expect(computeOsmdTimedLineDelayMs(params, line, 1)).toBeNull();
  });
});
