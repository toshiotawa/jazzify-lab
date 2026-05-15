import { describe, expect, it } from 'vitest';
import {
  buildJourneyLayout,
  computeFrontierLessonId,
  JOURNEY_CONSTANTS,
  JOURNEY_LOGICAL_WIDTH,
  JOURNEY_PHONE_LESSON_COLUMN_CENTER_X,
  JourneyLessonInput,
} from '../journeyLayout';

const makeLesson = (
  id: string,
  blockNumber: number,
  orderIndex: number,
  sourceIndex: number,
  overrides: Partial<JourneyLessonInput> = {},
): JourneyLessonInput => ({
  id,
  blockNumber,
  orderIndex,
  sourceIndex,
  blockName: `ブロック${blockNumber}`,
  blockNameEn: `Block ${blockNumber}`,
  ...overrides,
});

describe('buildJourneyLayout', () => {
  it('レッスンが 0 件でもクラッシュせずゴールのみを返す', () => {
    const layout = buildJourneyLayout([]);
    expect(layout.blocks).toHaveLength(0);
    expect(layout.goal.kind).toBe('goal');
    expect(layout.totalHeight).toBeGreaterThan(0);
    expect(layout.allNodes).toHaveLength(0);
  });

  it('N=1 ブロック(1レッスン)でも goal を生成し、ブロック範囲内にノードが収まる', () => {
    const layout = buildJourneyLayout([makeLesson('l1', 1, 0, 0)]);
    expect(layout.blocks).toHaveLength(1);
    const block = layout.blocks[0];
    expect(block.lessonNodes).toHaveLength(1);
    expect(layout.goal.kind).toBe('goal');
    // ノードはブロック範囲内に収まる
    expect(block.lessonNodes[0].y).toBeLessThanOrEqual(block.bottomY);
    expect(block.lessonNodes[0].y).toBeGreaterThanOrEqual(block.topY);
    // ブロック毎にカラーテーマが付与される
    expect(block.theme).toBeTruthy();
    expect(typeof block.theme.hue).toBe('number');
  });

  it('N=5 のブロックで、ノードが下から上へ等間隔に並ぶ', () => {
    const lessons: JourneyLessonInput[] = [];
    for (let i = 0; i < 5; i += 1) {
      lessons.push(makeLesson(`l${i}`, 1, i, i));
    }
    const layout = buildJourneyLayout(lessons);
    const block = layout.blocks[0];
    expect(block.lessonNodes).toHaveLength(5);
    for (let i = 1; i < block.lessonNodes.length; i += 1) {
      const prev = block.lessonNodes[i - 1];
      const curr = block.lessonNodes[i];
      // y は index が大きいほど小さくなる (上昇型)
      expect(curr.y).toBeLessThan(prev.y);
      const gap = prev.y - curr.y;
      expect(gap).toBeCloseTo(JOURNEY_CONSTANTS.NODE_SPACING, 5);
    }
  });

  it('phoneLeftLessonColumn では全レッスンが左一列 (同一 X) に揃う', () => {
    const lessons: JourneyLessonInput[] = [
      makeLesson('l0', 1, 0, 0),
      makeLesson('l1', 1, 1, 1),
      makeLesson('l2', 2, 0, 2),
    ];
    const layout = buildJourneyLayout(lessons, { phoneLeftLessonColumn: true });
    const xs = layout.blocks.flatMap(b => b.lessonNodes.map(n => n.x));
    expect(xs.every(x => x === JOURNEY_PHONE_LESSON_COLUMN_CENTER_X)).toBe(true);
  });

  it('N=12 のブロックでも X が論理幅内に収まる', () => {
    const lessons: JourneyLessonInput[] = [];
    for (let i = 0; i < 12; i += 1) {
      lessons.push(makeLesson(`l${i}`, 1, i, i));
    }
    const layout = buildJourneyLayout(lessons);
    const block = layout.blocks[0];
    expect(block.lessonNodes).toHaveLength(12);
    block.lessonNodes.forEach(node => {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(JOURNEY_LOGICAL_WIDTH);
    });
  });

  it('可変レッスン数(1/5/12)の複数ブロックが積み上げられる', () => {
    const lessons: JourneyLessonInput[] = [];
    // Block 1: 1 lesson
    lessons.push(makeLesson('b1-l1', 1, 0, 0));
    // Block 2: 5 lessons
    for (let i = 0; i < 5; i += 1) {
      lessons.push(makeLesson(`b2-l${i}`, 2, i, 1 + i));
    }
    // Block 3: 12 lessons
    for (let i = 0; i < 12; i += 1) {
      lessons.push(makeLesson(`b3-l${i}`, 3, i, 6 + i));
    }
    const layout = buildJourneyLayout(lessons);
    expect(layout.blocks).toHaveLength(3);
    // 下から上へ
    const b1 = layout.blocks[0];
    const b2 = layout.blocks[1];
    const b3 = layout.blocks[2];
    expect(b2.bottomY).toBeLessThanOrEqual(b1.topY);
    expect(b3.bottomY).toBeLessThanOrEqual(b2.topY);
    // ブロック毎のノード数一致
    expect(b1.lessonNodes).toHaveLength(1);
    expect(b2.lessonNodes).toHaveLength(5);
    expect(b3.lessonNodes).toHaveLength(12);
    // 全体高さは全てのノードを包含している
    layout.allNodes.forEach(node => {
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(layout.totalHeight);
    });
    // ゴールは最上端に近い
    expect(layout.goal.y).toBeLessThan(b3.topY);
  });

  it('ブロック番号が 1 始まりでなくても昇順ソートされる', () => {
    const lessons: JourneyLessonInput[] = [
      makeLesson('a', 3, 0, 0),
      makeLesson('b', 2, 0, 1),
      makeLesson('c', 1, 0, 2),
    ];
    const layout = buildJourneyLayout(lessons);
    expect(layout.blocks.map(b => b.blockNumber)).toEqual([1, 2, 3]);
  });
});

describe('computeFrontierLessonId', () => {
  const lessons: JourneyLessonInput[] = [
    makeLesson('a', 1, 0, 0),
    makeLesson('b', 1, 1, 1),
    makeLesson('c', 2, 0, 2),
  ];

  it('最初の unlocked かつ未完了のレッスンを返す', () => {
    const unlocked = new Set(['a', 'b']);
    const completed = new Set(['a']);
    const id = computeFrontierLessonId(
      lessons,
      lessonId => unlocked.has(lessonId),
      lessonId => completed.has(lessonId),
    );
    expect(id).toBe('b');
  });

  it('全て完了している場合は null', () => {
    const unlocked = new Set(['a', 'b', 'c']);
    const completed = new Set(['a', 'b', 'c']);
    const id = computeFrontierLessonId(
      lessons,
      lessonId => unlocked.has(lessonId),
      lessonId => completed.has(lessonId),
    );
    expect(id).toBeNull();
  });

  it('未解放しかない場合は null', () => {
    const id = computeFrontierLessonId(
      lessons,
      () => false,
      () => false,
    );
    expect(id).toBeNull();
  });
});
