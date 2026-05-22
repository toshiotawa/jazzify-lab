import {
  resolveSurvivalStageIntroSpeaker,
  type SurvivalStageIntroScript,
  type SurvivalStageIntroSpeaker,
} from './survivalStageIntroScriptTypes';

export interface SurvivalStageIntroScheduleHandle {
  readonly cancel: () => void;
}

export interface ScheduleSurvivalStageIntroLinesParams {
  readonly script: SurvivalStageIntroScript;
  readonly isEnglishCopy: boolean;
  /** 空文字は吹き出し非表示 */
  readonly setFaiLine: (text: string) => void;
  readonly setJajiiLine: (text: string) => void;
}

/** @deprecated 互換用。新規は setFaiLine / setJajiiLine を使う。 */
export interface ScheduleSurvivalStageIntroLinesLegacyParams {
  readonly script: SurvivalStageIntroScript;
  readonly isEnglishCopy: boolean;
  readonly setLine: (text: string) => void;
}

const applySpeakerLine = (
  speaker: SurvivalStageIntroSpeaker,
  text: string,
  setFaiLine: (t: string) => void,
  setJajiiLine: (t: string) => void,
): void => {
  if (speaker === 'jajii') {
    setFaiLine('');
    setJajiiLine(text);
  } else {
    setJajiiLine('');
    setFaiLine(text);
  }
};

/**
 * ゲーム開始からの相対秒でセリフを出し、lineDurationSeconds 後に消す（次行が先に来たら表示世代で消去を抑止）。
 * フレームループ不使用。キャンセル時は setLine('')。
 */
export const scheduleSurvivalStageIntroLines = (
  params: ScheduleSurvivalStageIntroLinesParams,
): SurvivalStageIntroScheduleHandle => {
  const { script, isEnglishCopy, setFaiLine, setJajiiLine } = params;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let displayGeneration = 0;
  const durationMs = Math.max(100, Math.round(script.lineDurationSeconds * 1000));

  const clearAll = (): void => {
    setFaiLine('');
    setJajiiLine('');
  };

  for (const line of script.lines) {
    const showMs = Math.max(0, Math.round(line.atSeconds * 1000));
    const showTimer = setTimeout(() => {
      displayGeneration += 1;
      const gen = displayGeneration;
      const t = isEnglishCopy ? line.text.en : line.text.ja;
      applySpeakerLine(resolveSurvivalStageIntroSpeaker(line), t, setFaiLine, setJajiiLine);
      const hideTimer = setTimeout(() => {
        if (displayGeneration === gen) {
          clearAll();
        }
      }, durationMs);
      timers.push(hideTimer);
    }, showMs);
    timers.push(showTimer);
  }

  return {
    cancel: () => {
      displayGeneration = 1_000_000_000;
      timers.forEach((t) => {
        clearTimeout(t);
      });
      clearAll();
    },
  };
};

/** ファイ吹き出しのみ（従来 API）。 */
export const scheduleSurvivalStageIntroLinesLegacy = (
  params: ScheduleSurvivalStageIntroLinesLegacyParams,
): SurvivalStageIntroScheduleHandle =>
  scheduleSurvivalStageIntroLines({
    script: params.script,
    isEnglishCopy: params.isEnglishCopy,
    setFaiLine: params.setLine,
    setJajiiLine: () => undefined,
  });
