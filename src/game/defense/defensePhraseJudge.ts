/**
 * Defense mode phrase judgment: sequential steps across N measures, completion count, pending switch.
 */
import type { DefensePhrase, DefensePhraseChord } from '@/game/defense/defenseTypes';
import {
  computeOrderedChordKeyboardHintsFromMidis,
  orderedPitchClassesFromMidis,
  shouldAcceptChordPitchClassInput,
  type OrderedChordKeyboardHints,
} from '@/utils/orderedChordInput';
import {
  advanceChordStep,
  getPhraseChordSteps,
  type ChordStepAdvanceState,
  type PhraseChordStep,
} from '@/utils/phraseChordSteps';
import { normalizePitchClass } from '@/utils/phraseStreamMatching';

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

const stepMidiNotes = (
  chord: DefensePhraseChord,
  step: PhraseChordStep,
): number[] => {
  const midis: number[] = [];
  for (const noteIndex of step.noteIndices) {
    const note = chord.notes[noteIndex];
    if (note) {
      midis.push(note.pitchMidi);
    }
  }
  return midis;
};

const sequentialCompletedPitchClasses = (
  chord: DefensePhraseChord,
  step: PhraseChordStep,
  correctNoteIndices: ReadonlySet<number>,
): number[] => {
  const midis = stepMidiNotes(chord, step);
  const orderedPcs = orderedPitchClassesFromMidis(midis);
  const completed: number[] = [];
  for (const pc of orderedPcs) {
    const matched = step.noteIndices.some((noteIndex) => {
      const note = chord.notes[noteIndex];
      return Boolean(
        note
        && correctNoteIndices.has(noteIndex)
        && normalizePitchClass(note.pitchClass) === pc,
      );
    });
    if (!matched) {
      break;
    }
    completed.push(pc);
  }
  return completed;
};

export const evaluateDefensePhraseNoteOn = (
  phrases: readonly DefensePhrase[],
  stageRequiredCompletionCount: number,
  state: DefensePhraseJudgeState,
  pitchClass: number,
  sequential = false,
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
  const currentStep = steps[state.targetStepIndex];
  if (sequential && currentStep) {
    const acceptance = shouldAcceptChordPitchClassInput(
      stepMidiNotes(chord, currentStep),
      sequentialCompletedPitchClasses(chord, currentStep, state.correctNoteIndices),
      pitchClass,
      true,
    );
    if (!acceptance.accept) {
      return {
        attack: false,
        phraseCompleted: false,
        pendingSwitch: state.pendingSwitch,
        completionCount: state.completionCount,
        nextState: state,
      };
    }
  }

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
    attack: false,
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

export const getDefensePhraseKeyboardHints = (
  phrases: readonly DefensePhrase[],
  state: DefensePhraseJudgeState,
  sequential: boolean,
): OrderedChordKeyboardHints => {
  const empty: OrderedChordKeyboardHints = {
    nextMidi: null,
    pendingMidis: [],
    completedMidis: [],
  };
  const phrase = phrases[state.phraseIndex] ?? null;
  const chord = getCurrentChord(phrase, state.chordIndex);
  if (!phrase || !chord) return empty;

  const { steps } = getPhraseChordSteps(chord.notes);
  const step = steps[state.targetStepIndex];
  if (!step) return empty;

  const midis = stepMidiNotes(chord, step);
  if (midis.length === 0) return empty;

  if (sequential) {
    return computeOrderedChordKeyboardHintsFromMidis(
      midis,
      sequentialCompletedPitchClasses(chord, step, state.correctNoteIndices),
    );
  }

  const pendingMidis: number[] = [];
  const completedMidis: number[] = [];
  for (const noteIndex of step.noteIndices) {
    const note = chord.notes[noteIndex];
    if (!note) continue;
    if (state.correctNoteIndices.has(noteIndex)) {
      completedMidis.push(note.pitchMidi);
    } else {
      pendingMidis.push(note.pitchMidi);
    }
  }
  return { nextMidi: null, pendingMidis, completedMidis };
};

export const nextPhraseIndex = (
  phrases: readonly DefensePhrase[],
  currentIndex: number,
): number => {
  if (phrases.length === 0) return 0;
  return (currentIndex + 1) % phrases.length;
};
