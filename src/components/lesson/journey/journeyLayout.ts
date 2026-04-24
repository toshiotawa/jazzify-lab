/**
 * レッスンモード「学びの旅マップ」レイアウト
 *
 * サバイバルの descentLayout が固定ブロック構造なのに対し、
 * レッスンは各ブロックに含まれるレッスン数が可変。
 * そのため、ブロック毎に高さを動的算出し積み上げる。
 *
 * 座標系は「論理ピクセル (lp)」。描画側で viewport 幅にフィットさせて scale する。
 * Y 軸は下→上に進む (index 0 のレッスンが最下段、最後のノードが最上段)。
 */

export const JOURNEY_LOGICAL_WIDTH = 360;

/** レイアウトチューニング定数 */
export const JOURNEY_CONSTANTS = {
  /** ノード同士の最小間隔 */
  NODE_SPACING: 78,
  /** 曲線の左右揺れ振幅 */
  AMPLITUDE: 72,
  /** 1ノードあたりのサインの角度 (ラジアン) */
  SINE_FREQUENCY: 0.58,
  /** ブロック上部の余白 (帯の下端と最初のノードの間) */
  BLOCK_TOP_PAD: 72,
  /** ブロック下部の余白 (ブロック帯とその下のブロック終端との間) */
  BLOCK_BOTTOM_PAD: 40,
  /** ブロック間の追加オフセット (まとめノード廃止後の隙間) */
  BLOCK_GAP: 40,
  /** コースゴールの上部余白 */
  GOAL_TOP_PAD: 240,
  /** マップ全体の最上端余白 (ゴールの上、ここでスクロールが止まる) */
  TOP_MARGIN: 120,
  /** マップ全体の最下端余白 (スタート地点下) */
  BOTTOM_MARGIN: 180,
} as const;

/**
 * ブロック毎のカラーテーマ。
 * blockIndex % BLOCK_THEMES.length で割り当てられる。
 * 全ブロックで「星空」の世界観を維持するため、色相は紫〜青の
 * 夜空系レンジ (225〜295) に統一し、微妙な識別性のみ残す。
 */
export interface BlockTheme {
  /** 主色相 (HSL) */
  hue: number;
  /** 二次色相 (グラデの上端用) */
  hueAlt: number;
  /** ラベル/識別子 (歴史的理由で昼夜サイクル名を保持している) */
  label: 'midnight' | 'dawn' | 'morning' | 'noon' | 'dusk' | 'starlight';
}

export const BLOCK_THEMES: BlockTheme[] = [
  { hue: 262, hueAlt: 282, label: 'midnight' },
  { hue: 248, hueAlt: 268, label: 'dawn' },
  { hue: 232, hueAlt: 252, label: 'morning' },
  { hue: 278, hueAlt: 258, label: 'noon' },
  { hue: 292, hueAlt: 272, label: 'dusk' },
  { hue: 225, hueAlt: 245, label: 'starlight' },
];

export const getBlockTheme = (blockIndex: number): BlockTheme => {
  return BLOCK_THEMES[blockIndex % BLOCK_THEMES.length];
};

export type JourneyNodeKind = 'lesson' | 'goal';

export interface JourneyNode {
  /** レッスン ID (goal の場合は仮想 ID) */
  id: string;
  /** ブロック内のレッスン順(1始まり)。goal は 0 */
  number: number;
  x: number;
  y: number;
  kind: JourneyNodeKind;
  blockIndex: number;
  /** goal 以外: 元の Lesson への参照 index */
  lessonIndex?: number;
}

export interface JourneyBlockLayout {
  blockNumber: number;
  blockName: string;
  blockNameEn?: string | null;
  /** 0 始まりの順序 */
  blockIndex: number;
  /** ブロック毎のカラーテーマ */
  theme: BlockTheme;
  /** ブロックの範囲 (上端 = topY, 下端 = bottomY) */
  topY: number;
  bottomY: number;
  /** 最初のレッスンノード y */
  firstLessonY: number;
  /** ブロック内のレッスンノード */
  lessonNodes: JourneyNode[];
}

