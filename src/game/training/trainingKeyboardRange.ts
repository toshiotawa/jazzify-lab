import type { TrainingQuestion } from '@/game/training/trainingTypes';

export const computeTrainingQuestionMidis = (question: TrainingQuestion): number[] => {
  const midis: number[] = [];
  for (let i = 0; i < question.notes.length; i += 1) {
    midis.push(question.notes[i].midi);
  }
  return midis;
};

/**
 * Merge question midis into an accumulated range, expanding min/max only (never shrinking).
 * Returns [minMidi, maxMidi] when non-empty; otherwise returns the previous accumulated values.
 */
export const expandTrainingKeyboardMidis = (
  accumulated: readonly number[],
  questionMidis: readonly number[],
): number[] => {
  if (questionMidis.length === 0) {
    return accumulated.length > 0 ? [...accumulated] : [];
  }

  let minMidi = accumulated.length >= 2 ? accumulated[0] : questionMidis[0];
  let maxMidi = accumulated.length >= 2 ? accumulated[1] : questionMidis[0];

  if (accumulated.length >= 2) {
    minMidi = accumulated[0];
    maxMidi = accumulated[1];
  } else if (accumulated.length === 1) {
    minMidi = accumulated[0];
    maxMidi = accumulated[0];
  } else {
    minMidi = questionMidis[0];
    maxMidi = questionMidis[0];
  }

  for (let i = 0; i < questionMidis.length; i += 1) {
    const midi = questionMidis[i];
    if (midi < minMidi) minMidi = midi;
    if (midi > maxMidi) maxMidi = midi;
  }

  return [minMidi, maxMidi];
};
