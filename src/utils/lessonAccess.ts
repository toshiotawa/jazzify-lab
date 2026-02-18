import { Course, Lesson, LessonProgress, Profile } from '@/types';

export type MembershipRank = Profile['rank'] | 'free';

const PREMIUM_RANKS: ReadonlySet<MembershipRank> = new Set([
  'premium',
  'platinum',
  'black',
]);

const PLATINUM_OR_BLACK_RANKS: ReadonlySet<MembershipRank> = new Set([
  'platinum',
  'black',
]);

const DEFAULT_RANK: MembershipRank = 'free';

export const isPremiumRank = (rank?: MembershipRank | null): boolean => {
  if (!rank) {
    return false;
  }
  return PREMIUM_RANKS.has(rank);
};

export const isPlatinumOrBlack = (rank?: MembershipRank | null): boolean => {
  if (!rank) {
    return false;
  }
  return PLATINUM_OR_BLACK_RANKS.has(rank);
};

export const normalizeRank = (rank?: MembershipRank | null): MembershipRank => {
  if (!rank) {
    return DEFAULT_RANK;
  }
  return rank;
};

export interface CourseAccessOptions {
  course: Course;
  userRank?: MembershipRank | null;
  completedCourseIds: string[];
  manualOverride?: boolean | null;
}

export interface CourseAccessResult {
  canAccess: boolean;
  reason?: string;
  manualUnlockApplied: boolean;
  manualUnlockSuppressed: boolean;
  manualLockApplied: boolean;
  prerequisitesMet: boolean;
  rankAllows: boolean;
  requiresPremium: boolean;
}

export const checkCoursePrerequisites = (
  course: Course,
  completedCourseIds: string[],
): boolean => {
  if (!course.prerequisites || course.prerequisites.length === 0) {
    return true;
  }
  return course.prerequisites.every((prerequisite) =>
    completedCourseIds.includes(prerequisite.prerequisite_course_id),
  );
};

const resolveCourseRank = (course: Course, rank: MembershipRank): { rankAllows: boolean; requiresPremium: boolean } => {
  const requiresPremium = Boolean(course.premium_only);
  if (!requiresPremium) {
    return { rankAllows: true, requiresPremium: false };
  }
  return { rankAllows: isPremiumRank(rank), requiresPremium: true };
};

export const resolveCourseAccess = ({
  course,
  userRank,
  completedCourseIds,
  manualOverride,
}: CourseAccessOptions): CourseAccessResult => {
  const rank = normalizeRank(userRank);
  const prerequisitesMet = checkCoursePrerequisites(course, completedCourseIds);

  const { rankAllows, requiresPremium } = resolveCourseRank(course, rank);

  if (!rankAllows) {
    return {
      canAccess: false,
      reason: 'プレミアムプラン以上が必要です',
      manualUnlockApplied: false,
      manualUnlockSuppressed: Boolean(manualOverride),
      manualLockApplied: false,
      prerequisitesMet,
      rankAllows,
      requiresPremium,
    };
  }

  const manualUnlock = manualOverride === true && !prerequisitesMet;
  const manualLock = manualOverride === false && !prerequisitesMet;
  const manualUnlockApplied = manualUnlock && isPremiumRank(rank);
  const manualUnlockSuppressed = manualUnlock && !manualUnlockApplied;
  const manualLockApplied = manualLock;

  if (manualLockApplied) {
    return {
      canAccess: false,
      reason: '管理者により一時的に利用が制限されています。',
      manualUnlockApplied: false,
      manualUnlockSuppressed,
      manualLockApplied: true,
      prerequisitesMet,
      rankAllows,
      requiresPremium,
    };
  }

  if (manualUnlockApplied) {
    return {
      canAccess: true,
      manualUnlockApplied: true,
      manualUnlockSuppressed,
      manualLockApplied: false,
      prerequisitesMet,
      rankAllows,
      requiresPremium,
    };
  }

  if (prerequisitesMet) {
    return {
      canAccess: true,
      manualUnlockApplied: false,
      manualUnlockSuppressed,
      manualLockApplied: false,
      prerequisitesMet: true,
      rankAllows,
      requiresPremium,
    };
  }

  const prerequisiteNames = course.prerequisites?.map((p) => p.prerequisite_course.title).join(', ');

  return {
    canAccess: false,
    reason: prerequisiteNames ? `前提コース（${prerequisiteNames}）を完了してください` : '前提コースを完了してください',
    manualUnlockApplied: false,
    manualUnlockSuppressed,
    manualLockApplied: false,
    prerequisitesMet: false,
    rankAllows,
    requiresPremium,
  };
};

