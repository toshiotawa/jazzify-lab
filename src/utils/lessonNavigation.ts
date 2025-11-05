import { Lesson } from '@/types';
import { fetchLessonsByCourse } from '@/platform/supabaseLessons';
import { fetchUserLessonProgress } from '@/platform/supabaseLessonProgress';
import { clearCacheByPattern } from '@/platform/supabaseClient';
import { buildLessonAccessGraph, MembershipRank } from '@/utils/lessonAccess';

export interface LessonNavigationInfo {
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  course: {
    id: string;
    hasAccessToPrevious: boolean;
    hasAccessToNext: boolean;
  };
}

// ナビゲーション情報のキャッシュ（メモリ内）
const navigationCache = new Map<string, {
  data: LessonNavigationInfo;
  expires: number;
  courseId: string;
  rank: MembershipRank | null | undefined;
}>();

const NAVIGATION_CACHE_TTL = 5 * 60 * 1000; // 5分
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

/**
 * 現在のレッスンからナビゲーション情報を取得（キャッシュ機能付き）
 */
export async function getLessonNavigationInfo(
  currentLessonId: string,
  courseId: string,
  userRank?: MembershipRank | null
): Promise<LessonNavigationInfo> {
  const cacheKey = `${courseId}:${currentLessonId}:${userRank ?? 'no-rank'}`;
  const now = Date.now();
  
  // キャッシュから取得を試行
  const cached = navigationCache.get(cacheKey);
    if (cached && cached.expires > now) {
    return cached.data;
  }
  
  // キャッシュクリーンアップ
  cleanupNavigationCache();
  
  try {
    // コース内の全レッスンを取得
    const lessons = await fetchLessonsByCourse(courseId);
    const userProgress = await fetchUserLessonProgress(courseId);
    
    // レッスンを order_index でソート
    const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);
    
    // 現在のレッスンのインデックスを取得
    const currentIndex = sortedLessons.findIndex(lesson => lesson.id === currentLessonId);
    
    if (currentIndex === -1) {
      throw new Error('現在のレッスンが見つかりません');
    }

    const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null;

    const progressMap: Record<string, typeof userProgress[number] | undefined> = {};
    userProgress.forEach((progress) => {
      progressMap[progress.lesson_id] = progress;
    });

    const accessGraph = buildLessonAccessGraph({
      lessons: sortedLessons,
      progressMap,
      userRank,
    });

    const hasAccessToPrevious = previousLesson
      ? accessGraph.lessonStates[previousLesson.id]?.isUnlocked === true
      : false;

    const hasAccessToNext = nextLesson
      ? accessGraph.lessonStates[nextLesson.id]?.isUnlocked === true
      : false;

    const navigationInfo: LessonNavigationInfo = {
      previousLesson,
      nextLesson,
      canGoPrevious: previousLesson !== null && hasAccessToPrevious,
      canGoNext: nextLesson !== null && hasAccessToNext,
      course: {
        id: courseId,
        hasAccessToPrevious,
        hasAccessToNext
      }
    };
    
    // キャッシュに保存
      navigationCache.set(cacheKey, {
        data: navigationInfo,
        expires: now + NAVIGATION_CACHE_TTL,
        courseId,
        rank: userRank,
      });
    
    return navigationInfo;
    
  } catch (error) {
    console.error('Navigation info loading error:', error);
    throw error;
  }
}

/**
 * レッスンナビゲーションのエラーメッセージを取得
 */
export function getNavigationErrorMessage(
  direction: 'previous' | 'next',
  navigationInfo: LessonNavigationInfo
): string {
  if (direction === 'previous') {
    if (!navigationInfo.previousLesson) {
      return 'これがコースの最初のレッスンです。';
    }
    if (!navigationInfo.course.hasAccessToPrevious) {
      return '前のレッスンにアクセスできません。レッスンが解放されていない可能性があります。';
    }
  } else {
    if (!navigationInfo.nextLesson) {
      return 'これがコースの最後のレッスンです。すべてのレッスンを完了されました！';
    }
    if (!navigationInfo.course.hasAccessToNext) {
      const blockInfo = navigationInfo.nextLesson ? getLessonBlockInfo(navigationInfo.nextLesson) : null;
      if (blockInfo) {
        return `次のレッスン（${blockInfo.displayText}）はまだ解放されていません。前のブロックの全レッスンを完了してください。`;
      }
      return '次のレッスンはまだ解放されていません。現在のブロックの全レッスンを完了してください。';
    }
  }
  return '';
}

/**
 * ナビゲーション前の安全性チェック
 */
export function validateNavigation(
  direction: 'previous' | 'next',
  navigationInfo: LessonNavigationInfo | null
): { canNavigate: boolean; errorMessage: string } {
  if (!navigationInfo) {
    return { canNavigate: false, errorMessage: 'ナビゲーション情報を読み込み中です...' };
  }

  const canNavigate = direction === 'previous' ? navigationInfo.canGoPrevious : navigationInfo.canGoNext;
  const errorMessage = canNavigate ? '' : getNavigationErrorMessage(direction, navigationInfo);

  return { canNavigate, errorMessage };
}

/**
 * レッスンが属するブロック情報を取得
 */
export function getLessonBlockInfo(lesson: Lesson): {
  blockNumber: number;
  lessonNumber: number;
  displayText: string;
  lessonDisplayText: string;
} {
  const blockNumber = lesson.block_number || 1;
  const lessonNumber = (lesson.order_index ?? 0) + 1;
  return {
    blockNumber,
    lessonNumber,
    displayText: `ブロック ${blockNumber}`,
    lessonDisplayText: `レッスン ${lessonNumber}`
  };
} 