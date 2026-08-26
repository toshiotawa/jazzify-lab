/** フレーズ/ペア/複合の部分進捗を、最後の正解入力からこの秒数で静かにリセットする */
export const PHRASE_PROGRESS_IDLE_RESET_SEC = 15;

export const PHRASE_PROGRESS_IDLE_RESET_MS = PHRASE_PROGRESS_IDLE_RESET_SEC * 1000;

export function isPhraseProgressIdleExpired(
  lastProgressAtSec: number | null,
  nowSec: number,
): boolean {
  if (lastProgressAtSec === null) {
    return false;
  }
  return nowSec - lastProgressAtSec >= PHRASE_PROGRESS_IDLE_RESET_SEC;
}
