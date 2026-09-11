import { computeDefenseStageMidis } from '@/game/defense/defenseStageMidis';
import type { DefensePhrase } from '@/game/defense/defenseTypes';

const phrases: readonly DefensePhrase[] = [
  {
    id: 'p0',
    orderIndex: 0,
    title: 'Phrase 1',
    audioUrl: 'https://example.com/a.mp3',
    keyFifths: null,
    requiredCompletionCount: null,
    chords: [
      {
        id: 'c0',
        orderIndex: 0,
        chordName: 'C',
        measureNumber: 1,
        notes: [
          { orderIndex: 0, pitchMidi: 60, pitchClass: 0, noteName: 'C4', staff: 1 },
          { orderIndex: 1, pitchMidi: 64, pitchClass: 4, noteName: 'E4', staff: 1 },
        ],
      },
    ],
  },
  {
    id: 'p1',
    orderIndex: 1,
    title: 'Phrase 2',
    audioUrl: 'https://example.com/b.mp3',
    keyFifths: null,
    requiredCompletionCount: null,
    chords: [
      {
        id: 'c1',
        orderIndex: 0,
        chordName: 'G',
        measureNumber: 1,
        notes: [
          { orderIndex: 0, pitchMidi: 67, pitchClass: 7, noteName: 'G4', staff: 1 },
        ],
      },
    ],
  },
];

describe('computeDefenseStageMidis', () => {
  it('collects all pitch MIDI values across phrases and chords', () => {
    expect(computeDefenseStageMidis(phrases)).toEqual([60, 64, 67]);
  });

  it('returns empty array when there are no notes', () => {
    expect(computeDefenseStageMidis([])).toEqual([]);
  });
});
