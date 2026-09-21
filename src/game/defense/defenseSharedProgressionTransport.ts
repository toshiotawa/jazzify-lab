/**
 * Shared progression mode: bar boundary math for phrase audio switching.
 */

import { planDefenseSwitch } from '@/game/defense/defenseTransport';

export type SharedProgressionSwitchEveryBars = 1 | 2 | 4;

export interface SharedProgressionSwitchPlan {
  readonly switchAt: number;
  readonly destinationBar0: number;
  readonly absoluteSwitchBar0: number;
  readonly immediate: boolean;
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

export const planSharedProgressionSwitch = (params: {
  readonly nowAudioTime: number;
  readonly transportStart: number;
  readonly barSec: number;
  readonly progressionBars: number;
  readonly switchEveryBars: SharedProgressionSwitchEveryBars;
  readonly beatSec: number;
}): SharedProgressionSwitchPlan => {
  const {
    nowAudioTime,
    transportStart,
    barSec,
    progressionBars,
    switchEveryBars,
    beatSec,
  } = params;

  const safeN = Math.max(1, progressionBars);
  const cutIntervalSec = Math.max(1e-9, barSec * switchEveryBars);
  const plan = planDefenseSwitch({
    now: nowAudioTime,
    transportStart,
    cutIntervalSec,
    beatSec,
  });

  const absoluteBarPosition = computeSharedProgressionAbsoluteBarPosition(
    nowAudioTime,
    transportStart,
    barSec,
  );

  if (plan.immediate) {
    const currentBar0 = Math.floor(absoluteBarPosition + 1e-9);
    return {
      switchAt: plan.switchAt,
      destinationBar0: currentBar0 % safeN,
      absoluteSwitchBar0: currentBar0,
      immediate: true,
    };
  }

  const absoluteSwitchBar0 = Math.round((plan.cutAt - transportStart) / barSec);
  return {
    switchAt: plan.switchAt,
    destinationBar0: absoluteSwitchBar0 % safeN,
    absoluteSwitchBar0,
    immediate: false,
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

/** AAC encoder delay / padding is typically tens of milliseconds, far above ±1 frame. */
const sharedProgressionFrameCountTolerance = (sampleRate: number): number => (
  Math.max(1, Math.round(Math.max(1, sampleRate) * 0.25))
);

export const isSharedProgressionFrameCountValid = (
  actualFrames: number,
  expectedFrames: number,
  sampleRate: number,
): boolean => {
  const tolerance = sharedProgressionFrameCountTolerance(sampleRate);
  return Math.abs(actualFrames - expectedFrames) <= tolerance;
};
