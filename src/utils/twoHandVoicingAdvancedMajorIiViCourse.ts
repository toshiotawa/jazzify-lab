/**
 * 両手ヴォイシングコース(上級) レッスン4 — メジャー II-V-I（251）。
 */
import {
  ALL_MAJOR_KEYS,
  KEY_FIFTHS_BY_MAJOR,
  type MajorKey,
  type QuizItemSpec,
  type SurvivalProgressionChordJson,
} from '@/utils/twoHandVoicingIntermediateCourse';
import {
  ADVANCED_SURVIVAL_STAGE_BASE,
  buildAdvancedSurvivalChordJson,
  SO_WHAT_MAJOR_M7_VOICINGS,
  SO_WHAT_M7_VOICINGS,
  UST_BVI_7ALT_VOICINGS,
  type AdvancedVoicingEntry,
} from '@/utils/twoHandVoicingAdvancedCourse';

export const ADVANCED_MAJOR_II_VI_SURVIVAL_STAGE_BASE = ADVANCED_SURVIVAL_STAGE_BASE + 12;

export interface MajorIiViChordSpec {
  readonly symbol: string;
  readonly notes: readonly [string, string, string, string, string];
}

export interface MajorIiViKeySet {
  readonly key: MajorKey;
  readonly keyFifths: number;
  readonly chords: readonly [MajorIiViChordSpec, MajorIiViChordSpec, MajorIiViChordSpec];
}

export interface MajorIiViProgressionSpec {
  readonly progressionKey: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly keys: readonly MajorKey[];
  readonly isSummary: boolean;
}

export interface TwoHandVoicingAdvancedMajorIiViLessonSpec {
  readonly lessonKey: 'b1-major-ii-v-i';
  readonly orderIndex: 3;
  readonly titleJa: 'メジャー II-V-I';
  readonly titleEn: 'Major II-V-I';
  readonly progressions: readonly MajorIiViProgressionSpec[];
  readonly survivalBlockKey: 'II-V-I';
}

const chord = (
  symbol: string,
  notes: readonly [string, string, string, string, string],
): MajorIiViChordSpec => ({ symbol, notes });

const iiSymbolForKey = (key: MajorKey): string => {
  const symbols: Record<MajorKey, string> = {
    C: 'Dm7',
    Db: 'Ebm7',
    D: 'Em7',
    Eb: 'Fm7',
    E: 'F#m7',
    F: 'Gm7',
    Gb: 'Abm7',
    G: 'Am7',
    Ab: 'Bbm7',
    A: 'Bm7',
    Bb: 'Cm7',
    B: 'C#m7',
  };
  return symbols[key];
};

const vSymbolForKey = (key: MajorKey): string => {
  const symbols: Record<MajorKey, string> = {
    C: 'G7alt',
    Db: 'Ab7alt',
    D: 'A7alt',
    Eb: 'Bb7alt',
    E: 'B7alt',
    F: 'C7alt',
    Gb: 'Db7alt',
    G: 'D7alt',
    Ab: 'Eb7alt',
    A: 'E7alt',
    Bb: 'F7alt',
    B: 'F#7alt',
  };
  return symbols[key];
};

const iSymbolForKey = (key: MajorKey): string => `${key}M7`;

const notesFromEntry = (
  entry: AdvancedVoicingEntry,
): readonly [string, string, string, string, string] => entry.notes;

/** 251 用: 単体表 lookup。Ab 等は音域調整のため上書きあり。 */
const buildKeySetFromLookup = (key: MajorKey): MajorIiViKeySet => {
  const iiSymbol = iiSymbolForKey(key);
  const vSymbol = vSymbolForKey(key);
  const iSymbol = iSymbolForKey(key);
  const iiEntry = SO_WHAT_M7_VOICINGS[iiSymbol];
  const vEntry = UST_BVI_7ALT_VOICINGS[vSymbol];
  const iEntry = SO_WHAT_MAJOR_M7_VOICINGS[iSymbol];
  if (!iiEntry || !vEntry || !iEntry) {
    throw new Error(`Missing voicing lookup for key ${key}`);
  }
  return {
    key,
    keyFifths: KEY_FIFTHS_BY_MAJOR[key],
    chords: [
      chord(iiEntry.symbol, notesFromEntry(iiEntry)),
      chord(vEntry.symbol, notesFromEntry(vEntry)),
      chord(iEntry.symbol, notesFromEntry(iEntry)),
    ],
  };
};

