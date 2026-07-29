/**
 * 動画視聴課題の累積視聴ゲート用純関数。
 * シーク飛ばしは加算しない（連続再生とみなせる小さな前進のみ加算）。
 */

/** 連続再生とみなす最大ステップ秒（timeupdate / 0.5s observer の余裕込み） */
const VIDEO_LESSON_CONTINUOUS_DELTA_MAX_SEC = 1.25;

export interface AccumulateWatchedResult {
  watchedSec: number;
  lastTime: number;
}

/**
 * 前回位置から今回位置への前進分だけ視聴秒を加算する。
 * 巻き戻し・大きなシークは加算せず lastTime のみ更新する。
 */
export function accumulateWatchedSeconds(
  prevWatchedSec: number,
  lastTime: number,
  currentTime: number,
  maxContinuousDeltaSec: number = VIDEO_LESSON_CONTINUOUS_DELTA_MAX_SEC,
): AccumulateWatchedResult {
  if (!Number.isFinite(currentTime) || currentTime < 0) {
    return { watchedSec: prevWatchedSec, lastTime };
  }
  if (!Number.isFinite(lastTime) || lastTime < 0) {
    return { watchedSec: prevWatchedSec, lastTime: currentTime };
  }
  const delta = currentTime - lastTime;
  if (delta > 0 && delta <= maxContinuousDeltaSec) {
    return {
      watchedSec: prevWatchedSec + delta,
      lastTime: currentTime,
    };
  }
  return { watchedSec: prevWatchedSec, lastTime: currentTime };
}

export function isWatchGateSatisfied(
  watchedSec: number,
  durationSec: number,
  requiredRatio: number,
): boolean {
  if (!Number.isFinite(watchedSec) || watchedSec < 0) {
    return false;
  }
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return false;
  }
  const ratio = Number.isFinite(requiredRatio) ? requiredRatio : 0.9;
  const clampedRatio = Math.min(1, Math.max(0.5, ratio));
  return watchedSec >= durationSec * clampedRatio;
}

export function remainingWatchSeconds(
  watchedSec: number,
  durationSec: number,
  requiredRatio: number,
): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return 0;
  }
  const ratio = Number.isFinite(requiredRatio) ? requiredRatio : 0.9;
  const clampedRatio = Math.min(1, Math.max(0.5, ratio));
  const needed = durationSec * clampedRatio;
  return Math.max(0, needed - (Number.isFinite(watchedSec) ? watchedSec : 0));
}
