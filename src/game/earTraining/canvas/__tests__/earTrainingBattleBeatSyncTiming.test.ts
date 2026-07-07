import { describe, expect, it } from 'vitest';
import {
  phraseLandingToPerfMs,
  resolveBeatSyncLandingSec,
  resolveParryBeatSyncSchedule,
  shouldRestartParryZoom,
} from '@/game/earTraining/canvas/earTrainingBattleBeatSyncTiming';

describe('resolveBeatSyncLandingSec', () => {
  const cases: Array<{
    label: string;
    bpm: number;
    isSwing: boolean;
    hitPhraseSec: number;
    expectedLandingSec: number;
  }> = [
    { label: 'even 100 onbeat', bpm: 100, isSwing: false, hitPhraseSec: 0, expectedLandingSec: 0.3 },
    { label: 'even 100 offbeat', bpm: 100, isSwing: false, hitPhraseSec: 0.3, expectedLandingSec: 0.6 },
    { label: 'even 160 onbeat', bpm: 160, isSwing: false, hitPhraseSec: 0, expectedLandingSec: 0.1875 },
    { label: 'even 160 offbeat', bpm: 160, isSwing: false, hitPhraseSec: 0.1875, expectedLandingSec: 0.375 },
    { label: 'even 200 onbeat', bpm: 200, isSwing: false, hitPhraseSec: 0, expectedLandingSec: 0.3 },
    { label: 'even 200 offbeat', bpm: 200, isSwing: false, hitPhraseSec: 0.15, expectedLandingSec: 0.45 },
    { label: 'even 300 onbeat', bpm: 300, isSwing: false, hitPhraseSec: 0, expectedLandingSec: 0.2 },
    { label: 'even 300 offbeat', bpm: 300, isSwing: false, hitPhraseSec: 0.1, expectedLandingSec: 0.4 },
    { label: 'swing 100 onbeat', bpm: 100, isSwing: true, hitPhraseSec: 0, expectedLandingSec: 0.4 },
    { label: 'swing 100 offbeat', bpm: 100, isSwing: true, hitPhraseSec: 0.4, expectedLandingSec: 0.6 },
    { label: 'swing 160 onbeat', bpm: 160, isSwing: true, hitPhraseSec: 0, expectedLandingSec: 0.25 },
    { label: 'swing 160 offbeat', bpm: 160, isSwing: true, hitPhraseSec: 0.25, expectedLandingSec: 0.375 },
    { label: 'swing 200 onbeat', bpm: 200, isSwing: true, hitPhraseSec: 0, expectedLandingSec: 0.3 },
    { label: 'swing 200 offbeat', bpm: 200, isSwing: true, hitPhraseSec: 0.2, expectedLandingSec: 0.5 },
    { label: 'swing 300 onbeat', bpm: 300, isSwing: true, hitPhraseSec: 0, expectedLandingSec: 0.2 },
    { label: 'swing 300 offbeat', bpm: 300, isSwing: true, hitPhraseSec: 0.1333333333, expectedLandingSec: 0.4 },
  ];

  it.each(cases)('$label', ({ bpm, isSwing, hitPhraseSec, expectedLandingSec }) => {
    const landing = resolveBeatSyncLandingSec(hitPhraseSec, bpm, isSwing);
    expect(landing).toBeCloseTo(expectedLandingSec, 6);
    expect(landing).toBeGreaterThan(hitPhraseSec);
  });
});

describe('phraseLandingToPerfMs', () => {
  it('maps phrase landing to performance time', () => {
    expect(phraseLandingToPerfMs(1, 1.3, 5000)).toBe(5300);
  });
});

describe('resolveParryBeatSyncSchedule', () => {
  it('uses the same perf end for pan in and return', () => {
    const schedule = resolveParryBeatSyncSchedule({
      hitPhraseSec: 0,
      hitPerfMs: 1000,
      bpm: 160,
      isSwing: true,
    });
    expect(schedule.slowDurationMs).toBe(250);
    expect(schedule.panInEndPerfMs).toBe(1250);
    expect(schedule.returnEndPerfMs).toBe(1250);
    expect(schedule.ringExpandStartMs).toBe(251);
  });
});

describe('shouldRestartParryZoom', () => {
  it('returns true when next target lands before computed landing', () => {
    expect(shouldRestartParryZoom(0.2, 0.3)).toBe(true);
    expect(shouldRestartParryZoom(0.3, 0.3)).toBe(false);
    expect(shouldRestartParryZoom(undefined, 0.3)).toBe(false);
  });
});
