/**
 * 両手ヴォイシングコース(中級) Block 3 レッスン8 — マイナー II-Valt-I 定義。
 */
import {
  TWO_HAND_VOICING_GRAND_STAFF,
  buildSurvivalChordJson,
  type QuizItemSpec,
  type SurvivalProgressionChordJson,
} from '@/utils/twoHandVoicingIntermediateCourse';

export const BLOCK3_MINOR_II_VALT_I_SURVIVAL_STAGE_BASE = 1246;

export type MinorKey =
  | 'Cm'
  | 'C#m'
  | 'Dm'
  | 'Ebm'
  | 'Em'
  | 'Fm'
  | 'F#m'
  | 'Gm'
  | 'G#m'
  | 'Am'
  | 'Bbm'
  | 'Bm';

export const ALL_MINOR_KEYS: readonly MinorKey[] = [
  'Cm',
  'C#m',
  'Dm',
  'Ebm',
  'Em',
  'Fm',
  'F#m',
  'Gm',
  'G#m',
  'Am',
  'Bbm',
  'Bm',
];

export const KEY_FIFTHS_BY_MINOR: Record<MinorKey, number> = {
  Cm: 0,
  'C#m': 5,
  Dm: 2,
  Ebm: -3,
  Em: 4,
  Fm: -1,
  'F#m': 4,
  Gm: 1,
  'G#m': 5,
  Am: 3,
  Bbm: -2,
  Bm: 5,
};

export interface MinorIiValtIChordSpec {
  readonly symbol: string;
  readonly notes: readonly [string, string, string, string];
}

export interface MinorIiValtIKeySet {
  readonly key: MinorKey;
  readonly keyFifths: number;
  readonly chords: readonly [
    MinorIiValtIChordSpec,
    MinorIiValtIChordSpec,
    MinorIiValtIChordSpec,
    MinorIiValtIChordSpec,
    MinorIiValtIChordSpec,
    MinorIiValtIChordSpec,
    MinorIiValtIChordSpec,
  ];
}

export interface MinorIiValtIProgressionSpec {
  readonly progressionKey: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly keys: readonly MinorKey[];
  readonly isSummary: boolean;
}

export interface TwoHandVoicingBlock3MinorIiValtILessonSpec {
  readonly lessonKey: 'b3-minor-ii-valt-i';
  readonly orderIndex: 21;
  readonly titleJa: 'マイナー II-Valt-I';
  readonly titleEn: 'Minor II-Valt-I';
  readonly progressions: readonly MinorIiValtIProgressionSpec[];
  readonly survivalBlockKey: 'II-V-I';
}

const chord = (
  symbol: string,
  notes: readonly [string, string, string, string],
): MinorIiValtIChordSpec => ({ symbol, notes });

const buildKeySet = (
  key: MinorKey,
  iiExtended: MinorIiValtIChordSpec,
  ii: MinorIiValtIChordSpec,
  vAltA: MinorIiValtIChordSpec,
  vAltB: MinorIiValtIChordSpec,
  iM6Nine: MinorIiValtIChordSpec,
  iMm7: MinorIiValtIChordSpec,
  iM6: MinorIiValtIChordSpec,
): MinorIiValtIKeySet => ({
  key,
  keyFifths: KEY_FIFTHS_BY_MINOR[key],
  chords: [iiExtended, ii, vAltA, vAltB, iM6Nine, iMm7, iM6],
});