/** ユーザー指定の 251 音域（Ab 最低域など単体表と異なるキー） */
const MAJOR_II_VI_REGISTER_OVERRIDES: Partial<Record<MajorKey, MajorIiViKeySet>> = {
  Ab: {
    key: 'Ab',
    keyFifths: KEY_FIFTHS_BY_MAJOR.Ab,
    chords: [
      chord('Bbm7', ['Bb2', 'Eb3', 'Ab3', 'Db4', 'F4']),
      chord('Eb7alt', ['Db3', 'Abb3', 'Cb4', 'Eb4', 'Gb4']),
      chord('AbM7', ['C3', 'F3', 'Bb3', 'E4', 'G4']),
    ],
  },
  A: {
    key: 'A',
    keyFifths: KEY_FIFTHS_BY_MAJOR.A,
    chords: [
      chord('Bm7', ['B2', 'E3', 'A3', 'D4', 'F#4']),
      chord('E7alt', ['D3', 'Ab3', 'C4', 'E4', 'G4']),
      chord('AM7', ['C#3', 'F#3', 'B3', 'E#4', 'G#4']),
    ],
  },
  Bb: {
    key: 'Bb',
    keyFifths: KEY_FIFTHS_BY_MAJOR.Bb,
    chords: [
      chord('Cm7', ['C3', 'F3', 'Bb3', 'Eb4', 'G4']),
      chord('F7alt', ['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']),
      chord('BbM7', ['D3', 'G3', 'C4', 'F#4', 'A4']),
    ],
  },
  B: {
    key: 'B',
    keyFifths: KEY_FIFTHS_BY_MAJOR.B,
    chords: [
      chord('C#m7', ['C#3', 'F#3', 'B3', 'E4', 'G#4']),
      chord('F#7alt', ['E3', 'Bb3', 'D4', 'F#4', 'A4']),
      chord('BM7', ['D#3', 'G#3', 'C#4', 'F##4', 'A#4']),
    ],
  },
  Db: {
    key: 'Db',
    keyFifths: KEY_FIFTHS_BY_MAJOR.Db,
    chords: [
      chord('Ebm7', ['Eb3', 'Ab3', 'Db4', 'Gb4', 'Bb4']),
      chord('Ab7alt', ['Gb3', 'Dbb4', 'Fb4', 'Ab4', 'Cb5']),
      chord('DbM7', ['F3', 'Bb3', 'Eb4', 'A4', 'C5']),
    ],
  },
  Eb: {
    key: 'Eb',
    keyFifths: KEY_FIFTHS_BY_MAJOR.Eb,
    chords: [
      chord('Fm7', ['F3', 'Bb3', 'Eb4', 'Ab4', 'C5']),
      chord('Bb7alt', ['Ab3', 'Ebb4', 'Gb4', 'Bb4', 'Db5']),
      chord('EbM7', ['G3', 'C4', 'F4', 'B4', 'D5']),
    ],
  },
  F: {
    key: 'F',
    keyFifths: KEY_FIFTHS_BY_MAJOR.F,
    chords: [
      chord('Gm7', ['G3', 'C4', 'F4', 'Bb4', 'D5']),
      chord('C7alt', ['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']),
      chord('FM7', ['A3', 'D4', 'G4', 'C#5', 'E5']),
    ],
  },
  Gb: {
    key: 'Gb',
    keyFifths: KEY_FIFTHS_BY_MAJOR.Gb,
    chords: [
      chord('Abm7', ['Ab3', 'Db4', 'Gb4', 'Cb5', 'Eb5']),
      chord('Db7alt', ['Cb4', 'Gbb4', 'Bbb4', 'Db5', 'Fb5']),
      chord('GbM7', ['Bb3', 'Eb4', 'Ab4', 'D5', 'F5']),
    ],
  },
};

export const MAJOR_II_VI_VOICINGS_BY_KEY: Record<MajorKey, MajorIiViKeySet> = (
  ALL_MAJOR_KEYS.reduce<Record<MajorKey, MajorIiViKeySet>>((acc, key) => {
    const override = MAJOR_II_VI_REGISTER_OVERRIDES[key];
    acc[key] = override ?? buildKeySetFromLookup(key);
    return acc;
  }, {} as Record<MajorKey, MajorIiViKeySet>)
);

