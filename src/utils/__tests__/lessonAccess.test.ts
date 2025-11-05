import { describe, expect, it } from 'vitest';
import type { Course, Lesson } from '@/types';
import type { LessonProgress } from '@/platform/supabaseLessonProgress';
import {
  ADMIN_LOCK_REASON,
  PREMIUM_ONLY_REASON,
  buildProgressMap,
  evaluateBlockAccess,
  evaluateCourseAccess,
  evaluateLessonAccess,
  getBlockLessons,
  getPreviousBlockNumbers,
  isPremiumRank,
  isRankAtLeast,
} from '@/utils/lessonAccess';

const iso = () => new Date('2024-01-01T00:00:00.000Z').toISOString();

const makeLesson = (overrides: Partial<Lesson>): Lesson => ({
  id: 'lesson-default',
  course_id: 'course-main',
  title: 'Lesson',
  description: 'desc',
  assignment_description: undefined,
  order_index: 0,
  block_number: 1,
  created_at: iso(),
  updated_at: iso(),
  ...overrides,
});

const sampleLessons: Lesson[] = [
  makeLesson({ id: 'l1', order_index: 0, block_number: 1, title: 'Intro' }),
  makeLesson({ id: 'l2', order_index: 1, block_number: 1, title: 'Basics' }),
  makeLesson({ id: 'l3', order_index: 2, block_number: 2, title: 'Intermediate' }),
  makeLesson({ id: 'l4', order_index: 3, block_number: 3, title: 'Advanced' }),
];

const makeCourse = (overrides: Partial<Course>): Course => ({
  id: 'course-main',
  title: 'Main Course',
  description: 'Course description',
  created_at: iso(),
  updated_at: iso(),
  order_index: 0,
  lessons: sampleLessons,
  prerequisites: [],
  ...overrides,
});

const makeProgress = (
  lessonId: string,
  overrides: Partial<LessonProgress> = {},
): LessonProgress => ({
  id: `${lessonId}-progress`,
  user_id: 'user-1',
  lesson_id: lessonId,
  course_id: 'course-main',
  completed: false,
  created_at: iso(),
  updated_at: iso(),
  ...overrides,
});

