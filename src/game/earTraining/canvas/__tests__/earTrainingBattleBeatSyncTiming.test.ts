import { describe, expect, it } from 'vitest';
import {
  phraseLandingToPerfMs,
  resolveBeatSyncLandingSec,
  resolveParryBeatSyncSchedule,
  resolveParryChainSlowDurationMs,
  resolveParryZoomEndPhraseSec,
  resolveParryZoomOutPhraseSec,
  resolveParryZoomPeakPhraseSec,
  resolveParryZoomScaleAtPhraseSec,
  resolvePhraseSecFromPerfAnchor,
} from '@/game/earTraining/canvas/earTrainingBattleBeatSyncTiming';
import {
  PARRY_ZOOM_TARGET,
} from '@/game/earTraining/canvas/earTrainingBattleDrawState';

describe('resolveBeatSyncLandingSec', () => {
  const cases: Array<{
    label: string;
    bpm: number;
    isSwing: boolean;
    hitPhraseSec: number;
    expectedLandingSec: number;
  }> = [
    { label: 'even 100 onbeat', bpm: 100, isSwing: false, hitPhraseSec: 0, expectedLandingSec: 0.6 },
    { label: 'even 100 offbeat', bpm: 100, isSwing: false, hitPhraseSec: 0.3, expectedLandingSec: 0.6 },
    { label: 'even 160 onbeat', bpm: 160, isSwing: false, hitPhraseSec: 0, expectedLandingSec: 0.375 },
    { label: 'even 160 offbeat', bpm: 160, isSwing: false, hitPhraseSec: 0.1875, expectedLandingSec: 0.375 },
    { label: 'even 200 onbeat', bpm: 200, isSwing: false, hitPhraseSec: 0, expectedLandingSec: 0.3 },
    { label: 'even 200 offbeat', bpm: 200, isSwing: false, hitPhraseSec: 0.15, expectedLandingSec: 0.3 },
    { label: 'even 300 onbeat', bpm: 300, isSwing: false, hitPhraseSec: 0, expectedLandingSec: 0.2 },
    { label: 'even 300 offbeat', bpm: 300, isSwing: false, hitPhraseSec: 0.1, expectedLandingSec: 0.4 },
    { label: 'swing 100 onbeat', bpm: 100, isSwing: true, hitPhraseSec: 0, expectedLandingSec: 0.6 },
    { label: 'swing 100 offbeat', bpm: 100, isSwing: true, hitPhraseSec: 0.4, expectedLandingSec: 0.6 },
    { label: 'swing 160 onbeat', bpm: 160, isSwing: true, hitPhraseSec: 0, expectedLandingSec: 0.375 },
    { label: 'swing 160 offbeat', bpm: 160, isSwing: true, hitPhraseSec: 0.25, expectedLandingSec: 0.375 },
    { label: 'swing 200 onbeat', bpm: 200, isSwing: true, hitPhraseSec: 0, expectedLandingSec: 0.3 },
    { label: 'swing 200 offbeat', bpm: 200, isSwing: true, hitPhraseSec: 0.2, expectedLandingSec: 0.6 },
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
  it('derives slow duration from beat-sync landing', () => {
    const schedule = resolveParryBeatSyncSchedule({
      hitPhraseSec: 0,
      hitPerfMs: 1000,
      bpm: 160,
      isSwing: true,
    });
    expect(schedule.slowDurationMs).toBe(375);
    expect(schedule.ringExpandStartMs).toBe(376);
  });
});

describe('resolveParryZoomPeakPhraseSec', () => {
  it('uses parry span end when available', () => {
    expect(resolveParryZoomPeakPhraseSec(1, 4, 160, false)).toBeCloseTo(4, 6);
  });

  it('falls back to beat-sync landing when span end is missing', () => {
    expect(resolveParryZoomPeakPhraseSec(0, undefined, 160, false)).toBeCloseTo(0.375, 6);
  });
});

describe('resolveParryZoomEndPhraseSec', () => {
  it('adds one beat after peak', () => {
    expect(resolveParryZoomEndPhraseSec(1, 160)).toBeCloseTo(1.375, 6);
  });
});

describe('resolveParryZoomOutPhraseSec', () => {
  it('uses next target phrase sec when available', () => {
    expect(resolveParryZoomOutPhraseSec(1, 1.75, 160, false)).toBeCloseTo(1.75, 6);
  });

  it('falls back to beat-sync landing when next target is missing', () => {
    expect(resolveParryZoomOutPhraseSec(0, undefined, 160, false)).toBeCloseTo(0.375, 6);
  });
});

describe('resolveParryZoomScaleAtPhraseSec', () => {
  const params = {
    anchorPhraseSec: 0,
    peakPhraseSec: 2,
    endPhraseSec: 2.375,
    zoomTarget: PARRY_ZOOM_TARGET,
    startScale: 1,
  };

  it('eases in to peak then eases out over one beat', () => {
    expect(resolveParryZoomScaleAtPhraseSec(0, params)).toBeCloseTo(1, 6);
    expect(resolveParryZoomScaleAtPhraseSec(1, params)).toBeGreaterThan(1);
    expect(resolveParryZoomScaleAtPhraseSec(1, params)).toBeLessThan(PARRY_ZOOM_TARGET);
    expect(resolveParryZoomScaleAtPhraseSec(2, params)).toBeCloseTo(PARRY_ZOOM_TARGET, 4);
    expect(resolveParryZoomScaleAtPhraseSec(2.1875, params)).toBeLessThan(PARRY_ZOOM_TARGET);
    expect(resolveParryZoomScaleAtPhraseSec(2.1875, params)).toBeGreaterThan(1);
    expect(resolveParryZoomScaleAtPhraseSec(2.375, params)).toBeCloseTo(1, 4);
    expect(resolveParryZoomScaleAtPhraseSec(3, params)).toBeCloseTo(1, 4);
  });

  it('preserves start scale at hit when retriggering mid-chain', () => {
    expect(resolveParryZoomScaleAtPhraseSec(0, {
      ...params,
      startScale: 1.02,
    })).toBeCloseTo(1.02, 4);
    expect(resolveParryZoomScaleAtPhraseSec(1, {
      ...params,
      startScale: 1.02,
    })).toBeGreaterThan(1.02);
    expect(resolveParryZoomScaleAtPhraseSec(2, {
      ...params,
      startScale: 1.02,
    })).toBeCloseTo(PARRY_ZOOM_TARGET, 4);
  });
});

describe('resolveParryChainSlowDurationMs', () => {
  it('uses phrase interval with minimum duration', () => {
    expect(resolveParryChainSlowDurationMs(0, 0.5, 64)).toBe(500);
    expect(resolveParryChainSlowDurationMs(0, 0.02, 64)).toBe(64);
  });
});

describe('resolvePhraseSecFromPerfAnchor', () => {
  it('maps performance time to phrase seconds', () => {
    expect(resolvePhraseSecFromPerfAnchor(2, 1000, 1500)).toBeCloseTo(2.5, 6);
  });
});
