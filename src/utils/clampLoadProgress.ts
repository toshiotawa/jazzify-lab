/** 0–1 にクランプする（ロード進捗表示用）。 */
export const clampLoadProgress = (value: number): number =>
  Math.min(1, Math.max(0, value));
