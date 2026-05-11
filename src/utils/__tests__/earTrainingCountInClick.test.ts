import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playEarTrainingCountInMeasure } from '@/utils/earTrainingCountInClick';

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

describe('playEarTrainingCountInMeasure', () => {
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

    const promise = playEarTrainingCountInMeasure({
      bpm: 60,
      beatsPerMeasure: 4,
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
});