export const MINOR_II_VALT_I_VOICINGS_BY_KEY: Record<MinorKey, MinorIiValtIKeySet> = {
  Cm: buildKeySet(
    'Cm',
    chord('Dm7b5(9,11)', ['E3', 'Ab3', 'C4', 'G4']),
    chord('Dm7b5', ['D3', 'Ab3', 'C4', 'F4']),
    chord('G7alt', ['G3', 'Cb4', 'Eb4', 'Bb4']),
    chord('G7alt', ['F3', 'Cb4', 'Eb4', 'Ab4']),
    chord('Cm6(9)', ['Eb3', 'A3', 'D4', 'G4']),
    chord('CmM7', ['B3', 'Eb4', 'G4', 'D5']),
    chord('Cm6', ['A3', 'Eb4', 'G4', 'C5']),
  ),
  'C#m': buildKeySet(
    'C#m',
    chord('D#m7b5(9,11)', ['E#3', 'A3', 'C#4', 'G#4']),
    chord('D#m7b5', ['D#3', 'A3', 'C#4', 'F#4']),
    chord('G#7alt', ['G#3', 'C4', 'E4', 'B4']),
    chord('G#7alt', ['F#3', 'C4', 'E4', 'A4']),
    chord('C#m6(9)', ['E3', 'A#3', 'D#4', 'G#4']),
    chord('C#mM7', ['B#3', 'E4', 'G#4', 'D#5']),
    chord('C#m6', ['A#3', 'E4', 'G#4', 'C#5']),
  ),
  Dm: buildKeySet(
    'Dm',
    chord('Em7b5(9,11)', ['F#3', 'Bb3', 'D4', 'A4']),
    chord('Em7b5', ['E3', 'Bb3', 'D4', 'G4']),
    chord('A7alt', ['A3', 'Db4', 'F4', 'C5']),
    chord('A7alt', ['G3', 'Db4', 'F4', 'Bb4']),
    chord('Dm6(9)', ['F3', 'B3', 'E4', 'A4']),
    chord('DmM7', ['C#4', 'F4', 'A4', 'E5']),
    chord('Dm6', ['B3', 'F4', 'A4', 'D5']),
  ),
  Ebm: buildKeySet(
    'Ebm',
    chord('Fm7b5(9,11)', ['G3', 'Cb4', 'Eb4', 'Bb4']),
    chord('Fm7b5', ['F3', 'Cb4', 'Eb4', 'Ab4']),
    chord('Bb7alt', ['Bb3', 'Ebb4', 'Gb4', 'Db5']),
    chord('Bb7alt', ['Ab3', 'Ebb4', 'Gb4', 'Cb5']),
    chord('Ebm6(9)', ['Gb3', 'C4', 'F4', 'Bb4']),
    chord('EbmM7', ['D4', 'Gb4', 'Bb4', 'F5']),
    chord('Ebm6', ['C4', 'Gb4', 'Bb4', 'Eb5']),
  ),
  Em: buildKeySet(
    'Em',
    chord('F#m7b5(9,11)', ['G#3', 'C4', 'E4', 'B4']),
    chord('F#m7b5', ['F#3', 'C4', 'E4', 'A4']),
    chord('B7alt', ['B3', 'Eb4', 'G4', 'D5']),
    chord('B7alt', ['A3', 'Eb4', 'G4', 'C5']),
    chord('Em6(9)', ['G3', 'C#4', 'F#4', 'B4']),
    chord('EmM7', ['D#4', 'G4', 'B4', 'F#5']),
    chord('Em6', ['C#4', 'G4', 'B4', 'E5']),
  ),
  Fm: buildKeySet(
    'Fm',
    chord('Gm7b5(9,11)', ['A3', 'Db4', 'F4', 'C5']),
    chord('Gm7b5', ['G3', 'Db4', 'F4', 'Bb4']),
    chord('C7alt', ['C4', 'Fb4', 'Ab4', 'Eb5']),
    chord('C7alt', ['Bb3', 'Fb4', 'Ab4', 'Db5']),
    chord('Fm6(9)', ['Ab3', 'D4', 'G4', 'C5']),
    chord('FmM7', ['E3', 'Ab3', 'C4', 'G4']),
    chord('Fm6', ['D3', 'Ab3', 'C4', 'F4']),
  ),
  'F#m': buildKeySet(
    'F#m',
    chord('G#m7b5(9,11)', ['A#3', 'D4', 'F#4', 'C#5']),
    chord('G#m7b5', ['G#3', 'D4', 'F#4', 'B4']),
    chord('C#7alt', ['C#4', 'F4', 'A4', 'E5']),
    chord('C#7alt', ['B3', 'F4', 'A4', 'D5']),
    chord('F#m6(9)', ['A3', 'D#4', 'G#4', 'C#5']),
    chord('F#mM7', ['E#3', 'A3', 'C#4', 'G#4']),
    chord('F#m6', ['D#3', 'A3', 'C#4', 'F#4']),
  ),
  Gm: buildKeySet(
    'Gm',
    chord('Am7b5(9,11)', ['B3', 'Eb4', 'G4', 'D5']),
    chord('Am7b5', ['A3', 'Eb4', 'G4', 'C5']),
    chord('D7alt', ['D4', 'Gb4', 'Bb4', 'F5']),
    chord('D7alt', ['C4', 'Gb4', 'Bb4', 'Eb5']),
    chord('Gm6(9)', ['Bb3', 'E4', 'A4', 'D5']),
    chord('GmM7', ['F#3', 'Bb3', 'D4', 'A4']),
    chord('Gm6', ['E3', 'Bb3', 'D4', 'G4']),
  ),
  'G#m': buildKeySet(
    'G#m',
    chord('A#m7b5(9,11)', ['B#3', 'E4', 'G#4', 'D#5']),
    chord('A#m7b5', ['A#3', 'E4', 'G#4', 'C#5']),
    chord('D#7alt', ['D#4', 'G4', 'B4', 'F#5']),
    chord('D#7alt', ['C#4', 'G4', 'B4', 'E5']),
    chord('G#m6(9)', ['B3', 'E#4', 'A#4', 'D#5']),
    chord('G#mM7', ['F##3', 'B3', 'D#4', 'A#4']),
    chord('G#m6', ['E#3', 'B3', 'D#4', 'G#4']),
  ),
  Am: buildKeySet(
    'Am',
    chord('Bm7b5(9,11)', ['C#4', 'F4', 'A4', 'E5']),
    chord('Bm7b5', ['B3', 'F4', 'A4', 'D5']),
    chord('E7alt', ['E4', 'Ab4', 'C5', 'G5']),
    chord('E7alt', ['D4', 'Ab4', 'C5', 'F5']),
    chord('Am6(9)', ['C4', 'F#4', 'B4', 'E5']),
    chord('AmM7', ['G#3', 'C4', 'E4', 'B4']),
    chord('Am6', ['F#3', 'C4', 'E4', 'A4']),
  ),
  Bbm: buildKeySet(
    'Bbm',
    chord('Cm7b5(9,11)', ['D4', 'Gb4', 'Bb4', 'F5']),
    chord('Cm7b5', ['C4', 'Gb4', 'Bb4', 'Eb5']),
    chord('F7alt', ['F4', 'Bbb4', 'Db5', 'Ab5']),
    chord('F7alt', ['Eb4', 'Bbb4', 'Db5', 'Gb5']),
    chord('Bbm6(9)', ['Db4', 'G4', 'C5', 'F5']),
    chord('BbmM7', ['A3', 'Db4', 'F4', 'C5']),
    chord('Bbm6', ['G3', 'Db4', 'F4', 'Bb4']),
  ),
  Bm: buildKeySet(
    'Bm',
    chord('C#m7b5(9,11)', ['D#4', 'G4', 'B4', 'F#5']),
    chord('C#m7b5', ['C#4', 'G4', 'B4', 'E5']),
    chord('F#7alt', ['F#4', 'Bb4', 'D5', 'A5']),
    chord('F#7alt', ['E4', 'Bb4', 'D5', 'G5']),
    chord('Bm6(9)', ['D4', 'G#4', 'C#5', 'F#5']),
    chord('BmM7', ['A#3', 'D4', 'F#4', 'C#5']),
    chord('Bm6', ['G#3', 'D4', 'F#4', 'B4']),
  ),
};

