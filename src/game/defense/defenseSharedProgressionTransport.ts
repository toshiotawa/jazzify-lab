/**
 * Shared progression mode: bar boundary math for phrase audio switching.
 */

export type SharedProgressionSwitchEveryBars = 1 | 2 | 4;

export interface SharedProgressionSwitchPlan {
  readonly switchAt: number;
  readonly destinationBar0: number;
  readonly absoluteSwitchBar0: number;
}

export const sharedProgressionBarSeconds = (
  bpm: number,
  beatsPerBar: number,
  playbackRatio: number,
): number => {
  const safeBpm = Math.max(1, bpm);
  const safeBeats = Math.max(1, beatsPerBar);
  const safeRatio = Math.max(0.0001, playbackRatio);
  return (60 / safeBpm) * safeBeats / safeRatio;
};

export const computeSharedProgressionAbsoluteBarPosition = (
  audioTime: number,
  transportStart: number,
  barSec: number,
): number => {
  if (barSec <= 0) {
    return 0;
  }
  return Math.max(0, (audioTime - transportStart) / barSec);
};

const nextBoundaryBar0 = (
  absoluteBarPosition: number,
  switchEveryBars: number,
): number => {
  const safeK = Math.max(1, switchEveryBars);
  const epsilon = 1e-9;
  const boundaryIndex = Math.floor((absoluteBarPosition + epsilon) / safeK) + 1;
  return boundaryIndex * safeK;
};

export const planSharedProgressionSwitch = (params: {
  readonly nowAudioTime: number;
  readonly transportStart: number;
  readonly barSec: number;
  readonly progressionBars: number;
  readonly switchEveryBars: SharedProgressionSwitchEveryBars;
  readonly schedulingLeadSec: number;
}): SharedProgressionSwitchPlan => {
  const {
    nowAudioTime,
    transportStart,
    barSec,
    progressionBars,
    switchEveryBars,
    schedulingLeadSec,
  } = params;

  const safeN = Math.max(1, progressionBars);
  const absoluteBarPosition = computeSharedProgressionAbsoluteBarPosition(
    nowAudioTime,
    transportStart,
    barSec,
  );

  let absoluteSwitchBar0 = nextBoundaryBar0(absoluteBarPosition, switchEveryBars);
  let switchAt = transportStart + absoluteSwitchBar0 * barSec;

  const safeLead = Math.max(0, schedulingLeadSec);
  while (switchAt - nowAudioTime < safeLead) {
    absoluteSwitchBar0 += switchEveryBars;
    switchAt = transportStart + absoluteSwitchBar0 * barSec;
  }

  const destinationBar0 = absoluteSwitchBar0 % safeN;
  return {
    switchAt,
    destinationBar0,
    absoluteSwitchBar0,
  };
};

export const sharedProgressionBarOffsetSec = (
  destinationBar0: number,
  barSec: number,
): number => Math.max(0, destinationBar0) * barSec;

export const computeSharedProgressionExpectedFrameCount = (
  progressionBars: number,
  bpm: number,
  beatsPerBar: number,
  sampleRate: number,
): number => {
  const barSec = sharedProgressionBarSeconds(bpm, beatsPerBar, 1);
  const totalSec = Math.max(1, progressionBars) * barSec;
  return Math.round(totalSec * sampleRate);
};

export const isSharedProgressionFrameCountValid = (
  actualFrames: number,
  expectedFrames: number,
  toleranceFrames = 1,
): boolean => Math.abs(actualFrames - expectedFrames) <= toleranceFrames;
