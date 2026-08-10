import type { Lesson } from '@/types';
import type { LessonAccessGraph } from '@/utils/lessonAccess';
import { applyFreeTierBlockLocks } from '@/utils/freeTierBlockLocks';

/** フリープランでプレイできるメインクエストの最大 `block_number`（この値まで含む） */
export const MAIN_QUEST_FREE_MAX_BLOCK_NUMBER = 1;

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
  return applyFreeTierBlockLocks(
    accessGraph,
    lessons,
    MAIN_QUEST_FREE_MAX_BLOCK_NUMBER,
    isPremiumMember,
  );
}
