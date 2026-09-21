/**
 * Staff chord label resolution for defense phrase chords (matches buildDefenseStaffGroups).
 */
import type { DefensePhraseChord } from '@/game/defense/defenseTypes';
import { getPhraseChordSteps } from '@/utils/phraseChordSteps';

export const resolveDefenseStaffChordLabels = (
  chord: DefensePhraseChord,
): readonly string[] => {
  const { steps } = getPhraseChordSteps(chord.notes);
  const hasStaffChordNames = chord.notes.some(
    (note) => (note.staffChordName ?? '').trim().length > 0,
  );
  let previousStaffLabel = '';
  return steps.map((step, stepPosition) => {
    let stepStaffLabel = '';
    for (const noteIndex of step.noteIndices) {
      const note = chord.notes[noteIndex];
      const noteStaffLabel = (note?.staffChordName ?? '').trim();
      if (noteStaffLabel.length > 0) {
        stepStaffLabel = noteStaffLabel;
      }
    }

    if (hasStaffChordNames) {
      if (stepStaffLabel.length > 0 && stepStaffLabel !== previousStaffLabel) {
        previousStaffLabel = stepStaffLabel;
        return stepStaffLabel;
      }
      return '';
    }
    if (stepPosition === 0) {
      return chord.chordName;
    }
    return '';
  });
};

export const resolveDefenseStaffChordLabelForStep = (
  chord: DefensePhraseChord,
  stepIndex: number,
): string => resolveDefenseStaffChordLabels(chord)[stepIndex] ?? '';
