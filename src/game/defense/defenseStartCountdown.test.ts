import {
  DEFENSE_START_COUNTDOWN_FIRST_STEP_SEC,
  DEFENSE_START_COUNTDOWN_SEC,
  DEFENSE_START_COUNTDOWN_SECOND_STEP_SEC,
  defenseStartCountdownDisplaySec,
} from '@/game/defense/defenseStartCountdown';

describe('defenseStartCountdown', () => {
  it('uses 2.1s total with 1.1s + 1.0s steps', () => {
    expect(DEFENSE_START_COUNTDOWN_SEC).toBeCloseTo(2.1);
    expect(
      DEFENSE_START_COUNTDOWN_FIRST_STEP_SEC + DEFENSE_START_COUNTDOWN_SECOND_STEP_SEC,
    ).toBeCloseTo(2.1);
  });

  it('maps remaining seconds to capped display values', () => {
    expect(defenseStartCountdownDisplaySec(2.1)).toBe(2);
    expect(defenseStartCountdownDisplaySec(1.01)).toBe(2);
    expect(defenseStartCountdownDisplaySec(1.0)).toBe(1);
    expect(defenseStartCountdownDisplaySec(0.5)).toBe(1);
    expect(defenseStartCountdownDisplaySec(0)).toBe(0);
  });
});
