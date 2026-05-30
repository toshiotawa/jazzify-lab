import type { SurvivalTutorialLocalizedText } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';

import { survivalTutorialLocalized } from './survivalTutorialV3Locales';

/** v3 台詞の話者。`dialogue_only` 省略時は fai、バトル dialogue 省略時は jajii。 */
export type SurvivalTutorialV3DialogueSpeaker = 'fai' | 'jajii' | 'narration';

export type SurvivalTutorialV3LineContext = 'dialogue_only' | 'battle';

const SPEAKERS: readonly SurvivalTutorialV3DialogueSpeaker[] = ['fai', 'jajii', 'narration'];

export const resolveSurvivalTutorialV3Speaker = (
  line: SurvivalTutorialLocalizedText & { readonly speaker?: SurvivalTutorialV3DialogueSpeaker | string },
  context: SurvivalTutorialV3LineContext,
): SurvivalTutorialV3DialogueSpeaker => {
  const raw = line.speaker;
  if (typeof raw === 'string' && (SPEAKERS as readonly string[]).includes(raw)) {
    return raw as SurvivalTutorialV3DialogueSpeaker;
  }
  return context === 'battle' ? 'jajii' : 'fai';
};

export interface SurvivalTutorialV3LinePresentationSink {
  readonly setCharacterText: (text: string) => void;
  readonly setNarrationText: (text: string) => void;
  readonly setJajiiSpeechText: (text: string) => void;
}

/** 1 行を話者に応じて表示先へ振り分け（他チャンネルはクリア）。 */
export const presentSurvivalTutorialV3Line = (
  line: SurvivalTutorialLocalizedText & { readonly speaker?: SurvivalTutorialV3DialogueSpeaker | string },
  isEnglishCopy: boolean,
  context: SurvivalTutorialV3LineContext,
  sink: SurvivalTutorialV3LinePresentationSink,
): void => {
  presentSurvivalTutorialV3ResolvedLine(
    line,
    survivalTutorialLocalized(line, isEnglishCopy),
    context,
    sink,
  );
};

/** 解決済み文字列を話者に応じて表示（`{{remaining}}` 展開後など）。 */
export const presentSurvivalTutorialV3ResolvedLine = (
  line: SurvivalTutorialLocalizedText & { readonly speaker?: SurvivalTutorialV3DialogueSpeaker | string },
  resolvedLine: string,
  context: SurvivalTutorialV3LineContext,
  sink: SurvivalTutorialV3LinePresentationSink,
): void => {
  const speaker = resolveSurvivalTutorialV3Speaker(line, context);
  sink.setCharacterText('');
  sink.setNarrationText('');
  sink.setJajiiSpeechText('');

  switch (speaker) {
    case 'fai':
      sink.setCharacterText(resolvedLine);
      break;
    case 'jajii':
      sink.setJajiiSpeechText(resolvedLine);
      break;
    case 'narration':
      sink.setNarrationText(resolvedLine);
      break;
    default:
      sink.setCharacterText(resolvedLine);
  }
};

export const clearSurvivalTutorialV3LinePresentation = (
  sink: SurvivalTutorialV3LinePresentationSink,
): void => {
  sink.setCharacterText('');
  sink.setNarrationText('');
  sink.setJajiiSpeechText('');
};
