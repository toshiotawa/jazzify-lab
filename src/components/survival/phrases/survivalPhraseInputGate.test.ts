import {
  acceptPhraseNoteOn,
  releasePhraseNote,
  resetPhraseNoteGate,
  syncPhraseInputGateAfterEvaluation,
} from './survivalPhraseInputGate';
import {
  createInitialCompositePhraseRuntimeState,
  evaluateCompositePhraseNoteOn,
} from './SurvivalCompositePhraseEngine';
import type { SurvivalPhraseDefinition } from '@/utils/survivalPhraseDefinitions';

function chordChain(stageLabel: number, chains: readonly (readonly number[])[]): SurvivalPhraseDefinition {
  const chords = chains.map((pcs, chordIdx) => {
    const notes = pcs.map((pc, idx) => ({
      orderIndex: idx,
      pitchMidi: pc + 60,
      pitchClass: pc % 12,
      noteName: 'X',
      staff: 1 as const,
    }));
    return {
      id: `chain-${stageLabel}-${chordIdx}`,
      orderIndex: chordIdx,
      chordName: 'T',
      measureNumber: chordIdx + 1,
      notes,
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

describe('survivalPhraseInputGate', () => {
  it('accepts first note-on per pitch class and rejects held repeats', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    expect(acceptPhraseNoteOn(held, 67)).toBe(true);
    expect(acceptPhraseNoteOn(held, 64)).toBe(false);
    expect(acceptPhraseNoteOn(held, 67)).toBe(false);
  });

  it('allows the same pitch class again after note-off', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    expect(acceptPhraseNoteOn(held, 64)).toBe(false);
    releasePhraseNote(held, 64);
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });

  it('reset clears all held pitch classes', () => {
    const held = new Set<number>();
    acceptPhraseNoteOn(held, 64);
    acceptPhraseNoteOn(held, 67);
    resetPhraseNoteGate(held);
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });

  it('measure-complete resets gate so same pitch class accepts again', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    syncPhraseInputGateAfterEvaluation(held, 'measure-complete', 4);
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });

  it('phrase-complete resets gate same as measure-complete', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    syncPhraseInputGateAfterEvaluation(held, 'phrase-complete', 4);
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });

  it('miss resets gate', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    syncPhraseInputGateAfterEvaluation(held, 'miss', 4);
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });

  it('progress releases played pitch class so duplicate PC in same measure can re-enter', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    expect(acceptPhraseNoteOn(held, 64)).toBe(false);
    syncPhraseInputGateAfterEvaluation(held, 'progress', 4);
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
  });

  it('rejects held repeat at same target before progress sync', () => {
    const held = new Set<number>();
    expect(acceptPhraseNoteOn(held, 64)).toBe(true);
    expect(acceptPhraseNoteOn(held, 64)).toBe(false);
  });

  it('gate + composite engine accepts E D A F E D with duplicate pitch classes', () => {
    const p = chordChain(1, [[4, 2, 9, 5, 4, 2]]);
    let state = createInitialCompositePhraseRuntimeState([p]);
    const held = new Set<number>();
    const pcs = [4, 2, 9, 5, 4, 2] as const;
    for (const pc of pcs) {
      expect(acceptPhraseNoteOn(held, pc)).toBe(true);
      const ev = evaluateCompositePhraseNoteOn(state, pc);
      expect(ev.result).not.toBe('miss');
      syncPhraseInputGateAfterEvaluation(held, ev.result, pc);
      state = ev.nextState;
    }
    expect(state.lastCompletedSourceStageNumber).toBe(1);
  });
});
