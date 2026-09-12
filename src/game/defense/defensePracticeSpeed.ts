/** ディフェンス練習速度の下限（%） */
export const DEFENSE_PRACTICE_SPEED_MIN_PERCENT = 50;

/** ディフェンス練習速度の上限（%）・デフォルト */
export const DEFENSE_PRACTICE_SPEED_MAX_PERCENT = 150;

/** ディフェンス練習速度の刻み（%） */
export const DEFENSE_PRACTICE_SPEED_STEP = 10;

export const clampDefensePracticeSpeedPercent = (percent: number): number =>
  Math.max(
    DEFENSE_PRACTICE_SPEED_MIN_PERCENT,
    Math.min(DEFENSE_PRACTICE_SPEED_MAX_PERCENT, Math.trunc(percent)),
  );

export const defensePracticeSpeedRatio = (percent: number): number =>
  clampDefensePracticeSpeedPercent(percent) / 100;

export const stepDefensePracticeSpeedPercent = (
  percent: number,
  direction: -1 | 1,
): number => {
  const clamped = clampDefensePracticeSpeedPercent(percent);
  const stepped = clamped + direction * DEFENSE_PRACTICE_SPEED_STEP;
  return clampDefensePracticeSpeedPercent(stepped);
};

export const formatDefensePracticeSpeedLabel = (percent: number): string =>
  `${clampDefensePracticeSpeedPercent(percent)}%`;
