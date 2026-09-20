import { buildDefenseStaffGroups } from '@/game/defense/defenseStaffGroups';
import type { DefensePhraseChord } from '@/game/defense/defenseTypes';

describe('buildDefenseStaffGroups staff chord names', () => {
  const chord: DefensePhraseChord = {
    id: 'c1',
    orderIndex: 0,
    chordName: 'Dm7',
    measureNumber: 1,
    notes: [
      { orderIndex: 0, pitchMidi: 65, pitchClass: 5, noteName: 'F4', staff: 1, staffChordName: 'F7' },
      { orderIndex: 1, pitchMidi: 67, pitchClass: 7, noteName: 'G4', staff: 1, staffChordName: 'F7' },
      { orderIndex: 2, pitchMidi: 60, pitchClass: 0, noteName: 'C4', staff: 1, staffChordName: 'D7' },
      { orderIndex: 3, pitchMidi: 62, pitchClass: 2, noteName: 'D4', staff: 1, staffChordName: 'D7' },
    ],
  };

  it('places labels above steps when staff_chord_name is set', () => {
    const built = buildDefenseStaffGroups(chord, new Set(), new Set(), 0, false);
    expect(built.groups.map((group) => group.chordName)).toEqual(['F7', '', 'D7', '']);
  });
});
