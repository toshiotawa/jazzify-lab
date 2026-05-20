import type { SurvivalStageIntroScript } from './survivalStageIntroScriptTypes';

export interface SurvivalStageIntroScheduleHandle {
  readonly cancel: () => void;
}

export interface ScheduleSurvivalStageIntroLinesParams {
  readonly script: SurvivalStageIntroScript;
  readonly isEnglishCopy: boolean;
  /** 空文字は吹き出し非表示 */
  readonly setLine: (text: string) => void;
}

/**
 * ゲーム開始からの相対秒でセリフを出し、lineDurationSeconds 後に消す（次行が先に来たら表示世代で消去を抑止）。
 * フレームループ不使用。キャンセル時は setLine('')。
 */
export const scheduleSurvivalStageIntroLines = (
  params: ScheduleSurvivalStageIntroLinesParams,
): SurvivalStageIntroScheduleHandle => {
  const { script, isEnglishCopy, setLine } = params;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let displayGeneration = 0;
  const durationMs = Math.max(100, Math.round(script.lineDurationSeconds * 1000));

  for (const line of script.lines) {
    const showMs = Math.max(0, Math.round(line.atSeconds * 1000));
    const showTimer = setTimeout(() => {
      displayGeneration += 1;
      const gen = displayGeneration;
      const t = isEnglishCopy ? line.text.en : line.text.ja;
      setLine(t);
      const hideTimer = setTimeout(() => {
        if (displayGeneration === gen) {
          setLine('');
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
      setLine('');
    },
  };
};
