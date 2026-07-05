import { Lesson, LessonProgress } from '@/types';
import { lessonDisplayBlockName } from '@/utils/lessonCopy';
import { fetchLessonsByCourse } from '@/platform/supabaseLessons';
import { fetchUserLessonProgress } from '@/platform/supabaseLessonProgress';
import { clearCacheByPattern } from '@/platform/supabaseClient';
import { buildLessonAccessGraph, MembershipRank } from '@/utils/lessonAccess';
import { applyMainQuestFreeTierLocks, isMainQuestBlockPlayable } from '@/utils/mainQuestFreeTier';
import { log } from '@/utils/logger';

export type NavigationBlockedReason =
  | 'first_lesson'
  | 'last_lesson'
  | 'sequential_lock'
  | 'previous_block_incomplete'
  | 'premium_required';

export interface LessonNavigationInfo {
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  previousBlockedReason: NavigationBlockedReason | null;
  nextBlockedReason: NavigationBlockedReason | null;
  course: {
    id: string;
    hasAccessToPrevious: boolean;
    hasAccessToNext: boolean;
  };
}

export interface LessonNavigationOptions {
  forceRefresh?: boolean;
  isMainQuest?: boolean;
  isPremiumMember?: boolean;
}

// ナビゲーション情報のキャッシュ（メモリ内）
const navigationCache = new Map<string, {
  data: LessonNavigationInfo;
  expires: number;
  courseId: string;
}>();

// 進捗の解放判定に直結するため、他端末・他タブでの完了操作を早く反映できるよう短命に留める。
// 目的は主に同一ページ内での再計算（Reactの二重effect等）の重複フェッチ回避であり、
// 長期キャッシュとして進捗の鮮度を犠牲にしない。
const NAVIGATION_CACHE_TTL = 15 * 1000; // 15秒
const MAX_CACHE_SIZE = 20; // 最大キャッシュサイズ

/**
 * ナビゲーションキャッシュのクリーンアップ
 */
function cleanupNavigationCache(): void {
  const now = Date.now();
  
  // 期限切れのキャッシュを削除
  for (const [key, value] of navigationCache.entries()) {
    if (value.expires < now) {
      navigationCache.delete(key);
    }
  }
  
  // サイズ制限を超えた場合、古いエントリを削除
  if (navigationCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(navigationCache.entries());
    const sortedEntries = entries.sort((a, b) => a[1].expires - b[1].expires);
    const toDelete = sortedEntries.slice(0, entries.length - MAX_CACHE_SIZE);
    
    for (const [key] of toDelete) {
      navigationCache.delete(key);
    }
  }
}

/**
 * 特定コースのナビゲーションキャッシュをクリア
 */
export function clearNavigationCacheForCourse(courseId: string): void {
  for (const [key, value] of navigationCache.entries()) {
    if (value.courseId === courseId) {
      navigationCache.delete(key);
    }
  }
}

/**
 * すべてのナビゲーションキャッシュをクリア
 */
export function clearAllNavigationCache(): void {
  navigationCache.clear();
}

/**
 * レッスンナビゲーション時のキャッシュクリーンアップ
 */
export function cleanupLessonNavigationCache(currentLessonId: string, courseId: string): void {
  // 現在のレッスン以外のレッスン詳細キャッシュをクリア
  clearCacheByPattern(/^lesson_videos:/);
  clearCacheByPattern(/^lesson_requirements:/);
  clearCacheByPattern(/^lesson_requirements_progress:/);
  
  // 古いナビゲーションキャッシュもクリア
  cleanupNavigationCache();
}

function buildNavigationCacheKey(
  courseId: string,
  currentLessonId: string,
  userRank: MembershipRank | null | undefined,
  isMainQuest: boolean,
  isPremiumMember: boolean,
): string {
  return [
    courseId,
    currentLessonId,
    userRank ?? 'no-rank',
    isMainQuest ? 'main' : 'course',
    isPremiumMember ? 'premium' : 'free',
  ].join(':');
}

function resolvePreviousBlockedReason(
  previousLesson: Lesson | null,
  canGoPrevious: boolean,
): NavigationBlockedReason | null {
  if (previousLesson === null) {
    return 'first_lesson';
  }
  if (canGoPrevious) {
    return null;
  }
  return 'sequential_lock';
}

function resolveNextBlockedReason(
  currentLesson: Lesson,
  nextLesson: Lesson | null,
  canGoNext: boolean,
  baseAccessGraph: ReturnType<typeof buildLessonAccessGraph>,
  completedIds: Set<string>,
  options: { isMainQuest: boolean; isPremiumMember: boolean },
): NavigationBlockedReason | null {
  if (nextLesson === null) {
    return 'last_lesson';
  }
  if (canGoNext) {
    return null;
  }

  const nextBlockNumber = nextLesson.block_number ?? 1;
  if (
    options.isMainQuest
    && !isMainQuestBlockPlayable(nextBlockNumber, options.isPremiumMember)
  ) {
    return 'premium_required';
  }

  const nextBlockUnlocked = baseAccessGraph.blockStates[nextBlockNumber]?.isUnlocked === true;
  if (!nextBlockUnlocked) {
    return 'previous_block_incomplete';
  }

  const currentBlockNumber = currentLesson.block_number ?? 1;
  if (
    options.isMainQuest
    && currentBlockNumber === nextBlockNumber
    && completedIds.has(currentLesson.id) !== true
  ) {
    return 'sequential_lock';
  }

  return 'previous_block_incomplete';
}

