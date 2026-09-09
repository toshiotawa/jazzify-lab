/**
 * Defense mode musical transport: bar boundary math on audio clock seconds.
 */

export const barSeconds = (bpm: number, beatsPerBar: number): number => {
  const safeBpm = Math.max(1, bpm);
  const safeBeats = Math.max(1, beatsPerBar);
  return (60 / safeBpm) * safeBeats;
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
