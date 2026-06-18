/**
 * 両手ヴォイシングコース(中級) Block 3 レッスン4 — II-Valt-I 定義。
 */
import {
  ALL_MAJOR_KEYS,
  KEY_FIFTHS_BY_MAJOR,
  TWO_HAND_VOICING_GRAND_STAFF,
  buildSurvivalChordJson,
  type MajorKey,
  type QuizItemSpec,
  type SurvivalProgressionChordJson,
} from '@/utils/twoHandVoicingIntermediateCourse';

export const BLOCK3_II_VALT_I_SURVIVAL_STAGE_BASE = 1227;

export interface IiValtIChordSpec {
  readonly symbol: string;
  readonly notes: readonly [string, string, string, string];
}

export interface IiValtIKeySet {
  readonly key: MajorKey;
  readonly keyFifths: number;
  readonly chords: readonly [
    IiValtIChordSpec,
    IiValtIChordSpec,
    IiValtIChordSpec,
    IiValtIChordSpec,
    IiValtIChordSpec,
    IiValtIChordSpec,
    IiValtIChordSpec,
  ];
}

export interface IiValtIProgressionSpec {
  readonly progressionKey: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly keys: readonly MajorKey[];
  readonly isSummary: boolean;
}

export interface TwoHandVoicingBlock3IiValtILessonSpec {
  readonly lessonKey: 'b3-ii-valt-i';
  readonly orderIndex: 17;
  readonly titleJa: 'II-Valt-I';
  readonly titleEn: 'II-Valt-I';
  readonly progressions: readonly IiValtIProgressionSpec[];
  readonly survivalBlockKey: 'II-V-I';
}

const chord = (
  symbol: string,
  notes: readonly [string, string, string, string],
): IiValtIChordSpec => ({ symbol, notes });

const buildKeySet = (
  key: MajorKey,
  iiExtended: IiValtIChordSpec,
  ii: IiValtIChordSpec,
  vAltA: IiValtIChordSpec,
  vAltB: IiValtIChordSpec,
  iM7A: IiValtIChordSpec,
  iM7B: IiValtIChordSpec,
  i6: IiValtIChordSpec,
): IiValtIKeySet => ({
  key,
  keyFifths: KEY_FIFTHS_BY_MAJOR[key],
  chords: [iiExtended, ii, vAltA, vAltB, iM7A, iM7B, i6],
});

