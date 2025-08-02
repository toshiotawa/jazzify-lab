/**
 * ファンタジーゲームのポジション計算ユーティリティ
 */

/**
 * プレイヤーゲージの計算
 * @param now 現在時刻
 * @param beat2 問題開始（Beat2）時刻
 * @param beat1 次のBeat1時刻
 * @returns 0-100のゲージ値
 */
export function calcPlayerGauge(
  now: number,
  beat2: number,
  beat1: number
): number {
  const firstSpan = beat1 - beat2; // 0%→95%
  const secondSpan = 400; // 95%→100% (±200ms)
  
  const p = now < beat1
    ? (now - beat2) / firstSpan * 95
    : 95 + Math.min((now - beat1) / secondSpan * 5, 5);
    
  return Math.max(0, Math.min(100, p));
}