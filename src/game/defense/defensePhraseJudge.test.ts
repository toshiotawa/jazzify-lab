import {
  createInitialPhraseJudgeState,
  evaluateDefensePhraseNoteOn,
  getDefenseExpectedPitchCandidates,
  getDefensePhraseKeyboardHints,
  isDefenseWaitingForSamePitchRepeat,
  nextPhraseIndex,
} from '@/game/defense/defensePhraseJudge';
import type { DefensePhrase } from '@/game/defense/defenseTypes';

const phraseA: DefensePhrase = {
  id: 'a',
  orderIndex: 0,
  title: 'A',
  audioUrl: 'https://example.com/a.mp3',
  loopStartMeasure: null,
  loopEndMeasure: null,
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
    expect(first.measureCompleted).toBe(false);
    state = first.nextState;

    const second = evaluateDefensePhraseNoteOn(phrases, 1, state, 4);
    expect(second.attack).toBe(true);
    expect(second.phraseCompleted).toBe(false);
    expect(second.measureCompleted).toBe(true);
    state = second.nextState;

    const third = evaluateDefensePhraseNoteOn(phrases, 1, state, 7);
    expect(third.attack).toBe(true);
    expect(third.phraseCompleted).toBe(true);
    expect(third.measureCompleted).toBe(true);
    expect(third.completionCount).toBe(1);
    expect(third.pendingSwitch).toBe(true);
  });

  it('fires attack only on measure complete in measure mode', () => {
    let state = createInitialPhraseJudgeState(0);
    const phrases = [phraseA];

    const first = evaluateDefensePhraseNoteOn(phrases, 1, state, 2, false, 'measure');
    expect(first.attack).toBe(false);
    expect(first.phraseCompleted).toBe(false);
    expect(first.measureCompleted).toBe(false);
    state = first.nextState;

    const second = evaluateDefensePhraseNoteOn(phrases, 1, state, 4, false, 'measure');
    expect(second.attack).toBe(true);
    expect(second.phraseCompleted).toBe(false);
    expect(second.measureCompleted).toBe(true);
    state = second.nextState;

    const third = evaluateDefensePhraseNoteOn(phrases, 1, state, 7, false, 'measure');
    expect(third.attack).toBe(true);
    expect(third.phraseCompleted).toBe(true);
    expect(third.measureCompleted).toBe(true);
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

  it('rejects G7-only pitch classes before Dm7 is complete', () => {
    const grandStaffPhrase: DefensePhrase = {
      id: 'grand',
      orderIndex: 0,
      title: 'Dm7 | G7',
      audioUrl: 'https://example.com/grand.mp3',
      loopStartMeasure: null,
      loopEndMeasure: null,
      keyFifths: null,
      requiredCompletionCount: null,
      chords: [
        {
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
        },
        {
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
        },
      ],
    };
    const phrases = [grandStaffPhrase];
    const initial = createInitialPhraseJudgeState(0);

    const gOnly = evaluateDefensePhraseNoteOn(phrases, 1, initial, 7);
    expect(gOnly.attack).toBe(false);
    expect(gOnly.nextState).toBe(initial);

    const bOnly = evaluateDefensePhraseNoteOn(phrases, 1, initial, 11);
    expect(bOnly.attack).toBe(false);
    expect(bOnly.nextState).toBe(initial);

    const commonF = evaluateDefensePhraseNoteOn(phrases, 1, initial, 5);
    expect(commonF.attack).toBe(true);
    expect(commonF.nextState.chordIndex).toBe(0);
    expect(commonF.nextState.correctNoteIndices).toEqual(new Set([1, 4]));
    expect(commonF.nextState.correctNoteIndices.has(0)).toBe(false);

    let state = commonF.nextState;
    for (const pc of [2, 9] as const) {
      const step = evaluateDefensePhraseNoteOn(phrases, 1, state, pc);
      expect(step.nextState.chordIndex).toBe(0);
      state = step.nextState;
    }
    const afterDm7 = evaluateDefensePhraseNoteOn(phrases, 1, state, 0);
    expect(afterDm7.measureCompleted).toBe(true);
    expect(afterDm7.nextState.chordIndex).toBe(1);
    expect(afterDm7.nextState.correctNoteIndices.size).toBe(0);
  });

  it('fires attack only when voicing completes in chord voicing mode', () => {
    const voicingPhrase: DefensePhrase = {
      ...phraseA,
      chords: [
        {
          id: 'cv0',
          orderIndex: 0,
          chordName: 'Gm7(9)',
          measureNumber: 1,
          notes: [
            { orderIndex: 0, pitchMidi: 53, pitchClass: 5, noteName: 'F3', staff: 2, stepIndex: 0 },
            { orderIndex: 1, pitchMidi: 58, pitchClass: 10, noteName: 'Bb3', staff: 2, stepIndex: 0 },
            { orderIndex: 2, pitchMidi: 62, pitchClass: 2, noteName: 'D4', staff: 1, stepIndex: 0 },
            { orderIndex: 3, pitchMidi: 69, pitchClass: 9, noteName: 'A4', staff: 1, stepIndex: 0 },
          ],
        },
      ],
    };
    const phrases = [voicingPhrase];
    const initial = createInitialPhraseJudgeState(0);
    const cvOpts = ['measure', true, 'chord_voicing', true] as const;

    const first = evaluateDefensePhraseNoteOn(phrases, 1, initial, 5, false, ...cvOpts);
    expect(first.attack).toBe(false);
    let state = first.nextState;

    const second = evaluateDefensePhraseNoteOn(phrases, 1, state, 10, false, ...cvOpts);
    expect(second.attack).toBe(false);
    state = second.nextState;

    const third = evaluateDefensePhraseNoteOn(phrases, 1, state, 2, false, ...cvOpts);
    expect(third.attack).toBe(false);
    state = third.nextState;

    const complete = evaluateDefensePhraseNoteOn(phrases, 1, state, 9, false, ...cvOpts);
    expect(complete.attack).toBe(true);
    expect(complete.measureCompleted).toBe(true);
  });

  it('fires attack on voicing complete even when attack_trigger is note', () => {
    const voicingPhrase: DefensePhrase = {
      ...phraseA,
      chords: [
        {
          id: 'cv0',
          orderIndex: 0,
          chordName: 'Gm7(9)',
          measureNumber: 1,
          notes: [
            { orderIndex: 0, pitchMidi: 53, pitchClass: 5, noteName: 'F3', staff: 2, stepIndex: 0 },
            { orderIndex: 1, pitchMidi: 58, pitchClass: 10, noteName: 'Bb3', staff: 2, stepIndex: 0 },
            { orderIndex: 2, pitchMidi: 62, pitchClass: 2, noteName: 'D4', staff: 1, stepIndex: 0 },
            { orderIndex: 3, pitchMidi: 69, pitchClass: 9, noteName: 'A4', staff: 1, stepIndex: 0 },
          ],
        },
      ],
    };
    const phrases = [voicingPhrase];
    const initial = createInitialPhraseJudgeState(0);

    const first = evaluateDefensePhraseNoteOn(
      phrases, 1, initial, 5, false, 'note', true, 'chord_voicing', true,
    );
    expect(first.attack).toBe(false);
    let state = first.nextState;

    const second = evaluateDefensePhraseNoteOn(
      phrases, 1, state, 10, false, 'note', true, 'chord_voicing', true,
    );
    expect(second.attack).toBe(false);
    state = second.nextState;

    const third = evaluateDefensePhraseNoteOn(
      phrases, 1, state, 2, false, 'note', true, 'chord_voicing', true,
    );
    expect(third.attack).toBe(false);
    state = third.nextState;

    const complete = evaluateDefensePhraseNoteOn(
      phrases, 1, state, 9, false, 'note', true, 'chord_voicing', true,
    );
    expect(complete.attack).toBe(true);
  });

  it('fires attack per step when one measure has multiple voicings', () => {
    const twoStepPhrase: DefensePhrase = {
      ...phraseA,
      chords: [
        {
          id: 'dm7-g7',
          orderIndex: 0,
          chordName: 'Dm7 | G7',
          measureNumber: 1,
          notes: [
            { orderIndex: 0, pitchMidi: 50, pitchClass: 2, noteName: 'D3', staff: 2, stepIndex: 0 },
            { orderIndex: 1, pitchMidi: 53, pitchClass: 5, noteName: 'F3', staff: 2, stepIndex: 0 },
            { orderIndex: 2, pitchMidi: 57, pitchClass: 9, noteName: 'A3', staff: 2, stepIndex: 0 },
            { orderIndex: 3, pitchMidi: 60, pitchClass: 0, noteName: 'C4', staff: 1, stepIndex: 0 },
            { orderIndex: 4, pitchMidi: 43, pitchClass: 7, noteName: 'G2', staff: 2, stepIndex: 1 },
            { orderIndex: 5, pitchMidi: 53, pitchClass: 5, noteName: 'F3', staff: 2, stepIndex: 1 },
            { orderIndex: 6, pitchMidi: 59, pitchClass: 11, noteName: 'B3', staff: 2, stepIndex: 1 },
            { orderIndex: 7, pitchMidi: 62, pitchClass: 2, noteName: 'D4', staff: 1, stepIndex: 1 },
          ],
        },
      ],
    };
    const phrases = [twoStepPhrase];
    let state = createInitialPhraseJudgeState(0);
    const cvOpts = ['measure', true, 'chord_voicing', true] as const;

    for (const pc of [2, 5, 9] as const) {
      const step = evaluateDefensePhraseNoteOn(phrases, 1, state, pc, false, ...cvOpts);
      expect(step.attack).toBe(false);
      state = step.nextState;
    }

    const dm7Complete = evaluateDefensePhraseNoteOn(phrases, 1, state, 0, false, ...cvOpts);
    expect(dm7Complete.attack).toBe(true);
    expect(dm7Complete.measureCompleted).toBe(false);
    state = dm7Complete.nextState;

    for (const pc of [7, 5, 11] as const) {
      const step = evaluateDefensePhraseNoteOn(phrases, 1, state, pc, false, ...cvOpts);
      expect(step.attack).toBe(false);
      state = step.nextState;
    }

    const g7Complete = evaluateDefensePhraseNoteOn(phrases, 1, state, 2, false, ...cvOpts);
    expect(g7Complete.attack).toBe(true);
    expect(g7Complete.measureCompleted).toBe(true);
  });

  it('plays root only when labeled voicing completes in chord voicing mode', () => {
    const voicingPhrase: DefensePhrase = {
      ...phraseA,
      chords: [
        {
          id: 'cv0',
          orderIndex: 0,
          chordName: 'Gm7(9)',
          measureNumber: 1,
          notes: [
            { orderIndex: 0, pitchMidi: 53, pitchClass: 5, noteName: 'F3', staff: 2, stepIndex: 0 },
            { orderIndex: 1, pitchMidi: 58, pitchClass: 10, noteName: 'Bb3', staff: 2, stepIndex: 0 },
            { orderIndex: 2, pitchMidi: 62, pitchClass: 2, noteName: 'D4', staff: 1, stepIndex: 0 },
            { orderIndex: 3, pitchMidi: 69, pitchClass: 9, noteName: 'A4', staff: 1, stepIndex: 0 },
          ],
        },
      ],
    };
    const phrases = [voicingPhrase];
    const initial = createInitialPhraseJudgeState(0);

    const first = evaluateDefensePhraseNoteOn(
      phrases,
      1,
      initial,
      5,
      false,
      'measure',
      true,
      'chord_voicing',
      true,
    );
    expect(first.playRootMidi).toBeNull();

    let state = first.nextState;
    const second = evaluateDefensePhraseNoteOn(
      phrases,
      1,
      state,
      10,
      false,
      'measure',
      true,
      'chord_voicing',
      true,
    );
    expect(second.playRootMidi).toBeNull();
    state = second.nextState;

    const third = evaluateDefensePhraseNoteOn(
      phrases,
      1,
      state,
      2,
      false,
      'measure',
      true,
      'chord_voicing',
      true,
    );
    expect(third.playRootMidi).toBeNull();
    state = third.nextState;

    const complete = evaluateDefensePhraseNoteOn(
      phrases,
      1,
      state,
      9,
      false,
      'measure',
      true,
      'chord_voicing',
      true,
    );
    expect(complete.playRootMidi).not.toBeNull();
    expect(complete.measureCompleted).toBe(true);
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

  it('sets repeat mask when next expected pitch matches last accepted', () => {
    const sameNotePhrase: DefensePhrase = {
      id: 'repeat',
      orderIndex: 0,
      title: 'Repeat',
      audioUrl: 'https://example.com/repeat.mp3',
      loopStartMeasure: null,
      loopEndMeasure: null,
      keyFifths: null,
      requiredCompletionCount: null,
      chords: [
        {
          id: 'f-repeat',
          orderIndex: 0,
          chordName: 'F',
          measureNumber: 1,
          notes: [
            { orderIndex: 0, pitchMidi: 65, pitchClass: 5, noteName: 'F4', staff: 1, stepIndex: 0 },
            { orderIndex: 1, pitchMidi: 65, pitchClass: 5, noteName: 'F4', staff: 1, stepIndex: 1 },
            { orderIndex: 2, pitchMidi: 65, pitchClass: 5, noteName: 'F4', staff: 1, stepIndex: 2 },
          ],
        },
        {
          id: 'c-repeat',
          orderIndex: 1,
          chordName: 'C',
          measureNumber: 2,
          notes: [
            { orderIndex: 0, pitchMidi: 72, pitchClass: 0, noteName: 'C5', staff: 1, stepIndex: 0 },
            { orderIndex: 1, pitchMidi: 72, pitchClass: 0, noteName: 'C5', staff: 1, stepIndex: 1 },
          ],
        },
      ],
    };
    let state = createInitialPhraseJudgeState(0);
    const afterFirst = evaluateDefensePhraseNoteOn([sameNotePhrase], 1, state, 5, true);
    state = afterFirst.nextState;
    expect(isDefenseWaitingForSamePitchRepeat([sameNotePhrase], state, true)).toBe(true);
    const candidates = getDefenseExpectedPitchCandidates([sameNotePhrase], state, true);
    expect(candidates.repeatPitchClassMask).toBe(1 << 5);

    const afterSecond = evaluateDefensePhraseNoteOn([sameNotePhrase], 1, state, 5, true);
    state = afterSecond.nextState;
    expect(isDefenseWaitingForSamePitchRepeat([sameNotePhrase], state, true)).toBe(true);
    expect(getDefenseExpectedPitchCandidates([sameNotePhrase], state, true).repeatPitchClassMask).toBe(1 << 5);

    const afterThird = evaluateDefensePhraseNoteOn([sameNotePhrase], 1, state, 5, true);
    state = afterThird.nextState;
    expect(isDefenseWaitingForSamePitchRepeat([sameNotePhrase], state, true)).toBe(false);
    expect(getDefenseExpectedPitchCandidates([sameNotePhrase], state, true).repeatPitchClassMask).toBe(0);

    const afterC = evaluateDefensePhraseNoteOn([sameNotePhrase], 1, state, 0, true);
    state = afterC.nextState;
    expect(isDefenseWaitingForSamePitchRepeat([sameNotePhrase], state, true)).toBe(true);
    expect(getDefenseExpectedPitchCandidates([sameNotePhrase], state, true).repeatPitchClassMask).toBe(1 << 0);
  });

  it('getDefenseExpectedPitchCandidates はフレーズ末尾でループ先頭も含める', () => {
    const state = {
      ...createInitialPhraseJudgeState(0),
      chordIndex: 1,
      targetStepIndex: 0,
      correctNoteIndices: new Set<number>(),
    };
    const candidates = getDefenseExpectedPitchCandidates([phraseA], state, true);
    expect(candidates.midis).toEqual(expect.arrayContaining([67, 62]));
  });
});
