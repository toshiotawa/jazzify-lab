import {
  trainingStaffDisplayNotes,
  trainingStaffHeightRatio,
  trainingStaffHintedPitchClasses,
  trainingStaffNoteOpacity,
} from '@/game/training/trainingStaffLayout';
import type { TrainingQuestionNote } from '@/game/training/trainingTypes';

const intervalNotes: readonly TrainingQuestionNote[] = [
  { noteName: 'C4', midi: 60, pitchClass: 0, staff: 1, isTarget: false },
  { noteName: 'E4', midi: 64, pitchClass: 4, staff: 1, isTarget: true },
];

describe('trainingStaffLayout', () => {
  it('uses larger height ratio for grand staff', () => {
    expect(trainingStaffHeightRatio('grand_concert')).toBe(0.5);
    expect(trainingStaffHeightRatio('instrument')).toBe(0.34);
    expect(trainingStaffHeightRatio('bass_concert')).toBe(0.34);
  });

  it('shows note heads in practice for all kinds', () => {
    expect(trainingStaffNoteOpacity(true, 'chord')).toBe(1);
    expect(trainingStaffNoteOpacity(true, 'note_reading')).toBe(1);
  });

  it('hides note heads in production except note reading and interval reference', () => {
    expect(trainingStaffNoteOpacity(false, 'note_reading')).toBe(1);
    expect(trainingStaffNoteOpacity(false, 'interval')).toBe(1);
    expect(trainingStaffNoteOpacity(false, 'chord')).toBe(0);
    expect(trainingStaffNoteOpacity(false, 'voicing')).toBe(0);
  });

  it('keeps only the interval reference note in production staff display', () => {
    expect(trainingStaffDisplayNotes(intervalNotes, true, 'interval')).toHaveLength(2);
    expect(trainingStaffDisplayNotes(intervalNotes, false, 'interval').map((n) => n.noteName)).toEqual(['C4']);
    expect(trainingStaffDisplayNotes(intervalNotes, false, 'chord')).toHaveLength(2);
  });

  it('shows interval targets as hinted pitch classes in practice only', () => {
    expect(trainingStaffHintedPitchClasses(intervalNotes, [], true, 'interval')).toEqual([4]);
    expect(trainingStaffHintedPitchClasses(intervalNotes, [], false, 'interval')).toEqual([]);
    expect(trainingStaffHintedPitchClasses(intervalNotes, [1], false, 'chord')).toEqual([4]);
  });
});
