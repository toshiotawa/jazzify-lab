/** チュートリアル: カウントイン + 指定小節数経過でクリアするまでの遅延（ms）。 */
export const computeTutorialMeasureClearDelayMs = (
  bpm: number,
  beatsPerMeasure: number,
  countInBeats: number,
  requiredMeasures: number,
): number => {
  const beatDurationSec = 60 / Math.max(1, bpm);
  const measureDurationSec = beatDurationSec * Math.max(1, beatsPerMeasure);
  const countInDurationSec = Math.max(0, countInBeats) * beatDurationSec;
  const measures = Math.max(1, Math.trunc(requiredMeasures));
  return (countInDurationSec + measures * measureDurationSec) * 1000;
};
