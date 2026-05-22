import type { EarTrainingQuotePayload } from '@/game/earTraining/types';
import type { TutorialResolvedTextSegment } from '@/types/tutorialStyledText';
import { TUTORIAL_DIALOG_BODY_COLOR } from '@/types/tutorialStyledText';

export const normalizeEarTrainingQuotePayload = (
  content: EarTrainingQuotePayload | null,
): readonly TutorialResolvedTextSegment[] | null => {
  if (content === null) {
    return null;
  }
  if (typeof content === 'string') {
    const t = content.trim();
    return t.length > 0 ? [{ text: t, color: TUTORIAL_DIALOG_BODY_COLOR }] : null;
  }
  const parts = content.segments.filter((s) => s.text.length > 0);
  return parts.length > 0 ? parts : null;
};

export const earTrainingQuoteSegmentsCacheKey = (
  segments: readonly TutorialResolvedTextSegment[] | null,
): string => {
  if (segments === null || segments.length === 0) {
    return '';
  }
  return segments.map((s) => `${s.color}\u001f${s.text}`).join('\u001e');
};
