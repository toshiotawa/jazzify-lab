import type { EarTrainingPhraseChord } from '@/types';

/** コード演奏バトル吹き出しに載せるテキスト（未設定・空白は null）。 */
export const getChordVoicingQuoteDisplayText = (
  chord: Pick<EarTrainingPhraseChord, 'quote'> | null | undefined,
): string | null => {
  const raw = chord?.quote?.text;
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};
