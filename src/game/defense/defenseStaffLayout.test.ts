import { resolveDefenseDisplayStaves } from '@/game/defense/defenseStaffLayout';

describe('resolveDefenseDisplayStaves', () => {
  it('uses bass staff for bass-clef instruments regardless of stage layout', () => {
    expect(resolveDefenseDisplayStaves('bass', 'treble')).toEqual([2]);
    expect(resolveDefenseDisplayStaves('bass', 'grand')).toEqual([2]);
  });

  it('uses treble staff for treble-clef instruments', () => {
    expect(resolveDefenseDisplayStaves('treble', 'treble')).toEqual([1]);
    expect(resolveDefenseDisplayStaves('treble', 'grand')).toEqual([1]);
  });

  it('follows stage layout for grand-staff instruments', () => {
    expect(resolveDefenseDisplayStaves('grand', 'treble')).toEqual([1]);
    expect(resolveDefenseDisplayStaves('grand', 'grand')).toEqual([1, 2]);
  });
});
