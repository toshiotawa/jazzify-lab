/** 判定ウィンドウユーティリティ  */
export const inJudgeWindow = (
  now: number,
  target: number,
  width = 200 /* ±ms */
): boolean => Math.abs(now - target) <= width;

export type JudgeResult = 'success' | 'miss';