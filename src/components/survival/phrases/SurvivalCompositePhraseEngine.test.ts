/**
 * Survival composite phrase judgment (parallel selection → lock).
 */
import type {
  SurvivalPhraseChord,
  SurvivalPhraseDefinition,
} from '@/utils/survivalPhraseDefinitions';
import {
  compositeSelectionGreenPrefixLength,
  createInitialCompositePhraseRuntimeState,
  evaluateCompositePhraseNoteOn,
} from './SurvivalCompositePhraseEngine';

function chordWithPcs(stageLabel: number, pcs: readonly number[]): SurvivalPhraseChord {
  const notes = pcs.map((pc, idx) => ({
    orderIndex: idx,
    pitchMidi: pc + 60,
    pitchClass: pc % 12,
    noteName: 'X',
    staff: 1 as const,
  }));
  return {
    id: `c-${stageLabel}`,
    orderIndex: 0,
    chordName: 'T',
    measureNumber: 1,
    notes,
  };
}

function chordChain(stageLabel: number, chains: readonly (readonly number[])[]): SurvivalPhraseDefinition {
  const chords = chains.map((pcs, chordIdx) => {
    const base = chordWithPcs(stageLabel * 100 + chordIdx, pcs);
    return {
      ...base,
      id: `chain-${stageLabel}-${chordIdx}`,
      orderIndex: chordIdx,
      measureNumber: chordIdx + 1,
    };
  });

  return {
    id: `p-${stageLabel}`,
    mapCategory: 'phrases',
    stageNumber: stageLabel,
    title: `Phrase ${stageLabel}`,
    bgmUrl: null,
    keyFifths: 0,
    chords,
  };
}

describe('SurvivalCompositePhraseEngine', () => {
  it('parses parallel then locks when only one branch matches next pitch', () => {
    const p1 = chordChain(11, [[0, 4, 7], [2]]); // C E G | D
    const p2 = chordChain(12, [[0, 4, 9], [2]]); // C E A | D
    let state = createInitialCompositePhraseRuntimeState([p1, p2]);

    let ev = evaluateCompositePhraseNoteOn(state, 0);
    expect(ev.result).toBe('progress');
    state = ev.nextState;
    expect(state.candidates.length).toBe(2);
    expect(state.lockedSourceStageNumber).toBeNull();

    ev = evaluateCompositePhraseNoteOn(state, 4);
    expect(ev.result).toBe('progress');
    state = ev.nextState;
    expect(state.candidates.length).toBe(2);

    ev = evaluateCompositePhraseNoteOn(state, 7);
    expect(ev.result).toBe('measure-complete');
    state = ev.nextState;
    expect(state.candidates.length).toBe(1);
    expect(state.lockedSourceStageNumber).toBe(11);

    ev = evaluateCompositePhraseNoteOn(state, 9);
    expect(ev.result).toBe('miss');
    state = ev.nextState;
    expect(state.candidates.length).toBe(2);
    expect(state.lockedSourceStageNumber).toBeNull();
  });

  it('shows common revealed prefix length while parallel', () => {
    const p1 = chordChain(21, [[0, 4, 7]]);
    const p2 = chordChain(22, [[0, 4, 9]]);
    let state = createInitialCompositePhraseRuntimeState([p1, p2]);
    state = evaluateCompositePhraseNoteOn(state, 0).nextState;
    expect(compositeSelectionGreenPrefixLength(state)).toBe(1);
    state = evaluateCompositePhraseNoteOn(state, 4).nextState;
    expect(compositeSelectionGreenPrefixLength(state)).toBe(2);
  });

  it('emits phrase-complete on last chord last note without looping', () => {
    const p = chordChain(31, [[0, 11], [4, 5]]);
    let state = createInitialCompositePhraseRuntimeState([p]);
    let ev = evaluateCompositePhraseNoteOn(state, 0);
    expect(ev.result).toBe('progress');
    state = ev.nextState;
    ev = evaluateCompositePhraseNoteOn(state, 11);
    expect(ev.result).toBe('measure-complete');
    state = ev.nextState;
    ev = evaluateCompositePhraseNoteOn(state, 4);
    expect(ev.result).toBe('progress');
    state = ev.nextState;
    ev = evaluateCompositePhraseNoteOn(state, 5);
    expect(ev.result).toBe('phrase-complete');
    state = ev.nextState;
    expect(state.candidates.length).toBe(1);
    expect(state.lastCompletedSourceStageNumber).toBe(31);
  });

  it('immediate lock when exactly one phrase matches opening pitch', () => {
    const pWide = chordChain(41, [[0, 2, 4]]);
    const pNarrow = chordChain(42, [[11, 0, 2]]);
    const state = createInitialCompositePhraseRuntimeState([pWide, pNarrow]);
    const ev = evaluateCompositePhraseNoteOn(state, 0);
    expect(ev.nextState.candidates.length).toBe(1);
    expect(ev.nextState.lockedSourceStageNumber).toBe(41);
  });

  it('completes phrases stage 1 sequence when locked (E D A F E D)', () => {
    const p1 = chordChain(1, [[4, 2, 9, 5, 4, 2]]);
    let state = createInitialCompositePhraseRuntimeState([p1]);
    let ev = evaluateCompositePhraseNoteOn(state, 4);
    expect(ev.result).toBe('progress');
    state = ev.nextState;
    expect(state.lockedSourceStageNumber).toBe(1);
    for (const pc of [2, 9, 5, 4, 2] as const) {
      ev = evaluateCompositePhraseNoteOn(state, pc);
      expect(ev.result).not.toBe('miss');
      state = ev.nextState;
    }
    expect(ev.result).toBe('phrase-complete');
  });

  it('repeat phrase-complete updates lastCompleted for repeat-damage heuristic', () => {
    const p = chordChain(51, [[0]]);
    let state = createInitialCompositePhraseRuntimeState([p]);
    let ev = evaluateCompositePhraseNoteOn(state, 0);
    expect(ev.result).toBe('phrase-complete');
    state = ev.nextState;
    expect(state.lastCompletedSourceStageNumber).toBe(51);
    ev = evaluateCompositePhraseNoteOn(state, 0);
    expect(ev.result).toBe('phrase-complete');
    state = ev.nextState;
    expect(state.lastCompletedSourceStageNumber).toBe(51);
  });
});
