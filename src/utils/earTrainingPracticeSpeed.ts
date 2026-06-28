/** 練習速度の下限（%） */
export const PRACTICE_SPEED_MIN_PERCENT = 40;

/** 練習速度の上限（%）・デフォルト */
export const PRACTICE_SPEED_MAX_PERCENT = 100;

export const clampPracticeSpeedPercent = (percent: number): number =>
  Math.max(
    PRACTICE_SPEED_MIN_PERCENT,
    Math.min(PRACTICE_SPEED_MAX_PERCENT, Math.trunc(percent)),
  );

export const practiceSpeedRatio = (percent: number): number =>
  clampPracticeSpeedPercent(percent) / 100;

/** 練習速度を反映した判定・スクロール用ターゲット時刻（秒） */
export const scalePracticeTargetTimeSec = (
  targetTimeSec: number,
  speedPercent: number,
): number => {
  const ratio = practiceSpeedRatio(speedPercent);
  if (ratio >= 1) {
    return targetTimeSec;
  }
  return targetTimeSec / ratio;
};

/** カウントイン等に使う effective BPM */
export const effectivePracticeBpm = (bpm: number, speedPercent: number): number =>
  bpm * practiceSpeedRatio(speedPercent);

/** 練習速度を反映した判定窓・ヒント段階などのタイミング幅（秒） */
export const scalePracticeTimingWindowSec = (
  windowSec: number,
  speedPercent: number,
): number => {
  const ratio = practiceSpeedRatio(speedPercent);
  if (ratio >= 1) {
    return windowSec;
  }
  return windowSec / ratio;
};

/** フレーズループ終了秒を練習速度に合わせてスケール */
export const scalePracticePhraseLoopEndSec = (
  loopEndSec: number,
  speedPercent: number,
): number => {
  const ratio = practiceSpeedRatio(speedPercent);
  if (ratio >= 1) {
    return loopEndSec;
  }
  return loopEndSec / ratio;
};

export const formatPracticeSpeedPercentLabel = (percent: number): string =>
  `${clampPracticeSpeedPercent(percent)}%`;
