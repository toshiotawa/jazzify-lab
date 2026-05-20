import { SURVIVAL_PHRASE_DEFAULT_DRUM_LOOP_URL } from '@/utils/survivalPhraseDrumLoop';

/**
 * Phrases マップ試聴用 URL（本編 `SurvivalGameScreen` と同じ解決順）。
 */
export const resolveSurvivalPhrasePreviewUrl = (
  phraseBgmUrl: string | null | undefined,
  phrasesStageBgm: string,
): string => {
  const trimmedPhrase = phraseBgmUrl?.trim() ?? '';
  if (trimmedPhrase.length > 0) {
    return trimmedPhrase;
  }
  const trimmedDefault = phrasesStageBgm?.trim() ?? '';
  if (trimmedDefault.length > 0) {
    return trimmedDefault;
  }
  return SURVIVAL_PHRASE_DEFAULT_DRUM_LOOP_URL;
};
