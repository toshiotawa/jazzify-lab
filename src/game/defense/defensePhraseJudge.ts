/**
 * Defense mode phrase judgment: sequential steps across N measures, completion count, pending switch.
 */
import type {
  DefenseAttackTrigger,
  DefensePhrase,
  DefensePhraseChord,
  DefensePlayStyle,
} from '@/game/defense/defenseTypes';
import { resolveDefenseStaffChordLabelForStep } from '@/game/defense/defenseStaffChordLabel';
import { parseProgressionChordRoot, rootMidiBelow } from '@/game/training/trainingProgression';
import {
  computeOrderedChordKeyboardHintsFromMidis,
  orderedPitchClassesFromMidis,
  shouldAcceptChordPitchClassInput,
  type OrderedChordKeyboardHints,
} from '@/utils/orderedChordInput';
import {
  buildExpectedPitchCandidates,
  type ExpectedPitchCandidates,
} from '@/utils/pitchInput/expectedPitchCandidates';
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
  /** 直前に正解した pitch class。同音連打ゲート用。 */
  readonly lastAcceptedPitchClass: number | null;
}

interface DefensePhraseNoteEvaluation {
  readonly attack: boolean;
  readonly phraseCompleted: boolean;
  readonly measureCompleted: boolean;
  readonly pendingSwitch: boolean;
  readonly completionCount: number;
  readonly playRootMidi: number | null;
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
  lastAcceptedPitchClass: null,
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

const pitchClassFromMidi = (midi: number): number => normalizePitchClass(midi % 12);

const nextExpectedPitchClass = (
  phrases: readonly DefensePhrase[],
  state: DefensePhraseJudgeState,
  sequential: boolean,
): number | null => {
  const hints = getDefensePhraseKeyboardHints(phrases, state, sequential);
  if (hints.nextMidi == null) {
    return null;
  }
  return pitchClassFromMidi(hints.nextMidi);
};

export const isDefenseWaitingForSamePitchRepeat = (
  phrases: readonly DefensePhrase[],
  state: DefensePhraseJudgeState,
  sequential: boolean,
): boolean => {
  if (!sequential || state.lastAcceptedPitchClass === null) {
    return false;
  }
  const nextPc = nextExpectedPitchClass(phrases, state, sequential);
  return nextPc !== null && nextPc === state.lastAcceptedPitchClass;
};

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

const resolvePlayRootMidi = (
  chord: DefensePhraseChord,
  completedStepIndex: number,
  playRootOnChordChange: boolean,
): number | null => {
  if (!playRootOnChordChange) return null;
  const label = resolveDefenseStaffChordLabelForStep(chord, completedStepIndex);
  if (label.trim().length === 0) return null;
  const { steps } = getPhraseChordSteps(chord.notes);
  const step = steps[completedStepIndex];
  if (!step) return null;
  let lowestMidi = Number.POSITIVE_INFINITY;
  for (const noteIndex of step.noteIndices) {
    const note = chord.notes[noteIndex];
    if (note && note.pitchMidi < lowestMidi) {
      lowestMidi = note.pitchMidi;
    }
  }
  if (!Number.isFinite(lowestMidi)) return null;
  const root = parseProgressionChordRoot(label);
  if (root == null) return null;
  return rootMidiBelow(root, lowestMidi);
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
  attackTrigger: DefenseAttackTrigger = 'note',
  autoAdvance = true,
  playStyle: DefensePlayStyle = 'phrase',
  playRootOnChordChange = false,
): DefensePhraseNoteEvaluation => {
  const phrase = phrases[state.phraseIndex] ?? null;
  const chord = getCurrentChord(phrase, state.chordIndex);
  if (!phrase || !chord || chord.notes.length === 0) {
    return {
      attack: false,
      phraseCompleted: false,
      measureCompleted: false,
      pendingSwitch: state.pendingSwitch,
      completionCount: state.completionCount,
      playRootMidi: null,
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
        measureCompleted: false,
        pendingSwitch: state.pendingSwitch,
        completionCount: state.completionCount,
        playRootMidi: null,
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
      measureCompleted: false,
      pendingSwitch: state.pendingSwitch,
      completionCount: state.completionCount,
      playRootMidi: null,
      nextState: state,
    };
  }

  const progressedState: DefensePhraseJudgeState = {
    ...applyStepState(state, evaluation.nextState),
    lastAcceptedPitchClass: pitchClass,
  };
  const isVoicingMode = playStyle === 'chord_voicing';
  const completedStepIndex = evaluation.result === 'measure-complete'
    ? Math.max(0, steps.length - 1)
    : state.targetStepIndex;
  const stepAdvanced = evaluation.result === 'measure-complete'
    || evaluation.nextState.targetStepIndex > state.targetStepIndex;
  const playRootMidi = stepAdvanced
    ? resolvePlayRootMidi(chord, completedStepIndex, playRootOnChordChange)
    : null;
  const attackOnStep = isVoicingMode
    ? stepAdvanced
    : (evaluation.result === 'measure-complete' || attackTrigger === 'note');

  if (evaluation.result === 'measure-complete') {
    const afterChord = advanceChord(progressedState, phrase);
    const wrapped = afterChord.chordIndex === 0;
    if (wrapped) {
      const required = requiredCompletionCountForPhrase(phrase, stageRequiredCompletionCount);
      const nextCount = state.pendingSwitch
        ? state.completionCount
        : state.completionCount + 1;
      const pendingSwitch = autoAdvance && (nextCount >= required || state.pendingSwitch);
      return {
        attack: attackOnStep,
        phraseCompleted: true,
        measureCompleted: true,
        pendingSwitch,
        completionCount: nextCount,
        playRootMidi,
        nextState: {
          ...afterChord,
          completionCount: nextCount,
          pendingSwitch,
        },
      };
    }
    return {
      attack: attackOnStep,
      phraseCompleted: false,
      measureCompleted: true,
      pendingSwitch: state.pendingSwitch,
      completionCount: state.completionCount,
      playRootMidi,
      nextState: {
        ...afterChord,
        completionCount: state.completionCount,
        pendingSwitch: state.pendingSwitch,
      },
    };
  }

  return {
    attack: attackOnStep,
    phraseCompleted: false,
    measureCompleted: false,
    pendingSwitch: state.pendingSwitch,
    completionCount: state.completionCount,
    playRootMidi,
    nextState: {
      ...progressedState,
      completionCount: state.completionCount,
      pendingSwitch: state.pendingSwitch,
    },
  };
};

const isOnPhraseLoopBoundary = (
  phrase: DefensePhrase,
  state: DefensePhraseJudgeState,
): boolean => {
  if (phrase.chords.length === 0) {
    return false;
  }
  const lastChordIndex = phrase.chords.length - 1;
  if (state.chordIndex !== lastChordIndex) {
    return false;
  }
  const lastChord = phrase.chords[lastChordIndex];
  if (!lastChord) {
    return false;
  }
  const { steps } = getPhraseChordSteps(lastChord.notes);
  return state.targetStepIndex >= steps.length - 1;
};

export const getDefenseExpectedPitchCandidates = (
  phrases: readonly DefensePhrase[],
  state: DefensePhraseJudgeState,
  sequential: boolean,
): ExpectedPitchCandidates => {
  if (!sequential) {
    return buildExpectedPitchCandidates([]);
  }
  const hints = getDefensePhraseKeyboardHints(phrases, state, sequential);
  const midis: number[] = [];
  if (hints.nextMidi != null) {
    midis.push(hints.nextMidi);
  }
  const phrase = phrases[state.phraseIndex];
  if (phrase && isOnPhraseLoopBoundary(phrase, state)) {
    const firstChord = phrase.chords[0];
    const firstSteps = firstChord ? getPhraseChordSteps(firstChord.notes).steps : [];
    const firstStep = firstSteps[0];
    if (firstChord && firstStep) {
      const loopStart = computeOrderedChordKeyboardHintsFromMidis(
        stepMidiNotes(firstChord, firstStep),
        [],
      );
      if (loopStart.nextMidi != null && !midis.includes(loopStart.nextMidi)) {
        midis.push(loopStart.nextMidi);
      }
    }
  }
  const repeatPitchClassMask = isDefenseWaitingForSamePitchRepeat(phrases, state, sequential)
    && state.lastAcceptedPitchClass !== null
    ? 1 << state.lastAcceptedPitchClass
    : 0;
  return buildExpectedPitchCandidates(midis, repeatPitchClassMask);
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