export interface LessonAccessState {
  isUnlocked: boolean;
  isCompleted: boolean;
  manualUnlockApplied: boolean;
  manualUnlockSuppressed: boolean;
  isBlockUnlocked?: boolean;
}

export interface BlockAccessState {
  blockNumber: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  manualUnlockApplied: boolean;
  manualUnlockSuppressed: boolean;
  isNaturallyUnlocked: boolean;
}

export interface LessonAccessGraph {
  lessonStates: Record<string, LessonAccessState>;
  blockStates: Record<number, BlockAccessState>;
}

export interface LessonAccessOptions {
  lessons: Lesson[];
  progressMap: Record<string, LessonProgress | undefined>;
  userRank?: MembershipRank | null;
}

const sortLessonsForAccess = (lessons: Lesson[]): Lesson[] => {
  return [...lessons].sort((a, b) => {
    const blockA = a.block_number ?? 1;
    const blockB = b.block_number ?? 1;
    if (blockA !== blockB) {
      return blockA - blockB;
    }
    return a.order_index - b.order_index;
  });
};

const groupLessonsByBlock = (sortedLessons: Lesson[]): Map<number, Lesson[]> => {
  const blockMap = new Map<number, Lesson[]>();
  sortedLessons.forEach((lesson) => {
    const blockNumber = lesson.block_number ?? 1;
    const blockLessons = blockMap.get(blockNumber) ?? [];
    blockLessons.push(lesson);
    blockMap.set(blockNumber, blockLessons);
  });
  return blockMap;
};

const isBlockCompleted = (
  lessons: Lesson[],
  progressMap: Record<string, LessonProgress | undefined>,
): boolean => {
  if (lessons.length === 0) {
    return false;
  }
  return lessons.every((lesson) => progressMap[lesson.id]?.completed === true);
};

const collectManualUnlockPresence = (
  lessons: Lesson[],
  progressMap: Record<string, LessonProgress | undefined>,
  baseUnlocked: boolean,
): boolean => {
  return lessons.some((lesson) => {
    const progress = progressMap[lesson.id];
    return progress?.is_unlocked === true && !baseUnlocked;
  });
};

export const buildLessonAccessGraph = ({
  lessons,
  progressMap,
  userRank,
}: LessonAccessOptions): LessonAccessGraph => {
  const normalizedRank = normalizeRank(userRank);
  const premium = isPremiumRank(normalizedRank);

  const sortedLessons = sortLessonsForAccess(lessons);
  const blockMap = groupLessonsByBlock(sortedLessons);
  const blockNumbers = Array.from(blockMap.keys()).sort((a, b) => a - b);

  const lessonStates: Record<string, LessonAccessState> = {};
  const blockStates: Record<number, BlockAccessState> = {};

  blockNumbers.forEach((blockNumber, index) => {
    const blockLessons = blockMap.get(blockNumber) ?? [];
    const previousBlockNumber = blockNumbers[index - 1];
    const previousCompleted = index === 0 ? true : blockStates[previousBlockNumber]?.isCompleted === true;

    const baseUnlocked = index === 0 ? true : previousCompleted;
    const manualUnlockPresent = collectManualUnlockPresence(blockLessons, progressMap, baseUnlocked);
    const manualUnlockApplied = manualUnlockPresent && premium;
    const manualUnlockSuppressed = manualUnlockPresent && !premium;
    const blockUnlocked = baseUnlocked || manualUnlockApplied;
    const isNaturallyUnlocked = baseUnlocked;
    const completed = isBlockCompleted(blockLessons, progressMap);

    blockStates[blockNumber] = {
      blockNumber,
      isUnlocked: blockUnlocked,
      isCompleted: completed,
      manualUnlockApplied,
      manualUnlockSuppressed,
      isNaturallyUnlocked,
    };

    blockLessons.forEach((lesson) => {
      const progress = progressMap[lesson.id];
      const manualUnlock = progress?.is_unlocked === true && !baseUnlocked;
      const manualUnlockAppliedForLesson = manualUnlock && premium;
      const manualUnlockSuppressedForLesson = manualUnlock && !premium;

      const completedLesson = progress?.completed === true;
      const unlocked = blockUnlocked || manualUnlockAppliedForLesson;

      lessonStates[lesson.id] = {
        isUnlocked: unlocked,
        isCompleted: completedLesson,
        manualUnlockApplied: manualUnlockAppliedForLesson,
        manualUnlockSuppressed: manualUnlockSuppressedForLesson,
        isBlockUnlocked: blockUnlocked,
      };
    });
  });

  return {
    lessonStates,
    blockStates,
  };
};
