import { describe, expect, it } from 'vitest';
import { buildLessonAccessGraph } from '@/utils/lessonAccess';
import {
  applyMainQuestFreeTierLocks,
  isMainQuestBlockPlayable,
} from '@/utils/mainQuestFreeTier';
import { Lesson, LessonProgress } from '@/types';

let uidCounter = 0;
const uid = () => `mq-free-${++uidCounter}`;

const createLesson = (overrides: Partial<Lesson>): Lesson => ({
  id: uid(),
  course_id: 'course-main',
  title: 'レッスン',
  description: '',
  assignment_description: '',
  assignment_description_en: '',
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
  lesson_id: 'x',
  course_id: 'course-main',
  completed: false,
  is_unlocked: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('isMainQuestBlockPlayable', () => {
  it('プレミアムは任意のチャプターで true', () => {
    expect(isMainQuestBlockPlayable(99, true)).toBe(true);
  });

  it('フリーは第1チャプターのみ true', () => {
    expect(isMainQuestBlockPlayable(1, false)).toBe(true);
    expect(isMainQuestBlockPlayable(2, false)).toBe(false);
    expect(isMainQuestBlockPlayable(99, false)).toBe(false);
  });
});

describe('applyMainQuestFreeTierLocks', () => {
  it('プレミアムはグラフ参照を変更しない', () => {
    const l1 = createLesson({ id: 'l1', block_number: 1, order_index: 0 });
    const l2 = createLesson({ id: 'l2', block_number: 2, order_index: 1 });
    const graph = buildLessonAccessGraph({
      lessons: [l1, l2],
      progressMap: {
        l1: createProgress({ lesson_id: 'l1', completed: true }),
      },
      enforceSequentialWithinBlocks: true,
    });
    const out = applyMainQuestFreeTierLocks(graph, [l1, l2], true);
    expect(out).toBe(graph);
  });

  it('block1 完了後もフリーでは block2 をロックしたまま', () => {
    const l1 = createLesson({ id: 'l1', block_number: 1, order_index: 0 });
    const l2 = createLesson({ id: 'l2', block_number: 2, order_index: 1 });
    const graph = buildLessonAccessGraph({
      lessons: [l1, l2],
      progressMap: {
        l1: createProgress({ lesson_id: 'l1', completed: true }),
      },
      enforceSequentialWithinBlocks: true,
    });
    expect(graph.blockStates[2]?.isUnlocked).toBe(true);
    expect(graph.lessonStates.l2?.isUnlocked).toBe(true);

    const locked = applyMainQuestFreeTierLocks(graph, [l1, l2], false);
    expect(locked).not.toBe(graph);
    expect(locked.blockStates[2]?.isUnlocked).toBe(false);
    expect(locked.lessonStates.l2?.isUnlocked).toBe(false);
    expect(locked.lessonStates.l1?.isUnlocked).toBe(true);
  });
});
