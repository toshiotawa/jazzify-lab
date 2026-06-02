import { describe, expect, it } from 'vitest';
import { getEarTrainingHalfBeatSec } from '@/utils/earTrainingChordTimeline';
import {
  evaluateAdlibNote,
  createInitialAdlibRuntimeState,
  type AdlibPattern,
} from '@/utils/earTrainingPhrasePairEngine';
import type { EarTrainingPhrasePairAdlibStep } from '@/utils/earTrainingPhrasePairAdlibAdapter';
import {
  getPhrasePairAdlibOverlapStepAtTime,
  getPhrasePairAdlibStepAtTime,
} from '@/utils/earTrainingPhrasePairTimeline';

const buildStep = (
  overrides: Partial<EarTrainingPhrasePairAdlibStep> & {
    id: string;
    orderIndex: number;
    startTimeSec: number;
    endTimeSec: number;
  },
): EarTrainingPhrasePairAdlibStep => ({
  id: overrides.id,
  orderIndex: overrides.orderIndex,
  chordName: overrides.chordName ?? 'C',
  patternGroupId: overrides.patternGroupId ?? 'group-a',
  measureNumber: overrides.measureNumber ?? 1,
  startTimeSec: overrides.startTimeSec,
  endTimeSec: overrides.endTimeSec,
  quote: overrides.quote ?? null,
  inputDisabled: overrides.inputDisabled ?? false,
});

describe('earTrainingPhrasePairTimeline overlap', () => {
  const bpm = 120;
  const half = getEarTrainingHalfBeatSec(bpm);
  const loopDurationSec = 8;

  const steps: EarTrainingPhrasePairAdlibStep[] = [
    buildStep({ id: 's1', orderIndex: 0, startTimeSec: 0, endTimeSec: 4 }),
    buildStep({ id: 's2', orderIndex: 1, startTimeSec: 4, endTimeSec: 8 }),
  ];

  it('次ステップ開始の半拍前から overlap ステップを返す', () => {
    expect(getPhrasePairAdlibStepAtTime(steps, 4 - half - 0.02, loopDurationSec)?.id).toBe('s1');
    expect(getPhrasePairAdlibOverlapStepAtTime(steps, 4 - half - 0.02, loopDurationSec, bpm)).toBeNull();
    expect(getPhrasePairAdlibOverlapStepAtTime(steps, 4 - half + 0.02, loopDurationSec, bpm)?.id).toBe('s2');
  });

  it('ループ境界の半拍前は先頭ステップを overlap として返す', () => {
    const loopTime = loopDurationSec - half + 0.02;
    expect(getPhrasePairAdlibStepAtTime(steps, loopTime, loopDurationSec)?.id).toBe('s2');
    expect(getPhrasePairAdlibOverlapStepAtTime(steps, loopTime, loopDurationSec, bpm)?.id).toBe('s1');
  });

  it('inputDisabled の次ステップは overlap 対象外', () => {
    const disabledSteps: EarTrainingPhrasePairAdlibStep[] = [
      buildStep({ id: 's1', orderIndex: 0, startTimeSec: 0, endTimeSec: 4 }),
      buildStep({
        id: 's2',
        orderIndex: 1,
        startTimeSec: 4,
        endTimeSec: 8,
        inputDisabled: true,
      }),
    ];
    expect(
      getPhrasePairAdlibOverlapStepAtTime(disabledSteps, 4 - half + 0.02, loopDurationSec, bpm),
    ).toBeNull();
  });

  it('連結パターンで次ステップの音を半拍前に complete できる', () => {
    const currentPatterns: AdlibPattern[] = [
      { id: 'cur', label: 'Cur', pcs: [0, 2], familyId: 'cur', carryTailLength: 0 },
    ];
    const nextPatterns: AdlibPattern[] = [
      { id: 'next', label: 'Next', pcs: [4, 7], familyId: 'next', carryTailLength: 0 },
    ];
    const combined = [...currentPatterns, ...nextPatterns];
    const state = createInitialAdlibRuntimeState();
    const first = evaluateAdlibNote(state, 4, combined);
    const second = evaluateAdlibNote(first.nextState, 7, combined);
    expect(second.result).toBe('complete');
    expect(second.completedPattern?.id).toBe('next');
  });
});
