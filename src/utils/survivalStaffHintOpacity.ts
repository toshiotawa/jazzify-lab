import type { ProductionHintMode } from '@/types';

const FADE_15S_STEPS: Record<number, number> = {
  11: 0.8,
  12: 0.6,
  13: 0.4,
  14: 0.2,
};

/** fade_15s: 0〜10秒 1.0 → 11〜14秒 段階フェード → 15秒以降 0.0 */
export function opacityForProductionHintMode(
  elapsedSec: number,
  productionHintMode: ProductionHintMode,
): number {
  if (productionHintMode === 'always') {
    return 1;
  }
  if (productionHintMode === 'hidden_until_pressed') {
    return 0;
  }
  const t = Math.floor(elapsedSec);
  if (t < 11) {
    return 1;
  }
  if (t >= 15) {
    return 0;
  }
  return FADE_15S_STEPS[t] ?? 1;
}

/** HINT OFF 本番: 未正解音符 opacity（DB productionHintMode に従う）。 */
export function computeUnpressedNoteOpacity(
  elapsedSec: number,
  options: {
    readonly hintMode: boolean;
    readonly hintBuffActive: boolean;
    readonly productionHintMode: ProductionHintMode;
    readonly isStageMode: boolean;
    readonly isPlaying: boolean;
    readonly isGameOver: boolean;
  },
): number {
  const {
    hintMode,
    hintBuffActive,
    productionHintMode,
    isStageMode,
    isPlaying,
    isGameOver,
  } = options;
  if (hintMode || hintBuffActive || !isStageMode || !isPlaying || isGameOver) {
    return 1;
  }
  return opacityForProductionHintMode(elapsedSec, productionHintMode);
}

/** 鍵盤 pending ハイライト opacity（DB productionHintMode に従う）。 */
export function computeKeyboardHintOpacity(
  elapsedSec: number,
  options: {
    readonly hintMode: boolean;
    readonly hintBuffActive: boolean;
    readonly productionHintMode: ProductionHintMode;
    readonly isStageMode: boolean;
    readonly isPlaying: boolean;
    readonly isGameOver: boolean;
  },
): number {
  const {
    hintMode,
    hintBuffActive,
    productionHintMode,
    isStageMode,
    isPlaying,
    isGameOver,
  } = options;
  if (hintMode || hintBuffActive || !isStageMode || !isPlaying || isGameOver) {
    return 1;
  }
  return opacityForProductionHintMode(elapsedSec, productionHintMode);
}

export interface SurvivalVoicingHintRenderer {
  setVoicingHints(pendingMidiNotes: readonly number[], completedMidiNotes: readonly number[]): void;
  setVoicingHintsByIntensity(
    strongMidis: readonly number[],
    mediumMidis: readonly number[],
    softMidis: readonly number[],
    completedMidiNotes: readonly number[],
  ): void;
  clearVoicingHints(): void;
}

/** pending ハイライトを opacity に応じて強度別描画。completed は常に通常表示。 */
export const applySurvivalVoicingHintsWithOpacity = (
  renderer: SurvivalVoicingHintRenderer,
  pendingMidi: readonly number[],
  completedMidi: readonly number[],
  opacity: number,
): void => {
  if (pendingMidi.length === 0 && completedMidi.length === 0) {
    renderer.clearVoicingHints();
    return;
  }
  if (opacity <= 0) {
    renderer.setVoicingHints([], completedMidi);
    return;
  }
  if (opacity >= 1) {
    renderer.setVoicingHints(pendingMidi, completedMidi);
    return;
  }
  if (opacity >= 0.75) {
    renderer.setVoicingHintsByIntensity(pendingMidi, [], [], completedMidi);
  } else if (opacity >= 0.5) {
    renderer.setVoicingHintsByIntensity([], pendingMidi, [], completedMidi);
  } else {
    renderer.setVoicingHintsByIntensity([], [], pendingMidi, completedMidi);
  }
};
