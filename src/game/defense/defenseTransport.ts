/**
 * Defense mode musical transport: bar boundary math on audio clock seconds.
 */

export const barSeconds = (bpm: number, beatsPerBar: number): number => {
  const safeBpm = Math.max(1, bpm);
  const safeBeats = Math.max(1, beatsPerBar);
  return (60 / safeBpm) * safeBeats;
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

export const nextSwitchTime = (
  now: number,
  transportStart: number,
  barSec: number,
  deadlineSec: number,
): number => {
  if (barSec <= 0) {
    return now;
  }
  const safeDeadline = Math.max(0, deadlineSec);
  const barIndex = Math.floor((now - transportStart) / barSec);
  let switchAt = transportStart + (barIndex + 1) * barSec;
  if (switchAt - now < safeDeadline) {
    switchAt += barSec;
  }
  return switchAt;
};

export const scheduleDeadlineSec = (baseLatencySec: number): number => (
  0.1 + Math.max(0, baseLatencySec)
);