/**
 * レッスン一覧と進捗からナビゲーション情報を算出（純粋関数）
 */
export function computeLessonNavigationInfo(
  currentLessonId: string,
  courseId: string,
  lessons: readonly Lesson[],
  progressMap: Record<string, Pick<LessonProgress, 'completed'> | undefined>,
  options: { isMainQuest: boolean; isPremiumMember: boolean },
): LessonNavigationInfo {
  const sortedLessons = sortLessonsByOrder([...lessons]);
  const currentIndex = sortedLessons.findIndex((lesson) => lesson.id === currentLessonId);

  if (currentIndex === -1) {
    throw new Error('現在のレッスンが見つかりません');
  }

  const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null;

  const baseAccessGraph = buildLessonAccessGraph({
    lessons: sortedLessons,
    progressMap,
    enforceSequentialWithinBlocks: options.isMainQuest,
  });

  let accessGraph = baseAccessGraph;
  if (options.isMainQuest) {
    accessGraph = applyMainQuestFreeTierLocks(
      accessGraph,
      sortedLessons,
      options.isPremiumMember,
    );
  }

  const hasAccessToPrevious = previousLesson
    ? accessGraph.lessonStates[previousLesson.id]?.isUnlocked === true
    : false;

  const hasAccessToNext = nextLesson
    ? accessGraph.lessonStates[nextLesson.id]?.isUnlocked === true
    : false;

  const canGoPrevious = previousLesson !== null && hasAccessToPrevious;
  const canGoNext = nextLesson !== null && hasAccessToNext;
  const completedIds = new Set(
    Object.entries(progressMap)
      .filter(([, progress]) => progress?.completed === true)
      .map(([lessonId]) => lessonId),
  );

  return {
    previousLesson,
    nextLesson,
    canGoPrevious,
    canGoNext,
    previousBlockedReason: resolvePreviousBlockedReason(previousLesson, canGoPrevious),
    nextBlockedReason: resolveNextBlockedReason(
      sortedLessons[currentIndex],
      nextLesson,
      canGoNext,
      baseAccessGraph,
      completedIds,
      options,
    ),
    course: {
      id: courseId,
      hasAccessToPrevious,
      hasAccessToNext,
    },
  };
}

/**
 * 現在のレッスンからナビゲーション情報を取得（キャッシュ機能付き）
 */
export async function getLessonNavigationInfo(
  currentLessonId: string,
  courseId: string,
  userRank?: MembershipRank | null,
  options?: LessonNavigationOptions,
): Promise<LessonNavigationInfo> {
  const isMainQuest = options?.isMainQuest === true;
  const isPremiumMember = options?.isPremiumMember === true;
  const cacheKey = buildNavigationCacheKey(
    courseId,
    currentLessonId,
    userRank,
    isMainQuest,
    isPremiumMember,
  );
  const now = Date.now();
  
  if (!options?.forceRefresh) {
    const cached = navigationCache.get(cacheKey);
    if (cached && cached.expires > now) {
      return cached.data;
    }
  } else {
    navigationCache.delete(cacheKey);
  }
  
  // キャッシュクリーンアップ
  cleanupNavigationCache();
  
  try {
    const [lessons, userProgress] = await Promise.all([
      fetchLessonsByCourse(courseId),
      fetchUserLessonProgress(courseId, undefined, { forceRefresh: !!options?.forceRefresh }),
    ]);

    const progressMap: Record<string, Pick<LessonProgress, 'completed'> | undefined> = {};
    userProgress.forEach((progress) => {
      progressMap[progress.lesson_id] = progress;
    });

    const navigationInfo = computeLessonNavigationInfo(
      currentLessonId,
      courseId,
      lessons,
      progressMap,
      { isMainQuest, isPremiumMember },
    );
    
    navigationCache.set(cacheKey, {
      data: navigationInfo,
      expires: now + NAVIGATION_CACHE_TTL,
      courseId,
    });
    
    return navigationInfo;
    
  } catch (error) {
    log.error('Navigation info loading error:', error);
    throw error;
  }
}

/**
 * レッスンナビゲーションのエラーメッセージを取得
 */
