/**
 * play シーンの進行ステップとセリフ解決(純粋)。
 *
 * play は時間非同期。判定塊(notes 有り)は「正解で進む note ステップ」、
 * セリフを持つ休符小節(notes 空)は「自動送り+クリックで進む dialogue ステップ」。
 * セリフは進行中ステップの拍位置に連動して表示する。
 */
import type {
  SurvivalTutorialV4Line,
  SurvivalTutorialV4PlayScene,
} from './survivalTutorialV4Types';

const BEAT_EPSILON = 1e-6;

export interface SurvivalTutorialV4PlayNoteStep {
  readonly kind: 'note';
  readonly startBeat: number;
  /** phrase 定義(判定塊のみ)の chord index。 */
  readonly judgeIndex: number;
  /** scene.questions 内の index(ベース取得用)。 */
  readonly chunkIndex: number;
}

export interface SurvivalTutorialV4PlayDialogueStep {
  readonly kind: 'dialogue';
  readonly startBeat: number;
  readonly durationBeats: number;
}

export type SurvivalTutorialV4PlayStep =
  | SurvivalTutorialV4PlayNoteStep
  | SurvivalTutorialV4PlayDialogueStep;

/** 進行拍 beat 以下で最も後ろの line index。該当なしは null。 */
export const resolvePlayLineIndexAtBeat = (
  lines: readonly SurvivalTutorialV4Line[],
  beat: number,
): number | null => {
  let result: number | null = null;
  let bestBeat = -Infinity;
  for (let i = 0; i < lines.length; i += 1) {
    const startBeat = lines[i].startBeat;
    if (startBeat <= beat + BEAT_EPSILON && startBeat >= bestBeat) {
      bestBeat = startBeat;
      result = i;
    }
  }
  return result;
};

const hasLineInSpan = (
  lines: readonly SurvivalTutorialV4Line[],
  startBeat: number,
  durationBeats: number,
): boolean =>
  lines.some(
    (line) =>
      line.startBeat >= startBeat - BEAT_EPSILON &&
      line.startBeat < startBeat + durationBeats - BEAT_EPSILON,
  );

/**
 * play シーンを進行ステップ列へ変換する。
 * - notes 有り → note ステップ(正解で進行)。
 * - notes 空でその範囲にセリフがある → dialogue ステップ(自動送り)。
 * - notes 空でセリフ無し(末尾の空小節など) → ステップ化しない。
 */
export const buildSurvivalTutorialV4PlaySteps = (
  scene: SurvivalTutorialV4PlayScene,
): readonly SurvivalTutorialV4PlayStep[] => {
  const steps: SurvivalTutorialV4PlayStep[] = [];
  let judgeIndex = 0;
  scene.questions.forEach((chunk, chunkIndex) => {
    if (chunk.notes.length > 0) {
      steps.push({
        kind: 'note',
        startBeat: chunk.startBeat,
        judgeIndex,
        chunkIndex,
      });
      judgeIndex += 1;
      return;
    }
    if (hasLineInSpan(scene.lines, chunk.startBeat, chunk.durationBeats)) {
      steps.push({
        kind: 'dialogue',
        startBeat: chunk.startBeat,
        durationBeats: chunk.durationBeats,
      });
    }
  });
  return steps;
};
