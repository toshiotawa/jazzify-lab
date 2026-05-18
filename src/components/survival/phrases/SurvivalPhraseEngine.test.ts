import {
  createInitialPhraseState,
  evaluatePhraseNoteOn,
} from './SurvivalPhraseEngine';
import type { SurvivalPhraseDefinition } from '@/utils/survivalPhraseDefinitions';

const samplePhrase: SurvivalPhraseDefinition = {
  id: 'p1',
  mapCategory: 'phrases',
  stageNumber: 1,
  title: 'Test',
  bgmUrl: null,
  keyFifths: 0,
  chords: [
    {
      id: 'c0',
      orderIndex: 0,
      chordName: 'Dm7',
      measureNumber: 1,
      notes: [
        { orderIndex: 0, pitchMidi: 62, pitchClass: 2, noteName: 'D4', staff: 1 },
        { orderIndex: 1, pitchMidi: 64, pitchClass: 4, noteName: 'E4', staff: 1 },
        { orderIndex: 2, pitchMidi: 65, pitchClass: 5, noteName: 'F4', staff: 1 },
        { orderIndex: 3, pitchMidi: 67, pitchClass: 7, noteName: 'G4', staff: 1 },
      ],
    },
    {
      id: 'c1',
      orderIndex: 1,
      chordName: 'G7',
      measureNumber: 2,
      notes: [
        { orderIndex: 0, pitchMidi: 64, pitchClass: 4, noteName: 'E4', staff: 1 },
        { orderIndex: 1, pitchMidi: 62, pitchClass: 2, noteName: 'D4', staff: 1 },
      ],
    },
    {
      id: 'c2',
      orderIndex: 2,
      chordName: 'CM7',
      measureNumber: 3,
      notes: [
        { orderIndex: 0, pitchMidi: 67, pitchClass: 7, noteName: 'G4', staff: 1 },
      ],
    },
  ],
};

describe('SurvivalPhraseEngine', () => {
  it('progresses through Dm7 notes then advances to G7', () => {
    let state = createInitialPhraseState(samplePhrase);
    expect(state.chordIndex).toBe(0);
    expect(state.targetNoteIndex).toBe(0);

    const r1 = evaluatePhraseNoteOn(state, 2);
    expect(r1.result).toBe('progress');
    state = r1.nextState;
    expect(state.targetNoteIndex).toBe(1);

    const r2 = evaluatePhraseNoteOn(state, 4);
    expect(r2.result).toBe('progress');
    state = r2.nextState;

    const r3 = evaluatePhraseNoteOn(state, 5);
    expect(r3.result).toBe('progress');
    state = r3.nextState;

    const r4 = evaluatePhraseNoteOn(state, 7);
    expect(r4.result).toBe('measure-complete');
    state = r4.nextState;
    expect(state.chordIndex).toBe(1);
    expect(state.targetNoteIndex).toBe(0);
  });

  it('resets current chord on wrong pitch class', () => {
    let state = createInitialPhraseState(samplePhrase);
    const ok = evaluatePhraseNoteOn(state, 2);
    state = ok.nextState;
    expect(state.correctNoteIndices.size).toBe(1);

    const miss = evaluatePhraseNoteOn(state, 0);
    expect(miss.result).toBe('miss');
    expect(miss.nextState.correctNoteIndices.size).toBe(0);
    expect(miss.nextState.targetNoteIndex).toBe(0);
    expect(miss.nextState.chordIndex).toBe(0);
  });

  it('loops from CM7 back to Dm7', () => {
    const state = {
      ...createInitialPhraseState(samplePhrase),
      chordIndex: 2,
      targetNoteIndex: 0,
    };
    const done = evaluatePhraseNoteOn(state, 7);
    expect(done.result).toBe('measure-complete');
    expect(done.nextState.chordIndex).toBe(0);
  });

  it('resets on out-of-chord note', () => {
    const state = createInitialPhraseState(samplePhrase);
    const miss = evaluatePhraseNoteOn(state, 0);
    expect(miss.result).toBe('miss');
    expect(miss.nextState.chordIndex).toBe(0);
  });
});