export const II_VALT_I_VOICINGS_BY_KEY: Record<MajorKey, IiValtIKeySet> = {
  C: buildKeySet(
    'C',
    chord('Dm7(9,11)', ['E3', 'A3', 'C4', 'G4']),
    chord('Dm7', ['D3', 'A3', 'C4', 'F4']),
    chord('G7alt', ['G3', 'Cb4', 'Eb4', 'Bb4']),
    chord('G7alt', ['F3', 'Cb4', 'Eb4', 'Ab4']),
    chord('CM7', ['E3', 'B3', 'D4', 'G4']),
    chord('CM7', ['B3', 'E4', 'G4', 'D5']),
    chord('C6', ['A3', 'E4', 'G4', 'C5']),
  ),
  Db: buildKeySet(
    'Db',
    chord('Ebm7(9,11)', ['F3', 'Bb3', 'Db4', 'Ab4']),
    chord('Ebm7', ['Eb3', 'Bb3', 'Db4', 'Gb4']),
    chord('Ab7alt', ['Ab3', 'Dbb4', 'Fb4', 'B4']),
    chord('Ab7alt', ['Gb3', 'Dbb4', 'Fb4', 'Bbb4']),
    chord('DbM7', ['F3', 'C4', 'Eb4', 'Ab4']),
    chord('DbM7', ['C4', 'F4', 'Ab4', 'Eb5']),
    chord('Db6', ['Bb3', 'F4', 'Ab4', 'Db5']),
  ),
  D: buildKeySet(
    'D',
    chord('Em7(9,11)', ['F#3', 'B3', 'D4', 'A4']),
    chord('Em7', ['E3', 'B3', 'D4', 'G4']),
    chord('A7alt', ['A3', 'Db4', 'F4', 'C5']),
    chord('A7alt', ['G3', 'Db4', 'F4', 'Bb4']),
    chord('DM7', ['F#3', 'C#4', 'E4', 'A4']),
    chord('DM7', ['C#4', 'F#4', 'A4', 'E5']),
    chord('D6', ['B3', 'F#4', 'A4', 'D5']),
  ),
  Eb: buildKeySet(
    'Eb',
    chord('Fm7(9,11)', ['G3', 'C4', 'Eb4', 'Bb4']),
    chord('Fm7', ['F3', 'C4', 'Eb4', 'Ab4']),
    chord('Bb7alt', ['Bb3', 'Ebb4', 'Gb4', 'Db5']),
    chord('Bb7alt', ['Ab3', 'Ebb4', 'Gb4', 'Cb5']),
    chord('EbM7', ['G3', 'D4', 'F4', 'Bb4']),
    chord('EbM7', ['D4', 'G4', 'Bb4', 'F5']),
    chord('Eb6', ['C4', 'G4', 'Bb4', 'Eb5']),
  ),
  E: buildKeySet(
    'E',
    chord('F#m7(9,11)', ['G#3', 'C#4', 'E4', 'B4']),
    chord('F#m7', ['F#3', 'C#4', 'E4', 'A4']),
    chord('B7alt', ['B3', 'Eb4', 'G4', 'D5']),
    chord('B7alt', ['A3', 'Eb4', 'G4', 'C5']),
    chord('EM7', ['G#3', 'D#4', 'F#4', 'B4']),
    chord('EM7', ['D#4', 'G#4', 'B4', 'F#5']),
    chord('E6', ['C#4', 'G#4', 'B4', 'E5']),
  ),
  F: buildKeySet(
    'F',
    chord('Gm7(9,11)', ['A3', 'D4', 'F4', 'C5']),
    chord('Gm7', ['G3', 'D4', 'F4', 'Bb4']),
    chord('C7alt', ['C4', 'Fb4', 'Ab4', 'Eb5']),
    chord('C7alt', ['Bb3', 'Fb4', 'Ab4', 'Db5']),
    chord('FM7', ['A3', 'E4', 'G4', 'C5']),
    chord('FM7', ['E3', 'A3', 'C4', 'G4']),
    chord('F6', ['D3', 'A3', 'C4', 'F4']),
  ),
  Gb: buildKeySet(
    'Gb',
    chord('Abm7(9,11)', ['Bb3', 'Eb4', 'Gb4', 'Db5']),
    chord('Abm7', ['Ab3', 'Eb4', 'Gb4', 'Cb5']),
    chord('Db7alt', ['Db4', 'Gbb4', 'Bbb4', 'E5']),
    chord('Db7alt', ['Cb4', 'Gbb4', 'Bbb4', 'Ebb5']),
    chord('GbM7', ['Bb3', 'F4', 'Ab4', 'Db5']),
    chord('GbM7', ['F3', 'Bb3', 'Db4', 'Ab4']),
    chord('Gb6', ['Eb3', 'Bb3', 'Db4', 'Gb4']),
  ),
  G: buildKeySet(
    'G',
    chord('Am7(9,11)', ['B3', 'E4', 'G4', 'D5']),
    chord('Am7', ['A3', 'E4', 'G4', 'C5']),
    chord('D7alt', ['D4', 'Gb4', 'Bb4', 'F5']),
    chord('D7alt', ['C4', 'Gb4', 'Bb4', 'Eb5']),
    chord('GM7', ['B3', 'F#4', 'A4', 'D5']),
    chord('GM7', ['F#3', 'B3', 'D4', 'A4']),
    chord('G6', ['E3', 'B3', 'D4', 'G4']),
  ),
  Ab: buildKeySet(
    'Ab',
    chord('Bbm7(9,11)', ['C4', 'F4', 'Ab4', 'Eb5']),
    chord('Bbm7', ['Bb3', 'F4', 'Ab4', 'Db5']),
    chord('Eb7alt', ['Eb4', 'Abb4', 'Cb5', 'Gb5']),
    chord('Eb7alt', ['Db4', 'Abb4', 'Cb5', 'Fb5']),
    chord('AbM7', ['C4', 'G4', 'Bb4', 'Eb5']),
    chord('AbM7', ['G3', 'C4', 'Eb4', 'Bb4']),
    chord('Ab6', ['F3', 'C4', 'Eb4', 'Ab4']),
  ),
  A: buildKeySet(
    'A',
    chord('Bm7(9,11)', ['C#4', 'F#4', 'A4', 'E5']),
    chord('Bm7', ['B3', 'F#4', 'A4', 'D5']),
    chord('E7alt', ['E4', 'Ab4', 'C5', 'G5']),
    chord('E7alt', ['D4', 'Ab4', 'C5', 'F5']),
    chord('AM7', ['C#4', 'G#4', 'B4', 'E5']),
    chord('AM7', ['G#3', 'C#4', 'E4', 'B4']),
    chord('A6', ['F#3', 'C#4', 'E4', 'A4']),
  ),
  Bb: buildKeySet(
    'Bb',
    chord('Cm7(9,11)', ['D4', 'G4', 'Bb4', 'F5']),
    chord('Cm7', ['C4', 'G4', 'Bb4', 'Eb5']),
    chord('F7alt', ['F4', 'Bbb4', 'Db5', 'Ab5']),
    chord('F7alt', ['Eb4', 'Bbb4', 'Db5', 'Gb5']),
    chord('BbM7', ['D4', 'A4', 'C5', 'F5']),
    chord('BbM7', ['A3', 'D4', 'F4', 'C5']),
    chord('Bb6', ['G3', 'D4', 'F4', 'Bb4']),
  ),
  B: buildKeySet(
    'B',
    chord('C#m7(9,11)', ['D#4', 'G#4', 'B4', 'F#5']),
    chord('C#m7', ['C#4', 'G#4', 'B4', 'E5']),
    chord('F#7alt', ['F#4', 'Bb4', 'D5', 'A5']),
    chord('F#7alt', ['E4', 'Bb4', 'D5', 'G5']),
    chord('BM7', ['D#4', 'A#4', 'C#5', 'F#5']),
    chord('BM7', ['A#3', 'D#4', 'F#4', 'C#5']),
    chord('B6', ['G#3', 'D#4', 'F#4', 'B4']),
  ),
};

