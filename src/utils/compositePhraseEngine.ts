/**
 * Composite phrase: parallel candidate filtering then single phrase (no chord loop).
 */
export interface CompositePhraseChordNote {
  readonly pitchClass: number;
  readonly noteName: string;
  readonly staff: 1 | 2;
}

export interface CompositePhraseChord {
  readonly id: string;
  readonly orderIndex: number;
  readonly chordName: string;
  readonly measureNumber: number;
  readonly notes: readonly CompositePhraseChordNote[];
}

export interface CompositePhraseDefinition {
  readonly id: string;
  readonly sourcePhraseId: string;
  readonly title: string;
  readonly chords: readonly CompositePhraseChord[];
}

export type CompositePhraseNoteResult =
  | 'progress'
  | 'measure-complete'
  | 'phrase-complete'
  | 'miss';

export interface CompositePhraseCandidateState {
  readonly sourcePhraseId: string;
  readonly phrase: CompositePhraseDefinition;
  readonly chordIndex: number;
  readonly targetNoteIndex: number;
  readonly correctNoteIndices: ReadonlySet<number>;
  readonly revealedNoteIndices: ReadonlySet<number>;
}

export interface CompositePhraseRuntimeState {
  readonly sourcePhrases: readonly CompositePhraseDefinition[];
  readonly candidates: readonly CompositePhraseCandidateState[];
  readonly lockedSourcePhraseId: string | null;
  readonly lastCompletedSourcePhraseId: string | null;
}

export interface CompositePhraseNoteEvaluation {
  readonly result: CompositePhraseNoteResult;
  readonly nextState: CompositePhraseRuntimeState;
}

