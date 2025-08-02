/**
 * 判定ウィンドウ内かどうかを判定する
 * @param nowMs 現在時刻（ミリ秒）
 * @param targetMs ターゲット時刻（ミリ秒）
 * @param width ウィンドウ幅（片側、デフォルト200ms）
 * @returns 判定ウィンドウ内であればtrue
 */
export const inWindow = (nowMs: number, targetMs: number, width = 200): boolean => {
  return Math.abs(nowMs - targetMs) <= width;
};

export default inWindow;