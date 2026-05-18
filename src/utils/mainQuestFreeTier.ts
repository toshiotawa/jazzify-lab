import type { Lesson } from '@/types';
import type { LessonAccessGraph } from '@/utils/lessonAccess';

/** フリープランでプレイできるメインクエストの最大 `block_number`（この値まで含む） */
const MAIN_QUEST_FREE_MAX_BLOCK_NUMBER = 1;

export function isMainQuestBlockPlayable(blockNumber: number, isPremiumMember: boolean): boolean {
  if (isPremiumMember) {
    return true;
  }
  return (blockNumber ?? 1) <= MAIN_QUEST_FREE_MAX_BLOCK_NUMBER;
}

/**
 * メインクエスト（`buildLessonAccessGraph` の結果）に、フリー会員の第2チャプター以降ロックを上書きする。
 * プレミアム会員のときは入力をそのまま返す（参照同一）。
 */
export function applyMainQuestFreeTierLocks(
  accessGraph: LessonAccessGraph,
  lessons: readonly Lesson[],
  isPremiumMember: boolean,
): LessonAccessGraph {
  if (isPremiumMember) {
    return accessGraph;
  }

  const lessonStates = { ...accessGraph.lessonStates };
  const blockStates = { ...accessGraph.blockStates };

  for (const lesson of lessons) {
    const bn = lesson.block_number ?? 1;
    if (bn > MAIN_QUEST_FREE_MAX_BLOCK_NUMBER) {
      const prev = lessonStates[lesson.id];
      if (prev !== undefined) {
        lessonStates[lesson.id] = { ...prev, isUnlocked: false };
      }
    }
  }

  for (const key of Object.keys(blockStates)) {
    const bn = Number(key);
    if (!Number.isFinite(bn) || bn <= MAIN_QUEST_FREE_MAX_BLOCK_NUMBER) {
      continue;
    }
    const prev = blockStates[bn];
    if (prev !== undefined) {
      blockStates[bn] = { ...prev, isUnlocked: false };
    }
  }

  return { lessonStates, blockStates };
}