function candidateFromPhrase(phrase: CompositePhraseDefinition): CompositePhraseCandidateState {
  return {
    sourcePhraseId: phrase.sourcePhraseId,
    phrase,
    chordIndex: 0,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

export function createInitialCompositePhraseRuntimeState(
  sourcePhrases: readonly CompositePhraseDefinition[],
): CompositePhraseRuntimeState {
  return {
    sourcePhrases,
    candidates: sourcePhrases.map(candidateFromPhrase),
    lockedSourcePhraseId: null,
    lastCompletedSourcePhraseId: null,
  };
}

function getCurrentChord(c: CompositePhraseCandidateState): CompositePhraseChord | null {
  return c.phrase.chords[c.chordIndex] ?? null;
}

function getTargetNote(c: CompositePhraseCandidateState) {
  const chord = getCurrentChord(c);
  if (!chord) return null;
  return chord.notes[c.targetNoteIndex] ?? null;
}

function isChordComplete(chord: CompositePhraseChord, correctIndices: ReadonlySet<number>): boolean {
  return chord.notes.length > 0 && correctIndices.size >= chord.notes.length;
}

function isLastChord(c: CompositePhraseCandidateState): boolean {
  return c.chordIndex >= c.phrase.chords.length - 1;
}

function resetChordFields(
  c: CompositePhraseCandidateState,
): CompositePhraseCandidateState {
  return {
    ...c,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

function advanceToNextChord(
  c: CompositePhraseCandidateState,
): CompositePhraseCandidateState {
  const nextChordIndex = c.chordIndex + 1;
  return {
    ...c,
    chordIndex: nextChordIndex,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

function resetAllCandidates(
  state: CompositePhraseRuntimeState,
  preserveLastCompleted: boolean,
): CompositePhraseRuntimeState {
  return {
    sourcePhrases: state.sourcePhrases,
    candidates: state.sourcePhrases.map(candidateFromPhrase),
    lockedSourcePhraseId: null,
    lastCompletedSourcePhraseId: preserveLastCompleted
      ? state.lastCompletedSourcePhraseId
      : null,
  };
}

function applyKnownGoodStep(
  c: CompositePhraseCandidateState,
  pitchClass: number,
): { candidate: CompositePhraseCandidateState; result: CompositePhraseNoteResult } {
  const chord = getCurrentChord(c);
  const target = getTargetNote(c);
  if (!chord || !target) {
    return { candidate: c, result: 'miss' };
  }
  const allowed = new Set(chord.notes.map((n) => n.pitchClass));
  if (!allowed.has(pitchClass) || pitchClass !== target.pitchClass) {
    return { candidate: resetChordFields(c), result: 'miss' };
  }
  const nextCorrect = new Set(c.correctNoteIndices);
  nextCorrect.add(c.targetNoteIndex);
  const nextRevealed = new Set(c.revealedNoteIndices);
  nextRevealed.add(c.targetNoteIndex);

  if (isChordComplete(chord, nextCorrect)) {
    if (isLastChord(c)) {
      return {
        candidate: {
          ...c,
          correctNoteIndices: nextCorrect,
          revealedNoteIndices: nextRevealed,
        },
        result: 'phrase-complete',
      };
    }
    return {
      candidate: advanceToNextChord({
        ...c,
        correctNoteIndices: nextCorrect,
        revealedNoteIndices: nextRevealed,
      }),
      result: 'measure-complete',
    };
  }

  return {
    candidate: {
      ...c,
      targetNoteIndex: c.targetNoteIndex + 1,
      correctNoteIndices: nextCorrect,
      revealedNoteIndices: nextRevealed,
    },
    result: 'progress',
  };
}

function selectionMatchingIndices(
  state: CompositePhraseRuntimeState,
  pitchClass: number,
): number[] {
  const out: number[] = [];
  for (let i = 0; i < state.candidates.length; i += 1) {
    const note = getTargetNote(state.candidates[i]);
    if (note && note.pitchClass === pitchClass) {
      out.push(i);
    }
  }
  return out;
}

function replaceCandidateAt(
  candidates: readonly CompositePhraseCandidateState[],
  index: number,
  next: CompositePhraseCandidateState,
): CompositePhraseCandidateState[] {
  const copy = [...candidates];
  copy[index] = next;
  return copy;
}

export function evaluateCompositePhraseNoteOn(
  state: CompositePhraseRuntimeState,
  pitchClass: number,
): CompositePhraseNoteEvaluation {
  const pc = ((pitchClass % 12) + 12) % 12;

  if (state.lockedSourcePhraseId !== null) {
    const idx = state.candidates.findIndex((c) => c.sourcePhraseId === state.lockedSourcePhraseId);
    if (idx < 0) {
      return { result: 'miss', nextState: resetAllCandidates(state, true) };
    }
    const cur = state.candidates[idx];
    const { candidate, result } = applyKnownGoodStep(cur, pc);
    if (result === 'miss') {
      return { result: 'miss', nextState: resetAllCandidates(state, true) };
    }
    if (result === 'phrase-complete') {
      const finishedId = candidate.sourcePhraseId;
      return {
        result: 'phrase-complete',
        nextState: resetAllCandidates(
          {
            ...state,
            lastCompletedSourcePhraseId: finishedId,
          },
          true,
        ),
      };
    }
    return {
      result,
      nextState: {
        ...state,
        candidates: replaceCandidateAt(state.candidates, idx, candidate),
        lockedSourcePhraseId: candidate.sourcePhraseId,
      },
    };
  }

  const matchIdx = selectionMatchingIndices(state, pc);
  if (matchIdx.length === 0) {
    return { result: 'miss', nextState: resetAllCandidates(state, true) };
  }

  const advanced: CompositePhraseCandidateState[] = [];
  let aggResult: CompositePhraseNoteResult = 'progress';
  for (const i of matchIdx) {
    const { candidate, result } = applyKnownGoodStep(state.candidates[i], pc);
    if (result === 'miss') {
      return { result: 'miss', nextState: resetAllCandidates(state, true) };
    }
    if (result === 'phrase-complete') {
      const finishedId = candidate.sourcePhraseId;
      return {
        result: 'phrase-complete',
        nextState: resetAllCandidates(
          {
            ...state,
            lastCompletedSourcePhraseId: finishedId,
          },
          true,
        ),
      };
    }
    advanced.push(candidate);
    aggResult = result;
  }

  const lock = advanced.length === 1 ? advanced[0].sourcePhraseId : null;
  return {
    result: aggResult,
    nextState: {
      ...state,
      candidates: advanced,
      lockedSourcePhraseId: lock,
    },
  };
}

/** Parallel selection: common revealed prefix length (same pc at each slot). */
export function compositeSelectionGreenPrefixLength(
  state: CompositePhraseRuntimeState,
): number {
  if (state.lockedSourcePhraseId !== null) return 0;
  if (state.candidates.length === 0) return 0;
  const chordLens = state.candidates.map((c) => getCurrentChord(c)?.notes.length ?? 0);
  const maxSafe = Math.min(...chordLens);
  let p = 0;
  outer: while (p < maxSafe) {
    let pitchClassBaseline: number | null = null;
    for (const c of state.candidates) {
      const ch = getCurrentChord(c);
      const noteAt = ch?.notes[p];
      if (!noteAt || !c.revealedNoteIndices.has(p)) {
        break outer;
      }
      if (pitchClassBaseline === null) {
        pitchClassBaseline = noteAt.pitchClass;
      } else if (noteAt.pitchClass !== pitchClassBaseline) {
        break outer;
      }
    }
    p += 1;
  }
  return p;
}

export interface CompositePhraseStaffChordView {
  readonly chord: CompositePhraseChord | null;
  readonly correctNoteIndices: ReadonlySet<number>;
}

export function getCompositePhraseStaffChordView(
  state: CompositePhraseRuntimeState,
): CompositePhraseStaffChordView {
  if (state.candidates.length === 0) {
    return { chord: null, correctNoteIndices: new Set() };
  }
  if (state.lockedSourcePhraseId !== null) {
    const c = state.candidates.find((x) => x.sourcePhraseId === state.lockedSourcePhraseId);
    if (!c) {
      return { chord: null, correctNoteIndices: new Set() };
    }
    return {
      chord: getCurrentChord(c),
      correctNoteIndices: c.revealedNoteIndices,
    };
  }

  const template = state.candidates[0];
  const chord = getCurrentChord(template);
  const len = compositeSelectionGreenPrefixLength(state);
  const correct = new Set<number>();
  for (let i = 0; i < len; i += 1) {
    correct.add(i);
  }
  return {
    chord,
    correctNoteIndices: correct,
  };
}
