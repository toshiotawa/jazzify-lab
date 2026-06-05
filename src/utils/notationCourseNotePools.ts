/**
 * 「音符の読み方」コース: トピック別出題音プール（唯一の音源）。
 * survival_random_chords / ear_training_chord_quiz_items 生成に使用。
 */
import type { SurvivalLessonRandomChordEntry } from '@/types';
import { Note } from 'tonal';

const parseNoteNameToMidi = (noteName: string): number | null => {
  const midi = Note.midi(noteName.trim());
  return typeof midi === 'number' && Number.isFinite(midi) ? midi : null;
};

export type NotationStaff = 1 | 2;

export interface NotationCourseNoteSpec {
  readonly noteName: string;
  readonly staff: NotationStaff;
  readonly keyFifths?: number;
}

export interface NotationCourseTopicSpec {
  readonly blockNumber: number;
  readonly questKey: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly descriptionJa: string;
  readonly descriptionEn: string;
  readonly notes: readonly NotationCourseNoteSpec[];
}

interface TopicMeta {
  readonly titleJa: string;
  readonly titleEn: string;
  readonly descriptionJa: string;
  readonly descriptionEn: string;
}

export const LEARNING_NOTES_PER_QUEST = 5;

/** DBパッチで削除する旧レッスン（加線ブロック q3/q4）。 */
export const NOTATION_COURSE_REMOVED_LESSON_KEYS: readonly string[] = [
  'b2-q3', 'b2-q4', 'b3-q3', 'b3-q4', 'b6-q3', 'b6-q4', 'b7-q3', 'b7-q4',
];

const note = (
  noteName: string,
  staff: NotationStaff,
  keyFifths = 0,
): NotationCourseNoteSpec => ({ noteName, staff, keyFifths });

const treble = (noteName: string, keyFifths = 0): NotationCourseNoteSpec => (
  note(noteName, 1, keyFifths)
);

const bass = (noteName: string, keyFifths = 0): NotationCourseNoteSpec => (
  note(noteName, 2, keyFifths)
);

