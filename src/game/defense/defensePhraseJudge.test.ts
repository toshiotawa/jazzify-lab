import {
  createInitialPhraseJudgeState,
  evaluateDefensePhraseNoteOn,
  nextPhraseIndex,
} from '@/game/defense/defensePhraseJudge';
import type { DefensePhrase } from '@/game/defense/defenseTypes';

const phraseA: DefensePhrase = {
  id: 'a',
  orderIndex: 0,
  title: 'A',
  audioUrl: 'https://example.com/a.mp3',
  keyFifths: null,
  requiredCompletionCount: null,
  chords: [
    {
      id: 'c0',
      orderIndex: 0,
      chordName: 'Dm7',
      measureNumber: 1,
      notes: [
        { orderIndex: 0, pitchMidi: 62, pitchClass: 2, noteName: 'D4', staff: 1, stepIndex: 0 },
        { orderIndex: 1, pitchMidi: 64, pitchClass: 4, noteName: 'E4', staff: 1, stepIndex: 1 },
      ],
    },
    {
      id: 'c1',
      orderIndex: 1,
      chordName: 'G7',
      measureNumber: 2,
      notes: [
        { orderIndex: 0, pitchMidi: 67, pitchClass: 7, noteName: 'G4', staff: 1, stepIndex: 0 },
      ],
    },
  ],
};

describe('defensePhraseJudge', () => {
  it('fires attack on step completion', () => {
    let state = createInitialPhraseJudgeState(0);
    const phrases = [phraseA];

    const first = evaluateDefensePhraseNoteOn(phrases, 1, state, 2);
    expect(first.attack).toBe(true);
    expect(first.phraseCompleted).toBe(false);
    state = first.nextState;

    const second = evaluateDefensePhraseNoteOn(phrases, 1, state, 4);
    expect(second.attack).toBe(true);
    state = second.nextState;

    const third = evaluateDefensePhraseNoteOn(phrases, 1, state, 7);
    expect(third.attack).toBe(true);
    expect(third.phraseCompleted).toBe(true);
    expect(third.completionCount).toBe(1);
    expect(third.pendingSwitch).toBe(true);
  });

  it('ignores wrong notes', () => {
    const state = createInitialPhraseJudgeState(0);
    const result = evaluateDefensePhraseNoteOn([phraseA], 1, state, 0);
    expect(result.attack).toBe(false);
    expect(result.nextState).toBe(state);
  });

  it('nextPhraseIndex wraps', () => {
    expect(nextPhraseIndex([phraseA, { ...phraseA, id: 'b', orderIndex: 1 }], 1)).toBe(0);
  });
});
