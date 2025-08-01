/**
 * 拍 / 小節 → 絶対 ms 変換ユーティリティ
 * 既存 timeStore の数値をそのまま利用出来る単関数。
 */
export const beatToMs = (beat: number, bpm: number): number =>
  (60000 / bpm) * beat;

export const measureBeatToMs = (
  measure: number,
  beat: number,
  bpm: number,
  timeSignature: number,
  countInMeasures = 0,
): number => {
  const totalBeats = (measure - 1 + countInMeasures) * timeSignature + (beat - 1);
  return beatToMs(totalBeats, bpm);
};