export interface JourneyLayout {
  logicalWidth: number;
  totalHeight: number;
  blocks: JourneyBlockLayout[];
  goal: JourneyNode;
  /** index を持たない軽量参照用。全ノードをフラットに返す */
  allNodes: JourneyNode[];
}

export interface JourneyLessonInput {
  id: string;
  blockNumber: number;
  blockName?: string | null;
  blockNameEn?: string | null;
  orderIndex: number;
  /** blocks で並べる時に使う元配列上の index */
  sourceIndex: number;
}

/** `blockName` から英語フォールバックを決める */
const defaultBlockName = (blockNumber: number, isEnglish: boolean): string => {
  return isEnglish ? `Block ${blockNumber}` : `ブロック ${blockNumber}`;
};

interface GroupedBlock {
  blockNumber: number;
  blockName: string;
  blockNameEn?: string | null;
  lessons: JourneyLessonInput[];
}

const groupByBlock = (lessons: JourneyLessonInput[], isEnglish: boolean): GroupedBlock[] => {
  const map = new Map<number, GroupedBlock>();
  lessons.forEach(lesson => {
    const bn = lesson.blockNumber;
    let entry = map.get(bn);
    if (!entry) {
      entry = {
        blockNumber: bn,
        blockName: lesson.blockName ?? defaultBlockName(bn, isEnglish),
        blockNameEn: lesson.blockNameEn ?? null,
        lessons: [],
      };
      map.set(bn, entry);
    }
    entry.lessons.push(lesson);
    if (!entry.blockName && lesson.blockName) {
      entry.blockName = lesson.blockName;
    }
    if (!entry.blockNameEn && lesson.blockNameEn) {
      entry.blockNameEn = lesson.blockNameEn;
    }
  });
  const sortedBlockNumbers = Array.from(map.keys()).sort((a, b) => a - b);
  return sortedBlockNumbers.map(bn => {
    const entry = map.get(bn)!;
    return {
      ...entry,
      lessons: [...entry.lessons].sort((a, b) => a.orderIndex - b.orderIndex),
    };
  });
};

/**
 * グローバル index から X 座標を導出。
 * block ごとに位相をずらして、ブロック間で軌道が単調にならないようにする。
 */
const computeX = (globalIndex: number, blockIndex: number, logicalWidth: number): number => {
  const centerX = logicalWidth / 2;
  const { AMPLITUDE, SINE_FREQUENCY } = JOURNEY_CONSTANTS;
  const phase = (blockIndex % 2 === 0 ? 0 : Math.PI / 2) + blockIndex * 0.35;
  const raw = Math.sin(globalIndex * SINE_FREQUENCY + phase) * AMPLITUDE;
  return centerX + raw;
};

export interface BuildJourneyOptions {
  logicalWidth?: number;
  isEnglish?: boolean;
}

/**
 * レッスン配列からマップ全体レイアウトを計算する純粋関数。
 * - 上昇型: Y が小さいほど画面の上 (ゴール側)
 * - 最下端はスタート位置 (= 最初のブロックの最初のレッスンノード)
 */
