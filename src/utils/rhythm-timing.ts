/**
 * リズムモード - プログレッションパターンのタイミング定数と関数
 */

// タイミング定数
export const RHYTHM_TIMING = {
  // 出題タイミング: 4拍子の場合、4拍目のウラ (4.50)
  QUESTION_APPEARANCE_OFFSET: 0.50,
  
  // 判定受付終了タイミング: 4拍子の場合、4拍目のウラの直前 (4.49)
  JUDGMENT_CUTOFF_OFFSET: 0.49,
  
  // 判定許容範囲 (ms)
  JUDGMENT_TOLERANCE_MS: 200,
} as const;

/**
 * 指定された拍子における出題タイミングを計算
 * @param timeSignature 拍子 (例: 4 = 4/4拍子)
 * @returns 出題タイミングの拍位置 (例: 4.50)
 */
export function getQuestionAppearanceBeat(timeSignature: number): number {
  return timeSignature + RHYTHM_TIMING.QUESTION_APPEARANCE_OFFSET;
}

/**
 * 指定された拍子における判定受付終了タイミングを計算
 * @param timeSignature 拍子 (例: 4 = 4/4拍子)
 * @returns 判定終了タイミングの拍位置 (例: 4.49)
 */
export function getJudgmentCutoffBeat(timeSignature: number): number {
  return timeSignature + RHYTHM_TIMING.JUDGMENT_CUTOFF_OFFSET;
}

/**
 * 現在の拍位置が判定受付期間内かどうかを判定
 * @param currentBeatDecimal 現在の拍位置 (小数点付き)
 * @param timeSignature 拍子
 * @returns 判定受付期間内ならtrue
 */
export function isWithinJudgmentWindow(
  currentBeatDecimal: number,
  timeSignature: number
): boolean {
  const cutoffBeat = getJudgmentCutoffBeat(timeSignature);
  
  // 現在の小節内での位置を正規化 (1.0 - timeSignature.99)
  const normalizedBeat = ((currentBeatDecimal - 1) % timeSignature) + 1;
  
  // 判定受付は1拍目から判定終了タイミングまで
  return normalizedBeat >= 1.0 && normalizedBeat <= cutoffBeat;
}

/**
 * 次の出題タイミングまでの時間を計算
 * @param currentBeatDecimal 現在の拍位置
 * @param timeSignature 拍子
 * @param bpm BPM
 * @returns 次の出題タイミングまでのミリ秒数
 */
export function getTimeUntilNextQuestion(
  currentBeatDecimal: number,
  timeSignature: number,
  bpm: number
): number {
  const questionBeat = getQuestionAppearanceBeat(timeSignature);
  const normalizedBeat = ((currentBeatDecimal - 1) % timeSignature) + 1;
  
  let beatsUntilQuestion: number;
  if (normalizedBeat <= questionBeat) {
    // 今の小節内で出題タイミングがある
    beatsUntilQuestion = questionBeat - normalizedBeat;
  } else {
    // 次の小節の出題タイミングまで
    beatsUntilQuestion = (timeSignature - normalizedBeat) + questionBeat;
  }
  
  const msPerBeat = 60000 / bpm;
  return beatsUntilQuestion * msPerBeat;
}

/**
 * リズムモードのタイミング状態
 */
export interface RhythmTimingState {
  isQuestionActive: boolean;      // 問題が出題されているか
  isJudgmentActive: boolean;      // 判定受付中か
  isInNullPeriod: boolean;        // NULL期間中か
  timeUntilNextQuestion: number;  // 次の出題までの時間 (ms)
  currentPhase: 'waiting' | 'judgment' | 'null' | 'transition';
}

/**
 * 現在のリズムタイミング状態を取得
 * @param currentBeatDecimal 現在の拍位置
 * @param timeSignature 拍子
 * @param bpm BPM
 * @param hasCompletedChord 現在のコードが完成しているか
 * @returns リズムタイミング状態
 */
export function getRhythmTimingState(
  currentBeatDecimal: number,
  timeSignature: number,
  bpm: number,
  hasCompletedChord: boolean
): RhythmTimingState {
  const normalizedBeat = ((currentBeatDecimal - 1) % timeSignature) + 1;
  const questionBeat = getQuestionAppearanceBeat(timeSignature);
  const cutoffBeat = getJudgmentCutoffBeat(timeSignature);
  
  let currentPhase: 'waiting' | 'judgment' | 'null' | 'transition';
  let isQuestionActive = false;
  let isJudgmentActive = false;
  let isInNullPeriod = false;
  
  if (normalizedBeat < 1.0) {
    // 小節の開始前（通常はありえない）
    currentPhase = 'waiting';
  } else if (normalizedBeat >= questionBeat) {
    // 出題タイミング以降 = 次の小節を待っている
    currentPhase = 'transition';
    isQuestionActive = false;
    isJudgmentActive = false;
  } else if (normalizedBeat >= cutoffBeat) {
    // 判定終了後、出題タイミングまでの僅かな時間
    currentPhase = 'transition';
    isQuestionActive = true;
    isJudgmentActive = false;
  } else if (hasCompletedChord) {
    // コード完成後のNULL期間
    currentPhase = 'null';
    isQuestionActive = false;
    isJudgmentActive = false;
    isInNullPeriod = true;
  } else {
    // 判定受付中
    currentPhase = 'judgment';
    isQuestionActive = true;
    isJudgmentActive = true;
  }
  
  const timeUntilNextQuestion = getTimeUntilNextQuestion(currentBeatDecimal, timeSignature, bpm);
  
  return {
    isQuestionActive,
    isJudgmentActive,
    isInNullPeriod,
    timeUntilNextQuestion,
    currentPhase
  };
}