import { describe, expect, it } from 'vitest';
import {
  isPhraseProgressIdleExpired,
  PHRASE_PROGRESS_IDLE_RESET_SEC,
} from '@/utils/phraseProgressIdleReset';

describe('phraseProgressIdleReset', () => {
  it('exports 15 second idle reset interval', () => {
    expect(PHRASE_PROGRESS_IDLE_RESET_SEC).toBe(15);
  });

  it('does not expire before interval elapses', () => {
    expect(isPhraseProgressIdleExpired(10, 24.9)).toBe(false);
  });

  it('expires after interval elapses', () => {
    expect(isPhraseProgressIdleExpired(10, 25)).toBe(true);
  });

  it('returns false when no progress timestamp exists', () => {
    expect(isPhraseProgressIdleExpired(null, 100)).toBe(false);
  });
});
