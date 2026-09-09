/**
 * Defense mode phrase judgment: sequential steps across N measures, completion count, pending switch.
 */
import type { DefensePhrase, DefensePhraseChord } from '@/game/defense/defenseTypes';
import {
  advanceChordStep,
  getPhraseChordSteps,
  type ChordStepAdvanceState,
} from '@/utils/phraseChordSteps';

export interface DefensePhraseJudgeState {
  readonly phraseIndex: number;
  readonly chordIndex: number;
  readonly targetStepIndex: number;
  readonly correctNoteIndices: ReadonlySet<number>;
  readonly revealedNoteIndices: ReadonlySet<number>;
  readonly completionCount: number;
  readonly pendingSwitch: boolean;
}

interface DefensePhraseNoteEvaluation {
  readonly attack: boolean;
  readonly phraseCompleted: boolean;
  readonly pendingSwitch: boolean;
  readonly completionCount: number;
  readonly nextState: DefensePhraseJudgeState;
}

const emptySet = (): ReadonlySet<number> => new Set<number>();

export const createInitialPhraseJudgeState = (
  phraseIndex: number,
): DefensePhraseJudgeState => ({
  phraseIndex,
  chordIndex: 0,
  targetStepIndex: 0,
  correctNoteIndices: emptySet(),
  revealedNoteIndices: emptySet(),
  completionCount: 0,
  pendingSwitch: false,
});

const getCurrentChord = (
  phrase: DefensePhrase | null,
  chordIndex: number,
): DefensePhraseChord | null => (
  phrase?.chords[chordIndex] ?? null
);

const resetChordProgress = (
  state: DefensePhraseJudgeState,
): DefensePhraseJudgeState => ({
  ...state,
  targetStepIndex: 0,
  correctNoteIndices: emptySet(),
  revealedNoteIndices: emptySet(),
});

const advanceChord = (
  state: DefensePhraseJudgeState,
  phrase: DefensePhrase,
): DefensePhraseJudgeState => {
  const chordCount = phrase.chords.length;
  if (chordCount === 0) {
    return resetChordProgress(state);
  }
  const nextIndex = (state.chordIndex + 1) % chordCount;
  return {
    ...state,
    chordIndex: nextIndex,
    targetStepIndex: 0,
    correctNoteIndices: emptySet(),
    revealedNoteIndices: emptySet(),
  };
};

const applyStepState = (
  state: DefensePhraseJudgeState,
  stepState: ChordStepAdvanceState,
): DefensePhraseJudgeState => ({
  ...state,
  targetStepIndex: stepState.targetStepIndex,
  correctNoteIndices: stepState.correctNoteIndices,
  revealedNoteIndices: stepState.revealedNoteIndices,
});

const requiredCompletionCountForPhrase = (
  phrase: DefensePhrase,
  stageDefault: number,
): number => phrase.requiredCompletionCount ?? stageDefault;

export const evaluateDefensePhraseNoteOn = (
  phrases: readonly DefensePhrase[],
  stageRequiredCompletionCount: number,
  state: DefensePhraseJudgeState,
  pitchClass: number,
): DefensePhraseNoteEvaluation => {
  const phrase = phrases[state.phraseIndex] ?? null;
  const chord = getCurrentChord(phrase, state.chordIndex);
  if (!phrase || !chord || chord.notes.length === 0) {
    return {
      attack: false,
      phraseCompleted: false,
      pendingSwitch: state.pendingSwitch,
      completionCount: state.completionCount,
      nextState: state,
    };
  }

  const { steps } = getPhraseChordSteps(chord.notes);
  const stepState: ChordStepAdvanceState = {
    targetStepIndex: state.targetStepIndex,
    correctNoteIndices: state.correctNoteIndices,
    revealedNoteIndices: state.revealedNoteIndices,
  };

  const evaluation = advanceChordStep(chord.notes, steps, stepState, pitchClass);
  if (evaluation.result === 'miss' || evaluation.result === 'chord-hold') {
    return {
      attack: false,
      phraseCompleted: false,
      pendingSwitch: state.pendingSwitch,
      completionCount: state.completionCount,
      nextState: state,
    };
  }

  const progressedState = applyStepState(state, evaluation.nextState);
  const stepCompleted = evaluation.nextState.targetStepIndex > state.targetStepIndex
    || evaluation.result === 'measure-complete';
  const attack = stepCompleted;

  if (evaluation.result === 'measure-complete') {
    const afterChord = advanceChord(progressedState, phrase);
    const wrapped = afterChord.chordIndex === 0;
    if (wrapped) {
      const required = requiredCompletionCountForPhrase(phrase, stageRequiredCompletionCount);
      const nextCount = state.pendingSwitch
        ? state.completionCount
        : state.completionCount + 1;
      const pendingSwitch = nextCount >= required || state.pendingSwitch;
      return {
        attack: true,
        phraseCompleted: true,
        pendingSwitch,
        completionCount: nextCount,
        nextState: {
          ...afterChord,
          completionCount: nextCount,
          pendingSwitch,
        },
      };
    }
    return {
      attack: true,
      phraseCompleted: false,
      pendingSwitch: state.pendingSwitch,
      completionCount: state.completionCount,
      nextState: {
        ...afterChord,
        completionCount: state.completionCount,
        pendingSwitch: state.pendingSwitch,
      },
    };
  }

  return {
    attack,
    phraseCompleted: false,
    pendingSwitch: state.pendingSwitch,
    completionCount: state.completionCount,
    nextState: {
      ...progressedState,
      completionCount: state.completionCount,
      pendingSwitch: state.pendingSwitch,
    },
  };
};

export const getDefensePhraseTargetMidis = (
  phrases: readonly DefensePhrase[],
  state: DefensePhraseJudgeState,
): readonly number[] => {
  const phrase = phrases[state.phraseIndex] ?? null;
  const chord = getCurrentChord(phrase, state.chordIndex);
  if (!phrase || !chord) return [];

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
};

export const nextPhraseIndex = (
  phrases: readonly DefensePhrase[],
  currentIndex: number,
): number => {
  if (phrases.length === 0) return 0;
  return (currentIndex + 1) % phrases.length;
};
