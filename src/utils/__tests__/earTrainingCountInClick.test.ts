import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playEarTrainingCountIn } from '@/utils/earTrainingCountInClick';

const scheduledStarts: number[] = [];

class MockAudioParam {
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockOscillatorNode {
  type: OscillatorType = 'sine';
  frequency = new MockAudioParam();

  connect = vi.fn();

  start = (when: number): void => {
    scheduledStarts.push(when);
  };

  stop = vi.fn();
}

class MockGainNode {
  gain = new MockAudioParam();

  connect = vi.fn();
}

class MockAudioContext {
  currentTime = 0;
  destination = {};

  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);

  createOscillator = (): MockOscillatorNode => new MockOscillatorNode();
  createGain = (): MockGainNode => new MockGainNode();
}

describe('playEarTrainingCountIn', () => {
  const originalAudioContext = window.AudioContext;

  beforeEach(() => {
    scheduledStarts.length = 0;
    vi.useFakeTimers();
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: MockAudioContext,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: originalAudioContext,
    });
  });

  it('waits one full beat after the last click before resolving', async () => {
    const onBeat = vi.fn();
    let resolved = false;

    const promise = playEarTrainingCountIn({
      bpm: 60,
      countInBeats: 4,
      gain: 1,
      onBeat,
    }).then(() => {
      resolved = true;
    });

    await Promise.resolve();

    expect(scheduledStarts).toEqual([0.02, 1.02, 2.02, 3.02]);
    expect(onBeat).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(20);
    expect(onBeat).toHaveBeenLastCalledWith(3);

    await vi.advanceTimersByTimeAsync(1000);
    expect(onBeat).toHaveBeenLastCalledWith(2);

    await vi.advanceTimersByTimeAsync(1000);
    expect(onBeat).toHaveBeenLastCalledWith(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(onBeat).toHaveBeenLastCalledWith(0);

    await vi.advanceTimersByTimeAsync(999);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await promise;

    expect(resolved).toBe(true);
  });

  it('最後の半拍の頭で onInputWindowStart を1回だけ呼ぶ', async () => {
    const onInputWindowStart = vi.fn();
    const promise = playEarTrainingCountIn({
      bpm: 60,
      countInBeats: 4,
      gain: 1,
      onInputWindowStart,
    });
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(3520);
    expect(onInputWindowStart).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(500);
    await promise;
  });

  it('resolves immediately without scheduling clicks when count-in beats is zero', async () => {
    const onBeat = vi.fn();

    await playEarTrainingCountIn({
      bpm: 60,
      countInBeats: 0,
      gain: 1,
      onBeat,
    });

    expect(scheduledStarts).toEqual([]);
    expect(onBeat).not.toHaveBeenCalled();
  });
});
