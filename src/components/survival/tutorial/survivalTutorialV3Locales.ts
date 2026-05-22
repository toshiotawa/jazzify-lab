import type { SurvivalTutorialLocalizedText } from './survivalTutorialV3ScriptTypes';
import type { TutorialResolvedTextSegment } from '@/types/tutorialStyledText';
import {
  interpolateRemainingOnSegments,
  resolveTutorialStyledSegments,
} from '@/types/tutorialStyledText';

export function survivalTutorialLocalized(
  text: SurvivalTutorialLocalizedText,
  english: boolean,
): string {
  return english ? text.en : text.ja;
}

export function interpolateRemaining(template: string, remaining: number): string {
  return template.split('{{remaining}}').join(String(remaining));
}

/** v3 の `styled` とロケールを解決した表示セグメント。 */
export function survivalTutorialResolvedSegments(
  text: SurvivalTutorialLocalizedText,
  isEnglishCopy: boolean,
): readonly TutorialResolvedTextSegment[] {
  return resolveTutorialStyledSegments(text, isEnglishCopy);
}

export function survivalTutorialResolvedSegmentsWithRemaining(
  text: SurvivalTutorialLocalizedText,
  isEnglishCopy: boolean,
  remaining: number,
): readonly TutorialResolvedTextSegment[] {
  return interpolateRemainingOnSegments(resolveTutorialStyledSegments(text, isEnglishCopy), remaining);
}
