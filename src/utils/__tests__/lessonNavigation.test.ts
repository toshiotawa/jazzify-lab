import { describe, expect, it } from 'vitest';
import type { Lesson, LessonProgress } from '@/types';
import {
  computeLessonNavigationInfo,
  getNavigationErrorMessage,
  getQuestCompletionModalKind,
  isLastLessonInBlock,
  sortLessonsByOrder,
  type LessonNavigationInfo,
  type NavigationBlockedReason,
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

const progress = (lessonId: string, completed: boolean): Pick<LessonProgress, 'completed'> => ({
  completed,
});

const navInfo = (
  next: Lesson | null,
  canGoNext: boolean,
  nextBlockedReason: NavigationBlockedReason | null = canGoNext ? null : 'sequential_lock',
): LessonNavigationInfo => ({
  previousLesson: null,
  nextLesson: next,
  canGoPrevious: false,
  canGoNext,
  previousBlockedReason: null,
  nextBlockedReason,
  course: {
    id: 'course-1',
    hasAccessToPrevious: false,
    hasAccessToNext: canGoNext,
  },
});

describe('computeLessonNavigationInfo', () => {
  const l1 = lesson('l1', 0, 1);
  const l2 = lesson('l2', 1, 1);
  const l3 = lesson('l3', 0, 2);

  it('メインクエスト: block1 lesson1 未完了 → lesson2 へ進めない', () => {
    const result = computeLessonNavigationInfo(
      'l1',
      'course-1',
      [l1, l2],
      {},
      { isMainQuest: true, isPremiumMember: true },
    );
    expect(result.nextLesson?.id).toBe('l2');
    expect(result.canGoNext).toBe(false);
    expect(result.nextBlockedReason).toBe('sequential_lock');
  });

  it('メインクエスト: block1 lesson1 完了 → lesson2 へ進める', () => {
    const result = computeLessonNavigationInfo(
      'l1',
      'course-1',
      [l1, l2],
      { l1: progress('l1', true) },
      { isMainQuest: true, isPremiumMember: true },
    );
    expect(result.nextLesson?.id).toBe('l2');
    expect(result.canGoNext).toBe(true);
  });

  it('order_index がブロックごとにリセットされていても block_number を優先して隣接クエストを判定する', () => {
    // 実データでは order_index がブロック単位で 0 から振り直されるため、
    // order_index のみでソートすると異なるブロックのレッスンが入り交じってしまう。
    const b1First = lesson('b1-first', 0, 1);
    const b1Second = lesson('b1-second', 1, 1);
    const b1Third = lesson('b1-third', 2, 1);
    const b2First = lesson('b2-first', 0, 2); // order_index は b1-first と同じ 0

    const result = computeLessonNavigationInfo(
      'b1-second',
      'course-1',
      [b1First, b1Second, b1Third, b2First],
      { 'b1-first': progress('b1-first', true) },
      { isMainQuest: true, isPremiumMember: true },
    );

    expect(result.previousLesson?.id).toBe('b1-first');
    expect(result.nextLesson?.id).toBe('b1-third');
  });

  it('メインクエスト: フリー会員 block1 最終完了 → block2 lesson1 へ進めない', () => {
    const block1First = lesson('b1-first', 0, 1);
    const block1Last = lesson('b1-last', 1, 1);
    const block2First = lesson('b2-first', 2, 2);
    const result = computeLessonNavigationInfo(
      'b1-last',
      'course-1',
      [block1First, block1Last, block2First],
      {
        'b1-first': progress('b1-first', true),
        'b1-last': progress('b1-last', true),
      },
      { isMainQuest: true, isPremiumMember: false },
    );
    expect(result.nextLesson?.id).toBe('b2-first');
    expect(result.canGoNext).toBe(false);
    expect(result.nextBlockedReason).toBe('premium_required');
  });

  it('目的別コース: 同一ブロック内は順番未完了でも次へ進める', () => {
    const result = computeLessonNavigationInfo(
      'l1',
      'course-1',
      [l1, l2],
      {},
      { isMainQuest: false, isPremiumMember: false },
    );
    expect(result.nextLesson?.id).toBe('l2');
    expect(result.canGoNext).toBe(true);
  });

  it('最後のレッスンでは canGoNext が false', () => {
    const result = computeLessonNavigationInfo(
      'l2',
      'course-1',
      [l1, l2],
      { l1: progress('l1', true), l2: progress('l2', true) },
      { isMainQuest: true, isPremiumMember: true },
    );
    expect(result.nextLesson).toBeNull();
    expect(result.canGoNext).toBe(false);
  });

  it('最初のレッスンでは canGoPrevious が false', () => {
    const result = computeLessonNavigationInfo(
      'l1',
      'course-1',
      [l1, l2],
      {},
      { isMainQuest: true, isPremiumMember: true },
    );
    expect(result.previousLesson).toBeNull();
    expect(result.canGoPrevious).toBe(false);
    expect(result.previousBlockedReason).toBe('first_lesson');
  });
});

describe('getNavigationErrorMessage', () => {
  it('順番ロック時は専用メッセージを返す', () => {
    const first = lesson('l1', 0, 1);
    const second = lesson('l2', 1, 1);
    const info = computeLessonNavigationInfo(
      'l1',
      'course-1',
      [first, second],
      {},
      { isMainQuest: true, isPremiumMember: true },
    );
    expect(getNavigationErrorMessage('next', info, false)).toContain('現在のクエストを完了');
  });

  it('無料ロック時はプレミアムメッセージを返す', () => {
    const block1Last = lesson('b1-last', 1, 1);
    const block2First = lesson('b2-first', 2, 2);
    const info = computeLessonNavigationInfo(
      'b1-last',
      'course-1',
      [lesson('b1-first', 0, 1), block1Last, block2First],
      {
        'b1-first': progress('b1-first', true),
        'b1-last': progress('b1-last', true),
      },
      { isMainQuest: true, isPremiumMember: false },
    );
    expect(getNavigationErrorMessage('next', info, false)).toContain('プレミアム');
  });
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

  it('returns chapterCompletePremiumUpsell when free tier blocks the next chapter', () => {
    expect(
      getQuestCompletionModalKind(
        lesson('b', 1, 1),
        sorted,
        navInfo(lesson('c', 0, 2), false, 'premium_required'),
      ),
    ).toBe('chapterCompletePremiumUpsell');
  });

  it('returns chapterCompleteOnly when finishing the final chapter of a course', () => {
    const singleChapter = sortLessonsByOrder([lesson('a', 0, 1), lesson('b', 1, 1)]);
    expect(
      getQuestCompletionModalKind(
        lesson('b', 1, 1),
        singleChapter,
        navInfo(null, false, 'last_lesson'),
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
