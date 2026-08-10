import { describe, expect, it } from 'vitest';
import { buildLessonAccessGraph } from '@/utils/lessonAccess';
import { applyFreeTierBlockLocks } from '@/utils/freeTierBlockLocks';
import type { Course, Lesson } from '@/types';
import {
  getFirstBlock1LessonId,
  getNextIncompleteBlock1LessonId,
  isBlock1CompleteForCourse,
  isLessonBlockPlayable,
  isSoftLandingCourse,
  resolveNextSoftLandingCourse,
  type SoftLandingCandidate,
} from '@/utils/softLanding';

const course = (overrides: Partial<Course>): Course => ({
  id: 'course-1',
  title: 'Course',
  created_at: '',
  updated_at: '',
  lessons: [],
  order_index: 1,
  ...overrides,
});

const lesson = (id: string, blockNumber: number, orderIndex: number): Lesson => ({
  id,
  course_id: 'course-1',
  title: id,
  description: '',
  order_index: orderIndex,
  block_number: blockNumber,
  created_at: '',
  updated_at: '',
});

describe('isSoftLandingCourse', () => {
  it('soft_landing_order が null でなければ true', () => {
    expect(isSoftLandingCourse(course({ soft_landing_order: 1 }))).toBe(true);
    expect(isSoftLandingCourse(course({ soft_landing_order: null }))).toBe(false);
  });
});

describe('isLessonBlockPlayable', () => {
  it('プレミアムは任意ブロックで true', () => {
    expect(isLessonBlockPlayable(course({ is_main_course: true }), 99, true)).toBe(true);
  });

  it('メインクエストは block1 のみ', () => {
    expect(isLessonBlockPlayable(course({ is_main_course: true }), 1, false)).toBe(true);
    expect(isLessonBlockPlayable(course({ is_main_course: true }), 2, false)).toBe(false);
  });

  it('ソフトランディングは block1 のみ', () => {
    expect(isLessonBlockPlayable(course({ soft_landing_order: 1 }), 1, false)).toBe(true);
    expect(isLessonBlockPlayable(course({ soft_landing_order: 1 }), 2, false)).toBe(false);
  });

  it('通常コースは常に true', () => {
    expect(isLessonBlockPlayable(course({ premium_only: false }), 3, false)).toBe(true);
  });
});

describe('resolveNextSoftLandingCourse', () => {
  const candidates: SoftLandingCandidate[] = [
    { course: course({ id: 'c2', soft_landing_order: 2 }), block1Completed: false },
    { course: course({ id: 'c1', soft_landing_order: 1 }), block1Completed: false },
    { course: course({ id: 'c3', soft_landing_order: 3 }), block1Completed: true },
  ];

  it('soft_landing_order 昇順で block1 未完了の先頭を返す', () => {
    const next = resolveNextSoftLandingCourse(candidates);
    expect(next?.course.id).toBe('c1');
  });

  it('excludeCourseId で直前完了コースを除外する', () => {
    const next = resolveNextSoftLandingCourse(candidates, { excludeCourseId: 'c1' });
    expect(next?.course.id).toBe('c2');
  });

  it('全消化なら null', () => {
    const next = resolveNextSoftLandingCourse([
      { course: course({ id: 'c1', soft_landing_order: 1 }), block1Completed: true },
    ]);
    expect(next).toBeNull();
  });
});

describe('getNextIncompleteBlock1LessonId', () => {
  it('returns the first incomplete block1 lesson', () => {
    const lessons = [
      lesson('l1', 1, 0),
      lesson('l2', 1, 1),
    ];
    const progressMap = {
      l1: { completed: true },
      l2: { completed: false },
    };
    expect(getNextIncompleteBlock1LessonId(lessons, progressMap)).toBe('l2');
  });
});

describe('getFirstBlock1LessonId', () => {
  it('block1 の order_index 最小レッスンを返す', () => {
    const id = getFirstBlock1LessonId([
      lesson('l2', 1, 1),
      lesson('l1', 1, 0),
      lesson('l3', 2, 0),
    ]);
    expect(id).toBe('l1');
  });
});

describe('isBlock1CompleteForCourse', () => {
  it('block1 全完了で true', () => {
    const lessons = [lesson('l1', 1, 0), lesson('l2', 1, 1)];
    const progressMap = {
      l1: { completed: true },
      l2: { completed: true },
    };
    expect(isBlock1CompleteForCourse(lessons, progressMap)).toBe(true);
  });
});

describe('applyFreeTierBlockLocks', () => {
  it('maxBlockNumber 超をロックする', () => {
    const l1 = lesson('l1', 1, 0);
    const l2 = lesson('l2', 2, 1);
    const graph = buildLessonAccessGraph({
      lessons: [l1, l2],
      progressMap: { l1: { completed: true } },
      enforceSequentialWithinBlocks: true,
    });
    const locked = applyFreeTierBlockLocks(graph, [l1, l2], 1, false);
    expect(locked.blockStates[2]?.isUnlocked).toBe(false);
    expect(locked.lessonStates.l2?.isUnlocked).toBe(false);
  });
});
