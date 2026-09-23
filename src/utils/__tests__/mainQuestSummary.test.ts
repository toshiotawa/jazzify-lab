import type { Course, Lesson } from '@/types';
import type { LessonProgressBasic } from '@/platform/supabaseLessonProgress';
import {
  buildMainQuestSummary,
  nextLessonForContinue,
  sortLessonsForQuest,
} from '@/utils/mainQuestSummary';

const course: Course = {
  id: 'course-1',
  title: 'Main Quest',
  order_index: 0,
  is_main_course: true,
};

const makeLesson = (
  id: string,
  orderIndex: number,
  blockNumber: number,
  blockName?: string,
): Lesson => ({
  id,
  course_id: course.id,
  title: `Quest ${orderIndex + 1}`,
  order_index: orderIndex,
  block_number: blockNumber,
  block_name: blockName ?? `Chapter ${blockNumber}`,
});

describe('sortLessonsForQuest', () => {
  it('sorts by block then order_index', () => {
    const lessons = [
      makeLesson('b2', 1, 2),
      makeLesson('a1', 0, 1),
      makeLesson('b1', 0, 2),
    ];
    expect(sortLessonsForQuest(lessons).map((l) => l.id)).toEqual(['a1', 'b1', 'b2']);
  });
});

describe('buildMainQuestSummary', () => {
  it('groups lessons into blocks and marks current block from frontier lesson', () => {
    const lessons = [
      makeLesson('l1', 0, 1, 'Intro'),
      makeLesson('l2', 1, 1, 'Intro'),
      makeLesson('l3', 0, 2, 'Next'),
    ];
    const progress: LessonProgressBasic[] = [
      { lesson_id: 'l1', course_id: course.id, completed: true },
    ];

    const summary = buildMainQuestSummary(course, lessons, progress, false, true);
    expect(summary).not.toBeNull();
    expect(summary?.blocks).toHaveLength(2);
    expect(summary?.currentBlock?.blockNumber).toBe(1);
    expect(summary?.frontierLesson?.id).toBe('l2');
    expect(summary?.completedLessons).toBe(1);
    expect(summary?.progressPercent).toBe(33);
  });

  it('returns null when course or lessons are missing', () => {
    expect(buildMainQuestSummary(null, [], [], false, true)).toBeNull();
    expect(buildMainQuestSummary(course, [], [], false, true)).toBeNull();
  });
});

describe('nextLessonForContinue', () => {
  it('returns the frontier lesson when the current chapter is in progress', () => {
    const lessons = [
      makeLesson('l1', 0, 1, 'Intro'),
      makeLesson('l2', 1, 1, 'Intro'),
      makeLesson('l3', 0, 2, 'Next'),
    ];
    const progress: LessonProgressBasic[] = [
      { lesson_id: 'l1', course_id: course.id, completed: true },
    ];

    const summary = buildMainQuestSummary(course, lessons, progress, false, true);
    expect(summary).not.toBeNull();
    expect(nextLessonForContinue(summary!)).toEqual(summary!.frontierLesson);
    expect(nextLessonForContinue(summary!)?.id).toBe('l2');
  });

  it('returns the last lesson in the current block when the chapter is fully cleared', () => {
    const lessons = [
      makeLesson('l1', 0, 1, 'Intro'),
      makeLesson('l2', 1, 1, 'Intro'),
      makeLesson('l3', 0, 2, 'Next'),
    ];
    const progress: LessonProgressBasic[] = [
      { lesson_id: 'l1', course_id: course.id, completed: true },
      { lesson_id: 'l2', course_id: course.id, completed: true },
    ];

    const summary = buildMainQuestSummary(course, lessons, progress, false, true);
    expect(summary).not.toBeNull();
    expect(summary!.frontierLesson?.id).toBe('l3');
    expect(nextLessonForContinue(summary!)?.id).toBe('l3');
  });

  it('returns the last lesson in the current block when the entire course is complete', () => {
    const lessons = [
      makeLesson('l1', 0, 1, 'Intro'),
      makeLesson('l2', 1, 1, 'Intro'),
    ];
    const progress: LessonProgressBasic[] = [
      { lesson_id: 'l1', course_id: course.id, completed: true },
      { lesson_id: 'l2', course_id: course.id, completed: true },
    ];

    const summary = buildMainQuestSummary(course, lessons, progress, false, true);
    expect(summary).not.toBeNull();
    expect(summary!.frontierLesson).toBeNull();
    expect(nextLessonForContinue(summary!)?.id).toBe('l2');
  });
});
