/**
 * Composite phrase: parallel KMP stream matching across all candidates.
 */
import {
  advanceKmp,
  coordinateFromMatchedLength,
  getCompositeKmpCache,
  isNonFinalMeasureBoundary,
  matchedLengthFromCoordinates,
  prefixIndexSet,
} from '@/utils/phraseStreamMatching';

export interface CompositePhraseChordNote {
  readonly pitchClass: number;
  readonly noteName: string;
  readonly staff: 1 | 2;
}

export interface CompositePhraseChord {
  readonly id: string;
  readonly orderIndex: number;
  readonly chordName: string;
  readonly quoteText?: string | null;
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
  | 'resync'
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
  readonly primarySourcePhraseId: string | null;
  readonly lastCompletedSourcePhraseId: string | null;
}

export interface CompositePhraseNoteEvaluation {
  readonly result: CompositePhraseNoteResult;
  readonly nextState: CompositePhraseRuntimeState;
}

interface CompositeCandidateStep {
  readonly candidate: CompositePhraseCandidateState;
  readonly result: CompositePhraseNoteResult;
  readonly accepted: boolean;
  readonly matchedLength: number;
  readonly beforeMatchedLength: number;
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
    primarySourcePhraseId: null,
    lastCompletedSourcePhraseId: null,
  };
}

function getCurrentChord(c: CompositePhraseCandidateState): CompositePhraseChord | null {
  return c.phrase.chords[c.chordIndex] ?? null;
}

function candidateWithMatchedLength(
  c: CompositePhraseCandidateState,
  matchedLength: number,
): CompositePhraseCandidateState {
  const coord = coordinateFromMatchedLength(c.phrase, matchedLength);
  const correct = prefixIndexSet(coord.targetNoteIndex);

  return {
    ...c,
    chordIndex: coord.chordIndex,
    targetNoteIndex: coord.targetNoteIndex,
    correctNoteIndices: correct,
    revealedNoteIndices: correct,
  };
}

function resetAllCandidates(
  state: CompositePhraseRuntimeState,
  preserveLastCompleted: boolean,
): CompositePhraseRuntimeState {
  return {
    sourcePhrases: state.sourcePhrases,
    candidates: state.sourcePhrases.map(candidateFromPhrase),
    primarySourcePhraseId: null,
    lastCompletedSourcePhraseId: preserveLastCompleted
      ? state.lastCompletedSourcePhraseId
      : null,
  };
}

function applyStreamingCandidateStep(
  c: CompositePhraseCandidateState,
  pitchClass: number,
): CompositeCandidateStep {
  const { pattern, table } = getCompositeKmpCache(c.phrase);

  if (pattern.length === 0) {
    return {
      candidate: candidateFromPhrase(c.phrase),
      result: 'miss',
      accepted: false,
      matchedLength: 0,
      beforeMatchedLength: 0,
    };
  }

  const beforeMatchedLength = matchedLengthFromCoordinates(
    c.phrase,
    c.chordIndex,
    c.targetNoteIndex,
  );
  const nextMatchedLength = advanceKmp(pattern, table, beforeMatchedLength, pitchClass);

  if (nextMatchedLength === 0) {
    return {
      candidate: candidateFromPhrase(c.phrase),
      result: 'miss',
      accepted: false,
      matchedLength: 0,
      beforeMatchedLength,
    };
  }

  const nextCandidate = candidateWithMatchedLength(c, nextMatchedLength);

  if (nextMatchedLength >= pattern.length) {
    return {
      candidate: nextCandidate,
      result: 'phrase-complete',
      accepted: true,
      matchedLength: nextMatchedLength,
      beforeMatchedLength,
    };
  }

  if (isNonFinalMeasureBoundary(c.phrase, nextMatchedLength)) {
    return {
      candidate: nextCandidate,
      result: 'measure-complete',
      accepted: true,
      matchedLength: nextMatchedLength,
      beforeMatchedLength,
    };
  }

  return {
    candidate: nextCandidate,
    result: 'progress',
    accepted: true,
    matchedLength: nextMatchedLength,
    beforeMatchedLength,
  };
}

function compositeSelectionCandidates(
  state: CompositePhraseRuntimeState,
): readonly CompositePhraseCandidateState[] {
  if (state.primarySourcePhraseId !== null) {
    const primary = state.candidates.find(
      (c) => c.sourcePhraseId === state.primarySourcePhraseId,
    );
    return primary ? [primary] : [];
  }

  if (state.candidates.length === 0) return [];

  let best = 0;
  for (const c of state.candidates) {
    best = Math.max(
      best,
      matchedLengthFromCoordinates(c.phrase, c.chordIndex, c.targetNoteIndex),
    );
  }

  if (best <= 0) {
    return state.candidates;
  }

  return state.candidates.filter(
    (c) => matchedLengthFromCoordinates(c.phrase, c.chordIndex, c.targetNoteIndex) === best,
  );
}

