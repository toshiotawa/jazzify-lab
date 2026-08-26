/**
 * Step grouping for Survival Phrases mode: simultaneous notes within a chunk.
 */
import { normalizePitchClass } from '@/utils/phraseStreamMatching';

export interface PhraseChordStepNote {
  readonly pitchClass: number;
  readonly stepIndex?: number;
}

export interface PhraseChordStep {
  readonly stepIndex: number;
  readonly noteIndices: readonly number[];
  readonly pitchClasses: readonly number[];
}

export interface PhraseChordStepsCache {
  readonly steps: readonly PhraseChordStep[];
}

const chordStepsCache = new WeakMap<
  readonly PhraseChordStepNote[],
  PhraseChordStepsCache
>();

export function getPhraseChordSteps(
  notes: readonly PhraseChordStepNote[],
): PhraseChordStepsCache {
  const cached = chordStepsCache.get(notes);
  if (cached) return cached;

  const steps: PhraseChordStep[] = [];
  let lastResolvedStepIndex: number | null = null;

  for (let noteIndex = 0; noteIndex < notes.length; noteIndex += 1) {
    const note = notes[noteIndex];
    const resolvedStepIndex = note.stepIndex ?? noteIndex;

    if (
      lastResolvedStepIndex === null
      || resolvedStepIndex !== lastResolvedStepIndex
    ) {
      steps.push({
        stepIndex: steps.length,
        noteIndices: [noteIndex],
        pitchClasses: [normalizePitchClass(note.pitchClass)],
      });
      lastResolvedStepIndex = resolvedStepIndex;
      continue;
    }

    const currentStep = steps[steps.length - 1];
    steps[steps.length - 1] = {
      stepIndex: currentStep.stepIndex,
      noteIndices: [...currentStep.noteIndices, noteIndex],
      pitchClasses: [
        ...currentStep.pitchClasses,
        normalizePitchClass(note.pitchClass),
      ],
    };
  }

  const entry: PhraseChordStepsCache = { steps };
  chordStepsCache.set(notes, entry);
  return entry;
}

export type ChordStepAdvanceResult =
  | 'progress'
  | 'resync'
  | 'chord-hold'
  | 'measure-complete'
  | 'miss';

export interface ChordStepAdvanceState {
  readonly targetStepIndex: number;
  readonly correctNoteIndices: ReadonlySet<number>;
  readonly revealedNoteIndices: ReadonlySet<number>;
}

export interface ChordStepAdvanceEvaluation {
  readonly result: ChordStepAdvanceResult;
  readonly nextState: ChordStepAdvanceState;
}

function pitchClassesForStepIndices(
  notes: readonly PhraseChordStepNote[],
  noteIndices: readonly number[],
): readonly number[] {
  return noteIndices.map((index) => normalizePitchClass(notes[index]?.pitchClass ?? 0));
}

function noteIndicesMatchingPitchClass(
  notes: readonly PhraseChordStepNote[],
  noteIndices: readonly number[],
  pitchClass: number,
): readonly number[] {
  const pc = normalizePitchClass(pitchClass);
  return noteIndices.filter(
    (index) => normalizePitchClass(notes[index]?.pitchClass ?? -1) === pc,
  );
}

function playedPitchClassesInStep(
  notes: readonly PhraseChordStepNote[],
  step: PhraseChordStep,
  correctNoteIndices: ReadonlySet<number>,
): ReadonlySet<number> {
  const played = new Set<number>();
  for (const noteIndex of step.noteIndices) {
    if (correctNoteIndices.has(noteIndex)) {
      played.add(normalizePitchClass(notes[noteIndex]?.pitchClass ?? 0));
    }
  }
  return played;
}

function isStepComplete(
  notes: readonly PhraseChordStepNote[],
  step: PhraseChordStep,
  correctNoteIndices: ReadonlySet<number>,
): boolean {
  const required = new Set(
    pitchClassesForStepIndices(notes, step.noteIndices),
  );
  const played = playedPitchClassesInStep(notes, step, correctNoteIndices);
  for (const pc of required) {
    if (!played.has(pc)) {
      return false;
    }
  }
  return true;
}

