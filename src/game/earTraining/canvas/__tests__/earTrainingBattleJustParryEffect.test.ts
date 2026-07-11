import { describe, expect, it } from 'vitest';
import {
  JUST_PARRY_MIN_DURATION_MS,
  resolveJustParryEffectDurationMs,
} from '@/game/earTraining/canvas/earTrainingBattleJustParryEffect';

describe('resolveJustParryEffectDurationMs', () => {
  it('uses full note duration minus 1ms to next target when available', () => {
    expect(resolveJustParryEffectDurationMs(1, 2, undefined)).toBe(999);
    expect(resolveJustParryEffectDurationMs(0.5, 1.5, undefined)).toBe(999);
  });

  it('uses fallback end phrase sec minus 1ms for final target', () => {
    expect(resolveJustParryEffectDurationMs(1, undefined, 2.2)).toBe(1199);
  });

  it('enforces minimum duration', () => {
    expect(resolveJustParryEffectDurationMs(1, 1.05, undefined)).toBe(JUST_PARRY_MIN_DURATION_MS);
    expect(resolveJustParryEffectDurationMs(1, undefined, 1.02)).toBe(JUST_PARRY_MIN_DURATION_MS);
  });
});
