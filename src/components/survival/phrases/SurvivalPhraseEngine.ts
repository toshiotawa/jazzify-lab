/**
 * Survival Phrases mode: sequential note judgment (pure functions).
 */
import type { SurvivalPhraseChord, SurvivalPhraseDefinition } from '@/utils/survivalPhraseDefinitions';
import {
  advanceChordStep,
  firstUnmatchedNoteIndexInStep,
  getPhraseChordSteps,
  type ChordStepAdvanceState,
} from '@/utils/phraseChordSteps';

export type SurvivalPhraseNoteResult =
  | 'progress'
  | 'chord-hold'
  | 'measure-complete'
  | 'miss';

export interface SurvivalPhraseRuntimeState {
  readonly phrase: SurvivalPhraseDefinition;
  readonly chordIndex: number;
  readonly targetStepIndex: number;
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
    targetStepIndex: 0,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

function getCurrentChord(state: SurvivalPhraseRuntimeState): SurvivalPhraseChord | null {
  return state.phrase.chords[state.chordIndex] ?? null;
}

function resetChordState(
  state: SurvivalPhraseRuntimeState,
): SurvivalPhraseRuntimeState {
  return {
    ...state,
    targetStepIndex: 0,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

export function hasSurvivalPhrasePartialProgress(
  state: SurvivalPhraseRuntimeState,
): boolean {
  return state.correctNoteIndices.size > 0;
}

export function resetSurvivalPhraseProgressIdle(
  state: SurvivalPhraseRuntimeState,
): SurvivalPhraseRuntimeState {
  return resetChordState(state);
}

function advanceChord(state: SurvivalPhraseRuntimeState): SurvivalPhraseRuntimeState {
  const chordCount = state.phrase.chords.length;
  if (chordCount === 0) return state;
  const nextIndex = (state.chordIndex + 1) % chordCount;
  return {
    phrase: state.phrase,
    chordIndex: nextIndex,
    targetStepIndex: 0,
    targetNoteIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

function applyStepState(
  state: SurvivalPhraseRuntimeState,
  chord: SurvivalPhraseChord,
  stepState: ChordStepAdvanceState,
): SurvivalPhraseRuntimeState {
  const { steps } = getPhraseChordSteps(chord.notes);
  const currentStep = steps[stepState.targetStepIndex];
  const targetNoteIndex = currentStep
    ? firstUnmatchedNoteIndexInStep(
      chord.notes,
      currentStep,
      stepState.correctNoteIndices,
    )
    : chord.notes.length;

  return {
    ...state,
    targetStepIndex: stepState.targetStepIndex,
    targetNoteIndex,
    correctNoteIndices: stepState.correctNoteIndices,
    revealedNoteIndices: stepState.revealedNoteIndices,
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
  if (!chord || chord.notes.length === 0) {
    return { result: 'miss', nextState: state };
  }

  const { steps } = getPhraseChordSteps(chord.notes);
  const stepState: ChordStepAdvanceState = {
    targetStepIndex: state.targetStepIndex,
    correctNoteIndices: state.correctNoteIndices,
    revealedNoteIndices: state.revealedNoteIndices,
  };

  const evaluation = advanceChordStep(chord.notes, steps, stepState, pitchClass);

  if (evaluation.result === 'miss') {
    return { result: 'miss', nextState: state };
  }

  if (evaluation.result === 'chord-hold') {
    return { result: 'chord-hold', nextState: state };
  }

  const progressedState = applyStepState(state, chord, evaluation.nextState);

  if (evaluation.result === 'measure-complete') {
    return {
      result: 'measure-complete',
      nextState: advanceChord(progressedState),
    };
  }

  return {
    result: evaluation.result,
    nextState: progressedState,
  };
}

export interface SurvivalPhraseRestSkip {
  /** 現在塊が休符(notes 空)で実際に送ったか。 */
  readonly advanced: boolean;
  /** 送った結果、先頭(index 0)に巻き戻ったか(= 1 周完了)。 */
  readonly wrapped: boolean;
  readonly nextState: SurvivalPhraseRuntimeState;
}

/**
 * 現在塊が休符(notes 空)のとき、入力なしで次塊へ送る。play(一緒に弾かせる)の
 * 「会話だけの小節」を自動送り/クリック送りするために外部(シーン)から駆動する。
 */
export function skipRestPhraseChord(
  state: SurvivalPhraseRuntimeState,
): SurvivalPhraseRestSkip {
  const chord = getCurrentChord(state);
  if (!chord || chord.notes.length === 0) {
    const nextState = advanceChord(state);
    return {
      advanced: state.phrase.chords.length > 0,
      wrapped: nextState.chordIndex === 0,
      nextState,
    };
  }
  return { advanced: false, wrapped: false, nextState: state };
}

export function getPhraseTargetMidis(
  state: SurvivalPhraseRuntimeState,
): readonly number[] {
  const chord = getCurrentChord(state);
  if (!chord) return [];

  const { steps } = getPhraseChordSteps(chord.notes);
  const step = steps[state.targetStepIndex];
  if (!step) return [];

  const midis: number[] = [];
  for (const noteIndex of step.noteIndices) {
    if (!state.correctNoteIndices.has(noteIndex)) {
      const note = chord.notes[noteIndex];
      if (note) {
        midis.push(note.pitchMidi);
      }
    }
  }
  return midis;
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

/** 塊 index が同一 measureNumber 内の最終塊か（playalong 衝撃波の小節単位判定）。 */
export function isLastPhraseChunkInMeasure(
  chords: ReadonlyArray<Pick<SurvivalPhraseChord, 'measureNumber'>>,
  chunkIndex: number,
): boolean {
  if (chunkIndex < 0 || chunkIndex >= chords.length) {
    return false;
  }
  const measureNum = chords[chunkIndex]?.measureNumber;
  if (measureNum === undefined) {
    return true;
  }
  for (let i = chunkIndex + 1; i < chords.length; i += 1) {
    if (chords[i]?.measureNumber === measureNum) {
      return false;
    }
  }
  return true;
}