function resetStepState(): ChordStepAdvanceState {
  return {
    targetStepIndex: 0,
    correctNoteIndices: new Set(),
    revealedNoteIndices: new Set(),
  };
}

function buildStepState(
  targetStepIndex: number,
  correctNoteIndices: ReadonlySet<number>,
  revealedNoteIndices: ReadonlySet<number>,
): ChordStepAdvanceState {
  return {
    targetStepIndex,
    correctNoteIndices,
    revealedNoteIndices,
  };
}

function applyStepMatch(
  notes: readonly PhraseChordStepNote[],
  steps: readonly PhraseChordStep[],
  stepIndex: number,
  correctNoteIndices: ReadonlySet<number>,
  revealedNoteIndices: ReadonlySet<number>,
  pitchClass: number,
): ChordStepAdvanceState {
  const step = steps[stepIndex];
  if (!step) {
    return resetStepState();
  }

  const matchedIndices = noteIndicesMatchingPitchClass(notes, step.noteIndices, pitchClass);
  const nextCorrect = new Set(correctNoteIndices);
  const nextRevealed = new Set(revealedNoteIndices);
  for (const index of matchedIndices) {
    nextCorrect.add(index);
    nextRevealed.add(index);
  }

  const stepComplete = isStepComplete(notes, step, nextCorrect);
  const nextStepIndex = stepComplete ? stepIndex + 1 : stepIndex;

  return buildStepState(nextStepIndex, nextCorrect, nextRevealed);
}

export function advanceChordStep(
  notes: readonly PhraseChordStepNote[],
  steps: readonly PhraseChordStep[],
  state: ChordStepAdvanceState,
  pitchClass: number,
): ChordStepAdvanceEvaluation {
  if (steps.length === 0) {
    return { result: 'miss', nextState: state };
  }

  const pc = normalizePitchClass(pitchClass);
  const step = steps[state.targetStepIndex];
  if (!step) {
    return { result: 'miss', nextState: resetStepState() };
  }

  const playedInStep = playedPitchClassesInStep(notes, step, state.correctNoteIndices);
  const requiredInStep = new Set(pitchClassesForStepIndices(notes, step.noteIndices));

  if (requiredInStep.has(pc) && !playedInStep.has(pc)) {
    const nextState = applyStepMatch(
      notes,
      steps,
      state.targetStepIndex,
      state.correctNoteIndices,
      state.revealedNoteIndices,
      pc,
    );

    if (nextState.targetStepIndex >= steps.length) {
      return { result: 'measure-complete', nextState };
    }

    return { result: 'progress', nextState };
  }

  if (requiredInStep.has(pc) && playedInStep.has(pc)) {
    return { result: 'chord-hold', nextState: state };
  }

  if (state.targetStepIndex > 0) {
    const firstStep = steps[0];
    if (firstStep) {
      const firstRequired = new Set(
        pitchClassesForStepIndices(notes, firstStep.noteIndices),
      );
      if (firstRequired.has(pc)) {
        const nextState = applyStepMatch(
          notes,
          steps,
          0,
          new Set(),
          new Set(),
          pc,
        );
        return { result: 'resync', nextState };
      }
    }
  }

  return { result: 'miss', nextState: state };
}

export function firstUnmatchedNoteIndexInStep(
  notes: readonly { readonly pitchClass: number }[],
  step: PhraseChordStep,
  correctNoteIndices: ReadonlySet<number>,
): number {
  for (const noteIndex of step.noteIndices) {
    if (!correctNoteIndices.has(noteIndex)) {
      return noteIndex;
    }
  }
  return step.noteIndices[step.noteIndices.length - 1] ?? 0;
}

export function targetNoteIndexFromStepState(
  notes: readonly { readonly pitchClass: number }[],
  steps: readonly PhraseChordStep[],
  state: ChordStepAdvanceState,
): number {
  const step = steps[state.targetStepIndex];
  if (!step) {
    return notes.length;
  }
  return firstUnmatchedNoteIndexInStep(notes, step, state.correctNoteIndices);
}
