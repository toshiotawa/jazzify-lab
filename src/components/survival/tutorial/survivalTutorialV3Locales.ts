import type { SurvivalTutorialLocalizedText } from './survivalTutorialV3ScriptTypes';

export function survivalTutorialLocalized(
  text: SurvivalTutorialLocalizedText,
  english: boolean,
): string {
  return english ? text.en : text.ja;
}

export function interpolateRemaining(template: string, remaining: number): string {
  return template.split('{{remaining}}').join(String(remaining));
}