const progression = (
  progressionKey: string,
  titleJa: string,
  titleEn: string,
  keys: readonly MajorKey[],
  isSummary = false,
): MajorIiViProgressionSpec => ({
  progressionKey,
  titleJa,
  titleEn,
  keys,
  isSummary,
});

const MAJOR_II_VI_KEY_PAIRS: readonly (readonly [MajorKey, MajorKey])[] = [
  ['C', 'F'],
  ['Bb', 'Eb'],
  ['Ab', 'Db'],
  ['Gb', 'B'],
  ['E', 'A'],
  ['D', 'G'],
];

export const TWO_HAND_VOICING_ADVANCED_MAJOR_II_VI_LESSON: TwoHandVoicingAdvancedMajorIiViLessonSpec = {
  lessonKey: 'b1-major-ii-v-i',
  orderIndex: 3,
  titleJa: 'メジャー II-V-I',
  titleEn: 'Major II-V-I',
  progressions: [
    ...MAJOR_II_VI_KEY_PAIRS.map(([keyA, keyB], index) => (
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

export const getAdvancedMajorIiViLessonKey = (
  lesson: TwoHandVoicingAdvancedMajorIiViLessonSpec = TWO_HAND_VOICING_ADVANCED_MAJOR_II_VI_LESSON,
): string => (
  `thva-${lesson.lessonKey}`
);

export const getAdvancedMajorIiViStageKey = (
  progression: MajorIiViProgressionSpec,
  mode: 'quiz' | 'survival',
): string => (
  `${getAdvancedMajorIiViLessonKey()}-${progression.progressionKey}-${mode}`
);

export const resolveAdvancedMajorIiViSurvivalStageNumber = (
  progressionIndex: number,
): number => (
  ADVANCED_MAJOR_II_VI_SURVIVAL_STAGE_BASE + progressionIndex
);

export const resolveAdvancedMajorIiViSurvivalStageNumberForProgression = (
  progression: MajorIiViProgressionSpec,
): number => {
  const progressionIndex = TWO_HAND_VOICING_ADVANCED_MAJOR_II_VI_LESSON.progressions.findIndex(
    (entry) => entry.progressionKey === progression.progressionKey,
  );
  return resolveAdvancedMajorIiViSurvivalStageNumber(progressionIndex);
};

const CHORDS_PER_KEY = 3;

export const getMajorIiViProgressionChords = (
  progressionSpec: MajorIiViProgressionSpec,
): SurvivalProgressionChordJson[] => {
  const chords: SurvivalProgressionChordJson[] = [];
  for (const key of progressionSpec.keys) {
    const keySet = MAJOR_II_VI_VOICINGS_BY_KEY[key];
    for (const chordSpec of keySet.chords) {
      chords.push(buildAdvancedSurvivalChordJson(
        chordSpec.symbol,
        chordSpec.notes,
        keySet.keyFifths,
      ));
    }
  }
  return chords;
};

export const buildMajorIiViQuizItems = (
  progressionSpec: MajorIiViProgressionSpec,
): QuizItemSpec[] => {
  const progressionChords = getMajorIiViProgressionChords(progressionSpec);
  if (progressionSpec.isSummary) {
    return progressionChords.map((chordEntry, orderIndex) => ({
      orderIndex,
      measureNumber: (orderIndex % CHORDS_PER_KEY) + 1,
      chordName: chordEntry.name,
      notes: [...chordEntry.voicing_names],
      keyFifths: chordEntry.key_fifths,
    }));
  }
  return progressionChords.map((chordEntry, orderIndex) => ({
    orderIndex,
    measureNumber: orderIndex + 1,
    chordName: chordEntry.name,
    notes: [...chordEntry.voicing_names],
    keyFifths: chordEntry.key_fifths,
  }));
};

export const resolveMajorIiViQuizLoopMeasures = (
  progressionSpec: MajorIiViProgressionSpec,
): number => (
  progressionSpec.isSummary
    ? CHORDS_PER_KEY
    : progressionSpec.keys.length * CHORDS_PER_KEY
);
