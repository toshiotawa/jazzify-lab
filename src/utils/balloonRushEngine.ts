/** Balloon lifespan / blink / visibility — synced with iOS BalloonRushEngine */
export interface BalloonRunState {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  /** Monotonic elapsed game seconds at spawn */
  readonly spawnedAtSec: number;
  readonly lifetimeSec: number;
}

const BLINK_WINDOW_SEC = 2;
const BLINK_PERIOD_SEC = 0.5;
const BLINK_COUNT = 4;

export const balloonAgeSec = (b: BalloonRunState, nowGameSec: number): number =>
  Math.max(0, nowGameSec - b.spawnedAtSec);

export const balloonExpiresAtGameSec = (b: BalloonRunState): number =>
  b.spawnedAtSec + b.lifetimeSec;

export const isBalloonExpired = (b: BalloonRunState, nowGameSec: number): boolean =>
  balloonAgeSec(b, nowGameSec) >= b.lifetimeSec - 1e-6;

/** 「残り2秒」でゆっくり4回（0.5s周期）。最初は表示ONから */
export const balloonBlinkVisibleAt = (
  b: BalloonRunState,
  nowGameSec: number,
): boolean => {
  const age = balloonAgeSec(b, nowGameSec);
  const left = b.lifetimeSec - age;
  if (left > BLINK_WINDOW_SEC) {
    return true;
  }
  if (left <= 0) {
    return false;
  }
  const blinkPhase = BLINK_WINDOW_SEC - left;
  const idx = Math.min(BLINK_COUNT - 1, Math.floor(blinkPhase / BLINK_PERIOD_SEC));
  return idx % 2 === 0;
};
