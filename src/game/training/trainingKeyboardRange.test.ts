import {
  computeTrainingQuestionMidis,
  expandTrainingKeyboardMidis,
} from '@/game/training/trainingKeyboardRange';
import type { TrainingQuestion } from '@/game/training/trainingTypes';

const makeQuestion = (midis: readonly number[]): TrainingQuestion => ({
  questionKey: 'q1',
  promptLabel: 'C',
  notes: midis.map((midi, index) => ({
    noteName: 'C4',
    midi,
    pitchClass: midi % 12,
    staff: 1 as const,
    isTarget: true,
  })),
  layout: 'horizontal',
  ordered: false,
  keyFifths: 0,
  rootMidi: null,
});

describe('trainingKeyboardRange', () => {
  it('collects all note midis from a question', () => {
    expect(computeTrainingQuestionMidis(makeQuestion([60, 64, 67]))).toEqual([60, 64, 67]);
  });

  it('expands accumulated range without shrinking', () => {
    expect(expandTrainingKeyboardMidis([], [60, 67])).toEqual([60, 67]);
    expect(expandTrainingKeyboardMidis([60, 67], [55])).toEqual([55, 67]);
    expect(expandTrainingKeyboardMidis([55, 67], [72])).toEqual([55, 72]);
    expect(expandTrainingKeyboardMidis([55, 72], [60])).toEqual([55, 72]);
  });
});
