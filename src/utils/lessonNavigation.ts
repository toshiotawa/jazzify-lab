import { Lesson } from '@/types';
import { fetchLessonsByCourse } from '@/platform/supabaseLessons';
import { fetchUserLessonProgress } from '@/platform/supabaseLessonProgress';

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

/**
 * 現在のレッスンからナビゲーション情報を取得
 */
export async function getLessonNavigationInfo(
  currentLessonId: string,
  courseId: string
): Promise<LessonNavigationInfo> {
  // コース内の全レッスンを取得
  const lessons = await fetchLessonsByCourse(courseId);
  const userProgress = await fetchUserLessonProgress(courseId);
  
  // レッスンを order_index でソート
  const sortedLessons = lessons.sort((a, b) => a.order_index - b.order_index);
  
  // 現在のレッスンのインデックスを取得
  const currentIndex = sortedLessons.findIndex(lesson => lesson.id === currentLessonId);
  
  if (currentIndex === -1) {
    throw new Error('現在のレッスンが見つかりません');
  }

  const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null;

  // 進捗データをマップに変換
  const progressMap = new Map(userProgress.map(p => [p.lesson_id, p]));

  // アクセス権限をチェック
  const hasAccessToPrevious = previousLesson ? 
    progressMap.get(previousLesson.id)?.is_unlocked || false : false;
  
  const hasAccessToNext = nextLesson ? 
    progressMap.get(nextLesson.id)?.is_unlocked || false : false;

  return {
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
  displayText: string;
} {
  const blockNumber = lesson.block_number || 1;
  return {
    blockNumber,
    displayText: `ブロック ${blockNumber}`
  };
} 