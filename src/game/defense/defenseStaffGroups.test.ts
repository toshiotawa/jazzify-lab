import { buildDefenseStaffGroups } from '@/game/defense/defenseStaffGroups';
import type { DefensePhraseChord } from '@/game/defense/defenseTypes';

const dm7Chord: DefensePhraseChord = {
  id: 'dm7',
  orderIndex: 0,
  chordName: 'Dm7',
  measureNumber: 1,
  notes: [
    { orderIndex: 0, pitchMidi: 50, pitchClass: 2, noteName: 'D3', staff: 2, stepIndex: 0 },
    { orderIndex: 1, pitchMidi: 53, pitchClass: 5, noteName: 'F3', staff: 2, stepIndex: 0 },
    { orderIndex: 2, pitchMidi: 57, pitchClass: 9, noteName: 'A3', staff: 2, stepIndex: 0 },
    { orderIndex: 3, pitchMidi: 60, pitchClass: 0, noteName: 'C4', staff: 1, stepIndex: 0 },
    { orderIndex: 4, pitchMidi: 65, pitchClass: 5, noteName: 'F4', staff: 1, stepIndex: 0 },
  ],
};

const g7Chord: DefensePhraseChord = {
  id: 'g7',
  orderIndex: 1,
  chordName: 'G7',
  measureNumber: 2,
  notes: [
    { orderIndex: 0, pitchMidi: 43, pitchClass: 7, noteName: 'G2', staff: 2, stepIndex: 0 },
    { orderIndex: 1, pitchMidi: 53, pitchClass: 5, noteName: 'F3', staff: 2, stepIndex: 0 },
    { orderIndex: 2, pitchMidi: 59, pitchClass: 11, noteName: 'B3', staff: 2, stepIndex: 0 },
    { orderIndex: 3, pitchMidi: 62, pitchClass: 2, noteName: 'D4', staff: 1, stepIndex: 0 },
    { orderIndex: 4, pitchMidi: 65, pitchClass: 5, noteName: 'F4', staff: 1, stepIndex: 0 },
  ],
};

describe('buildDefenseStaffGroups', () => {
  it('builds single-measure groups for the current chord only', () => {
    const result = buildDefenseStaffGroups(
      dm7Chord,
      new Set([1, 4]),
      new Set([1, 4]),
      0,
      true,
    );

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]?.chordName).toBe('Dm7');
    expect(result.groups.every((group) => group.measureOffset === 0)).toBe(true);
    expect(result.correctPitchClassesByGroupId.get('m0-s0')).toEqual([5, 5]);
    expect(result.activeGroupId).toBe('m0-s0');
  });

  it('does not leak correct pitch classes to a different chord', () => {
    const dm7Result = buildDefenseStaffGroups(
      dm7Chord,
      new Set([1, 4]),
      new Set([1, 4]),
      0,
      true,
    );
    const g7Result = buildDefenseStaffGroups(
      g7Chord,
      new Set(),
      new Set(),
      0,
      true,
    );

    expect(dm7Result.correctPitchClassesByGroupId.get('m0-s0')).toEqual([5, 5]);
    expect(g7Result.correctPitchClassesByGroupId.size).toBe(0);
    expect(g7Result.groups[0]?.chordName).toBe('G7');
  });

  it('returns empty groups for null chord', () => {
    const result = buildDefenseStaffGroups(
      null,
      new Set(),
      new Set(),
      0,
      false,
    );

    expect(result.groups).toHaveLength(0);
    expect(result.activeGroupId).toBeNull();
  });
});