const progression = (
  progressionKey: string,
  titleJa: string,
  titleEn: string,
  keys: readonly MinorKey[],
  isSummary = false,
): MinorIiValtIProgressionSpec => ({
  progressionKey,
  titleJa,
  titleEn,
  keys,
  isSummary,
});

const MINOR_II_VALT_I_KEY_PAIRS: readonly (readonly [MinorKey, MinorKey])[] = [
  ['Cm', 'Fm'],
  ['Bbm', 'Ebm'],
  ['G#m', 'C#m'],
  ['F#m', 'Bm'],
  ['Em', 'Am'],
  ['Dm', 'Gm'],
];

export const TWO_HAND_VOICING_BLOCK3_MINOR_II_VALT_I_LESSON: TwoHandVoicingBlock3MinorIiValtILessonSpec = {
  lessonKey: 'b3-minor-ii-valt-i',
  orderIndex: 21,
  titleJa: 'マイナー II-Valt-I',
  titleEn: 'Minor II-Valt-I',
  progressions: [
    ...MINOR_II_VALT_I_KEY_PAIRS.map(([keyA, keyB], index) => (
      progression(
        `p${index + 1}`,
        `Key of ${keyA} & ${keyB}`,
        `Key of ${keyA} & ${keyB}`,
        [keyA, keyB],
      )
    )),
    progression('summary', '全キーまとめ', 'All keys', ALL_MINOR_KEYS, true),
  ],
  survivalBlockKey: 'II-V-I',
};

