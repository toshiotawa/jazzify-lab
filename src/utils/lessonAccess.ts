import { Course, Lesson } from '@/types';
import { LessonProgress } from '@/platform/supabaseLessonProgress';

export type UserRank =
  | 'free'
  | 'standard'
  | 'standard_global'
  | 'premium'
  | 'platinum'
  | 'black';

const PREMIUM_RANK_SET: ReadonlySet<UserRank> = new Set([
  'premium',
  'platinum',
  'black',
]);

export const isPremiumRank = (rank: UserRank | null | undefined): boolean => {
  if (!rank) return false;
  return PREMIUM_RANK_SET.has(rank);
};

export interface CourseAccessEvaluation {
  canAccess: boolean;
  reason?: string;
  appliedAdminOverride: boolean;
  overrideType?: 'unlock' | 'lock';
}

export interface EvaluateCourseAccessParams {
  course: Course;
  userRank: UserRank;
  completedCourseIds?: string[];
  adminOverride?: boolean | null;
}

export const areCoursePrerequisitesMet = (
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

export const evaluateCourseAccess = ({
  course,
  userRank,
  completedCourseIds = [],
  adminOverride = null,
}: EvaluateCourseAccessParams): CourseAccessEvaluation => {
  const hasPremiumAccess = !course.premium_only || isPremiumRank(userRank);

  if (!hasPremiumAccess) {
    return {
      canAccess: false,
      reason: 'プレミアムプラン以上が必要です',
      appliedAdminOverride: false,
    };
  }

  if (isPremiumRank(userRank) && adminOverride !== null && adminOverride !== undefined) {
    if (adminOverride) {
      return {
        canAccess: true,
        appliedAdminOverride: true,
        overrideType: 'unlock',
      };
    }

    return {
      canAccess: false,
      reason: '管理者によりロックされています。前提条件を満たすまでアクセスできません。',
      appliedAdminOverride: true,
      overrideType: 'lock',
    };
  }

  const prerequisitesMet = areCoursePrerequisitesMet(course, completedCourseIds);

  if (!prerequisitesMet) {
    const prerequisiteNames = course.prerequisites
      ?.map((item) => item.prerequisite_course.title)
      .join(', ');

    return {
      canAccess: false,
      reason: prerequisiteNames
        ? `前提コース（${prerequisiteNames}）を完了してください`
        : '前提条件を満たしていません',
      appliedAdminOverride: false,
    };
  }

  return {
    canAccess: true,
    appliedAdminOverride: false,
  };
};

export interface BlockUnlockInfo {
  blockNumber: number;
  naturalUnlocked: boolean;
  adminUnlocked: boolean;
  unlockedForRank: boolean;
  completed: boolean;
}

const buildProgressMap = (
  progress: LessonProgress[] | Map<string, LessonProgress>,
): Map<string, LessonProgress> => {
  if (progress instanceof Map) {
    return progress;
  }

  const map = new Map<string, LessonProgress>();
  progress.forEach((item) => {
    map.set(item.lesson_id, item);
  });
  return map;
};

export const groupLessonsByBlock = (lessons: Lesson[]): Map<number, Lesson[]> => {
  const blockMap = new Map<number, Lesson[]>();

  lessons.forEach((lesson) => {
    const blockNumber = lesson.block_number ?? 1;
    if (!blockMap.has(blockNumber)) {
      blockMap.set(blockNumber, []);
    }
    blockMap.get(blockNumber)!.push(lesson);
  });

  return blockMap;
};

const arePreviousBlocksCompleted = (
  targetBlockNumber: number,
  blockMap: Map<number, Lesson[]>,
  progressMap: Map<string, LessonProgress>,
): boolean => {
  if (targetBlockNumber <= 1) {
    return true;
  }

  for (let block = 1; block < targetBlockNumber; block += 1) {
    const lessonsInBlock = blockMap.get(block);
    if (!lessonsInBlock || lessonsInBlock.length === 0) {
      continue;
    }

    const completed = lessonsInBlock.every((lesson) =>
      progressMap.get(lesson.id)?.completed,
    );

    if (!completed) {
      return false;
    }
  }

  return true;
};

export const getBlockUnlockInfo = ({
  blockNumber,
  allLessons,
  progress,
  userRank,
  blockMap: providedBlockMap,
  progressMap: providedProgressMap,
}: {
  blockNumber: number;
  allLessons: Lesson[];
  progress: LessonProgress[] | Map<string, LessonProgress>;
  userRank: UserRank;
  blockMap?: Map<number, Lesson[]>;
  progressMap?: Map<string, LessonProgress>;
}): BlockUnlockInfo => {
  const progressMap = providedProgressMap ?? buildProgressMap(progress);
  const blockMap = providedBlockMap ?? groupLessonsByBlock(allLessons);
  const lessonsInBlock = blockMap.get(blockNumber) ?? [];

  const naturalUnlocked = blockNumber === 1
    ? true
    : arePreviousBlocksCompleted(blockNumber, blockMap, progressMap);

  const adminUnlocked = lessonsInBlock.some((lesson) =>
    progressMap.get(lesson.id)?.is_unlocked,
  );

  const unlockedForRank = isPremiumRank(userRank)
    ? naturalUnlocked || adminUnlocked
    : naturalUnlocked;

  const completed = lessonsInBlock.length > 0
    ? lessonsInBlock.every((lesson) => progressMap.get(lesson.id)?.completed)
    : false;

  return {
    blockNumber,
    naturalUnlocked,
    adminUnlocked,
    unlockedForRank,
    completed,
  };
};

export interface LessonUnlockInfo {
  naturalUnlocked: boolean;
  adminUnlocked: boolean;
  unlockedForRank: boolean;
}

export const getLessonUnlockInfo = ({
  lesson,
  allLessons,
  progress,
  userRank,
  blockMap,
  progressMap: providedProgressMap,
}: {
  lesson: Lesson;
  allLessons: Lesson[];
  progress: LessonProgress[] | Map<string, LessonProgress>;
  userRank: UserRank;
  blockMap?: Map<number, Lesson[]>;
  progressMap?: Map<string, LessonProgress>;
}): LessonUnlockInfo => {
  const progressMap = providedProgressMap ?? buildProgressMap(progress);
  const derivedBlockMap = blockMap ?? groupLessonsByBlock(allLessons);
  const blockNumber = lesson.block_number ?? 1;
  const blockInfo = getBlockUnlockInfo({
    blockNumber,
    allLessons,
    progress,
    userRank,
    blockMap: derivedBlockMap,
    progressMap,
  });

  const adminUnlocked = Boolean(progressMap.get(lesson.id)?.is_unlocked);

  const unlockedForRank = isPremiumRank(userRank)
    ? blockInfo.unlockedForRank && (blockInfo.naturalUnlocked || adminUnlocked)
    : blockInfo.naturalUnlocked;

  return {
    naturalUnlocked: blockInfo.naturalUnlocked,
    adminUnlocked,
    unlockedForRank,
  };
};
