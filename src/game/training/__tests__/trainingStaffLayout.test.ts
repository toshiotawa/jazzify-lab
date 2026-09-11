import {
  trainingStaffHeightRatio,
  trainingStaffNoteOpacity,
} from '@/game/training/trainingStaffLayout';

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

  it('hides note heads in production except note reading', () => {
    expect(trainingStaffNoteOpacity(false, 'note_reading')).toBe(1);
    expect(trainingStaffNoteOpacity(false, 'chord')).toBe(0);
    expect(trainingStaffNoteOpacity(false, 'voicing')).toBe(0);
  });
});
