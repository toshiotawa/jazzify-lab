/**
 * Defense HUD chord progression: beat-aligned slots synced to backing audio.
 */

export interface DefenseStageProgressionChord {
  readonly orderIndex: number;
  readonly chordName: string;
  readonly measureNumber: number;
  readonly beatOffset: number;
  readonly durationBeats: number;
}

export interface DefenseProgressionChip {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
}

const progressionChordStartBeat = (
  chord: DefenseStageProgressionChord,
  beatsPerBar: number,
): number => (
  (chord.measureNumber - 1) * beatsPerBar + (chord.beatOffset - 1)
);

/** 0-based fractional beat within the form loop. */
export const resolveDefenseProgressionActiveIndex = (
  chords: readonly DefenseStageProgressionChord[],
  beatInForm: number,
  formBarCount: number,
  beatsPerBar: number,
): number => {
  if (chords.length === 0 || formBarCount <= 0 || beatsPerBar <= 0) {
    return 0;
  }

  const totalBeats = formBarCount * beatsPerBar;
  const normalizedBeat = ((beatInForm % totalBeats) + totalBeats) % totalBeats;

  for (let index = chords.length - 1; index >= 0; index -= 1) {
    const chord = chords[index];
    const startBeat = progressionChordStartBeat(chord, beatsPerBar);
    if (normalizedBeat + 1e-9 >= startBeat) {
      return index;
    }
  }

  return 0;
};

export const resolveDefenseFormBarCount = (
  progressionBars: number | null,
  phraseLoopBarCount: number,
): number => {
  if (progressionBars !== null && progressionBars > 0) {
    return progressionBars;
  }
  return Math.max(1, phraseLoopBarCount);
};

export const buildDefenseProgressionChips = (
  chords: readonly DefenseStageProgressionChord[],
  activeIndex: number,
  transposeLabel: (label: string) => string,
): readonly DefenseProgressionChip[] => (
  chords.map((chord, index) => ({
    id: `progression-${chord.orderIndex}`,
    name: transposeLabel(chord.chordName),
    active: index === activeIndex,
  }))
);
