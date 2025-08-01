/** リズムモード共通ユーティリティ */

export const JUDGEMENT_WINDOW_MS = 200;          // ±200 ms
export const COUNT_IN_SYMBOL = '/';             // UI に使う区分け記号

/** 次の判定〆切を返す (ms) */
export const nextDeadline = (now = performance.now()): number =>
  now + JUDGEMENT_WINDOW_MS * 2;                // 前後 200 ms → 幅 400 ms

/**
 * ループ用に「今がカウントイン中か」を求める。
 * 返り値 true → UI は "M / – B n" で表示
 */
export const isInCountIn = (
  currentMeasure: number,
  countInMeasures: number
): boolean => currentMeasure <= countInMeasures;