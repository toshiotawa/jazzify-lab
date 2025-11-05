import { describe, expect, it } from 'vitest';
import { buildLessonAccessGraph, resolveCourseAccess } from '@/utils/lessonAccess';
import { Course, Lesson, LessonProgress } from '@/types';

let uidCounter = 0;
const uid = () => `test-id-${++uidCounter}`;

const createCourse = (overrides: Partial<Course>): Course => ({
  id: 'course-main',
  title: 'メインコース',
  description: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  lessons: [],
  order_index: 1,
  premium_only: false,
  prerequisites: [],
  ...overrides,
});

const createLesson = (overrides: Partial<Lesson>): Lesson => ({
  id: uid(),
  course_id: 'course-main',
  title: 'レッスン',
  description: '',
  assignment_description: '',
  order_index: 0,
  block_number: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  lesson_songs: [],
  videos: [],
  ...overrides,
});

const createProgress = (overrides: Partial<LessonProgress>): LessonProgress => ({
  id: uid(),
  user_id: 'user-1',
  lesson_id: 'lesson-1',
  course_id: 'course-main',
  completed: false,
  is_unlocked: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('resolveCourseAccess', () => {
  it('プレミア会員は管理者解放で前提条件未達でもアクセス可能になる', () => {
    const prerequisiteCourse = createCourse({ id: 'course-pre', title: 'プレコース' });
    const targetCourse = createCourse({
      prerequisites: [
        {
          prerequisite_course_id: prerequisiteCourse.id,
          prerequisite_course: prerequisiteCourse,
        },
      ],
    });

    const result = resolveCourseAccess({
      course: targetCourse,
      userRank: 'premium',
      completedCourseIds: [],
      manualOverride: true,
    });

    expect(result.canAccess).toBe(true);
    expect(result.manualUnlockApplied).toBe(true);
    expect(result.manualUnlockSuppressed).toBe(false);
  });

  it('スタンダード会員では管理者解放が抑止され通常条件が優先される', () => {
    const prerequisiteCourse = createCourse({ id: 'course-pre', title: 'プレコース' });
    const targetCourse = createCourse({
      prerequisites: [
        {
          prerequisite_course_id: prerequisiteCourse.id,
          prerequisite_course: prerequisiteCourse,
        },
      ],
    });

    const result = resolveCourseAccess({
      course: targetCourse,
      userRank: 'standard',
      completedCourseIds: [],
      manualOverride: true,
    });

    expect(result.canAccess).toBe(false);
    expect(result.manualUnlockApplied).toBe(false);
    expect(result.manualUnlockSuppressed).toBe(true);
    expect(result.reason).toContain('前提コース');
  });
});

describe('buildLessonAccessGraph', () => {
  it('管理者解放はプレミア会員のみ有効となりスタンダードでは無効化される', () => {
    const lessonBlock1 = createLesson({ id: 'lesson-1', order_index: 0, block_number: 1 });
    const lessonBlock2 = createLesson({ id: 'lesson-2', order_index: 1, block_number: 2 });
    const lessons: Lesson[] = [lessonBlock1, lessonBlock2];

    const progressMap = {
      [lessonBlock1.id]: createProgress({ lesson_id: lessonBlock1.id, is_unlocked: true }),
      [lessonBlock2.id]: createProgress({ lesson_id: lessonBlock2.id, is_unlocked: true }),
    } satisfies Record<string, LessonProgress>;

    const premiumGraph = buildLessonAccessGraph({
      lessons,
      progressMap,
      userRank: 'premium',
    });

    expect(premiumGraph.blockStates[2].manualUnlockApplied).toBe(true);
    expect(premiumGraph.lessonStates[lessonBlock2.id].isUnlocked).toBe(true);

    const standardGraph = buildLessonAccessGraph({
      lessons,
      progressMap,
      userRank: 'standard',
    });

    expect(standardGraph.blockStates[2].manualUnlockApplied).toBe(false);
    expect(standardGraph.lessonStates[lessonBlock2.id].isUnlocked).toBe(false);
  });
});
