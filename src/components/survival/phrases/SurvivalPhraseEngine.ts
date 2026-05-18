/**
 * Survival Phrases mode: sequential note judgment (pure functions).
 */
import type { SurvivalPhraseChord, SurvivalPhraseDefinition } from '@/utils/survivalPhraseDefinitions';

export type SurvivalPhraseNoteResult = 'progress' | 'measure-complete' | 'miss';

export interface SurvivalPhraseRuntimeState {
  readonly phrase: SurvivalPhraseDefinition;
  readonly chordIndex: number;
  readonly targetNoteIndex: number;
  readonly correctNoteIndices: ReadonlySet<number>;
  readonly revealedNoteIndices: ReadonlySet<number>;
}

export function createInitialPhraseState(
  phrase: SurvivalPhraseDefinition,
): SurvivalPhraseRuntimeState {
  return {
    phrase,
    chordIndex: 0,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

function getCurrentChord(state: SurvivalPhraseRuntimeState): SurvivalPhraseChord | null {
  return state.phrase.chords[state.chordIndex] ?? null;
}

function getTargetNote(state: SurvivalPhraseRuntimeState) {
  const chord = getCurrentChord(state);
  if (!chord) return null;
  return chord.notes[state.targetNoteIndex] ?? null;
}

function isChordComplete(chord: SurvivalPhraseChord, correctIndices: ReadonlySet<number>): boolean {
  return chord.notes.length > 0 && correctIndices.size >= chord.notes.length;
}

function resetChordState(
  state: SurvivalPhraseRuntimeState,
): SurvivalPhraseRuntimeState {
  return {
    ...state,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

function advanceChord(state: SurvivalPhraseRuntimeState): SurvivalPhraseRuntimeState {
  const chordCount = state.phrase.chords.length;
  if (chordCount === 0) return state;
  const nextIndex = (state.chordIndex + 1) % chordCount;
  return {
    phrase: state.phrase,
    chordIndex: nextIndex,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

export interface SurvivalPhraseNoteEvaluation {
  readonly result: SurvivalPhraseNoteResult;
  readonly nextState: SurvivalPhraseRuntimeState;
}

export function evaluatePhraseNoteOn(
  state: SurvivalPhraseRuntimeState,
  pitchClass: number,
): SurvivalPhraseNoteEvaluation {
  const chord = getCurrentChord(state);
  const target = getTargetNote(state);
  if (!chord || !target) {
    return { result: 'miss', nextState: state };
  }

  const allowedPitchClasses = new Set(chord.notes.map((n) => n.pitchClass));
  if (!allowedPitchClasses.has(pitchClass)) {
    return { result: 'miss', nextState: resetChordState(state) };
  }

  if (pitchClass !== target.pitchClass) {
    return { result: 'miss', nextState: resetChordState(state) };
  }

  const nextCorrect = new Set(state.correctNoteIndices);
  nextCorrect.add(state.targetNoteIndex);
  const nextRevealed = new Set(state.revealedNoteIndices);
  nextRevealed.add(state.targetNoteIndex);

  if (isChordComplete(chord, nextCorrect)) {
    return {
      result: 'measure-complete',
      nextState: advanceChord({
        ...state,
        correctNoteIndices: nextCorrect,
        revealedNoteIndices: nextRevealed,
      }),
    };
  }

  return {
    result: 'progress',
    nextState: {
      ...state,
      targetNoteIndex: state.targetNoteIndex + 1,
      correctNoteIndices: nextCorrect,
      revealedNoteIndices: nextRevealed,
    },
  };
}

export function getPhraseTargetMidi(state: SurvivalPhraseRuntimeState): number | null {
  return getTargetNote(state)?.pitchMidi ?? null;
}

export function getPhraseDisplayChords(
  state: SurvivalPhraseRuntimeState,
): { current: SurvivalPhraseChord | null; next: SurvivalPhraseChord | null } {
  const chords = state.phrase.chords;
  if (chords.length === 0) {
    return { current: null, next: null };
  }
  const current = chords[state.chordIndex] ?? null;
  const next = chords[(state.chordIndex + 1) % chords.length] ?? null;
  return { current, next };
}