function getDisplayCandidate(
  state: CompositePhraseRuntimeState,
): CompositePhraseCandidateState | null {
  const candidates = compositeSelectionCandidates(state);
  return candidates[0] ?? null;
}

function resolvePrimarySourcePhraseId(
  state: CompositePhraseRuntimeState,
  steps: readonly CompositeCandidateStep[],
  bestMatchedLength: number,
): string | null {
  const best = steps.filter(
    (s) => s.accepted && s.matchedLength === bestMatchedLength,
  );

  const previousPrimary = state.primarySourcePhraseId;
  const previousStep = previousPrimary !== null
    ? steps.find((s) => s.candidate.sourcePhraseId === previousPrimary)
    : undefined;

  const previousPrimaryStillBest =
    previousStep !== undefined
    && previousStep.accepted
    && previousStep.matchedLength === bestMatchedLength;

  if (previousPrimaryStillBest) {
    return previousPrimary;
  }

  if (best.length === 1) {
    return best[0].candidate.sourcePhraseId;
  }

  return null;
}

function resolveAggregateResult(
  selectedStep: CompositeCandidateStep | undefined,
  primaryResync: boolean,
): CompositePhraseNoteResult {
  if (primaryResync) {
    return 'resync';
  }

  if (selectedStep?.result === 'measure-complete') {
    return 'measure-complete';
  }

  return 'progress';
}

export function evaluateCompositePhraseNoteOn(
  state: CompositePhraseRuntimeState,
  pitchClass: number,
): CompositePhraseNoteEvaluation {
  const candidateById = new Map(
    state.candidates.map((c) => [c.sourcePhraseId, c] as const),
  );

  const steps = state.sourcePhrases.map((phrase) => {
    const current = candidateById.get(phrase.sourcePhraseId) ?? candidateFromPhrase(phrase);
    return applyStreamingCandidateStep(current, pitchClass);
  });

  const completed = steps.filter((s) => s.result === 'phrase-complete');

  if (completed.length > 0) {
    const preferred = state.primarySourcePhraseId !== null
      ? completed.find((s) => s.candidate.sourcePhraseId === state.primarySourcePhraseId)
      : undefined;
    const finished = preferred ?? completed[0];
    const finishedId = finished.candidate.sourcePhraseId;

    return {
      result: 'phrase-complete',
      nextState: resetAllCandidates(
        {
          ...state,
          candidates: steps.map((s) => s.candidate),
          lastCompletedSourcePhraseId: finishedId,
        },
        true,
      ),
    };
  }

  const accepted = steps.filter((s) => s.accepted && s.matchedLength > 0);

  if (accepted.length === 0) {
    return {
      result: 'miss',
      nextState: resetAllCandidates(
        {
          ...state,
          candidates: steps.map((s) => s.candidate),
        },
        true,
      ),
    };
  }

  const bestMatchedLength = Math.max(...accepted.map((s) => s.matchedLength));
  const nextPrimarySourcePhraseId = resolvePrimarySourcePhraseId(
    state,
    steps,
    bestMatchedLength,
  );

  const selectedStep = nextPrimarySourcePhraseId !== null
    ? steps.find((s) => s.candidate.sourcePhraseId === nextPrimarySourcePhraseId)
    : accepted.find((s) => s.matchedLength === bestMatchedLength);

  const primaryResync =
    selectedStep !== undefined
    && selectedStep.matchedLength < selectedStep.beforeMatchedLength;

  const result = resolveAggregateResult(selectedStep, primaryResync);

  return {
    result,
    nextState: {
      sourcePhrases: state.sourcePhrases,
      candidates: steps.map((s) => s.candidate),
      primarySourcePhraseId: nextPrimarySourcePhraseId,
      lastCompletedSourcePhraseId: state.lastCompletedSourcePhraseId,
    },
  };
}

/** Parallel selection: common revealed prefix length (same pc at each slot). */
export function compositeSelectionGreenPrefixLength(
  state: CompositePhraseRuntimeState,
): number {
  if (state.primarySourcePhraseId !== null) return 0;

  const candidates = compositeSelectionCandidates(state);
  if (candidates.length === 0) return 0;

  const chordLens = candidates.map((c) => getCurrentChord(c)?.notes.length ?? 0);
  const maxSafe = Math.min(...chordLens);
  let p = 0;
  outer: while (p < maxSafe) {
    let pitchClassBaseline: number | null = null;
    for (const c of candidates) {
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

  if (state.primarySourcePhraseId !== null) {
    const c = state.candidates.find(
      (x) => x.sourcePhraseId === state.primarySourcePhraseId,
    );
    if (!c) {
      return { chord: null, correctNoteIndices: new Set() };
    }
    return {
      chord: getCurrentChord(c),
      correctNoteIndices: c.revealedNoteIndices,
    };
  }

  const display = getDisplayCandidate(state);
  if (!display) {
    return { chord: null, correctNoteIndices: new Set() };
  }

  const chord = getCurrentChord(display);
  const len = compositeSelectionGreenPrefixLength(state);
  return {
    chord,
    correctNoteIndices: prefixIndexSet(len),
  };
}

