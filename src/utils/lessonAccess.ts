import { Course, Lesson, LessonProgress, Profile } from '@/types';
import { courseDisplayTitle } from '@/utils/courseCopy';

export type MembershipRank = Profile['rank'] | 'free';

const PREMIUM_RANKS: ReadonlySet<MembershipRank> = new Set([
  'premium',
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
  /** true のとき reason 文言と前提コース名を英語優先で組み立てる */
  isEnglishCopy?: boolean;
}

export interface CourseAccessResult {
  canAccess: boolean;
  reason?: string;
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
  isEnglishCopy = false,
}: CourseAccessOptions): CourseAccessResult => {
  const rank = normalizeRank(userRank);
  const prerequisitesMet = checkCoursePrerequisites(course, completedCourseIds);
  const { rankAllows, requiresPremium } = resolveCourseRank(course, rank);

  if (!rankAllows) {
    return {
      canAccess: false,
      reason: isEnglishCopy
        ? 'Premium membership is required.'
        : 'プレミアムプラン以上が必要です',
      prerequisitesMet,
      rankAllows,
      requiresPremium,
    };
  }

  if (prerequisitesMet) {
    return {
      canAccess: true,
      prerequisitesMet: true,
      rankAllows,
      requiresPremium,
    };
  }

  const prerequisiteNames = course.prerequisites
    ?.map((p) => courseDisplayTitle(p.prerequisite_course, isEnglishCopy))
    .join(', ');

  return {
    canAccess: false,
    reason: prerequisiteNames
      ? isEnglishCopy
        ? `Complete the prerequisite course(s): ${prerequisiteNames}.`
        : `前提コース（${prerequisiteNames}）を完了してください`
      : isEnglishCopy
        ? 'Complete the prerequisite course(s).'
        : '前提コースを完了してください',
    prerequisitesMet: false,
    rankAllows,
    requiresPremium,
  };
};

export interface LessonAccessState {
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface BlockAccessState {
  blockNumber: number;
  isUnlocked: boolean;
  isCompleted: boolean;
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

export const buildLessonAccessGraph = ({
  lessons,
  progressMap,
}: LessonAccessOptions): LessonAccessGraph => {
  const sortedLessons = sortLessonsForAccess(lessons);
  const blockMap = groupLessonsByBlock(sortedLessons);
  const blockNumbers = Array.from(blockMap.keys()).sort((a, b) => a - b);

  const lessonStates: Record<string, LessonAccessState> = {};
  const blockStates: Record<number, BlockAccessState> = {};

  blockNumbers.forEach((blockNumber, index) => {
    const blockLessons = blockMap.get(blockNumber) ?? [];
    const previousBlockNumber = blockNumbers[index - 1];
    const previousCompleted = index === 0 ? true : blockStates[previousBlockNumber]?.isCompleted === true;

    const blockUnlocked = index === 0 ? true : previousCompleted;
    const completed = isBlockCompleted(blockLessons, progressMap);

    blockStates[blockNumber] = {
      blockNumber,
      isUnlocked: blockUnlocked,
      isCompleted: completed,
    };

    blockLessons.forEach((lesson) => {
      const completedLesson = progressMap[lesson.id]?.completed === true;
      lessonStates[lesson.id] = {
        isUnlocked: blockUnlocked,
        isCompleted: completedLesson,
      };
    });
  });

  return {
    lessonStates,
    blockStates,
  };
};
