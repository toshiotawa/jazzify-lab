import { collectTrainingStageMidis } from '@/game/training/trainingQuestionBuilder';
import type { TrainingQuestionBuilderOptions, TrainingRow } from '@/game/training/trainingTypes';

export const computeTrainingStageMidis = (
  training: TrainingRow,
  options: Pick<
    TrainingQuestionBuilderOptions,
    'notationInstrumentId' | 'notationOctaveShift' | 'ignoreNotationInstrument'
  >,
): number[] => collectTrainingStageMidis({
  training,
  notationInstrumentId: options.notationInstrumentId,
  notationOctaveShift: options.notationOctaveShift,
  ignoreNotationInstrument: options.ignoreNotationInstrument,
});