const uniqNotes = (specs: readonly NotationCourseNoteSpec[]): NotationCourseNoteSpec[] => {
  const seen = new Set<string>();
  const out: NotationCourseNoteSpec[] = [];
  for (const spec of specs) {
    const key = `${spec.noteName}:${spec.staff}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(spec);
  }
  return out;
};

const mergeTopicNotes = (
  topics: readonly NotationCourseTopicSpec[],
): NotationCourseNoteSpec[] => uniqNotes(topics.flatMap(t => [...t.notes]));

const mergeLearningTopicNotes = (
  ...topicGroups: readonly (readonly NotationCourseTopicSpec[])[]
): NotationCourseNoteSpec[] => mergeTopicNotes(
  topicGroups.flatMap(group => group.filter(t => t.questKey !== 'q5')),
);

const sliceFiveNoteWindow = (
  pool: readonly NotationCourseNoteSpec[],
  startIndex: number,
): NotationCourseNoteSpec[] => pool.slice(startIndex, startIndex + LEARNING_NOTES_PER_QUEST);

const buildLearningTopics = (
  blockNumber: number,
  pool: readonly NotationCourseNoteSpec[],
  metas: readonly TopicMeta[],
): NotationCourseTopicSpec[] => metas.map((meta, index) => ({
  blockNumber,
  questKey: `q${index + 1}`,
  ...meta,
  notes: sliceFiveNoteWindow(pool, index),
}));

const buildReviewTopic = (
  blockNumber: number,
  pool: readonly NotationCourseNoteSpec[],
  meta: TopicMeta,
): NotationCourseTopicSpec => ({
  blockNumber,
  questKey: 'q5',
  ...meta,
  notes: [...pool],
});

export const toRandomChordEntry = (spec: NotationCourseNoteSpec): SurvivalLessonRandomChordEntry => {
  const midi = parseNoteNameToMidi(spec.noteName);
  if (midi === null) {
    throw new Error(`Invalid note name: ${spec.noteName}`);
  }
  return {
    name: spec.noteName,
    voicing: [midi],
    voicingNames: [spec.noteName],
    voicingStaves: [spec.staff],
    keyFifths: spec.keyFifths ?? 0,
  };
};

export const toRandomChordEntries = (
  specs: readonly NotationCourseNoteSpec[],
): SurvivalLessonRandomChordEntry[] => specs.map(toRandomChordEntry);

const block1Pool: NotationCourseNoteSpec[] = [
  treble('E4'), treble('F4'), treble('G4'), treble('A4'), treble('B4'),
  treble('C5'), treble('D5'), treble('E5'), treble('F5'),
];

const block1Topics: NotationCourseTopicSpec[] = [
  ...buildLearningTopics(1, block1Pool, [
    {
      titleJa: 'ミファソラシ',
      titleEn: 'E F G A B',
      descriptionJa: 'ト音記号・五線の中。ミからシまでの5音です。',
      descriptionEn: 'Treble clef, notes on the staff: E through B.',
    },
    {
      titleJa: 'ファソラシド',
      titleEn: 'F G A B C',
      descriptionJa: 'ト音記号・五線の中。ファからドまで読みましょう。',
      descriptionEn: 'Treble clef, notes on the staff: F through C.',
    },
    {
      titleJa: 'ソラシドレ',
      titleEn: 'G A B C D',
      descriptionJa: 'ト音記号・五線の中。ソからレまでの5音です。',
      descriptionEn: 'Treble clef, notes on the staff: G through D.',
    },
    {
      titleJa: 'ラシドレミ',
      titleEn: 'A B C D E',
      descriptionJa: 'ト音記号・五線の中。ラからミまで読みましょう。',
      descriptionEn: 'Treble clef, notes on the staff: A through E.',
    },
  ]),
  buildReviewTopic(1, block1Pool, {
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionJa: 'ト音記号・五線の中の音符をすべて復習します。',
    descriptionEn: 'Review all treble-clef notes within the staff.',
  }),
];

const block2Pool: NotationCourseNoteSpec[] = [
  treble('G5'), treble('A5'), treble('B5'), treble('C6'), treble('D6'), treble('E6'),
];

const block2Topics: NotationCourseTopicSpec[] = [
  ...buildLearningTopics(2, block2Pool, [
    {
      titleJa: 'ソラシドレ',
      titleEn: 'G A B C D',
      descriptionJa: 'ト音記号・上加線。ソからレまでの5音です。',
      descriptionEn: 'Treble clef, upper ledger lines: G through D.',
    },
    {
      titleJa: 'ラシドレミ',
      titleEn: 'A B C D E',
      descriptionJa: 'ト音記号・上加線。ラからミまで読みましょう。',
      descriptionEn: 'Treble clef, upper ledger lines: A through E.',
    },
  ]),
  buildReviewTopic(2, block2Pool, {
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionJa: 'ト音記号・上加線の音符をすべて復習します。',
    descriptionEn: 'Review all treble-clef upper-ledger notes.',
  }),
];

const block3Pool: NotationCourseNoteSpec[] = [
  treble('F3'), treble('G3'), treble('A3'), treble('B3'), treble('C4'), treble('D4'),
];

const block3Topics: NotationCourseTopicSpec[] = [
  ...buildLearningTopics(3, block3Pool, [
    {
      titleJa: 'ファソラシド',
      titleEn: 'F G A B C',
      descriptionJa: 'ト音記号・下加線。ファからドまでの5音です。',
      descriptionEn: 'Treble clef, lower ledger lines: F through C.',
    },
    {
      titleJa: 'ソラシドレ',
      titleEn: 'G A B C D',
      descriptionJa: 'ト音記号・下加線。ソからレまで読みましょう。',
      descriptionEn: 'Treble clef, lower ledger lines: G through D.',
    },
  ]),
  buildReviewTopic(3, block3Pool, {
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionJa: 'ト音記号・下加線の音符をすべて復習します。',
    descriptionEn: 'Review all treble-clef lower-ledger notes.',
  }),
];

const block4Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 4,
    questKey: 'q1',
    titleJa: 'ト音記号 総合まとめ',
    titleEn: 'Treble clef review',
    descriptionJa: '五線の中・上加線・下加線のト音記号音符をすべて復習します。',
    descriptionEn: 'Review all treble-clef notes: staff, upper ledger, and lower ledger.',
    notes: mergeLearningTopicNotes(block1Topics, block2Topics, block3Topics),
  },
];

const block5Pool: NotationCourseNoteSpec[] = [
  bass('G2'), bass('A2'), bass('B2'), bass('C3'), bass('D3'),
  bass('E3'), bass('F3'), bass('G3'), bass('A3'),
];

const block5Topics: NotationCourseTopicSpec[] = [
  ...buildLearningTopics(5, block5Pool, [
    {
      titleJa: 'ソラシドレ',
      titleEn: 'G A B C D',
      descriptionJa: 'ヘ音記号・五線の中。ソからレまでの5音です。',
      descriptionEn: 'Bass clef, notes on the staff: G through D.',
    },
    {
      titleJa: 'ラシドレミ',
      titleEn: 'A B C D E',
      descriptionJa: 'ヘ音記号・五線の中。ラからミまで読みましょう。',
      descriptionEn: 'Bass clef, notes on the staff: A through E.',
    },
    {
      titleJa: 'シドレミファ',
      titleEn: 'B C D E F',
      descriptionJa: 'ヘ音記号・五線の中。シからファまでの5音です。',
      descriptionEn: 'Bass clef, notes on the staff: B through F.',
    },
    {
      titleJa: 'ドレミファソ',
      titleEn: 'C D E F G',
      descriptionJa: 'ヘ音記号・五線の中。ドからソまで読みましょう。',
      descriptionEn: 'Bass clef, notes on the staff: C through G.',
    },
  ]),
  buildReviewTopic(5, block5Pool, {
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionJa: 'ヘ音記号・五線の中の音符をすべて復習します。',
    descriptionEn: 'Review all bass-clef notes within the staff.',
  }),
];

const block6Pool: NotationCourseNoteSpec[] = [
  bass('A1'), bass('B1'), bass('C2'), bass('D2'), bass('E2'), bass('F2'),
];

const block6Topics: NotationCourseTopicSpec[] = [
  ...buildLearningTopics(6, block6Pool, [
    {
      titleJa: 'ラシドレミ',
      titleEn: 'A B C D E',
      descriptionJa: 'ヘ音記号・下加線。ラからミまでの5音です。',
      descriptionEn: 'Bass clef, lower ledger lines: A through E.',
    },
    {
      titleJa: 'シドレミファ',
      titleEn: 'B C D E F',
      descriptionJa: 'ヘ音記号・下加線。シからファまで読みましょう。',
      descriptionEn: 'Bass clef, lower ledger lines: B through F.',
    },
  ]),
  buildReviewTopic(6, block6Pool, {
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionJa: 'ヘ音記号・下加線の音符をすべて復習します。',
    descriptionEn: 'Review all bass-clef lower-ledger notes.',
  }),
];

const block7Pool: NotationCourseNoteSpec[] = [
  bass('B3'), bass('C4'), bass('D4'), bass('E4'), bass('F4'), bass('G4'),
];

const block7Topics: NotationCourseTopicSpec[] = [
  ...buildLearningTopics(7, block7Pool, [
    {
      titleJa: 'シドレミファ',
      titleEn: 'B C D E F',
      descriptionJa: 'ヘ音記号・上加線。シからファまでの5音です。',
      descriptionEn: 'Bass clef, upper ledger lines: B through F.',
    },
    {
      titleJa: 'ドレミファソ',
      titleEn: 'C D E F G',
      descriptionJa: 'ヘ音記号・上加線。ドからソまで読みましょう。',
      descriptionEn: 'Bass clef, upper ledger lines: C through G.',
    },
  ]),
  buildReviewTopic(7, block7Pool, {
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionJa: 'ヘ音記号・上加線の音符をすべて復習します。',
    descriptionEn: 'Review all bass-clef upper-ledger notes.',
  }),
];

const block8Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 8,
    questKey: 'q1',
    titleJa: 'ヘ音記号 総合まとめ',
    titleEn: 'Bass clef review',
    descriptionJa: '五線の中・下加線・上加線のヘ音記号音符をすべて復習します。',
    descriptionEn: 'Review all bass-clef notes: staff, lower ledger, and upper ledger.',
    notes: mergeLearningTopicNotes(block5Topics, block6Topics, block7Topics),
  },
];

const block9Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 9,
    questKey: 'q1',
    titleJa: '大譜表まとめ',
    titleEn: 'Grand staff review',
    descriptionJa: '中央のドを中心に、ト音記号とヘ音記号がランダムに出題されます。',
    descriptionEn: 'Random mix of treble and bass clef notes centered on middle C.',
    notes: [
      bass('A3'), bass('B3'), bass('C4'), bass('D4'),
      treble('C4'), treble('D4'), treble('E4'), treble('F4'),
    ],
  },
];

const trebleStaffSharps: NotationCourseNoteSpec[] = [
  treble('F#4'), treble('G#4'), treble('A#4'), treble('C#5'), treble('D#5'),
];

const bassStaffSharps: NotationCourseNoteSpec[] = [
  bass('F#2'), bass('G#2'), bass('A#2'), bass('C#3'), bass('D#3'),
];

const trebleStaffFlats: NotationCourseNoteSpec[] = [
  treble('Bb4'), treble('Eb4'), treble('Ab4'), treble('Gb4'), treble('Db5'),
];

const bassStaffFlats: NotationCourseNoteSpec[] = [
  bass('Bb2'), bass('Eb3'), bass('Ab2'), bass('Gb2'), bass('Db3'),
];

const block10Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 10,
    questKey: 'q1',
    titleJa: '五線の中（ト音）＋♯',
    titleEn: 'Treble staff + sharps',
    descriptionJa: 'ト音記号・五線の中のシャープ（♯）付き音符です。',
    descriptionEn: 'Sharps on the treble staff within the five lines.',
    notes: trebleStaffSharps,
  },
  {
    blockNumber: 10,
    questKey: 'q2',
    titleJa: '五線の中（ヘ音）＋♯',
    titleEn: 'Bass staff + sharps',
    descriptionJa: 'ヘ音記号・五線の中のシャープ（♯）付き音符です。',
    descriptionEn: 'Sharps on the bass staff within the five lines.',
    notes: bassStaffSharps,
  },
  {
    blockNumber: 10,
    questKey: 'q3',
    titleJa: 'まとめ（全て＋♯）',
    titleEn: 'Review (all + sharps)',
    descriptionJa: 'ト音・ヘ音の五線内シャープ音符を復習します。',
    descriptionEn: 'Review all treble and bass sharps within the staff.',
    notes: [...trebleStaffSharps, ...bassStaffSharps],
  },
];

const block11Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 11,
    questKey: 'q1',
    titleJa: '五線の中（ト音）＋♭',
    titleEn: 'Treble staff + flats',
    descriptionJa: 'ト音記号・五線の中のフラット（♭）付き音符です。',
    descriptionEn: 'Flats on the treble staff within the five lines.',
    notes: trebleStaffFlats,
  },
  {
    blockNumber: 11,
    questKey: 'q2',
    titleJa: '五線の中（ヘ音）＋♭',
    titleEn: 'Bass staff + flats',
    descriptionJa: 'ヘ音記号・五線の中のフラット（♭）付き音符です。',
    descriptionEn: 'Flats on the bass staff within the five lines.',
    notes: bassStaffFlats,
  },
  {
    blockNumber: 11,
    questKey: 'q3',
    titleJa: 'まとめ（全て＋♭）',
    titleEn: 'Review (all + flats)',
    descriptionJa: 'ト音・ヘ音の五線内フラット音符を復習します。',
    descriptionEn: 'Review all treble and bass flats within the staff.',
    notes: [...trebleStaffFlats, ...bassStaffFlats],
  },
];

const block12Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 12,
    questKey: 'q1',
    titleJa: '総仕上げ（ファイナル）',
    titleEn: 'Final review',
    descriptionJa: 'ト音・ヘ音・上下加線・臨時記号すべてのランダム総復習です。',
    descriptionEn: 'Final random review: treble, bass, ledger lines, and accidentals.',
    notes: uniqNotes([
      ...mergeLearningTopicNotes(block1Topics, block2Topics, block3Topics),
      ...mergeLearningTopicNotes(block5Topics, block6Topics, block7Topics),
      ...block9Topics[0].notes,
      ...trebleStaffSharps,
      ...bassStaffSharps,
      ...trebleStaffFlats,
      ...bassStaffFlats,
    ]),
  },
];

export const NOTATION_COURSE_BLOCK_META: Readonly<
  Record<number, { blockNameJa: string; blockNameEn: string; blockDescriptionJa: string; blockDescriptionEn: string }>
> = {
  1: {
    blockNameJa: '五線の中の音符（ト音記号）',
    blockNameEn: 'Treble clef: notes on the staff',
    blockDescriptionJa: 'ト音記号の五線の中の音符を、5音ずつ覚えていきます。',
    blockDescriptionEn: 'Learn treble-clef notes on the staff, five at a time.',
  },
  2: {
    blockNameJa: '五線の上加線（ト音記号）',
    blockNameEn: 'Treble clef: upper ledger lines',
    blockDescriptionJa: '五線の上にある加線の音符を読みましょう。',
    blockDescriptionEn: 'Read notes on upper ledger lines above the treble staff.',
  },
  3: {
    blockNameJa: '五線の下加線（ト音記号）',
    blockNameEn: 'Treble clef: lower ledger lines',
    blockDescriptionJa: '五線の下にある加線の音符を読みましょう。',
    blockDescriptionEn: 'Read notes on lower ledger lines below the treble staff.',
  },
  4: {
    blockNameJa: 'ト音記号 総合まとめ',
    blockNameEn: 'Treble clef review',
    blockDescriptionJa: 'ト音記号の五線・上加線・下加線を総復習します。',
    blockDescriptionEn: 'Review all treble-clef staff and ledger-line notes.',
  },
  5: {
    blockNameJa: '五線の中の音符（ヘ音記号）',
    blockNameEn: 'Bass clef: notes on the staff',
    blockDescriptionJa: 'ヘ音記号の五線の中の音符を、5音ずつ覚えていきます。',
    blockDescriptionEn: 'Learn bass-clef notes on the staff, five at a time.',
  },
  6: {
    blockNameJa: '五線の下加線（ヘ音記号）',
    blockNameEn: 'Bass clef: lower ledger lines',
    blockDescriptionJa: 'ヘ音記号・五線の下の加線音符を読みましょう。',
    blockDescriptionEn: 'Read notes on lower ledger lines below the bass staff.',
  },
  7: {
    blockNameJa: '五線の上加線（ヘ音記号）',
    blockNameEn: 'Bass clef: upper ledger lines',
    blockDescriptionJa: 'ヘ音記号・五線の上の加線音符を読みましょう。',
    blockDescriptionEn: 'Read notes on upper ledger lines above the bass staff.',
  },
  8: {
    blockNameJa: 'ヘ音記号 総合まとめ',
    blockNameEn: 'Bass clef review',
    blockDescriptionJa: 'ヘ音記号の五線・下加線・上加線を総復習します。',
    blockDescriptionEn: 'Review all bass-clef staff and ledger-line notes.',
  },
  9: {
    blockNameJa: '大譜表まとめ',
    blockNameEn: 'Grand staff review',
    blockDescriptionJa: '中央のドを中心にト音とヘ音が混ざって出題されます。',
    blockDescriptionEn: 'Mixed treble and bass clef notes centered on middle C.',
  },
  10: {
    blockNameJa: '臨時記号（シャープ ♯）',
    blockNameEn: 'Accidentals: sharps',
    blockDescriptionJa: '五線の中のシャープ（♯）付き音符を読みましょう。',
    blockDescriptionEn: 'Read sharps on the treble and bass staves.',
  },
  11: {
    blockNameJa: '臨時記号（フラット ♭）',
    blockNameEn: 'Accidentals: flats',
    blockDescriptionJa: '五線の中のフラット（♭）付き音符を読みましょう。',
    blockDescriptionEn: 'Read flats on the treble and bass staves.',
  },
  12: {
    blockNameJa: '総仕上げ（ファイナル）',
    blockNameEn: 'Final review',
    blockDescriptionJa: 'これまで学んだすべての音符をランダムに総復習します。',
    blockDescriptionEn: 'Final random review of every note you have learned.',
  },
};

export const NOTATION_COURSE_TOPICS_BY_BLOCK: Readonly<Record<number, readonly NotationCourseTopicSpec[]>> = {
  1: block1Topics,
  2: block2Topics,
  3: block3Topics,
  4: block4Topics,
  5: block5Topics,
  6: block6Topics,
  7: block7Topics,
  8: block8Topics,
  9: block9Topics,
  10: block10Topics,
  11: block11Topics,
  12: block12Topics,
};

export const NOTATION_COURSE_ALL_TOPICS: readonly NotationCourseTopicSpec[] = [
  ...block1Topics,
  ...block2Topics,
  ...block3Topics,
  ...block4Topics,
  ...block5Topics,
  ...block6Topics,
  ...block7Topics,
  ...block8Topics,
  ...block9Topics,
  ...block10Topics,
  ...block11Topics,
  ...block12Topics,
];

export const getNotationCourseTopicsForBlocks = (
  blockNumbers: readonly number[],
): NotationCourseTopicSpec[] => blockNumbers.flatMap(bn => [...(NOTATION_COURSE_TOPICS_BY_BLOCK[bn] ?? [])]);

export const getTopicLessonKey = (topic: NotationCourseTopicSpec): string => (
  `b${topic.blockNumber}-${topic.questKey}`
);

export const getTopicLowestMidi = (topic: NotationCourseTopicSpec): number => {
  const midis = topic.notes.map(n => parseNoteNameToMidi(n.noteName)).filter((m): m is number => m !== null);
  return midis.length > 0 ? Math.min(...midis) : Number.POSITIVE_INFINITY;
};

export const assertTopicsOrderedByLowestNote = (
  topics: readonly NotationCourseTopicSpec[],
): void => {
  for (let i = 1; i < topics.length; i += 1) {
    const prev = getTopicLowestMidi(topics[i - 1]);
    const curr = getTopicLowestMidi(topics[i]);
    if (curr < prev) {
      throw new Error(
        `Topic order violation at index ${i}: ${topics[i].titleJa} (${curr}) before ${topics[i - 1].titleJa} (${prev})`,
      );
    }
  }
};

export const isLearningTopic = (topic: NotationCourseTopicSpec): boolean => (
  topic.questKey !== 'q5' && !topic.titleJa.includes('まとめ') && !topic.titleJa.includes('総合') && !topic.titleJa.includes('総仕上げ') && !topic.titleJa.includes('大譜表')
);
