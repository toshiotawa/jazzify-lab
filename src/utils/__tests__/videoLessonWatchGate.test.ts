import {
  accumulateWatchedSeconds,
  isWatchGateSatisfied,
  remainingWatchSeconds,
} from '@/utils/videoLessonWatchGate';

describe('accumulateWatchedSeconds', () => {
  it('連続再生の小さな前進だけ加算する', () => {
    const a = accumulateWatchedSeconds(0, 0, 0.4);
    expect(a.watchedSec).toBeCloseTo(0.4, 5);
    expect(a.lastTime).toBe(0.4);

    const b = accumulateWatchedSeconds(a.watchedSec, a.lastTime, 0.9);
    expect(b.watchedSec).toBeCloseTo(0.9, 5);
  });

  it('シーク飛ばしは加算しない', () => {
    const result = accumulateWatchedSeconds(5, 10, 40);
    expect(result.watchedSec).toBe(5);
    expect(result.lastTime).toBe(40);
  });

  it('巻き戻しは加算しない', () => {
    const result = accumulateWatchedSeconds(8, 20, 5);
    expect(result.watchedSec).toBe(8);
    expect(result.lastTime).toBe(5);
  });
});

describe('isWatchGateSatisfied', () => {
  it('ちょうど90%で達成', () => {
    expect(isWatchGateSatisfied(90, 100, 0.9)).toBe(true);
  });

  it('89.9%では未達', () => {
    expect(isWatchGateSatisfied(89.9, 100, 0.9)).toBe(false);
  });

  it('duration が不正なら false', () => {
    expect(isWatchGateSatisfied(10, 0, 0.9)).toBe(false);
  });
});

describe('remainingWatchSeconds', () => {
  it('残り秒を返す', () => {
    expect(remainingWatchSeconds(50, 100, 0.9)).toBeCloseTo(40, 5);
  });
});
