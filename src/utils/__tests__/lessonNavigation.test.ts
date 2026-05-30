import { describe, expect, it } from 'vitest';
import type { Lesson } from '@/types';
import {
  getQuestCompletionModalKind,
  isLastLessonInBlock,
  sortLessonsByOrder,
  type LessonNavigationInfo,
} from '@/utils/lessonNavigation';

const lesson = (id: string, orderIndex: number, blockNumber = 1): Lesson => ({
  id,
  course_id: 'course-1',
  title: `Lesson ${id}`,
  description: '',
  order_index: orderIndex,
  block_number: blockNumber,
  created_at: '',
  updated_at: '',
});

const navInfo = (
  next: Lesson | null,
  canGoNext: boolean,
): LessonNavigationInfo => ({
  previousLesson: null,
  nextLesson: next,
  canGoPrevious: false,
  canGoNext,
  course: {
    id: 'course-1',
    hasAccessToPrevious: false,
    hasAccessToNext: canGoNext,
  },
});

describe('isLastLessonInBlock', () => {
  it('returns true for the last lesson in the same block', () => {
    const sorted = sortLessonsByOrder([
      lesson('a', 0, 1),
      lesson('b', 1, 1),
      lesson('c', 0, 2),
    ]);
    expect(isLastLessonInBlock(lesson('b', 1, 1), sorted)).toBe(true);
    expect(isLastLessonInBlock(lesson('a', 0, 1), sorted)).toBe(false);
  });
});

describe('getQuestCompletionModalKind', () => {
  const sorted = sortLessonsByOrder([
    lesson('a', 0, 1),
    lesson('b', 1, 1),
    lesson('c', 0, 2),
  ]);

  it('returns nextQuest when another quest in the same chapter is unlocked', () => {
    expect(
      getQuestCompletionModalKind(
        lesson('a', 0, 1),
        sorted,
        navInfo(lesson('b', 1, 1), true),
      ),
    ).toBe('nextQuest');
  });

  it('returns chapterCompleteWithNext when finishing the last quest in a chapter', () => {
    expect(
      getQuestCompletionModalKind(
        lesson('b', 1, 1),
        sorted,
        navInfo(lesson('c', 0, 2), true),
      ),
    ).toBe('chapterCompleteWithNext');
  });

  it('returns chapterCompleteOnly when the chapter ends and the next quest is locked', () => {
    expect(
      getQuestCompletionModalKind(
        lesson('b', 1, 1),
        sorted,
        navInfo(lesson('c', 0, 2), false),
      ),
    ).toBe('chapterCompleteOnly');
  });

  it('returns none when the next quest in the same chapter is locked', () => {
    expect(
      getQuestCompletionModalKind(
        lesson('a', 0, 1),
        sorted,
        navInfo(lesson('b', 1, 1), false),
      ),
    ).toBe('none');
  });
});
