import type { Course, Lesson } from '@/types';
import type { LessonProgress } from '@/platform/supabaseLessonProgress';

export const rankOrder = [
  'free',
  'standard',
  'standard_global',
  'premium',
  'platinum',
  'black',
] as const;

export type MembershipRank = typeof rankOrder[number];

const premiumRanks: ReadonlySet<MembershipRank> = new Set([
  'premium',
  'platinum',
  'black',
]);

export const ADMIN_LOCK_REASON =
  '管理者によりロックされています。前提コースを完了すると自動で解放されます。';

export const PREMIUM_ONLY_REASON = 'プレミアムプラン以上が必要です';

export type CourseAccessOverride = 'admin_unlock' | 'admin_lock' | 'none';

export interface CourseAccessParams {
  course: Course;
  userRank: MembershipRank;
  completedCourseIds?: readonly string[];
  adminOverride?: boolean | null;
}

export interface CourseAccessResult {
  canAccess: boolean;
  reason?: string;
  overrideApplied: CourseAccessOverride;
  showAdminBadge: boolean;
}

export function isRankAtLeast(
  userRank: MembershipRank,
  requiredRank: MembershipRank,
): boolean {
  return rankOrder.indexOf(userRank) >= rankOrder.indexOf(requiredRank);
}

export function isPremiumRank(rank: MembershipRank): boolean {
  return premiumRanks.has(rank);
}

export function checkCoursePrerequisites(
  course: Course,
  completedCourseIds: readonly string[] = [],
): boolean {
  if (!course.prerequisites || course.prerequisites.length === 0) {
    return true;
  }

  return course.prerequisites.every((prereq) =>
    completedCourseIds.includes(prereq.prerequisite_course_id),
  );
}

function buildPrerequisiteReason(course: Course): string | undefined {
  if (!course.prerequisites || course.prerequisites.length === 0) {
    return undefined;
  }

  const prerequisiteNames = course.prerequisites
    .map((prereq) => prereq.prerequisite_course.title)
    .join(', ');

  return prerequisiteNames
    ? `前提コース（${prerequisiteNames}）を完了してください`
    : undefined;
}

export function evaluateCourseAccess({
  course,
  userRank,
  completedCourseIds = [],
  adminOverride,
}: CourseAccessParams): CourseAccessResult {
  const overrideAllowed = isPremiumRank(userRank);
  const effectiveOverride = overrideAllowed ? adminOverride ?? null : null;
  const showAdminBadge = effectiveOverride === true && overrideAllowed;

  if (effectiveOverride === false) {
    return {
      canAccess: false,
      reason: ADMIN_LOCK_REASON,
      overrideApplied: 'admin_lock',
      showAdminBadge: false,
    };
  }

  if (effectiveOverride === true) {
    return {
      canAccess: true,
      overrideApplied: 'admin_unlock',
      showAdminBadge,
    };
  }

  if (course.min_rank && !isRankAtLeast(userRank, course.min_rank)) {
    return {
      canAccess: false,
      reason: `このコースは${course.min_rank.toUpperCase()}プラン以上が必要です`,
      overrideApplied: 'none',
      showAdminBadge: false,
    };
  }

  if (course.premium_only && !isPremiumRank(userRank)) {
    return {
      canAccess: false,
      reason: PREMIUM_ONLY_REASON,
      overrideApplied: 'none',
      showAdminBadge: false,
    };
  }

  const prerequisitesMet = checkCoursePrerequisites(course, completedCourseIds);

  if (!prerequisitesMet) {
    return {
      canAccess: false,
      reason: buildPrerequisiteReason(course),
      overrideApplied: 'none',
      showAdminBadge: false,
    };
  }

  return {
    canAccess: true,
    overrideApplied: 'none',
    showAdminBadge: false,
  };
}

export interface BlockAccessContext {
  course: Course;
  progressMap: Map<string, LessonProgress>;
  blockNumber: number;
}

export interface BlockAccessState {
  blockNumber: number;
  naturallyUnlocked: boolean;
  completed: boolean;
}

export function getBlockLessons(course: Course, blockNumber: number): Lesson[] {
  return course.lessons.filter(
    (lesson) => (lesson.block_number || 1) === blockNumber,
  );
}

export function buildProgressMap(progress: readonly LessonProgress[]): Map<string, LessonProgress> {
  return new Map(progress.map((entry) => [entry.lesson_id, entry]));
}

export function getPreviousBlockNumbers(course: Course, blockNumber: number): number[] {
  if (blockNumber <= 1) {
    return [];
  }

  const allBlocks = new Set<number>();
  course.lessons.forEach((lesson) => {
    const currentBlock = lesson.block_number || 1;
    if (currentBlock < blockNumber) {
      allBlocks.add(currentBlock);
    }
  });

  return Array.from(allBlocks.values()).sort((a, b) => a - b);
}

export function evaluateBlockAccess({
  course,
  progressMap,
  blockNumber,
}: BlockAccessContext): BlockAccessState {
  const lessonsInBlock = getBlockLessons(course, blockNumber);
  const previousBlocks = getPreviousBlockNumbers(course, blockNumber);

  const previousBlocksCompleted = previousBlocks.every((prevBlockNumber) => {
    const lessons = getBlockLessons(course, prevBlockNumber);
    if (lessons.length === 0) {
      return true;
    }

    return lessons.every((lesson) => progressMap.get(lesson.id)?.completed === true);
  });

  const naturallyUnlocked = blockNumber === 1 || previousBlocksCompleted;
  const completed =
    lessonsInBlock.length > 0 &&
    lessonsInBlock.every((lesson) => progressMap.get(lesson.id)?.completed === true);

  return {
    blockNumber,
    naturallyUnlocked,
    completed,
  };
}

export interface LessonAccessState {
  lessonId: string;
  naturallyUnlocked: boolean;
  manuallyUnlocked: boolean;
  completed: boolean;
}

export function evaluateLessonAccess(
  lesson: Lesson,
  blockState: BlockAccessState,
  progressMap: Map<string, LessonProgress>,
): LessonAccessState {
  const progress = progressMap.get(lesson.id);
  const manuallyUnlocked =
    progress?.is_unlocked === true && !blockState.naturallyUnlocked;
  const completed = progress?.completed === true;

  return {
    lessonId: lesson.id,
    naturallyUnlocked: blockState.naturallyUnlocked,
    manuallyUnlocked,
    completed,
  };
}

