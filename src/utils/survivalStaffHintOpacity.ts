/** HINT OFF 本番: 未正解音符の opacity（5秒までは1.0、6〜9秒で0.8→0.2、10秒以降0.0）。 */
export function computeUnpressedNoteOpacity(
  elapsedSec: number,
  options: {
    readonly hintMode: boolean;
    readonly hintBuffActive: boolean;
    readonly beginnerAssistActive?: boolean;
    readonly isPhraseMode?: boolean;
    readonly isStageMode: boolean;
    readonly isPlaying: boolean;
    readonly isGameOver: boolean;
  },
): number {
  const {
    hintMode,
    hintBuffActive,
    beginnerAssistActive = false,
    isPhraseMode = false,
    isStageMode,
    isPlaying,
    isGameOver,
  } = options;
  if (
    hintMode
    || hintBuffActive
    || beginnerAssistActive
    || isPhraseMode
    || !isStageMode
    || !isPlaying
    || isGameOver
  ) {
    return 1;
  }
  const t = Math.floor(elapsedSec);
  if (t < 6) {
    return 1;
  }
  if (t >= 10) {
    return 0;
  }
  const fadeSteps: Record<number, number> = {
    6: 0.8,
    7: 0.6,
    8: 0.4,
    9: 0.2,
  };
  return fadeSteps[t] ?? 1;
}

/** 鍵盤 pending ハイライト opacity。第一ブロックは常に 1.0、第二ブロック以降の挑戦は約 10 秒フェード。 */
export function computeKeyboardHintOpacity(
  elapsedSec: number,
  options: {
    readonly hintMode: boolean;
    readonly hintBuffActive: boolean;
    readonly beginnerAssistActive?: boolean;
    readonly isStageMode: boolean;
    readonly isPlaying: boolean;
    readonly isGameOver: boolean;
  },
): number {
  const {
    hintMode,
    hintBuffActive,
    beginnerAssistActive = false,
    isStageMode,
    isPlaying,
    isGameOver,
  } = options;
  if (
    hintMode
    || hintBuffActive
    || beginnerAssistActive
    || !isStageMode
    || !isPlaying
    || isGameOver
  ) {
    return 1;
  }
  const t = Math.floor(elapsedSec);
  if (t < 6) {
    return 1;
  }
  if (t >= 10) {
    return 0;
  }
  const fadeSteps: Record<number, number> = {
    6: 0.8,
    7: 0.6,
    8: 0.4,
    9: 0.2,
  };
  return fadeSteps[t] ?? 1;
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
