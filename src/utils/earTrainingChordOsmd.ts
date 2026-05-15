import type { EarTrainingPhrase, EarTrainingPhraseChord, EarTrainingRank } from '@/types';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

export const CHORD_OSMD_JUDGMENT_WINDOW_SEC = 0.1;
export const CHORD_OSMD_HAMMER_LEAD_SEC = 3;
export const CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC = 0.2;

const SAME_TARGET_EPSILON_SEC = 0.0005;

interface ChordOsmdMidiCount {
  midi: number;
  count: number;
}

export interface ChordOsmdRhythmTarget {
  id: string;
  label: string;
  orderIndex: number;
  targetTimeSec: number;
  measureNumber: number;
  midiCounts: readonly ChordOsmdMidiCount[];
}

export type ChordOsmdTargetVisualState = 'idle' | 'active' | 'completed' | 'failed';

const chordStartTimeSec = (
  chord: EarTrainingPhraseChord,
  beatDurationSec: number,
  beatsPerMeasure: number,
): number => {
  if (typeof chord.start_time_sec === 'number' && Number.isFinite(chord.start_time_sec)) {
    return Math.max(0, chord.start_time_sec);
  }

  if (
    typeof chord.measure_number === 'number'
    && Number.isFinite(chord.measure_number)
    && typeof chord.beat_offset === 'number'
    && Number.isFinite(chord.beat_offset)
  ) {
    const measureIndex = Math.max(0, Math.trunc(chord.measure_number) - 1);
    const beatIndex = Math.max(0, chord.beat_offset - 1);
    return (measureIndex * Math.max(1, beatsPerMeasure) + beatIndex) * beatDurationSec;
  }

  return Math.max(0, chord.order_index) * beatDurationSec;
};

const chordMeasureNumber = (
  chord: EarTrainingPhraseChord,
  targetTimeSec: number,
  beatDurationSec: number,
  beatsPerMeasure: number,
): number => {
  if (typeof chord.measure_number === 'number' && Number.isFinite(chord.measure_number)) {
    return Math.max(1, Math.trunc(chord.measure_number));
  }
  const measureDurationSec = beatDurationSec * Math.max(1, beatsPerMeasure);
  return measureDurationSec > 0
    ? Math.floor(targetTimeSec / measureDurationSec) + 1
    : 1;
};

const noteNameToMidi = (noteName: string): number | null => {
  const trimmed = noteName.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return parseVoicingNoteName(trimmed).midi;
  } catch {
    return null;
  }
};

const addMidiCounts = (
  counts: Map<number, number>,
  voicing: readonly string[] | null | undefined,
): void => {
  for (const noteName of voicing ?? []) {
    const midi = noteNameToMidi(noteName);
    if (midi !== null) {
      counts.set(midi, (counts.get(midi) ?? 0) + 1);
    }
  }
};

const midiCountArray = (counts: ReadonlyMap<number, number>): ChordOsmdMidiCount[] => (
  Array.from(counts, ([midi, count]) => ({ midi, count }))
    .filter(item => item.count > 0)
    .sort((a, b) => a.midi - b.midi)
);

export const buildChordOsmdRhythmTargets = (
  phrase: EarTrainingPhrase | undefined,
  bpm: number,
  beatsPerMeasure: number,
): ChordOsmdRhythmTarget[] => {
  const chords = phrase?.chords ?? [];
  if (chords.length === 0) {
    return [];
  }

  const beatDurationSec = 60 / Math.max(1, bpm);
  const sorted = chords
    .map(chord => {
      const targetTimeSec = chordStartTimeSec(chord, beatDurationSec, beatsPerMeasure);
      const measureNumber = chordMeasureNumber(chord, targetTimeSec, beatDurationSec, beatsPerMeasure);
      return { chord, targetTimeSec, measureNumber };
    })
    .sort((a, b) => {
      if (Math.abs(a.targetTimeSec - b.targetTimeSec) > SAME_TARGET_EPSILON_SEC) {
        return a.targetTimeSec - b.targetTimeSec;
      }
      return a.chord.order_index - b.chord.order_index;
    });

  const targets: Array<ChordOsmdRhythmTarget & { mutableCounts: Map<number, number> }> = [];
  for (const item of sorted) {
    const counts = new Map<number, number>();
    addMidiCounts(counts, item.chord.voicing);
    if (counts.size === 0) {
      continue;
    }

    const last = targets[targets.length - 1];
    if (
      last
      && Math.abs(last.targetTimeSec - item.targetTimeSec) <= SAME_TARGET_EPSILON_SEC
      && last.measureNumber === item.measureNumber
    ) {
      if (!last.label.split(' / ').includes(item.chord.chord_name)) {
        last.label = `${last.label} / ${item.chord.chord_name}`;
      }
      counts.forEach((count, midi) => {
        last.mutableCounts.set(midi, (last.mutableCounts.get(midi) ?? 0) + count);
      });
      last.midiCounts = midiCountArray(last.mutableCounts);
      continue;
    }

    targets.push({
      id: item.chord.id,
      label: item.chord.chord_name,
      orderIndex: item.chord.order_index,
      targetTimeSec: item.targetTimeSec,
      measureNumber: item.measureNumber,
      midiCounts: midiCountArray(counts),
      mutableCounts: counts,
    });
  }

  return targets.map(({ mutableCounts: _mutableCounts, ...target }) => target);
};

export const createChordOsmdRemainingCounts = (
  target: ChordOsmdRhythmTarget,
): Map<number, number> => (
  new Map(target.midiCounts.map(item => [item.midi, item.count]))
);

export const consumeChordOsmdMidi = (
  remainingCounts: ReadonlyMap<number, number>,
  midi: number,
): Map<number, number> | null => {
  const current = remainingCounts.get(Math.round(midi)) ?? 0;
  if (current <= 0) {
    return null;
  }
  const next = new Map(remainingCounts);
  next.set(Math.round(midi), current - 1);
  return next;
};

export const chordOsmdTargetIsComplete = (
  remainingCounts: ReadonlyMap<number, number>,
): boolean => {
  for (const count of remainingCounts.values()) {
    if (count > 0) {
      return false;
    }
  }
  return true;
};

export const chordOsmdRankForAccuracy = (accuracy: number): EarTrainingRank => {
  if (accuracy >= 0.98) {
    return 'Perfect';
  }
  if (accuracy >= 0.8) {
    return 'Great';
  }
  if (accuracy >= 0.4) {
    return 'Good';
  }
  return 'Fail';
};

export const getChordOsmdTargetNoteCount = (target: ChordOsmdRhythmTarget): number => (
  target.midiCounts.reduce((sum, item) => sum + item.count, 0)
);

export const getChordOsmdTotalNoteCount = (
  targets: readonly ChordOsmdRhythmTarget[],
): number => (
  targets.reduce((sum, target) => sum + getChordOsmdTargetNoteCount(target), 0)
);
