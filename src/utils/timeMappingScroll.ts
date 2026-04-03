export interface TimeMappingEntry {
  timeMs: number;
  xPosition: number;
}

/**
 * 再生位置に対応する楽譜上の X（線形補間）。線形走査 O(n) を避け二分探索 O(log n)。
 */
export function computeXPositionFromTimeMapping(
  mapping: TimeMappingEntry[],
  currentTimeMs: number,
  loopDurationMs: number,
  sheetWidth: number
): number {
  const len = mapping.length;
  if (len === 0) return 0;

  if (currentTimeMs < mapping[0].timeMs) {
    return 0;
  }

  if (len >= 2) {
    let lo = 0;
    let hi = len - 2;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const t0 = mapping[mid].timeMs;
      const t1 = mapping[mid + 1].timeMs;
      if (currentTimeMs < t0) {
        hi = mid - 1;
      } else if (currentTimeMs >= t1) {
        lo = mid + 1;
      } else {
        const dt = t1 - t0;
        const t = dt > 0 ? (currentTimeMs - t0) / dt : 0;
        return mapping[mid].xPosition + t * (mapping[mid + 1].xPosition - mapping[mid].xPosition);
      }
    }
  }

  const lastEntry = mapping[len - 1];
  if (currentTimeMs >= lastEntry.timeMs) {
    const remainingTime = loopDurationMs - lastEntry.timeMs;
    if (remainingTime > 0) {
      const frac = (currentTimeMs - lastEntry.timeMs) / remainingTime;
      return lastEntry.xPosition + frac * (sheetWidth - lastEntry.xPosition);
    }
    return lastEntry.xPosition;
  }

  return 0;
}
