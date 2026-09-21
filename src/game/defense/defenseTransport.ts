/**
 * Defense mode musical transport: bar boundary math on audio clock seconds.
 */

export const barSeconds = (bpm: number, beatsPerBar: number): number => {
  const safeBpm = Math.max(1, bpm);
  const safeBeats = Math.max(1, beatsPerBar);
  return (60 / safeBpm) * safeBeats;
};

export const beatSeconds = (bpm: number, playbackRatio = 1): number => {
  const safeBpm = Math.max(1, bpm);
  const safeRatio = Math.max(0.0001, playbackRatio);
  return 60 / safeBpm / safeRatio;
};

export const barSecondsFromLoop = (
  loopStartSec: number,
  loopEndSec: number,
  barCount: number,
): number => {
  const duration = Math.max(1e-6, loopEndSec - loopStartSec);
  return duration / Math.max(1, Math.trunc(barCount));
};

/**
 * Keep the current bar-phase when tempo changes, so the next bar head
 * stays musically aligned instead of being recomputed from t=0.
 */
export const rebaseTransportStart = (
  now: number,
  transportStart: number,
  oldBarSec: number,
  newBarSec: number,
): number => {
  if (oldBarSec <= 0 || newBarSec <= 0) {
    return now;
  }
  const elapsed = Math.max(0, now - transportStart);
  const barIndex = Math.floor(elapsed / oldBarSec);
  const phase = elapsed - barIndex * oldBarSec;
  const fraction = phase / oldBarSec;
  return now - fraction * newBarSec;
};

export interface DefenseSwitchPlan {
  readonly switchAt: number;
  readonly immediate: boolean;
  readonly cutAt: number;
}

/** Minimum time before a scheduled cut; below this, fall back to immediate switch. */
const SCHEDULE_MIN_QUANTUM_SEC = 0.001;

/**
 * Production phrase switch timing:
 * - before cut: always target the upcoming cut (even inside the old 100ms lead window)
 * - within one beat after cut: immediate switch
 * - more than one beat after cut: target the next cut
 */
export const planDefenseSwitch = (params: {
  readonly now: number;
  readonly transportStart: number;
  readonly cutIntervalSec: number;
  readonly beatSec: number;
}): DefenseSwitchPlan => {
  const { now, transportStart, cutIntervalSec, beatSec } = params;
  if (cutIntervalSec <= 0) {
    return { switchAt: now, immediate: true, cutAt: now };
  }

  const safeBeat = Math.max(1e-9, beatSec);
  const epsilon = 1e-9;

  const elapsed = Math.max(0, now - transportStart);
  const cutIndex = Math.floor(elapsed / cutIntervalSec + epsilon);
  const recentCutAt = transportStart + cutIndex * cutIntervalSec;
  const upcomingCutAt = recentCutAt + cutIntervalSec;

  if (now >= recentCutAt - epsilon) {
    const overshoot = now - recentCutAt;
    if (overshoot <= safeBeat + epsilon) {
      return { switchAt: now, immediate: true, cutAt: recentCutAt };
    }
  }

  if (now < upcomingCutAt - epsilon) {
    const remaining = upcomingCutAt - now;
    if (remaining < SCHEDULE_MIN_QUANTUM_SEC) {
      return { switchAt: now, immediate: true, cutAt: upcomingCutAt };
    }
    return { switchAt: upcomingCutAt, immediate: false, cutAt: upcomingCutAt };
  }

  return { switchAt: now, immediate: true, cutAt: upcomingCutAt };
};

export const nextSwitchTime = (
  now: number,
  transportStart: number,
  barSec: number,
  _deadlineSec: number,
  beatSec?: number,
): number => (
  planDefenseSwitch({
    now,
    transportStart,
    cutIntervalSec: barSec,
    beatSec: beatSec ?? barSec / 4,
  }).switchAt
);

export const scheduleDeadlineSec = (baseLatencySec: number): number => (
  0.1 + Math.max(0, baseLatencySec)
);
