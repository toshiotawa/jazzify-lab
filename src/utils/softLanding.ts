import type { Course, Lesson, LessonProgress } from '@/types';
import { applyFreeTierBlockLocks } from '@/utils/freeTierBlockLocks';
import type { LessonAccessGraph } from '@/utils/lessonAccess';
import { MAIN_QUEST_FREE_MAX_BLOCK_NUMBER } from '@/utils/mainQuestFreeTier';

/** フリープランでプレイできるソフトランディングコースの最大 `block_number`（この値まで含む） */
export const SOFT_LANDING_FREE_MAX_BLOCK_NUMBER = 1;

export function isSoftLandingCourse(course: Pick<Course, 'soft_landing_order'>): boolean {
  return course.soft_landing_order != null;
}

export function isSequentialCourse(course: Pick<Course, 'is_main_course' | 'soft_landing_order'>): boolean {
  return course.is_main_course === true || isSoftLandingCourse(course);
}

export interface SoftLandingCandidate {
  course: Course;
  block1Completed: boolean;
  block1ProgressMap?: Record<string, { completed: boolean }>;
}

export function isLessonBlockPlayable(
  course: Pick<Course, 'is_main_course' | 'soft_landing_order'>,
  blockNumber: number,
  isPremiumMember: boolean,
): boolean {
  if (isPremiumMember) {
    return true;
  }
  const bn = blockNumber ?? 1;
  if (course.is_main_course === true) {
    return bn <= MAIN_QUEST_FREE_MAX_BLOCK_NUMBER;
  }
  if (isSoftLandingCourse(course)) {
    return bn <= SOFT_LANDING_FREE_MAX_BLOCK_NUMBER;
  }
  return true;
}

export function applySoftLandingFreeTierLocks(
  accessGraph: LessonAccessGraph,
  lessons: readonly Lesson[],
  isPremiumMember: boolean,
): LessonAccessGraph {
  return applyFreeTierBlockLocks(
    accessGraph,
    lessons,
    SOFT_LANDING_FREE_MAX_BLOCK_NUMBER,
    isPremiumMember,
  );
}

export function isBlock1CompleteForCourse(
  lessons: readonly Pick<Lesson, 'id' | 'block_number'>[],
  progressMap: Record<string, Pick<LessonProgress, 'completed'> | undefined>,
): boolean {
  const block1Lessons = lessons.filter((lesson) => (lesson.block_number ?? 1) === 1);
  if (block1Lessons.length === 0) {
    return false;
  }
  return block1Lessons.every((lesson) => progressMap[lesson.id]?.completed === true);
}

export function resolveNextSoftLandingCourse<T extends SoftLandingCandidate>(
  candidates: readonly T[],
  options?: { excludeCourseId?: string },
): T | null {
  const excludeId = options?.excludeCourseId;
  const sorted = [...candidates].sort(
    (a, b) => (a.course.soft_landing_order ?? 0) - (b.course.soft_landing_order ?? 0),
  );
  return sorted.find(
    (candidate) => !candidate.block1Completed && candidate.course.id !== excludeId,
  ) ?? null;
}

export function getFirstBlock1LessonId(lessons: readonly Lesson[]): string | null {
  const block1Lessons = [...lessons]
    .filter((lesson) => (lesson.block_number ?? 1) === 1)
    .sort((a, b) => a.order_index - b.order_index);
  return block1Lessons[0]?.id ?? null;
}

export function getNextIncompleteBlock1LessonId(
  lessons: readonly Pick<Lesson, 'id' | 'block_number' | 'order_index'>[],
  progressMap: Record<string, Pick<LessonProgress, 'completed'> | undefined>,
): string | null {
  const block1Lessons = [...lessons]
    .filter((lesson) => (lesson.block_number ?? 1) === 1)
    .sort((a, b) => a.order_index - b.order_index);
  const nextIncomplete = block1Lessons.find(
    (lesson) => progressMap[lesson.id]?.completed !== true,
  );
  return nextIncomplete?.id ?? block1Lessons[0]?.id ?? null;
}
