import {
  advanceChordStep,
  getPhraseChordSteps,
  type PhraseChordStepNote,
} from './phraseChordSteps';

const legacyNotes: readonly PhraseChordStepNote[] = [
  { pitchClass: 5 },
  { pitchClass: 8 },
  { pitchClass: 5 },
];

const chordNotes: readonly PhraseChordStepNote[] = [
  { pitchClass: 5, stepIndex: 0 },
  { pitchClass: 5, stepIndex: 1 },
  { pitchClass: 8, stepIndex: 1 },
  { pitchClass: 5, stepIndex: 2 },
];

describe('getPhraseChordSteps', () => {
  it('treats each legacy note as its own step when stepIndex is omitted', () => {
    const { steps } = getPhraseChordSteps(legacyNotes);
    expect(steps).toHaveLength(3);
    expect(steps.map((step) => step.noteIndices)).toEqual([[0], [1], [2]]);
  });

  it('groups notes with the same stepIndex vertically', () => {
    const { steps } = getPhraseChordSteps(chordNotes);
    expect(steps).toHaveLength(3);
    expect(steps[1]?.noteIndices).toEqual([1, 2]);
    expect(steps[1]?.pitchClasses).toEqual([5, 8]);
  });
});

describe('advanceChordStep', () => {
  it('accepts chord tones in either order before advancing', () => {
    const { steps } = getPhraseChordSteps(chordNotes);
    let state = {
      targetStepIndex: 0,
      correctNoteIndices: new Set<number>(),
      revealedNoteIndices: new Set<number>(),
    };

    state = advanceChordStep(chordNotes, steps, state, 5).nextState;
    expect(state.targetStepIndex).toBe(1);

    const afterAb = advanceChordStep(chordNotes, steps, state, 8);
    expect(afterAb.result).toBe('progress');
    expect(afterAb.nextState.targetStepIndex).toBe(1);
    expect(afterAb.nextState.correctNoteIndices).toEqual(new Set([0, 2]));

    const afterSecondF = advanceChordStep(chordNotes, steps, afterAb.nextState, 5);
    expect(afterSecondF.result).toBe('progress');
    expect(afterSecondF.nextState.targetStepIndex).toBe(2);
    expect(afterSecondF.nextState.correctNoteIndices).toEqual(new Set([0, 1, 2]));
  });

  it('holds when replaying an already matched pitch in the current chord step', () => {
    const { steps } = getPhraseChordSteps(chordNotes);
    const state = {
      targetStepIndex: 1,
      correctNoteIndices: new Set([0, 1]),
      revealedNoteIndices: new Set([0, 1]),
    };

    const hold = advanceChordStep(chordNotes, steps, state, 5);
    expect(hold.result).toBe('chord-hold');
    expect(hold.nextState).toBe(state);
  });

  it('misses when the current chord step is incomplete and the pitch is not required', () => {
    const { steps } = getPhraseChordSteps(chordNotes);
    const state = {
      targetStepIndex: 1,
      correctNoteIndices: new Set([0, 1]),
      revealedNoteIndices: new Set([0, 1]),
    };

    const miss = advanceChordStep(chordNotes, steps, state, 7);
    expect(miss.result).toBe('miss');
    expect(miss.nextState).toEqual(state);
  });

  it('does not rewind when replaying opening pitch mid-phrase (Fa So La Fa Mi Re)', () => {
    const faSoLaFaMiRe: readonly PhraseChordStepNote[] = [
      { pitchClass: 5 },
      { pitchClass: 7 },
      { pitchClass: 9 },
      { pitchClass: 5 },
      { pitchClass: 4 },
      { pitchClass: 2 },
    ];
    const { steps } = getPhraseChordSteps(faSoLaFaMiRe);
    let state = {
      targetStepIndex: 0,
      correctNoteIndices: new Set<number>(),
      revealedNoteIndices: new Set<number>(),
    };

    state = advanceChordStep(faSoLaFaMiRe, steps, state, 5).nextState;
    state = advanceChordStep(faSoLaFaMiRe, steps, state, 7).nextState;
    expect(state.targetStepIndex).toBe(2);

    const wrongFa = advanceChordStep(faSoLaFaMiRe, steps, state, 5);
    expect(wrongFa.result).toBe('miss');
    expect(wrongFa.nextState).toEqual(state);

    state = advanceChordStep(faSoLaFaMiRe, steps, state, 9).nextState;
    state = advanceChordStep(faSoLaFaMiRe, steps, state, 5).nextState;
    state = advanceChordStep(faSoLaFaMiRe, steps, state, 4).nextState;
    const done = advanceChordStep(faSoLaFaMiRe, steps, state, 2);
    expect(done.result).toBe('measure-complete');
  });
});
