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

export const DEFENSE_PROGRESSION_HUD_SLOT_COUNT = 4;

/** Loop position in seconds → 0-based fractional beat within the loop. */
export const loopPositionToBeatInLoop = (
  positionInLoopSec: number,
  barSec: number,
  beatsPerBar: number,
): number => {
  if (barSec <= 0 || beatsPerBar <= 0) {
    return 0;
  }
  return (Math.max(0, positionInLoopSec) / barSec) * beatsPerBar;
};

/** Elapsed transport seconds → beat within the phrase loop (matches backing deck HUD sync). */
export const elapsedSecToBeatInLoop = (
  elapsedSec: number,
  loopStartSec: number,
  loopEndSec: number,
  startOffsetSec: number,
  barSec: number,
  beatsPerBar: number,
): number => {
  const loopDuration = Math.max(1e-6, loopEndSec - loopStartSec);
  const positionInBuffer = startOffsetSec + Math.max(0, elapsedSec);
  const positionInLoop = (
    ((positionInBuffer - loopStartSec) % loopDuration) + loopDuration
  ) % loopDuration;
  return loopPositionToBeatInLoop(positionInLoop, barSec, beatsPerBar);
};

export interface DefenseProgressionHudWindow {
  readonly firstVisibleIndex: number;
  readonly visibleCount: number;
}

/** Fixed-slot paging window for Defense chord HUD (default 4 chips). */
export const resolveDefenseProgressionHudWindow = (
  chipCount: number,
  activeIndex: number,
  slotCount = DEFENSE_PROGRESSION_HUD_SLOT_COUNT,
): DefenseProgressionHudWindow => {
  const visibleCount = Math.min(slotCount, Math.max(0, chipCount));
  if (visibleCount === 0) {
    return { firstVisibleIndex: 0, visibleCount: 0 };
  }
  const safeActive = Math.min(Math.max(activeIndex, 0), Math.max(0, chipCount - 1));
  const pageStart = Math.floor(safeActive / slotCount) * slotCount;
  const maxStart = Math.max(0, chipCount - visibleCount);
  const firstVisibleIndex = Math.min(pageStart, maxStart);
  return { firstVisibleIndex, visibleCount };
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