function blockedReasonMessage(
  reason: NavigationBlockedReason,
  navigationInfo: LessonNavigationInfo,
  isEnglishCopy: boolean,
): string {
  switch (reason) {
    case 'first_lesson':
      return isEnglishCopy
        ? 'This is the first quest in the course.'
        : 'これがコースの最初のクエストです。';
    case 'last_lesson':
      return isEnglishCopy
        ? 'This is the last quest. You have finished the course!'
        : 'これがコースの最後のクエストです。すべてのクエストを完了されました！';
    case 'sequential_lock':
      return isEnglishCopy
        ? 'Complete the current quest before moving to the next one.'
        : '先に現在のクエストを完了してください。';
    case 'premium_required':
      return isEnglishCopy
        ? 'Main Quest chapters after Chapter 1 require Premium.'
        : 'メインクエスト第2チャプター以降はプレミアムが必要です。';
    case 'previous_block_incomplete': {
      const blockInfo = navigationInfo.nextLesson
        ? getLessonBlockInfo(navigationInfo.nextLesson, { isEnglishCopy })
        : null;
      if (blockInfo) {
        return isEnglishCopy
          ? `The next quest (${blockInfo.displayText}) is still locked. Complete every quest in the previous block first.`
          : `次のクエスト（${blockInfo.displayText}）はまだ解放されていません。前のブロックの全クエストを完了してください。`;
      }
      return isEnglishCopy
        ? 'The next quest is still locked. Complete every quest in the current block first.'
        : '次のクエストはまだ解放されていません。現在のブロックの全クエストを完了してください。';
    }
  }
}

export function getNavigationErrorMessage(
  direction: 'previous' | 'next',
  navigationInfo: LessonNavigationInfo,
  isEnglishCopy = false,
): string {
  if (direction === 'previous') {
    if (navigationInfo.canGoPrevious) {
      return '';
    }
    const reason = navigationInfo.previousBlockedReason ?? 'sequential_lock';
    return blockedReasonMessage(reason, navigationInfo, isEnglishCopy);
  }

  if (navigationInfo.canGoNext) {
    return '';
  }
  const reason = navigationInfo.nextBlockedReason ?? 'previous_block_incomplete';
  return blockedReasonMessage(reason, navigationInfo, isEnglishCopy);
}

/**
 * ナビゲーション前の安全性チェック
 */
export function validateNavigation(
  direction: 'previous' | 'next',
  navigationInfo: LessonNavigationInfo | null,
  isEnglishCopy = false,
): { canNavigate: boolean; errorMessage: string } {
  if (!navigationInfo) {
    return {
      canNavigate: false,
      errorMessage: isEnglishCopy ? 'Loading navigation…' : 'ナビゲーション情報を読み込み中です...',
    };
  }

  const canNavigate = direction === 'previous' ? navigationInfo.canGoPrevious : navigationInfo.canGoNext;
  const errorMessage = canNavigate ? '' : getNavigationErrorMessage(direction, navigationInfo, isEnglishCopy);

  return { canNavigate, errorMessage };
}

/**
 * レッスンが属するブロック情報を取得
 */
export function getLessonBlockInfo(
  lesson: Lesson,
  options?: { isEnglishCopy?: boolean },
): {
  blockNumber: number;
  blockName: string;
  lessonNumber: number;
  displayText: string;
  lessonDisplayText: string;
} {
  const isEnglishCopy = Boolean(options?.isEnglishCopy);
  const blockNumber = lesson.block_number || 1;
  const blockName = lessonDisplayBlockName(lesson, isEnglishCopy);
  const lessonNumber = (lesson.order_index ?? 0) + 1;
  return {
    blockNumber,
    blockName,
    lessonNumber,
    displayText: blockName,
    lessonDisplayText: isEnglishCopy ? `Quest ${lessonNumber}` : `クエスト ${lessonNumber}`,
  };
}

export type QuestCompletionModalKind =
  | 'nextQuest'
  | 'chapterCompleteWithNext'
  | 'chapterCompletePremiumUpsell'
  | 'chapterCompleteOnly'
  | 'none';

export function sortLessonsByOrder(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) => {
    const blockA = a.block_number ?? 1;
    const blockB = b.block_number ?? 1;
    if (blockA !== blockB) {
      return blockA - blockB;
    }
    return a.order_index - b.order_index;
  });
}

export function sortLessonSongsByOrderIndex<T extends { order_index?: number }>(
  lessonSongs: T[],
): T[] {
  return [...lessonSongs].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

export function isLastLessonInBlock(currentLesson: Lesson, sortedLessons: Lesson[]): boolean {
  const blockNumber = currentLesson.block_number ?? 1;
  const blockLessons = sortedLessons.filter(
    (lesson) => (lesson.block_number ?? 1) === blockNumber,
  );
  const lastLesson = blockLessons[blockLessons.length - 1];
  return lastLesson?.id === currentLesson.id;
}

export function getQuestCompletionModalKind(
  currentLesson: Lesson,
  sortedLessons: Lesson[],
  navigationInfo: LessonNavigationInfo,
): QuestCompletionModalKind {
  const isLastInChapter = isLastLessonInBlock(currentLesson, sortedLessons);
  const hasNext = navigationInfo.nextLesson !== null;
  const canGoNext = navigationInfo.canGoNext;

  if (isLastInChapter) {
    if (hasNext && canGoNext) {
      return 'chapterCompleteWithNext';
    }
    if (hasNext && !canGoNext && navigationInfo.nextBlockedReason === 'premium_required') {
      return 'chapterCompletePremiumUpsell';
    }
    return 'chapterCompleteOnly';
  }

  if (hasNext && canGoNext) {
    return 'nextQuest';
  }

  return 'none';
} 