const BEAT_EPS = 1e-6;

/** ガードポーズ／OSU shatter と同尺のパリィ視覚尺 */
export const JUST_PARRY_MIN_DURATION_MS = 120;
export const JUST_PARRY_VISUAL_DURATION_MS = 450;

/**
 * ヒット音符の長さに合わせたフィニッシュ／持続尺。
 * 次ターゲットまで（なければ fallback 終端）−1ms、下限は minDurationMs。
 */
export const resolveJustParryEffectDurationMs = (
  hitPhraseTimeSec: number,
  nextTargetPhraseSec: number | undefined,
  fallbackEndPhraseSec: number | undefined,
  minDurationMs: number = JUST_PARRY_MIN_DURATION_MS,
): number => {
  if (
    nextTargetPhraseSec !== undefined
    && Number.isFinite(nextTargetPhraseSec)
    && nextTargetPhraseSec > hitPhraseTimeSec + BEAT_EPS
  ) {
    const noteDurationMs = Math.round((nextTargetPhraseSec - hitPhraseTimeSec) * 1000);
    return Math.max(minDurationMs, noteDurationMs - 1);
  }
  if (
    fallbackEndPhraseSec !== undefined
    && Number.isFinite(fallbackEndPhraseSec)
    && fallbackEndPhraseSec > hitPhraseTimeSec + BEAT_EPS
  ) {
    const noteDurationMs = Math.round((fallbackEndPhraseSec - hitPhraseTimeSec) * 1000);
    return Math.max(minDurationMs, noteDurationMs - 1);
  }
  return minDurationMs;
};