export const buildJourneyLayout = (
  lessons: JourneyLessonInput[],
  options: BuildJourneyOptions = {},
): JourneyLayout => {
  const logicalWidth = options.logicalWidth ?? JOURNEY_LOGICAL_WIDTH;
  const isEnglish = options.isEnglish ?? false;

  const {
    NODE_SPACING,
    BLOCK_TOP_PAD,
    BLOCK_BOTTOM_PAD,
    BLOCK_GAP,
    GOAL_TOP_PAD,
    TOP_MARGIN,
    BOTTOM_MARGIN,
  } = JOURNEY_CONSTANTS;

  const grouped = groupByBlock(lessons, isEnglish);
  if (grouped.length === 0) {
    return {
      logicalWidth,
      totalHeight: TOP_MARGIN + BOTTOM_MARGIN,
      blocks: [],
      goal: {
        id: '__goal__',
        number: 0,
        x: logicalWidth / 2,
        y: TOP_MARGIN,
        kind: 'goal',
        blockIndex: 0,
      },
      allNodes: [],
    };
  }

  const blocks: JourneyBlockLayout[] = [];
  // まず総高さを計算する (ノード座標は後段で totalHeight から逆算)
  const blockHeights: number[] = grouped.map(g => {
    const n = g.lessons.length;
    const lessonsHeight = Math.max(1, n) * NODE_SPACING;
    return BLOCK_TOP_PAD + lessonsHeight + BLOCK_GAP + BLOCK_BOTTOM_PAD;
  });
  const blocksTotalHeight = blockHeights.reduce((acc, v) => acc + v, 0);
  const totalHeight = TOP_MARGIN + GOAL_TOP_PAD + blocksTotalHeight + BOTTOM_MARGIN;

  /** 最下端 y (スタート側) */
  const bottomY = totalHeight - BOTTOM_MARGIN;
  /** 各ブロックの bottomY (ブロックごとに積み上げ) */
  let cursorBottomY = bottomY;
  let globalIndex = 0;
  const allNodes: JourneyNode[] = [];

  grouped.forEach((group, blockIndex) => {
    const blockHeight = blockHeights[blockIndex];
    const blockBottomY = cursorBottomY;
    const blockTopY = cursorBottomY - blockHeight;
    const firstLessonY = blockBottomY - BLOCK_BOTTOM_PAD;

    const lessonNodes: JourneyNode[] = group.lessons.map((lesson, i) => {
      const y = firstLessonY - i * NODE_SPACING;
      const x = computeX(globalIndex, blockIndex, logicalWidth);
      globalIndex += 1;
      const node: JourneyNode = {
        id: lesson.id,
        number: i + 1,
        x,
        y,
        kind: 'lesson',
        blockIndex,
        lessonIndex: lesson.sourceIndex,
      };
      allNodes.push(node);
      return node;
    });

    blocks.push({
      blockNumber: group.blockNumber,
      blockName: group.blockName || defaultBlockName(group.blockNumber, isEnglish),
      blockNameEn: group.blockNameEn ?? undefined,
      blockIndex,
      theme: getBlockTheme(blockIndex),
      topY: blockTopY,
      bottomY: blockBottomY,
      firstLessonY,
      lessonNodes,
    });

    cursorBottomY = blockTopY;
  });

  // コースゴール: 全ブロックの最上端よりさらに少し上 (中央)
  const lastBlock = blocks[blocks.length - 1];
  const goal: JourneyNode = {
    id: '__goal__',
    number: 0,
    x: logicalWidth / 2,
    y: lastBlock.topY - GOAL_TOP_PAD * 0.5,
    kind: 'goal',
    blockIndex: blocks.length,
  };
  allNodes.push(goal);

  return {
    logicalWidth,
    totalHeight,
    blocks,
    goal,
    allNodes,
  };
};

/**
 * 進捗・アクセス状態からフロンティア (= 今取り組むべき)レッスン id を算出する。
 * 「unlocked かつ未完了」のうち blockNumber、orderIndex が最小のもの。
 * すべて完了している or 未解放しかない場合は null。
 */
export const computeFrontierLessonId = (
  lessons: JourneyLessonInput[],
  isUnlocked: (lessonId: string) => boolean,
  isCompleted: (lessonId: string) => boolean,
): string | null => {
  const sorted = [...lessons].sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
    return a.orderIndex - b.orderIndex;
  });
  for (const lesson of sorted) {
    if (isUnlocked(lesson.id) && !isCompleted(lesson.id)) {
      return lesson.id;
    }
  }
  return null;
};
