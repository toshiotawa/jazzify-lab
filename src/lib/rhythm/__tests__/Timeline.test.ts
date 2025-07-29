import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Timeline } from '../Timeline';

describe('Timeline', () => {
  let timeline: Timeline;
  
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
    if (timeline) {
      timeline.stop();
    }
  });

  describe('基本機能', () => {
    it('正しい設定で初期化される', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 32 });
      
      expect(timeline.getBpm()).toBe(120);
      expect(timeline.getTimeSig()).toBe(4);
      expect(timeline.getBars()).toBe(32);
      expect(timeline.getBeatDuration()).toBeCloseTo(0.5); // 60/120 = 0.5秒
      expect(timeline.getBarDuration()).toBeCloseTo(2.0); // 0.5 * 4 = 2秒
    });

    it('3/4拍子の計算が正しい', () => {
      timeline = new Timeline({ bpm: 90, timeSig: 3, bars: 24 });
      
      expect(timeline.getBeatDuration()).toBeCloseTo(0.667, 2); // 60/90 ≈ 0.667秒
      expect(timeline.getBarDuration()).toBeCloseTo(2.0, 1); // 0.667 * 3 = 2秒
    });
  });

  describe('拍検出', () => {
    it('拍ごとにコールバックが呼ばれる', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 4 });
      const beatCallback = vi.fn();
      
      timeline.onBeat(beatCallback);
      timeline.start();
      
      // 最初は何も呼ばれない
      expect(beatCallback).not.toHaveBeenCalled();
      
      // 0.5秒後（1拍目）
      vi.advanceTimersByTime(500);
      expect(beatCallback).toHaveBeenCalledWith(0, 0, expect.any(Number));
      
      // さらに0.5秒後（2拍目）
      vi.advanceTimersByTime(500);
      expect(beatCallback).toHaveBeenCalledWith(0, 1, expect.any(Number));
      
      // さらに1秒後（次の小節の1拍目）
      vi.advanceTimersByTime(1000);
      expect(beatCallback).toHaveBeenCalledWith(1, 0, expect.any(Number));
    });

    it('コールバックの登録解除が機能する', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 4 });
      const beatCallback = vi.fn();
      
      timeline.onBeat(beatCallback);
      timeline.start();
      
      vi.advanceTimersByTime(500);
      expect(beatCallback).toHaveBeenCalledTimes(1);
      
      timeline.offBeat(beatCallback);
      vi.advanceTimersByTime(500);
      expect(beatCallback).toHaveBeenCalledTimes(1); // 増えない
    });
  });

  describe('進行率計算', () => {
    it('ループ内進行率が正しく計算される', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 2 });
      timeline.start();
      
      // 0秒：0%
      expect(timeline.getProgress()).toBeCloseTo(0);
      
      // 1秒：25%（4秒で1ループなので）
      vi.advanceTimersByTime(1000);
      expect(timeline.getProgress()).toBeCloseTo(0.25, 1);
      
      // 4秒：100%（0%に戻る）
      vi.advanceTimersByTime(3000);
      expect(timeline.getProgress()).toBeCloseTo(0, 1);
    });

    it('小節内進行率が正しく計算される', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 2 });
      timeline.start();
      
      // 0秒：0%
      expect(timeline.getBarProgress()).toBeCloseTo(0);
      
      // 0.5秒：25%（2秒で1小節なので）
      vi.advanceTimersByTime(500);
      expect(timeline.getBarProgress()).toBeCloseTo(0.25);
      
      // 2秒：100%（0%に戻る）
      vi.advanceTimersByTime(1500);
      expect(timeline.getBarProgress()).toBeCloseTo(0, 1);
    });
  });

  describe('判定タイミング', () => {
    it('80%位置での判定が正しく検出される', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 1 });
      timeline.start();
      
      // 1.5秒時点：75%
      vi.advanceTimersByTime(1500);
      expect(timeline.isJudgmentTiming(0.8, 200)).toBe(false);
      
      // 1.6秒時点：80%
      vi.advanceTimersByTime(100);
      expect(timeline.isJudgmentTiming(0.8, 200)).toBe(true);
      
      // 1.8秒時点：90%
      vi.advanceTimersByTime(200);
      expect(timeline.isJudgmentTiming(0.8, 200)).toBe(true);
      
      // 2.0秒時点：100%
      vi.advanceTimersByTime(200);
      expect(timeline.isJudgmentTiming(0.8, 200)).toBe(false);
    });

    it('判定窓の範囲が正しい', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 1 });
      timeline.start();
      
      // 1.6秒（80%）の前後200ms
      
      // 1.39秒：範囲外
      vi.advanceTimersByTime(1390);
      expect(timeline.isJudgmentTiming(0.8, 200)).toBe(false);
      
      // 1.41秒：範囲内
      vi.advanceTimersByTime(20);
      expect(timeline.isJudgmentTiming(0.8, 200)).toBe(true);
      
      // 1.79秒：範囲内
      vi.advanceTimersByTime(380);
      expect(timeline.isJudgmentTiming(0.8, 200)).toBe(true);
      
      // 1.81秒：範囲外
      vi.advanceTimersByTime(20);
      expect(timeline.isJudgmentTiming(0.8, 200)).toBe(false);
    });
  });

  describe('一時停止と再開', () => {
    it('一時停止と再開が正しく動作する', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 1 });
      const beatCallback = vi.fn();
      timeline.onBeat(beatCallback);
      
      timeline.start();
      vi.advanceTimersByTime(500);
      expect(beatCallback).toHaveBeenCalledTimes(1);
      
      timeline.pause();
      vi.advanceTimersByTime(500);
      expect(beatCallback).toHaveBeenCalledTimes(1); // 増えない
      
      timeline.resume();
      vi.advanceTimersByTime(500);
      expect(beatCallback).toHaveBeenCalledTimes(2); // 再開後に増える
    });
  });

  describe('ループカウント', () => {
    it('ループ回数が正しくカウントされる', () => {
      timeline = new Timeline({ bpm: 120, timeSig: 4, bars: 1 });
      timeline.start();
      
      expect(timeline.getLoopCount()).toBe(0);
      
      // 1ループ目（2秒）
      vi.advanceTimersByTime(2000);
      expect(timeline.getLoopCount()).toBe(1);
      
      // 2ループ目（4秒）
      vi.advanceTimersByTime(2000);
      expect(timeline.getLoopCount()).toBe(2);
    });
  });
});