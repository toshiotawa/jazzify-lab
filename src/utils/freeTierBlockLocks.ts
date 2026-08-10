import type { Lesson } from '@/types';
import type { LessonAccessGraph } from '@/utils/lessonAccess';

/**
 * フリー会員向けに `maxBlockNumber` 超のブロックをロックする。
 * プレミアム会員のときは入力をそのまま返す（参照同一）。
 */
export function applyFreeTierBlockLocks(
  accessGraph: LessonAccessGraph,
  lessons: readonly Lesson[],
  maxBlockNumber: number,
  isPremiumMember: boolean,
): LessonAccessGraph {
  if (isPremiumMember) {
    return accessGraph;
  }

  const lessonStates = { ...accessGraph.lessonStates };
  const blockStates = { ...accessGraph.blockStates };

  for (const lesson of lessons) {
    const bn = lesson.block_number ?? 1;
    if (bn > maxBlockNumber) {
      const prev = lessonStates[lesson.id];
      if (prev !== undefined) {
        lessonStates[lesson.id] = { ...prev, isUnlocked: false };
      }
    }
  }

  for (const key of Object.keys(blockStates)) {
    const bn = Number(key);
    if (!Number.isFinite(bn) || bn <= maxBlockNumber) {
      continue;
    }
    const prev = blockStates[bn];
    if (prev !== undefined) {
      blockStates[bn] = { ...prev, isUnlocked: false };
    }
  }

  return { lessonStates, blockStates };
}
