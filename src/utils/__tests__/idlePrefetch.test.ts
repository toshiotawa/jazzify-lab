import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runWhenIdle, runWhenIdleDelayed } from '@/utils/idlePrefetch';

describe('idlePrefetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('runs runWhenIdle task via requestIdleCallback', () => {
    const task = vi.fn();
    const idleCallback = vi.fn((callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
      return 1;
    });
    vi.stubGlobal('requestIdleCallback', idleCallback);

    runWhenIdle(`idle-test-${Date.now()}-immediate`, task);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('cancels runWhenIdleDelayed before idle execution', () => {
    const task = vi.fn();
    const cancel = runWhenIdleDelayed(`idle-test-${Date.now()}-cancel`, task, 1000);

    vi.advanceTimersByTime(500);
    cancel();
    vi.advanceTimersByTime(5000);

    expect(task).not.toHaveBeenCalled();
  });

  it('runs runWhenIdleDelayed after delay and idle callback', () => {
    const task = vi.fn();
    const idleCallback = vi.fn((callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
      return 1;
    });
    vi.stubGlobal('requestIdleCallback', idleCallback);

    runWhenIdleDelayed(`idle-test-${Date.now()}-delayed`, task, 2000);
    vi.advanceTimersByTime(2000);

    expect(task).toHaveBeenCalledTimes(1);
  });
});
