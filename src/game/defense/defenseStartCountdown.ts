/** ステージ開始前カウントダウンの合計秒数（2 表示 1.1s → 1 表示 1.0s）。 */
export const DEFENSE_START_COUNTDOWN_SEC = 2.1;

export const DEFENSE_START_COUNTDOWN_FIRST_STEP_SEC = 1.1;

export const DEFENSE_START_COUNTDOWN_SECOND_STEP_SEC = 1.0;

/** 残り秒数から表示数字（0 / 1 / 2）を返す。ceil を 2 でキャップして 3 が一瞬出ないようにする。 */
export const defenseStartCountdownDisplaySec = (remainingSec: number): number => {
  if (remainingSec <= 0) {
    return 0;
  }
  return Math.min(2, Math.ceil(remainingSec));
};
