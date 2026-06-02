/**
 * Composite phrase judgment (parallel KMP stream matching).
 */
import type { CompositePhraseChord, CompositePhraseDefinition } from '@/utils/compositePhraseEngine';
import {
  compositeSelectionGreenPrefixLength,
  createInitialCompositePhraseRuntimeState,
  evaluateCompositePhraseNoteOn,
} from '@/utils/compositePhraseEngine';

function chordWithPcs(stageLabel: number, pcs: readonly number[]): CompositePhraseChord {
  const notes = pcs.map((pc) => ({
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

function chordChain(stageLabel: number, chains: readonly (readonly number[])[]): CompositePhraseDefinition {
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
    sourcePhraseId: String(stageLabel),
    title: `Phrase ${stageLabel}`,
    chords,
  };
}

describe('compositePhraseEngine', () => {
  it('parses parallel then locks when only one branch matches next pitch', () => {
    const p1 = chordChain(11, [[0, 4, 7], [2]]);
    const p2 = chordChain(12, [[0, 4, 9], [2]]);
    let state = createInitialCompositePhraseRuntimeState([p1, p2]);

    let ev = evaluateCompositePhraseNoteOn(state, 0);
    expect(ev.result).toBe('progress');
    state = ev.nextState;
    expect(state.candidates.length).toBe(2);
    expect(state.primarySourcePhraseId).toBeNull();

    ev = evaluateCompositePhraseNoteOn(state, 4);
    expect(ev.result).toBe('progress');
    state = ev.nextState;
    expect(state.candidates.length).toBe(2);

    ev = evaluateCompositePhraseNoteOn(state, 7);
    expect(ev.result).toBe('measure-complete');
    state = ev.nextState;
    expect(state.candidates.length).toBe(2);
    expect(state.primarySourcePhraseId).toBe('11');

    ev = evaluateCompositePhraseNoteOn(state, 9);
    expect(ev.result).toBe('miss');
    state = ev.nextState;
    expect(state.candidates.length).toBe(2);
    expect(state.primarySourcePhraseId).toBeNull();
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
    expect(state.lastCompletedSourcePhraseId).toBe('31');
  });

  it('immediate primary when exactly one phrase matches opening pitch', () => {
    const pWide = chordChain(41, [[0, 2, 4]]);
    const pNarrow = chordChain(42, [[11, 0, 2]]);
    const state = createInitialCompositePhraseRuntimeState([pWide, pNarrow]);
    const ev = evaluateCompositePhraseNoteOn(state, 0);
    expect(ev.nextState.candidates.length).toBe(2);
    expect(ev.nextState.primarySourcePhraseId).toBe('41');
  });

  it('completes phrases stage 1 sequence when primary is set (E D A F E D)', () => {
    const p1 = chordChain(1, [[4, 2, 9, 5, 4, 2]]);
    let state = createInitialCompositePhraseRuntimeState([p1]);
    let ev = evaluateCompositePhraseNoteOn(state, 4);
    expect(ev.result).toBe('progress');
    state = ev.nextState;
    expect(state.primarySourcePhraseId).toBe('1');
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
    expect(state.lastCompletedSourcePhraseId).toBe('51');
    ev = evaluateCompositePhraseNoteOn(state, 0);
    expect(ev.result).toBe('phrase-complete');
    state = ev.nextState;
    expect(state.lastCompletedSourcePhraseId).toBe('51');
  });

  it('after measure-complete next chord may start with same pitch class as prior notes', () => {
    const p = chordChain(61, [[0, 4, 7], [4, 5]]);
    let state = createInitialCompositePhraseRuntimeState([p]);
    for (const pc of [0, 4] as const) {
      state = evaluateCompositePhraseNoteOn(state, pc).nextState;
    }
    const evChord1 = evaluateCompositePhraseNoteOn(state, 7);
    expect(evChord1.result).toBe('measure-complete');
    state = evChord1.nextState;
    const evNext = evaluateCompositePhraseNoteOn(state, 4);
    expect(evNext.result).not.toBe('miss');
  });

  it('Web iOS parity: evaluate each note-on in order without an input gate (E D A F E D)', () => {
    const p = chordChain(71, [[4, 2, 9, 5, 4, 2]]);
    let state = createInitialCompositePhraseRuntimeState([p]);
    const pcs = [4, 2, 9, 5, 4, 2] as const;
    for (const pc of pcs) {
      const ev = evaluateCompositePhraseNoteOn(state, pc);
      expect(ev.result).not.toBe('miss');
      state = ev.nextState;
    }
    expect(state.lastCompletedSourcePhraseId).toBe('71');
  });

  it('phrases stage 6 composite: DEFGED then AFE EDA DE without duplicate pc in same step', () => {
    const pcs = (stage: number, seq: readonly number[]) =>
      chordChain(stage, [seq]);
    const phrases = [
      pcs(1, [4, 2, 9, 5, 4, 2]),
      pcs(2, [4, 5, 9, 0, 4, 2]),
      pcs(3, [2, 4, 5, 7, 4, 2]),
      pcs(4, [4, 1, 2, 4, 5, 7]),
      pcs(5, [9, 5, 4, 2, 7, 5]),
    ];
    const freshAfterDefged = () => {
      let s = createInitialCompositePhraseRuntimeState(phrases);
      for (const pc of [2, 4, 5, 7, 4, 2] as const) {
        s = evaluateCompositePhraseNoteOn(s, pc).nextState;
      }
      return s;
    };
    for (const seq of [[9, 5, 4], [4, 2, 9], [2, 4]] as const) {
      let attempt = freshAfterDefged();
      for (const pc of seq) {
        const ev = evaluateCompositePhraseNoteOn(attempt, pc);
        expect(ev.result).not.toBe('miss');
        attempt = ev.nextState;
      }
    }
  });

  it('resyncs primary phrase when replaying opening pitch mid-phrase', () => {
    const p = chordChain(81, [[4, 2, 9, 5, 4, 2]]);
    let state = createInitialCompositePhraseRuntimeState([p]);
    state = evaluateCompositePhraseNoteOn(state, 4).nextState;
    state = evaluateCompositePhraseNoteOn(state, 2).nextState;
    state = evaluateCompositePhraseNoteOn(state, 9).nextState;
    expect(state.primarySourcePhraseId).toBe('81');

    const ev = evaluateCompositePhraseNoteOn(state, 4);
    expect(ev.result).toBe('resync');
    expect(ev.nextState.candidates[0]?.targetNoteIndex).toBe(1);
  });

  it('keeps evaluating all candidates while primary is set', () => {
    const p1 = chordChain(91, [[4, 2, 9, 5, 4, 2]]);
    const p2 = chordChain(92, [[9, 5, 4, 2, 7, 5]]);
    let state = createInitialCompositePhraseRuntimeState([p1, p2]);
    state = evaluateCompositePhraseNoteOn(state, 4).nextState;
    state = evaluateCompositePhraseNoteOn(state, 2).nextState;
    expect(state.primarySourcePhraseId).toBe('91');
    expect(state.candidates.length).toBe(2);

    const ev = evaluateCompositePhraseNoteOn(state, 9);
    expect(ev.result).not.toBe('miss');
    expect(ev.nextState.candidates.length).toBe(2);
  });
});
