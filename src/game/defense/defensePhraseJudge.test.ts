import {
  createInitialPhraseJudgeState,
  evaluateDefensePhraseNoteOn,
  getDefensePhraseKeyboardHints,
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
  it('fires attack on each correct note in note mode', () => {
    let state = createInitialPhraseJudgeState(0);
    const phrases = [phraseA];

    const first = evaluateDefensePhraseNoteOn(phrases, 1, state, 2);
    expect(first.attack).toBe(true);
    expect(first.phraseCompleted).toBe(false);
    state = first.nextState;

    const second = evaluateDefensePhraseNoteOn(phrases, 1, state, 4);
    expect(second.attack).toBe(true);
    expect(second.phraseCompleted).toBe(false);
    state = second.nextState;

    const third = evaluateDefensePhraseNoteOn(phrases, 1, state, 7);
    expect(third.attack).toBe(true);
    expect(third.phraseCompleted).toBe(true);
    expect(third.completionCount).toBe(1);
    expect(third.pendingSwitch).toBe(true);
  });

  it('fires attack only on measure complete in measure mode', () => {
    let state = createInitialPhraseJudgeState(0);
    const phrases = [phraseA];

    const first = evaluateDefensePhraseNoteOn(phrases, 1, state, 2, false, 'measure');
    expect(first.attack).toBe(false);
    expect(first.phraseCompleted).toBe(false);
    state = first.nextState;

    const second = evaluateDefensePhraseNoteOn(phrases, 1, state, 4, false, 'measure');
    expect(second.attack).toBe(true);
    expect(second.phraseCompleted).toBe(false);
    state = second.nextState;

    const third = evaluateDefensePhraseNoteOn(phrases, 1, state, 7, false, 'measure');
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

  it('does not set pendingSwitch when autoAdvance is false', () => {
    let state = createInitialPhraseJudgeState(0);
    const phrases = [phraseA];

    const first = evaluateDefensePhraseNoteOn(phrases, 1, state, 2, false, 'note', false);
    state = first.nextState;
    const second = evaluateDefensePhraseNoteOn(phrases, 1, state, 4, false, 'note', false);
    state = second.nextState;
    const third = evaluateDefensePhraseNoteOn(phrases, 1, state, 7, false, 'note', false);

    expect(third.phraseCompleted).toBe(true);
    expect(third.completionCount).toBe(1);
    expect(third.pendingSwitch).toBe(false);
    expect(third.nextState.pendingSwitch).toBe(false);
  });

  it('voice sequential requires lowest MIDI first in a simultaneous chord', () => {
    const chordPhrase: DefensePhrase = {
      ...phraseA,
      chords: [
        {
          id: 'c-sim',
          orderIndex: 0,
          chordName: 'C',
          measureNumber: 1,
          notes: [
            { orderIndex: 0, pitchMidi: 67, pitchClass: 7, noteName: 'G4', staff: 1, stepIndex: 0 },
            { orderIndex: 1, pitchMidi: 60, pitchClass: 0, noteName: 'C4', staff: 1, stepIndex: 0 },
            { orderIndex: 2, pitchMidi: 64, pitchClass: 4, noteName: 'E4', staff: 1, stepIndex: 0 },
          ],
        },
      ],
    };
    const phrases = [chordPhrase];
    const initial = createInitialPhraseJudgeState(0);

    const skipHigh = evaluateDefensePhraseNoteOn(phrases, 1, initial, 7, true);
    expect(skipHigh.attack).toBe(false);
    expect(skipHigh.nextState).toBe(initial);

    const anyOrderMidi = evaluateDefensePhraseNoteOn(phrases, 1, initial, 7, false);
    expect(anyOrderMidi.nextState.correctNoteIndices.size).toBe(1);

    const lowest = evaluateDefensePhraseNoteOn(phrases, 1, initial, 0, true);
    expect(lowest.nextState.correctNoteIndices.size).toBe(1);
    expect(lowest.attack).toBe(true);

    const middle = evaluateDefensePhraseNoteOn(phrases, 1, lowest.nextState, 4, true);
    expect(middle.nextState.correctNoteIndices.size).toBe(2);
    expect(middle.attack).toBe(true);

    const top = evaluateDefensePhraseNoteOn(phrases, 1, middle.nextState, 7, true);
    expect(top.attack).toBe(true);
    expect(top.phraseCompleted).toBe(true);

    const hints = getDefensePhraseKeyboardHints(phrases, initial, true);
    expect(hints.nextMidi).toBe(60);
    expect(hints.pendingMidis).toEqual(expect.arrayContaining([64, 67]));
    expect(hints.completedMidis).toEqual([]);
  });
});
