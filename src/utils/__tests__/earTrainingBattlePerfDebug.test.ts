import { afterEach, describe, expect, it } from 'vitest';

import {
  EAR_TRAINING_BATTLE_PERF_DEBUG_STORAGE_KEY,
  isEarTrainingBattlePerfDebugEnabled,
} from '@/utils/earTrainingBattlePerfDebug';

const withSearch = (search: string, run: () => void): void => {
  const originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation, search },
  });
  try {
    run();
  } finally {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  }
};

describe('isEarTrainingBattlePerfDebugEnabled', () => {
  afterEach(() => {
    window.localStorage.removeItem(EAR_TRAINING_BATTLE_PERF_DEBUG_STORAGE_KEY);
  });

  it('returns false by default', () => {
    withSearch('', () => {
      expect(isEarTrainingBattlePerfDebugEnabled()).toBe(false);
    });
  });

  it('returns true when URL query earPerf=1', () => {
    withSearch('?earPerf=1', () => {
      expect(isEarTrainingBattlePerfDebugEnabled()).toBe(true);
    });
  });

  it('returns true when localStorage flag is set', () => {
    withSearch('', () => {
      window.localStorage.setItem(EAR_TRAINING_BATTLE_PERF_DEBUG_STORAGE_KEY, '1');
      expect(isEarTrainingBattlePerfDebugEnabled()).toBe(true);
    });
  });
});
