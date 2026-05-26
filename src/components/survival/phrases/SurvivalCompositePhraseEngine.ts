/**
 * Survival composite phrase boss: parallel candidate filtering then single phrase (no chord loop).
 */
import type {
  SurvivalPhraseChord,
  SurvivalPhraseDefinition,
} from '@/utils/survivalPhraseDefinitions';

export type SurvivalCompositePhraseNoteResult =
  | 'progress'
  | 'measure-complete'
  | 'phrase-complete'
  | 'miss';

export interface SurvivalCompositePhraseCandidateState {
  readonly sourceStageNumber: number;
  readonly phrase: SurvivalPhraseDefinition;
  readonly chordIndex: number;
  readonly targetNoteIndex: number;
  readonly correctNoteIndices: ReadonlySet<number>;
  readonly revealedNoteIndices: ReadonlySet<number>;
}

export interface SurvivalCompositePhraseRuntimeState {
  readonly sourcePhrases: readonly SurvivalPhraseDefinition[];
  readonly candidates: readonly SurvivalCompositePhraseCandidateState[];
  readonly lockedSourceStageNumber: number | null;
  readonly lastCompletedSourceStageNumber: number | null;
}

function candidateFromPhrase(phrase: SurvivalPhraseDefinition): SurvivalCompositePhraseCandidateState {
  return {
    sourceStageNumber: phrase.stageNumber,
    phrase,
    chordIndex: 0,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

export function createInitialCompositePhraseRuntimeState(
  sourcePhrases: readonly SurvivalPhraseDefinition[],
): SurvivalCompositePhraseRuntimeState {
  return {
    sourcePhrases,
    candidates: sourcePhrases.map(candidateFromPhrase),
    lockedSourceStageNumber: null,
    lastCompletedSourceStageNumber: null,
  };
}

function getCurrentChord(
  c: SurvivalCompositePhraseCandidateState,
): SurvivalPhraseChord | null {
  return c.phrase.chords[c.chordIndex] ?? null;
}

function getTargetNote(c: SurvivalCompositePhraseCandidateState) {
  const chord = getCurrentChord(c);
  if (!chord) return null;
  return chord.notes[c.targetNoteIndex] ?? null;
}

function isChordComplete(chord: SurvivalPhraseChord, correctIndices: ReadonlySet<number>): boolean {
  return chord.notes.length > 0 && correctIndices.size >= chord.notes.length;
}

function isLastChord(c: SurvivalCompositePhraseCandidateState): boolean {
  return c.chordIndex >= c.phrase.chords.length - 1;
}

function resetChordFields(
  c: SurvivalCompositePhraseCandidateState,
): SurvivalCompositePhraseCandidateState {
  return {
    ...c,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

/** 次コードへ（ループなし; 呼び出し元で最終小節を弾く） */
function advanceToNextChord(
  c: SurvivalCompositePhraseCandidateState,
): SurvivalCompositePhraseCandidateState {
  const nextChordIndex = c.chordIndex + 1;
  return {
    ...c,
    chordIndex: nextChordIndex,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

export interface SurvivalCompositePhraseNoteEvaluation {
  readonly result: SurvivalCompositePhraseNoteResult;
  readonly nextState: SurvivalCompositePhraseRuntimeState;
}

function resetAllCandidates(
  state: SurvivalCompositePhraseRuntimeState,
  preserveLastCompleted: boolean,
): SurvivalCompositePhraseRuntimeState {
  return {
    sourcePhrases: state.sourcePhrases,
    candidates: state.sourcePhrases.map(candidateFromPhrase),
    lockedSourceStageNumber: null,
    lastCompletedSourceStageNumber: preserveLastCompleted
      ? state.lastCompletedSourceStageNumber
      : null,
  };
}

function applyKnownGoodStep(
  c: SurvivalCompositePhraseCandidateState,
  pitchClass: number,
): { candidate: SurvivalCompositePhraseCandidateState; result: SurvivalCompositePhraseNoteResult } {
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
  state: SurvivalCompositePhraseRuntimeState,
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
  candidates: readonly SurvivalCompositePhraseCandidateState[],
  index: number,
  next: SurvivalCompositePhraseCandidateState,
): SurvivalCompositePhraseCandidateState[] {
  const copy = [...candidates];
  copy[index] = next;
  return copy;
}

export function evaluateCompositePhraseNoteOn(
  state: SurvivalCompositePhraseRuntimeState,
  pitchClass: number,
): SurvivalCompositePhraseNoteEvaluation {
  const pc = ((pitchClass % 12) + 12) % 12;

  if (state.lockedSourceStageNumber !== null) {
    const idx = state.candidates.findIndex(
      (c) => c.sourceStageNumber === state.lockedSourceStageNumber,
    );
    if (idx < 0) {
      return { result: 'miss', nextState: resetAllCandidates(state, true) };
    }
    const cur = state.candidates[idx];
    const { candidate, result } = applyKnownGoodStep(cur, pc);
    if (result === 'miss') {
      return { result: 'miss', nextState: resetAllCandidates(state, true) };
    }
    if (result === 'phrase-complete') {
      const finishedStage = candidate.sourceStageNumber;
      return {
        result: 'phrase-complete',
        nextState: resetAllCandidates(
          {
            ...state,
            lastCompletedSourceStageNumber: finishedStage,
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
        lockedSourceStageNumber: candidate.sourceStageNumber,
      },
    };
  }

  const matchIdx = selectionMatchingIndices(state, pc);
  if (matchIdx.length === 0) {
    return { result: 'miss', nextState: resetAllCandidates(state, true) };
  }

  const advanced: SurvivalCompositePhraseCandidateState[] = [];
  let aggResult: SurvivalCompositePhraseNoteResult = 'progress';
  for (const i of matchIdx) {
    const { candidate, result } = applyKnownGoodStep(state.candidates[i], pc);
    if (result === 'miss') {
      return { result: 'miss', nextState: resetAllCandidates(state, true) };
    }
    if (result === 'phrase-complete') {
      const finishedStage = candidate.sourceStageNumber;
      return {
        result: 'phrase-complete',
        nextState: resetAllCandidates(
          {
            ...state,
            lastCompletedSourceStageNumber: finishedStage,
          },
          true,
        ),
      };
    }
    advanced.push(candidate);
    aggResult = result;
  }

  const lock = advanced.length === 1 ? advanced[0].sourceStageNumber : null;
  return {
    result: aggResult,
    nextState: {
      ...state,
      candidates: advanced,
      lockedSourceStageNumber: lock,
    },
  };
}

/** 並行選択中: 全候補の現小節で、順位ごとに同ピッチクラスかつ revealed 済みの共通 prefix 長さ */
export function compositeSelectionGreenPrefixLength(
  state: SurvivalCompositePhraseRuntimeState,
): number {
  if (state.lockedSourceStageNumber !== null) return 0;
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

export interface SurvivalCompositePhraseStaffChordView {
  readonly chord: SurvivalPhraseChord | null;
  readonly correctNoteIndices: ReadonlySet<number>;
}

export function getCompositePhraseStaffChordView(
  state: SurvivalCompositePhraseRuntimeState,
): SurvivalCompositePhraseStaffChordView {
  if (state.candidates.length === 0) {
    return { chord: null, correctNoteIndices: new Set() };
  }
  if (state.lockedSourceStageNumber !== null) {
    const c = state.candidates.find((x) => x.sourceStageNumber === state.lockedSourceStageNumber);
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