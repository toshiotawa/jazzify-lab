/**
 * chord_quiz: 次の出題インデックス（読み取りやすさのため `items[].order_index` は使わず 0..n-1）。
 * `random`: 問題が2つ以上あるとき `prevIndex` と別の問題を選ぶ。
 */
export const pickNextQuizIndex = <T extends { order_index?: number | null }>(
  items: readonly T[],
  order: 'random' | 'sequential',
  prevIndex: number | null,
  rand: () => number,
): number => {
  const n = items.length;
  if (n <= 0) {
    return 0;
  }
  if (n === 1) {
    return 0;
  }
  if (order === 'sequential') {
    return ((prevIndex ?? -1) + 1) % n;
  }
  let next = Math.floor(rand() * n);
  if (prevIndex !== null && next === prevIndex) {
    let guard = 0;
    while (next === prevIndex && guard < 32) {
      next = Math.floor(rand() * n);
      guard += 1;
    }
    if (next === prevIndex) {
      next = (prevIndex + 1) % n;
    }
  }
  return next;
};

export const isQuizClear = (correct: number, required: number): boolean => (
  correct >= Math.max(0, required)
);
