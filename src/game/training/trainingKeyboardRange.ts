import { collectTrainingStageMidis } from '@/game/training/trainingQuestionBuilder';
import type { TrainingQuestionBuilderOptions, TrainingRow } from '@/game/training/trainingTypes';

export const computeTrainingStageMidis = (
  training: TrainingRow,
  options: Pick<
    TrainingQuestionBuilderOptions,
    'notationInstrumentId' | 'ignoreNotationInstrument'
  >,
): number[] => collectTrainingStageMidis({
  training,
  notationInstrumentId: options.notationInstrumentId,
  ignoreNotationInstrument: options.ignoreNotationInstrument,
});
