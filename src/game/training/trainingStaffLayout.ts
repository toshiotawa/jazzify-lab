import type {
  TrainingClefMode,
  TrainingKind,
  TrainingQuestionNote,
} from '@/game/training/trainingTypes';

/** Fraction of the staff band (HUD bottom → piano top) used for the staff block. */
export const trainingStaffHeightRatio = (clefMode: TrainingClefMode): number => (
  clefMode === 'grand_concert' ? 0.5 : 0.34
);

/** Unpressed note opacity on the staff: hidden in production except note reading / interval reference. */
export const trainingStaffNoteOpacity = (
  practiceMode: boolean,
  kind: TrainingKind,
): number => (practiceMode || kind === 'note_reading' || kind === 'interval' ? 1 : 0);

/** 本番の音程では正解音を譜面から外し、基準音だけ残す。 */
export const trainingStaffDisplayNotes = (
  notes: readonly TrainingQuestionNote[],
  practiceMode: boolean,
  kind: TrainingKind,
): readonly TrainingQuestionNote[] => {
  if (kind === 'interval' && !practiceMode) {
    return notes.filter((note) => !note.isTarget);
  }
  return notes;
};

/** 譜面の緑符頭。音程の練習では正解音を最初から緑にする。 */
export const trainingStaffHintedPitchClasses = (
  notes: readonly TrainingQuestionNote[],
  correctIndices: readonly number[],
  practiceMode: boolean,
  kind: TrainingKind,
): readonly number[] => {
  const out: number[] = [];
  const seen = new Set<number>();
  const push = (pitchClass: number): void => {
    if (seen.has(pitchClass)) return;
    seen.add(pitchClass);
    out.push(pitchClass);
  };
  for (let i = 0; i < correctIndices.length; i += 1) {
    const pitchClass = notes[correctIndices[i]]?.pitchClass;
    if (pitchClass != null) push(pitchClass);
  }
  if (kind === 'interval' && practiceMode) {
    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i];
      if (note?.isTarget) push(note.pitchClass);
    }
  }
  return out;
};
