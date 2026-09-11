import type { TrainingClefMode, TrainingKind } from '@/game/training/trainingTypes';

/** Fraction of the staff band (HUD bottom → piano top) used for the staff block. */
export const trainingStaffHeightRatio = (clefMode: TrainingClefMode): number => (
  clefMode === 'grand_concert' ? 0.5 : 0.34
);

/** Unpressed note opacity on the staff: hidden in production except note reading. */
export const trainingStaffNoteOpacity = (
  practiceMode: boolean,
  kind: TrainingKind,
): number => (practiceMode || kind === 'note_reading' ? 1 : 0);
