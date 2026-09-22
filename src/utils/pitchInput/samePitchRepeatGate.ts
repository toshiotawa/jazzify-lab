/** 同音連打待ち: 直前の正解から短すぎる入力を捨てる（判定側のみ）。 */
export const isTooSoonForSamePitchRepeat = (
  inputPitchClass: number,
  lastAcceptedPitchClass: number | null,
  lastAcceptedAtMs: number | null,
  inputTimeMs: number,
  minIntervalMs: number,
): boolean => {
  if (lastAcceptedPitchClass === null || lastAcceptedAtMs === null) {
    return false;
  }
  if (inputPitchClass !== lastAcceptedPitchClass) {
    return false;
  }
  if (!Number.isFinite(inputTimeMs) || !Number.isFinite(lastAcceptedAtMs)) {
    return false;
  }
  return inputTimeMs - lastAcceptedAtMs < minIntervalMs;
};

/** BPM から 8分音符の半分（50%）の ms を返す。 */
export const minIntervalMsForEighthNote = (bpm: number, ratio = 0.5): number => {
  if (!Number.isFinite(bpm) || bpm <= 0) {
    return 0;
  }
  return (60_000 / bpm / 2) * ratio;
};

/** 楽譜上の 2 音間隔の半分（50%）の ms を返す。 */
export const minIntervalMsForWrittenSpacing = (
  prevSec: number,
  nextSec: number,
  ratio = 0.5,
): number => {
  if (!Number.isFinite(prevSec) || !Number.isFinite(nextSec)) {
    return 0;
  }
  return Math.max(0, (nextSec - prevSec) * 1000 * ratio);
};
