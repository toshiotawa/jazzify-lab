import { describe, expect, it } from 'vitest';

import { resolveDefenseStaffChordLabels } from '@/game/defense/defenseStaffChordLabel';
import type { DefensePhraseChord } from '@/game/defense/defenseTypes';

describe('resolveDefenseStaffChordLabels', () => {
  it('labels only steps where staff chord name changes', () => {
    const chord: DefensePhraseChord = {
      id: 'c1',
      orderIndex: 0,
      chordName: 'Cm7',
      measureNumber: 1,
      notes: [
        { orderIndex: 0, pitchMidi: 50, pitchClass: 2, noteName: 'D3', staff: 2, stepIndex: 0, staffChordName: 'Cm7' },
        { orderIndex: 1, pitchMidi: 55, pitchClass: 7, noteName: 'G3', staff: 2, stepIndex: 0 },
        { orderIndex: 2, pitchMidi: 48, pitchClass: 0, noteName: 'C3', staff: 2, stepIndex: 1 },
        { orderIndex: 3, pitchMidi: 51, pitchClass: 3, noteName: 'Eb3', staff: 2, stepIndex: 1 },
      ],
    };
    expect(resolveDefenseStaffChordLabels(chord)).toEqual(['Cm7', '']);
  });

  it('uses chord_name on first step when staff labels absent', () => {
    const chord: DefensePhraseChord = {
      id: 'c1',
      orderIndex: 0,
      chordName: 'Dm7',
      measureNumber: 1,
      notes: [
        { orderIndex: 0, pitchMidi: 62, pitchClass: 2, noteName: 'D4', staff: 1, stepIndex: 0 },
      ],
    };
    expect(resolveDefenseStaffChordLabels(chord)).toEqual(['Dm7']);
  });
});
