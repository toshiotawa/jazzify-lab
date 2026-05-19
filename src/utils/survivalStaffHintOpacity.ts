/** HINT OFF 本番: 未正解音符の opacity（25秒までは1.0、26〜29秒で0.8→0.2、30秒以降0.0）。 */
export function computeUnpressedNoteOpacity(
  elapsedSec: number,
  options: {
    readonly hintMode: boolean;
    readonly hintBuffActive: boolean;
    readonly isStageMode: boolean;
    readonly isPlaying: boolean;
    readonly isGameOver: boolean;
  },
): number {
  const { hintMode, hintBuffActive, isStageMode, isPlaying, isGameOver } = options;
  if (hintMode || hintBuffActive || !isStageMode || !isPlaying || isGameOver) {
    return 1;
  }
  const t = Math.floor(elapsedSec);
  if (t < 25) {
    return 1;
  }
  if (t >= 30) {
    return 0;
  }
  const fadeSteps: Record<number, number> = {
    26: 0.8,
    27: 0.6,
    28: 0.4,
    29: 0.2,
  };
  return fadeSteps[t] ?? 1;
}
