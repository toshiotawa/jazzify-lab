import type { BalloonRunState } from './balloonRushEngine';

import { balloonBlinkVisibleAt, balloonExpiresAtGameSec, isBalloonExpired } from './balloonRushEngine';

const make = (spawnedAt: number, lifetime: number): BalloonRunState => ({
  id: 'x',
  x: 0,
  y: 0,
  spawnedAtSec: spawnedAt,
  lifetimeSec: lifetime,
});

describe('balloonRushEngine', () => {
  it('expiration at lifetime edge', () => {
    const b = make(0, 10);
    expect(balloonExpiresAtGameSec(b)).toBe(10);
    expect(isBalloonExpired(b, 9.999)).toBe(false);
    expect(isBalloonExpired(b, 10)).toBe(true);
  });

  it('blink in last two seconds toggles periodically', () => {
    const b = make(100, 10);
    const tExpire = balloonExpiresAtGameSec(b);
    expect(balloonBlinkVisibleAt(b, tExpire - 2 - 1e-9)).toBe(true);
    expect(balloonBlinkVisibleAt(b, tExpire - 1.999)).toBe(true);
    expect(balloonBlinkVisibleAt(b, tExpire - 1.5)).toBe(false);
    expect(balloonBlinkVisibleAt(b, tExpire - 1.0)).toBe(true);
    expect(balloonBlinkVisibleAt(b, tExpire - 0.01)).toBe(false);
  });
});
