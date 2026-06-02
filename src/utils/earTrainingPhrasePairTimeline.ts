import type { AdlibPattern } from '@/utils/earTrainingPhrasePairEngine';
import type { EarTrainingPhrasePairAdlibStep } from '@/utils/earTrainingPhrasePairAdlibAdapter';

export const getPhrasePairAdlibStepAtTime = (
  steps: readonly EarTrainingPhrasePairAdlibStep[],
  loopTimeSec: number,
  loopDurationSec: number,
): EarTrainingPhrasePairAdlibStep | null => {
  if (steps.length === 0 || loopDurationSec <= 0) return null;

  const normalized = ((loopTimeSec % loopDurationSec) + loopDurationSec) % loopDurationSec;

  for (const step of steps) {
    if (normalized >= step.startTimeSec && normalized < step.endTimeSec) {
      return step;
    }
  }

  return steps[steps.length - 1] ?? null;
};

export const getPhrasePairAdlibPatternsForStep = (
  step: EarTrainingPhrasePairAdlibStep | null,
  patternsByGroupId: Readonly<Record<string, readonly AdlibPattern[]>>,
): readonly AdlibPattern[] => {
  if (!step) return [];
  return patternsByGroupId[step.patternGroupId] ?? [];
};

export const getNextPhrasePairStepBoundarySec = (
  steps: readonly EarTrainingPhrasePairAdlibStep[],
  loopTimeSec: number,
  loopDurationSec: number,
): number | null => {
  const current = getPhrasePairAdlibStepAtTime(steps, loopTimeSec, loopDurationSec);
  if (!current || steps.length === 0) return null;

  const nextStep = steps.find((s) => s.orderIndex === current.orderIndex + 1);
  if (nextStep) return nextStep.startTimeSec;
  return loopDurationSec;
};
