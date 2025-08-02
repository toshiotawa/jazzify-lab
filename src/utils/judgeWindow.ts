/**
 * リズムモード用の判定ウィンドウユーティリティ
 */

/**
 * 判定ウィンドウ内にあるかどうかを判定
 * @param nowMs 現在時刻（ms）
 * @param targetMs ターゲット時刻（ms）
 * @param windowMs 判定ウィンドウの幅（片側、デフォルト200ms）
 * @returns 判定ウィンドウ内ならtrue
 */
export const inWindow = (nowMs: number, targetMs: number, windowMs: number = 200): boolean => {
  return Math.abs(nowMs - targetMs) <= windowMs;
};

/**
 * タイミング誤差を計算
 * @param nowMs 現在時刻（ms）
 * @param targetMs ターゲット時刻（ms）
 * @returns タイミング誤差（ms）正の値は遅い、負の値は早い
 */
export const getTimingError = (nowMs: number, targetMs: number): number => {
  return nowMs - targetMs;
};

/**
 * 判定結果を取得
 * @param nowMs 現在時刻（ms）
 * @param targetMs ターゲット時刻（ms）
 * @returns 'early' | 'perfect' | 'late' | 'miss'
 */
export const getJudgment = (nowMs: number, targetMs: number): 'early' | 'perfect' | 'late' | 'miss' => {
  const error = getTimingError(nowMs, targetMs);
  
  if (Math.abs(error) <= 50) return 'perfect';
  if (error < -200) return 'miss';
  if (error > 200) return 'miss';
  if (error < 0) return 'early';
  return 'late';
};