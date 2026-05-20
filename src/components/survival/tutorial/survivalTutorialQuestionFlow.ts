/** progression / random の 1 問サイクル用（タイマー駆動。フレームループ無し）。 */

export interface SurvivalTutorialQuestionCallbacks {
  /** 問題非表示フェーズ開始（モンスター削除・譜面隠す等）。 */
  readonly onIntro: () => void;
  /** 問題表示フェーズ開始（譜面・リング spawn・`setSlotBChord` 済み）。 */
  readonly onRevealFight: () => void;
}

export interface RunSurvivalTutorialQuestionsParams {
  readonly totalQuestions: number;
  /** intro が表示されたら「タップ or この秒数が経過」で reveal へ */
  readonly introHoldSeconds?: number;
  readonly signal: AbortSignal;
  readonly sleepSeconds: (seconds: number, signal: AbortSignal) => Promise<void>;
  readonly callbacks: SurvivalTutorialQuestionCallbacks;
  readonly onPrepareQuestion?: (questionIndex: number) => Promise<void> | void;
  readonly waitForChordCompletion: (timeoutSeconds: number) => Promise<boolean>;
  readonly completionTimeoutSeconds?: number;
  readonly afterCorrectSleepSeconds?: number;
  readonly emitSpecialGaugeSkill: () => void;
  /** 各質問ごとに新しいインスタンスへ差し替え（フルスクリーンタップで resolve） */
  readonly awaitIntroTap: () => Promise<void>;
  readonly afterCorrect?: (remainingQuestions: number, questionIndexCompleted: number) => void;
}

export const runSurvivalTutorialQuestions = async (
  params: RunSurvivalTutorialQuestionsParams,
): Promise<boolean> => {
  const introHoldSeconds = params.introHoldSeconds ?? 4;
  const completionTimeoutSeconds = params.completionTimeoutSeconds ?? 180;
  const afterCorrectSleepSeconds = params.afterCorrectSleepSeconds ?? 1;

  for (let questionIndex = 0; questionIndex < params.totalQuestions; questionIndex += 1) {
    if (params.signal.aborted) {
      return false;
    }

    await params.onPrepareQuestion?.(questionIndex);

    params.callbacks.onIntro();

    await Promise.race([
      params.sleepSeconds(introHoldSeconds, params.signal),
      params.awaitIntroTap(),
    ]);

    if (params.signal.aborted) {
      return false;
    }

    params.callbacks.onRevealFight();

    const done = await params.waitForChordCompletion(completionTimeoutSeconds);
    if (params.signal.aborted || !done) {
      return false;
    }

    params.emitSpecialGaugeSkill();

    const remainingQuestions = Math.max(
      0,
      params.totalQuestions - questionIndex - 1,
    );
    params.afterCorrect?.(remainingQuestions, questionIndex);

    await params.sleepSeconds(afterCorrectSleepSeconds, params.signal);
  }

  return !params.signal.aborted;
};
