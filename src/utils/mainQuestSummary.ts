import type { Course, Lesson } from '@/types';
import type { LessonProgressBasic } from '@/platform/supabaseLessonProgress';
import { lessonDisplayBlockName, lessonDisplayDescription } from '@/utils/lessonCopy';
import { buildLessonAccessGraph, type LessonAccessGraph } from '@/utils/lessonAccess';
import { applyMainQuestFreeTierLocks } from '@/utils/mainQuestFreeTier';

export interface MainQuestBlock {
  blockNumber: number;
  title: string;
  description: string;
  lessons: Lesson[];
  completedCount: number;
  totalCount: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  stageNumber: number;
}

export interface MainQuestSummary {
  course: Course;
  lessons: Lesson[];
  accessGraph: LessonAccessGraph;
  blocks: MainQuestBlock[];
  currentBlock: MainQuestBlock | null;
  frontierLesson: Lesson | null;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

type LessonCompletionMap = Record<string, { completed: boolean } | undefined>;

export const sortLessonsForQuest = (lessons: Lesson[]): Lesson[] => {
  return [...lessons].sort((a, b) => {
    const blockA = a.block_number ?? 1;
    const blockB = b.block_number ?? 1;
    if (blockA !== blockB) {
      return blockA - blockB;
    }
    return a.order_index - b.order_index;
  });
};

const localizedBlockDescription = (lesson: Lesson, isEnglishCopy: boolean): string => {
  const primary = isEnglishCopy ? lesson.block_description_en : lesson.block_description;
  const fallback = isEnglishCopy ? lesson.block_description : lesson.block_description_en;
  const value = primary || fallback || lessonDisplayDescription(lesson, isEnglishCopy) || '';
  return value.replace(/\s+/g, ' ').trim();
};

const buildCompletionMap = (
  courseId: string,
  allProgress: readonly LessonProgressBasic[],
): LessonCompletionMap => {
  const completionMap: LessonCompletionMap = {};
  allProgress.forEach((progress) => {
    if (progress.course_id === courseId) {
      completionMap[progress.lesson_id] = { completed: progress.completed };
    }
  });
  return completionMap;
};

export const buildMainQuestSummary = (
  course: Course | null,
  lessons: Lesson[],
  allProgress: readonly LessonProgressBasic[],
  isEnglishCopy: boolean,
  isPremiumMember: boolean,
): MainQuestSummary | null => {
  if (!course || lessons.length === 0) {
    return null;
  }

  const sortedLessons = sortLessonsForQuest(lessons);
  const completionMap = buildCompletionMap(course.id, allProgress);

  const accessGraphBuilt = buildLessonAccessGraph({
    lessons: sortedLessons,
    progressMap: completionMap,
    enforceSequentialWithinBlocks: true,
  });

  const accessGraph = applyMainQuestFreeTierLocks(accessGraphBuilt, sortedLessons, isPremiumMember);

  const frontierLesson = sortedLessons.find((lesson) => {
    const state = accessGraph.lessonStates[lesson.id];
    return state?.isUnlocked === true && state.isCompleted !== true;
  }) ?? null;

  const unlockedInOrder = sortedLessons.filter(
    (lesson) => accessGraph.lessonStates[lesson.id]?.isUnlocked === true,
  );
  const currentLesson =
    frontierLesson ??
    unlockedInOrder[unlockedInOrder.length - 1] ??
    sortedLessons[0] ??
    null;

  if (!currentLesson) {
    return null;
  }

  const currentBlockNumber = currentLesson.block_number ?? sortedLessons[0]?.block_number ?? 1;

  const groups = new Map<number, Lesson[]>();
  sortedLessons.forEach((lesson) => {
    const blockNumber = lesson.block_number ?? 1;
    const list = groups.get(blockNumber) ?? [];
    list.push(lesson);
    groups.set(blockNumber, list);
  });

  const blockNumbers = Array.from(groups.keys()).sort((a, b) => a - b);
  const blocks = blockNumbers.map((blockNumber, index): MainQuestBlock => {
    const blockLessons = groups.get(blockNumber) ?? [];
    const firstLesson = blockLessons[0];
    const completedCount = blockLessons.filter(
      (lesson) => completionMap[lesson.id]?.completed === true,
    ).length;
    const state = accessGraph.blockStates[blockNumber];
    return {
      blockNumber,
      title: firstLesson
        ? lessonDisplayBlockName(firstLesson, isEnglishCopy)
        : isEnglishCopy ? `Chapter ${blockNumber}` : `チャプター ${blockNumber}`,
      description: firstLesson ? localizedBlockDescription(firstLesson, isEnglishCopy) : '',
      lessons: blockLessons,
      completedCount,
      totalCount: blockLessons.length,
      isUnlocked: state?.isUnlocked ?? index === 0,
      isCompleted: state?.isCompleted ?? false,
      isCurrent: blockNumber === currentBlockNumber,
      stageNumber: index + 1,
    };
  });

  const completedLessons = sortedLessons.filter(
    (lesson) => completionMap[lesson.id]?.completed === true,
  ).length;
  const totalLessons = sortedLessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const currentBlock = blocks.find((block) => block.isCurrent) ?? blocks[0] ?? null;

  return {
    course,
    lessons: sortedLessons,
    accessGraph,
    blocks,
    currentBlock,
    frontierLesson,
    completedLessons,
    totalLessons,
    progressPercent,
  };
};

export const nextLessonForContinue = (summary: MainQuestSummary): Lesson | null => {
  if (summary.frontierLesson) {
    return summary.frontierLesson;
  }
  const blockLessons = summary.currentBlock?.lessons ?? summary.lessons;
  return blockLessons[blockLessons.length - 1] ?? null;
};