export const getBlock3MinorIiValtILessonKey = (
  lesson: TwoHandVoicingBlock3MinorIiValtILessonSpec = TWO_HAND_VOICING_BLOCK3_MINOR_II_VALT_I_LESSON,
): string => (
  `thvi-${lesson.lessonKey}`
);

export const getBlock3MinorIiValtIStageKey = (
  progression: MinorIiValtIProgressionSpec,
  mode: 'quiz' | 'survival',
): string => (
  `${getBlock3MinorIiValtILessonKey()}-${progression.progressionKey}-${mode}`
);

export const resolveBlock3MinorIiValtISurvivalStageNumber = (
  progressionIndex: number,
): number => (
  BLOCK3_MINOR_II_VALT_I_SURVIVAL_STAGE_BASE + progressionIndex
);

export const resolveBlock3MinorIiValtISurvivalStageNumberForProgression = (
  progression: MinorIiValtIProgressionSpec,
): number => {
  const progressionIndex = TWO_HAND_VOICING_BLOCK3_MINOR_II_VALT_I_LESSON.progressions.findIndex(
    (entry) => entry.progressionKey === progression.progressionKey,
  );
  return resolveBlock3MinorIiValtISurvivalStageNumber(progressionIndex);
};

const CHORDS_PER_KEY = 7;

export const getMinorIiValtIProgressionChords = (
  progressionSpec: MinorIiValtIProgressionSpec,
): SurvivalProgressionChordJson[] => {
  const chords: SurvivalProgressionChordJson[] = [];
  for (const key of progressionSpec.keys) {
    const keySet = MINOR_II_VALT_I_VOICINGS_BY_KEY[key];
    for (const chordSpec of keySet.chords) {
      chords.push(buildSurvivalChordJson(chordSpec.symbol, chordSpec.notes, keySet.keyFifths));
    }
  }
  return chords;
};

export const buildMinorIiValtIQuizItems = (
  progressionSpec: MinorIiValtIProgressionSpec,
): QuizItemSpec[] => {
  const progression = getMinorIiValtIProgressionChords(progressionSpec);
  if (progressionSpec.isSummary) {
    return progression.map((chordEntry, orderIndex) => ({
      orderIndex,
      measureNumber: (orderIndex % CHORDS_PER_KEY) + 1,
      chordName: chordEntry.name,
      notes: [...chordEntry.voicing_names],
      keyFifths: chordEntry.key_fifths,
    }));
  }
  return progression.map((chordEntry, orderIndex) => ({
    orderIndex,
    measureNumber: orderIndex + 1,
    chordName: chordEntry.name,
    notes: [...chordEntry.voicing_names],
    keyFifths: chordEntry.key_fifths,
  }));
};

export const resolveMinorIiValtIQuizLoopMeasures = (
  progressionSpec: MinorIiValtIProgressionSpec,
): number => (
  progressionSpec.isSummary
    ? CHORDS_PER_KEY
    : progressionSpec.keys.length * CHORDS_PER_KEY
);

export { TWO_HAND_VOICING_GRAND_STAFF };
