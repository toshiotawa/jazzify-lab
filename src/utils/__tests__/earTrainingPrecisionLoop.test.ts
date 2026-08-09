import { describe, expect, it } from 'vitest';
import {
  buildLoopWindowNotes,
  globalToLoopPosition,
  loopActiveMeasureNumber,
  loopCycleWindowSize,
  loopPracticeUniqueSemitones,
  loopSemitoneForCycle,
  resolveLoopWindow,
} from '@/utils/earTrainingPrecisionLoop';
import type { PrecisionNote } from '@/utils/earTrainingPrecisionNotes';

const note = (
  id: string,
  startSec: number,
  measureNumber: number,
): PrecisionNote => ({
  id,
  midi: 60,
  startSec,
  durationSec: 0.5,
  isBlackKey: false,
  measureNumber,
  isShortNote: false,
});

describe('earTrainingPrecisionLoop', () => {
  it('loopSemitoneForCycle: 7周目は +5 にラップする', () => {
    expect(loopSemitoneForCycle(7, 'down')).toBe(5);
    expect(loopSemitoneForCycle(6, 'down')).toBe(-6);
  });

  it('loopSemitoneForCycle: 上昇方向', () => {
    expect(loopSemitoneForCycle(1, 'up')).toBe(1);
    expect(loopSemitoneForCycle(7, 'up')).toBe(-5);
  });

  it('loopSemitoneForCycle: 完全4度上昇方向', () => {
    expect(loopSemitoneForCycle(1, 'fourthUp')).toBe(5);
    expect(loopSemitoneForCycle(2, 'fourthUp')).toBe(-2);
    expect(loopSemitoneForCycle(12, 'fourthUp')).toBe(0);
    expect(loopSemitoneForCycle(2, 'fourthUp', 3)).toBe(1);
  });

  it('loopSemitoneForCycle: 移調なしは常に原調', () => {
    expect(loopSemitoneForCycle(0, 'none')).toBe(0);
    expect(loopSemitoneForCycle(7, 'none')).toBe(0);
  });

  it('loopSemitoneForCycle: 基準キー付き', () => {
    expect(loopSemitoneForCycle(0, 'none', 3)).toBe(3);
    expect(loopSemitoneForCycle(2, 'down', 3)).toBe(1);
  });

  it('resolveLoopWindow: 小節番号を秒に変換する', () => {
    const window = resolveLoopWindow({
      startMeasure: 2,
      endMeasure: 4,
      measureDurationSec: 2,
    });
    expect(window).toEqual({
      startMeasure: 2,
      endMeasure: 4,
      startSec: 2,
      endSec: 8,
      durationSec: 6,
    });
  });

  it('globalToLoopPosition: 周回と局所秒を返す', () => {
    expect(globalToLoopPosition(13, 6)).toEqual({ cycleIndex: 2, localSec: 1 });
    expect(globalToLoopPosition(0, 6)).toEqual({ cycleIndex: 0, localSec: 0 });
  });

  it('loopCycleWindowSize: 短いループでは窓を広げる', () => {
    expect(loopCycleWindowSize(2.4)).toBeGreaterThanOrEqual(3);
    expect(loopCycleWindowSize(8)).toBe(2);
  });

  it('buildLoopWindowNotes: 周回ごとに ID と startSec をオフセットする', () => {
    const notesBySemitone = new Map<number, readonly PrecisionNote[]>([
      [0, [note('a', 2.5, 2)]],
      [-1, [note('b', 2.5, 2)]],
    ]);
    const loopWindow = resolveLoopWindow({
      startMeasure: 2,
      endMeasure: 3,
      measureDurationSec: 2,
    });
    const built = buildLoopWindowNotes({
      notesBySemitone,
      cycleIndex: 1,
      windowSize: 1,
      loopWindow,
      direction: 'down',
    });
    expect(built).toHaveLength(1);
    expect(built[0]?.id).toBe('b#c1');
    expect(built[0]?.startSec).toBeCloseTo(4.5, 5);
  });

  it('loopPracticeUniqueSemitones: 移調なしは基準キー1件だけ読み込む', () => {
    expect(loopPracticeUniqueSemitones('none')).toEqual([0]);
    expect(loopPracticeUniqueSemitones('none', 3)).toEqual([3]);
  });

  it('loopPracticeUniqueSemitones: 12キー分の半音セット', () => {
    expect(loopPracticeUniqueSemitones('down')).toHaveLength(12);
    expect(loopPracticeUniqueSemitones('down', 3)).toHaveLength(12);
    expect(loopPracticeUniqueSemitones('fourthUp')).toHaveLength(12);
  });

  it('loopActiveMeasureNumber: ループ開始小節を加算する', () => {
    const loopWindow = resolveLoopWindow({
      startMeasure: 3,
      endMeasure: 5,
      measureDurationSec: 2,
    });
    expect(loopActiveMeasureNumber(0, 2, loopWindow, 8)).toBe(3);
    expect(loopActiveMeasureNumber(2.1, 2, loopWindow, 8)).toBe(4);
  });
});