const progression = (
  progressionKey: string,
  titleJa: string,
  titleEn: string,
  keys: readonly MajorKey[],
  isSummary = false,
): IiValtIProgressionSpec => ({
  progressionKey,
  titleJa,
  titleEn,
  keys,
  isSummary,
});

const II_VALT_I_KEY_PAIRS: readonly (readonly [MajorKey, MajorKey])[] = [
  ['C', 'F'],
  ['Bb', 'Eb'],
  ['Ab', 'Db'],
  ['Gb', 'B'],
  ['E', 'A'],
  ['D', 'G'],
];

export const TWO_HAND_VOICING_BLOCK3_II_VALT_I_LESSON: TwoHandVoicingBlock3IiValtILessonSpec = {
  lessonKey: 'b3-ii-valt-i',
  orderIndex: 17,
  titleJa: 'II-Valt-I',
  titleEn: 'II-Valt-I',
  progressions: [
    ...II_VALT_I_KEY_PAIRS.map(([keyA, keyB], index) => (
      progression(
        `p${index + 1}`,
        `Key of ${keyA} & ${keyB}`,
        `Key of ${keyA} & ${keyB}`,
        [keyA, keyB],
      )
    )),
    progression('summary', '全キーまとめ', 'All keys', ALL_MAJOR_KEYS, true),
  ],
  survivalBlockKey: 'II-V-I',
};

export const getBlock3IiValtILessonKey = (
  lesson: TwoHandVoicingBlock3IiValtILessonSpec = TWO_HAND_VOICING_BLOCK3_II_VALT_I_LESSON,
): string => (
  `thvi-${lesson.lessonKey}`
);

export const getBlock3IiValtIStageKey = (
  progression: IiValtIProgressionSpec,
  mode: 'quiz' | 'survival',
): string => (
  `${getBlock3IiValtILessonKey()}-${progression.progressionKey}-${mode}`
);

export const resolveBlock3IiValtISurvivalStageNumber = (
  progressionIndex: number,
): number => (
  BLOCK3_II_VALT_I_SURVIVAL_STAGE_BASE + progressionIndex
);

export const resolveBlock3IiValtISurvivalStageNumberForProgression = (
  progression: IiValtIProgressionSpec,
): number => {
  const progressionIndex = TWO_HAND_VOICING_BLOCK3_II_VALT_I_LESSON.progressions.findIndex(
    (entry) => entry.progressionKey === progression.progressionKey,
  );
  return resolveBlock3IiValtISurvivalStageNumber(progressionIndex);
};

export const getIiValtIProgressionChords = (
  progressionSpec: IiValtIProgressionSpec,
): SurvivalProgressionChordJson[] => {
  const chords: SurvivalProgressionChordJson[] = [];
  for (const key of progressionSpec.keys) {
    const keySet = II_VALT_I_VOICINGS_BY_KEY[key];
    for (const chordSpec of keySet.chords) {
      chords.push(buildSurvivalChordJson(chordSpec.symbol, chordSpec.notes, keySet.keyFifths));
    }
  }
  return chords;
};

const CHORDS_PER_KEY = 7;
const SUMMARY_LOOP_MEASURES = 3;
const II_VALT_I_SUMMARY_CHORD_INDICES = [1, 2, 4] as const;

export const buildIiValtIQuizItems = (
  progressionSpec: IiValtIProgressionSpec,
): QuizItemSpec[] => {
  if (progressionSpec.isSummary) {
    const items: QuizItemSpec[] = [];
    let orderIndex = 0;
    for (const key of progressionSpec.keys) {
      const keySet = II_VALT_I_VOICINGS_BY_KEY[key];
      for (const chordIndex of II_VALT_I_SUMMARY_CHORD_INDICES) {
        const chordSpec = keySet.chords[chordIndex];
        items.push({
          orderIndex,
          measureNumber: (orderIndex % SUMMARY_LOOP_MEASURES) + 1,
          chordName: chordSpec.symbol,
          notes: [...chordSpec.notes],
          keyFifths: keySet.keyFifths,
        });
        orderIndex += 1;
      }
    }
    return items;
  }
  const progression = getIiValtIProgressionChords(progressionSpec);
  return progression.map((chordEntry, orderIndex) => ({
    orderIndex,
    measureNumber: orderIndex + 1,
    chordName: chordEntry.name,
    notes: [...chordEntry.voicing_names],
    keyFifths: chordEntry.key_fifths,
  }));
};

export const resolveIiValtIQuizLoopMeasures = (
  progressionSpec: IiValtIProgressionSpec,
): number => (
  progressionSpec.isSummary
    ? SUMMARY_LOOP_MEASURES
    : progressionSpec.keys.length * CHORDS_PER_KEY
);

export { TWO_HAND_VOICING_GRAND_STAFF };
