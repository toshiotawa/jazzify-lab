/** OSMD 耳コピバトル: 譜面ノート／小節ハイライト（Web と iOS WKWebView で同じ意味） */

export type EarTrainingOsmdHighlightPhase = 'idle' | 'judgment' | 'completed' | 'failed';

export interface EarTrainingOsmdHighlightTargetRow {
  id: string;
  measureNumber: number;
  beatOffset: number | null;
  midiCounts: readonly { midi: number; count: number }[];
  remainingByMidi: Readonly<Record<string, number>>;
  phase: EarTrainingOsmdHighlightPhase;
}

export interface EarTrainingOsmdHighlightSnapshot {
  activeMeasureNumber: number;
  targets: readonly EarTrainingOsmdHighlightTargetRow[];
}

export const EAR_TRAINING_OSMD_HIGHLIGHT_COLORS = {
  default: '#ffffff',
  /** iOS `EarTrainingPianoView` の voicingHintPending と揃える */
  judgmentPending: '#f39800',
  correct: '#22c55e',
  failed: '#ef4444',
} as const;

type RuntimeLike = {
  completed: boolean;
  failed: boolean;
  inJudgmentWindow: boolean;
};

export const resolveEarTrainingOsmdHighlightPhase = (r: RuntimeLike): EarTrainingOsmdHighlightPhase => {
  if (r.completed) {
    return 'completed';
  }
  if (r.failed) {
    return 'failed';
  }
  if (r.inJudgmentWindow) {
    return 'judgment';
  }
  return 'idle';
};

/**
 * 同一 attack 内で同じ MIDI の何本目か（0..total-1）に対する色。
 * judgment: 先に取った `consumed` 本は緑、残りはマリンゴールド。
 */
export const earTrainingOsmdNoteColorForMidiInstance = (
  phase: EarTrainingOsmdHighlightPhase,
  instanceIndex: number,
  totalForMidi: number,
  remainingForMidi: number,
): string => {
  if (phase === 'idle') {
    return EAR_TRAINING_OSMD_HIGHLIGHT_COLORS.default;
  }
  if (phase === 'failed') {
    return EAR_TRAINING_OSMD_HIGHLIGHT_COLORS.failed;
  }
  if (phase === 'completed') {
    return EAR_TRAINING_OSMD_HIGHLIGHT_COLORS.correct;
  }
  const safeTotal = Math.max(0, totalForMidi);
  const safeRem = Math.max(0, Math.min(safeTotal, remainingForMidi));
  const consumed = safeTotal - safeRem;
  const idx = Math.max(0, instanceIndex);
  if (idx < consumed) {
    return EAR_TRAINING_OSMD_HIGHLIGHT_COLORS.correct;
  }
  return EAR_TRAINING_OSMD_HIGHLIGHT_COLORS.judgmentPending;
};
