/**
 * リズムゲーム判定ウィンドウユーティリティ
 * 太鼓の達人風の判定ロジックを実装
 */

/**
 * 判定ウィンドウ内かどうかを判定
 * @param now - 現在時刻（ミリ秒）
 * @param target - ターゲット時刻（ミリ秒）
 * @param width - 判定ウィンドウ幅（デフォルト200ms）
 * @returns 判定ウィンドウ内ならtrue
 */
export const inWindow = (now: number, target: number, width = 200): boolean => {
  return Math.abs(now - target) <= width;
};

/**
 * 判定結果の詳細を取得
 * @param now - 現在時刻（ミリ秒）
 * @param target - ターゲット時刻（ミリ秒）
 * @returns 判定結果の詳細
 */
export const getJudgeDetail = (now: number, target: number): {
  inWindow: boolean;
  diff: number;
  early: boolean;
} => {
  const diff = now - target;
  return {
    inWindow: Math.abs(diff) <= 200,
    diff,
    early: diff < 0
  };
};