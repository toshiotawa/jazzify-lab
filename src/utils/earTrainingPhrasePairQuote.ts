import type { EarTrainingPhrasePairAdlibStep } from '@/utils/earTrainingPhrasePairAdlibAdapter';

/** ペアアドリブの step 吹き出し（未設定・空白は null）。 */
export const getPhrasePairStepQuoteDisplayText = (
  step: Pick<EarTrainingPhrasePairAdlibStep, 'quote'> | null | undefined,
): string | null => {
  const raw = step?.quote;
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};
