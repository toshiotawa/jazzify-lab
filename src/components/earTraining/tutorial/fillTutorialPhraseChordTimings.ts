import type { EarTrainingTutorialContentChord } from './earTrainingTutorialScriptTypes';

/** measure/beat から start/end を補完（harmony グループ化・譜面用）。 */
export const fillTutorialPhraseChordTimings = (
  chords: EarTrainingTutorialContentChord[],
  bpm: number,
  beatsPerMeasure: number,
  loopDurationSec: number,
): EarTrainingTutorialContentChord[] => {
  if (chords.length === 0) {
    return chords;
  }
  const beatSec = 60 / Math.max(1, bpm);
  const sorted = chords.slice().sort((a, b) => a.order_index - b.order_index);
  const withStart = sorted.map((chord, index) => {
    if (
      typeof chord.start_time_sec === 'number'
      && Number.isFinite(chord.start_time_sec)
    ) {
      return { chord, index };
    }
    const measure = chord.measure_number ?? index + 1;
    const beat = chord.beat_offset ?? 1;
    const start = ((Math.max(1, measure) - 1) * Math.max(1, beatsPerMeasure) + (beat - 1)) * beatSec;
    return {
      chord: { ...chord, start_time_sec: start },
      index,
    };
  });

  return withStart.map(({ chord, index }, i) => {
    if (
      typeof chord.end_time_sec === 'number'
      && Number.isFinite(chord.end_time_sec)
    ) {
      return chord;
    }
    const nextStart = withStart[i + 1]?.chord.start_time_sec;
    const end = typeof nextStart === 'number' && Number.isFinite(nextStart)
      ? nextStart
      : loopDurationSec;
    return { ...chord, end_time_sec: Math.min(loopDurationSec, end) };
  });
};
