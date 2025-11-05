import { Course, Lesson } from '@/types';
import type { LessonProgress } from '@/platform/supabaseLessonProgress';

const PREMIUM_RANKS = new Set(['premium', 'platinum', 'black']);

export const isPremiumRank = (rank?: string | null): boolean => {
  if (!rank) {
    return false;
  }
  return PREMIUM_RANKS.has(rank);
};

export const buildPrerequisiteMessage = (course: Course): string | undefined => {
  if (!course.prerequisites || course.prerequisites.length === 0) {
    return undefined;
  }

  const prerequisiteNames = course.prerequisites
    .map((prerequisite) => prerequisite.prerequisite_course.title)
    .join(', ');

  if (prerequisiteNames.length === 0) {
    return undefined;
  }

  return `前提コース（${prerequisiteNames}）を完了してください`;
};

const checkCoursePrerequisites = (
  course: Course,
  completedCourseIds: string[] = [],
): boolean => {
  if (!course.prerequisites || course.prerequisites.length === 0) {
    return true;
  }

  return course.prerequisites.every((prerequisite) =>
    completedCourseIds.includes(prerequisite.prerequisite_course_id),
  );
};

export interface CourseAccessParams {
  course: Course;
  userRank?: string | null;
  completedCourseIds?: string[];
  adminUnlockFlag?: boolean | null;
}

export interface CourseAccessResult {
  canAccess: boolean;
  reason?: string;
  unlockedByAdmin: boolean;
  requiresPremium: boolean;
  prerequisitesMet: boolean;
}

export const resolveCourseAccess = ({
  course,
  userRank,
  completedCourseIds = [],
  adminUnlockFlag = null,
}: CourseAccessParams): CourseAccessResult => {
  const rank = userRank ?? 'free';
  const premiumMember = isPremiumRank(rank);
  const requiresPremium = Boolean(course.premium_only);

  if (requiresPremium && !premiumMember) {
    return {
      canAccess: false,
      reason: 'プレミアムプラン以上が必要です',
      unlockedByAdmin: false,
      requiresPremium,
      prerequisitesMet: false,
    };
  }

  if (premiumMember && adminUnlockFlag === true) {
    return {
      canAccess: true,
      unlockedByAdmin: true,
      requiresPremium,
      prerequisitesMet: true,
    };
  }

  const prerequisitesMet = checkCoursePrerequisites(course, completedCourseIds);

  if (!prerequisitesMet) {
    return {
      canAccess: false,
      reason: buildPrerequisiteMessage(course) ?? '前提条件を満たしていません',
      unlockedByAdmin: false,
      requiresPremium,
      prerequisitesMet,
    };
  }

  return {
    canAccess: true,
    unlockedByAdmin: false,
    requiresPremium,
    prerequisitesMet,
  };
};

export interface BlockStatus {
  blockNumber: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  unlockedByAdmin: boolean;
  unlockedNaturally: boolean;
}

export interface LessonStatus {
  lessonId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  unlockedByAdmin: boolean;
  unlockedNaturally: boolean;
}

const groupLessonsByBlock = (lessons: Lesson[]): Map<number, Lesson[]> => {
  const grouped = new Map<number, Lesson[]>();
  lessons.forEach((lesson) => {
    const blockNumber = lesson.block_number ?? 1;
    if (!grouped.has(blockNumber)) {
      grouped.set(blockNumber, []);
    }
    grouped.get(blockNumber)!.push(lesson);
  });
  return grouped;
};

const sortBlockNumbers = (blockMap: Map<number, Lesson[]>): number[] => {
  return Array.from(blockMap.keys()).sort((a, b) => a - b);
};

export const buildBlockStatuses = (
  lessons: Lesson[],
  progress: Record<string, LessonProgress>,
  allowAdminOverride: boolean,
): Record<number, BlockStatus> => {
  const blockMap = groupLessonsByBlock(lessons);
  const blockNumbers = sortBlockNumbers(blockMap);
  if (blockNumbers.length === 0) {
    return {};
  }

  const firstBlockNumber = blockNumbers[0];
  const statuses: Record<number, BlockStatus> = {};
  const blockCompletion = new Map<number, boolean>();

  blockNumbers.forEach((blockNumber) => {
    const blockLessons = blockMap.get(blockNumber) ?? [];
    const completed =
      blockLessons.length > 0 &&
      blockLessons.every((lesson) => progress[lesson.id]?.completed === true);

    blockCompletion.set(blockNumber, completed);
  });

  blockNumbers.forEach((blockNumber, index) => {
    const blockLessons = blockMap.get(blockNumber) ?? [];
    const previousBlockNumber = blockNumbers[index - 1];
    const previousCompleted = previousBlockNumber
      ? blockCompletion.get(previousBlockNumber) === true
      : false;

    const unlockedNaturally =
      blockNumber === firstBlockNumber || previousCompleted;

    const unlockedByAdmin =
      allowAdminOverride &&
      blockLessons.some((lesson) => progress[lesson.id]?.is_unlocked === true);

    const isUnlocked = unlockedNaturally || unlockedByAdmin;

    statuses[blockNumber] = {
      blockNumber,
      isUnlocked,
      isCompleted: blockCompletion.get(blockNumber) === true,
      unlockedByAdmin: unlockedByAdmin && !unlockedNaturally,
      unlockedNaturally,
    };
  });

  return statuses;
};

export const buildLessonStatuses = (
  lessons: Lesson[],
  progress: Record<string, LessonProgress>,
  blockStatuses: Record<number, BlockStatus>,
  allowAdminOverride: boolean,
): Record<string, LessonStatus> => {
  const statuses: Record<string, LessonStatus> = {};

  lessons.forEach((lesson) => {
    const blockNumber = lesson.block_number ?? 1;
    const blockStatus = blockStatuses[blockNumber];
    const lessonProgress = progress[lesson.id];

    const unlockedNaturally = blockStatus?.unlockedNaturally ?? true;
    const unlockedByAdmin =
      allowAdminOverride && lessonProgress?.is_unlocked === true && !unlockedNaturally;

    const isUnlocked = unlockedNaturally || unlockedByAdmin;

    statuses[lesson.id] = {
      lessonId: lesson.id,
      isUnlocked,
      isCompleted: lessonProgress?.completed === true,
      unlockedByAdmin,
      unlockedNaturally,
    };
  });

  return statuses;
};

