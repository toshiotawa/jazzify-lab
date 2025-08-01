/**
 * 拍 / 小節 → 絶対 ms 変換ユーティリティ
 * 既存 timeStore の数値をそのまま利用出来る単関数。
 */

/**
 * 拍数をミリ秒に変換
 * @param beat 拍数
 * @param bpm BPM
 * @returns ミリ秒
 */
export const beatToMs = (beat: number, bpm: number): number =>
  (60000 / bpm) * beat;

/**
 * 小節・拍位置をミリ秒に変換
 * @param measure 小節番号（1から始まる）
 * @param beat 小節内の拍位置（1から始まる、小数可）
 * @param bpm BPM
 * @param timeSignature 拍子（4 = 4/4拍子）
 * @param countInMeasures カウントイン小節数
 * @param readyDuration Ready表示の時間（ms）
 * @returns Ready開始時点からのミリ秒
 */
export const measureBeatToMs = (
  measure: number,
  beat: number,
  bpm: number,
  timeSignature: number,
  countInMeasures = 0,
  readyDuration = 2000
): number => {
  // Ready時間を加算
  const totalBeats = (measure - 1 + countInMeasures) * timeSignature + (beat - 1);
  return readyDuration + beatToMs(totalBeats, bpm);
};

/**
 * ミリ秒から小節・拍位置を計算
 * @param ms ミリ秒（Ready開始時点から）
 * @param bpm BPM
 * @param timeSignature 拍子
 * @param countInMeasures カウントイン小節数
 * @param readyDuration Ready表示の時間（ms）
 * @returns { measure, beat, isCountIn }
 */
export const msToMeasureBeat = (
  ms: number,
  bpm: number,
  timeSignature: number,
  countInMeasures = 0,
  readyDuration = 2000
): { measure: number; beat: number; isCountIn: boolean } => {
  if (ms < readyDuration) {
    return { measure: 1, beat: 1, isCountIn: true };
  }

  const musicMs = ms - readyDuration;
  const totalBeats = Math.floor(musicMs / (60000 / bpm));
  const totalMeasures = Math.floor(totalBeats / timeSignature);
  const currentBeatInMeasure = (totalBeats % timeSignature) + 1;

  if (totalMeasures < countInMeasures) {
    return {
      measure: totalMeasures + 1,
      beat: currentBeatInMeasure,
      isCountIn: true
    };
  }

  const measuresAfterCountIn = totalMeasures - countInMeasures;
  return {
    measure: measuresAfterCountIn + 1,
    beat: currentBeatInMeasure,
    isCountIn: false
  };
};