describe('lessonAccess helper', () => {
  describe('evaluateCourseAccess', () => {
    it('applies admin unlock for premium ranks and exposes badge', () => {
      const course = makeCourse({});
      const result = evaluateCourseAccess({
        course,
        userRank: 'premium',
        completedCourseIds: [],
        adminOverride: true,
      });

      expect(result.canAccess).toBe(true);
      expect(result.overrideApplied).toBe('admin_unlock');
      expect(result.showAdminBadge).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('blocks access when admin lock is present for premium ranks', () => {
      const course = makeCourse({});
      const result = evaluateCourseAccess({
        course,
        userRank: 'platinum',
        completedCourseIds: [],
        adminOverride: false,
      });

      expect(result.canAccess).toBe(false);
      expect(result.overrideApplied).toBe('admin_lock');
      expect(result.reason).toBe(ADMIN_LOCK_REASON);
    });

    it('ignores admin override for standard ranks while keeping access', () => {
      const course = makeCourse({});
      const result = evaluateCourseAccess({
        course,
        userRank: 'standard',
        completedCourseIds: [],
        adminOverride: true,
      });

      expect(result.canAccess).toBe(true);
      expect(result.overrideApplied).toBe('none');
      expect(result.showAdminBadge).toBe(false);
    });

    it('requires premium rank for premium-only courses', () => {
      const course = makeCourse({ premium_only: true });
      const result = evaluateCourseAccess({
        course,
        userRank: 'standard',
        completedCourseIds: [],
      });

      expect(result.canAccess).toBe(false);
      expect(result.reason).toBe(PREMIUM_ONLY_REASON);
    });

    it('respects min_rank threshold when present', () => {
      const course = makeCourse({ min_rank: 'platinum' });
      const result = evaluateCourseAccess({
        course,
        userRank: 'premium',
        completedCourseIds: [],
      });

      expect(result.canAccess).toBe(false);
      expect(result.reason).toBe('このコースはPLATINUMプラン以上が必要です');
    });

    it('enforces course prerequisites when not completed', () => {
      const prerequisiteCourse: Course = {
        ...makeCourse({ id: 'course-pre', title: 'Prerequisite', lessons: [] }),
      };
      const course = makeCourse({
        prerequisites: [
          {
            prerequisite_course_id: prerequisiteCourse.id,
            prerequisite_course: prerequisiteCourse,
          },
        ],
      });

      const result = evaluateCourseAccess({
        course,
        userRank: 'premium',
        completedCourseIds: [],
      });

      expect(result.canAccess).toBe(false);
      expect(result.reason).toBe('前提コース（Prerequisite）を完了してください');

      const satisfied = evaluateCourseAccess({
        course,
        userRank: 'premium',
        completedCourseIds: [prerequisiteCourse.id],
      });

      expect(satisfied.canAccess).toBe(true);
      expect(satisfied.reason).toBeUndefined();
    });
  });

  describe('block and lesson evaluation', () => {
    it('evaluates block access with natural unlocks and completions', () => {
      const course = makeCourse({});
      const emptyMap = buildProgressMap([]);
      const block1State = evaluateBlockAccess({
        course,
        progressMap: emptyMap,
        blockNumber: 1,
      });

      expect(block1State.blockNumber).toBe(1);
      expect(block1State.naturallyUnlocked).toBe(true);
      expect(block1State.completed).toBe(false);

      const block2State = evaluateBlockAccess({
        course,
        progressMap: emptyMap,
        blockNumber: 2,
      });

      expect(block2State.naturallyUnlocked).toBe(false);

      const completedProgress = buildProgressMap([
        makeProgress('l1', { completed: true }),
        makeProgress('l2', { completed: true }),
      ]);

      const block2AfterCompletion = evaluateBlockAccess({
        course,
        progressMap: completedProgress,
        blockNumber: 2,
      });

      expect(block2AfterCompletion.naturallyUnlocked).toBe(true);
      expect(block2AfterCompletion.completed).toBe(false);
    });

    it('identifies manual lesson unlocks and completions', () => {
      const course = makeCourse({});
      const progress = buildProgressMap([
        makeProgress('l1', { completed: true }),
        makeProgress('l2', { completed: true }),
        makeProgress('l3', { is_unlocked: true }),
      ]);

      const block2State = evaluateBlockAccess({
        course,
        progressMap: progress,
        blockNumber: 2,
      });

      const lessonAccess = evaluateLessonAccess(
        sampleLessons[2],
        block2State,
        progress,
      );

      expect(lessonAccess.naturallyUnlocked).toBe(true);
      expect(lessonAccess.manuallyUnlocked).toBe(true);
      expect(lessonAccess.completed).toBe(false);

      const block3State = evaluateBlockAccess({
        course,
        progressMap: progress,
        blockNumber: 3,
      });

      const lockedLesson = evaluateLessonAccess(
        sampleLessons[3],
        block3State,
        progress,
      );

      expect(lockedLesson.naturallyUnlocked).toBe(false);
      expect(lockedLesson.manuallyUnlocked).toBe(false);
    });
  });

  describe('utility helpers', () => {
    it('builds lesson progress map keyed by lesson id', () => {
      const progress = [
        makeProgress('l1'),
        makeProgress('l2', { is_unlocked: true }),
      ];

      const map = buildProgressMap(progress);
      expect(map.get('l1')).toMatchObject({ lesson_id: 'l1' });
      expect(map.get('l2')?.is_unlocked).toBe(true);
    });

    it('returns lessons and previous block numbers correctly', () => {
      const course = makeCourse({});
      expect(getBlockLessons(course, 1).length).toBe(2);
      expect(getBlockLessons(course, 3).length).toBe(1);
      expect(getPreviousBlockNumbers(course, 1)).toEqual([]);
      expect(getPreviousBlockNumbers(course, 3)).toEqual([1, 2]);
    });

    it('checks rank relationships and premium statuses', () => {
      expect(isRankAtLeast('platinum', 'standard')).toBe(true);
      expect(isRankAtLeast('standard', 'platinum')).toBe(false);
      expect(isPremiumRank('premium')).toBe(true);
      expect(isPremiumRank('standard')).toBe(false);
    });
  });
});

