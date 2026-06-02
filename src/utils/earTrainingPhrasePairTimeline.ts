import { getEarTrainingHalfBeatSec } from '@/utils/earTrainingChordTimeline';
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

const isPositiveFinite = (value: number): boolean => Number.isFinite(value) && value > 0;

/**
 * 次ステップ開始の半拍前から、表示は現ステップのまま次ステップの入力判定だけを重ねる窓。
 * コードヴォイシングの overlap と同様（ループ境界は nextStart > loopDuration でラップ）。
 */
export const getPhrasePairAdlibOverlapStepAtTime = (
  steps: readonly EarTrainingPhrasePairAdlibStep[],
  loopTimeSec: number,
  loopDurationSec: number,
  bpm: number,
): EarTrainingPhrasePairAdlibStep | null => {
  if (steps.length === 0 || loopDurationSec <= 0) return null;

  const normalized = ((loopTimeSec % loopDurationSec) + loopDurationSec) % loopDurationSec;
  const current = getPhrasePairAdlibStepAtTime(steps, normalized, loopDurationSec);
  if (!current) return null;

  const nextStep = steps.find((s) => s.orderIndex === current.orderIndex + 1)
    ?? (steps.length > 0 ? steps[0] : null);
  if (!nextStep || nextStep.inputDisabled) return null;

  const halfSec = getEarTrainingHalfBeatSec(bpm);
  if (halfSec <= 0) return null;

  const nextStart = nextStep.orderIndex === current.orderIndex + 1
    ? nextStep.startTimeSec
    : loopDurationSec + nextStep.startTimeSec;

  const overlapStart = nextStart - halfSec;
  const inOverlap = isPositiveFinite(nextStart) && nextStart > loopDurationSec
    ? normalized >= overlapStart && normalized < loopDurationSec
    : normalized >= overlapStart && normalized < nextStart;

  return inOverlap ? nextStep : null;
};
