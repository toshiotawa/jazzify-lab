/**
 * 両手ヴォイシングコース(上級) レッスン8 — マイナー II-V-I（251）。
 */
import {
  type QuizItemSpec,
  type SurvivalProgressionChordJson,
} from '@/utils/twoHandVoicingIntermediateCourse';
import {
  ADVANCED_EXT_SURVIVAL_STAGE_BASE,
  buildAdvancedSurvivalChordJson,
  MM7_913_VOICINGS,
  M7B5_911_VOICINGS,
  UST_BVI_7ALT_VOICINGS,
  type AdvancedVoicingEntry,
} from '@/utils/twoHandVoicingAdvancedCourse';
import {
  ALL_MINOR_KEYS,
  KEY_FIFTHS_BY_MINOR,
  type MinorKey,
} from '@/utils/twoHandVoicingKeyFifths';

export const ADVANCED_MINOR_II_VI_SURVIVAL_STAGE_BASE = ADVANCED_EXT_SURVIVAL_STAGE_BASE + 12;

export type { MinorKey };
export { ALL_MINOR_KEYS, KEY_FIFTHS_BY_MINOR };

export interface MinorIiViChordSpec {
  readonly symbol: string;
  readonly notes: readonly [string, string, string, string, string];
}

export interface MinorIiViKeySet {
  readonly key: MinorKey;
  readonly keyFifths: number;
  readonly chords: readonly [MinorIiViChordSpec, MinorIiViChordSpec, MinorIiViChordSpec];
}

export interface MinorIiViProgressionSpec {
  readonly progressionKey: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly keys: readonly MinorKey[];
  readonly isSummary: boolean;
}

export interface TwoHandVoicingAdvancedMinorIiViLessonSpec {
  readonly lessonKey: 'b1-minor-ii-v-i';
  readonly orderIndex: 7;
  readonly titleJa: 'マイナー II-V-I';
  readonly titleEn: 'Minor II-V-I';
  readonly progressions: readonly MinorIiViProgressionSpec[];
  readonly survivalBlockKey: 'II-V-i';
}

const chord = (
  symbol: string,
  notes: readonly [string, string, string, string, string],
): MinorIiViChordSpec => ({ symbol, notes });

const iiSymbolForKey = (key: MinorKey): string => {
  const symbols: Record<MinorKey, string> = {
    Am: 'Bm7b5',
    Bbm: 'Cm7b5',
    Bm: 'C#m7b5',
    Cm: 'Dm7b5',
    'C#m': 'D#m7b5',
    Dm: 'Em7b5',
    Ebm: 'Fm7b5',
    Em: 'F#m7b5',
    Fm: 'Gm7b5',
    'F#m': 'G#m7b5',
    Gm: 'Am7b5',
    'G#m': 'A#m7b5',
  };
  return symbols[key];
};

const vSymbolForKey = (key: MinorKey): string => {
  const symbols: Record<MinorKey, string> = {
    Am: 'E7alt',
    Bbm: 'F7alt',
    Bm: 'F#7alt',
    Cm: 'G7alt',
    'C#m': 'G#7alt',
    Dm: 'A7alt',
    Ebm: 'Bb7alt',
    Em: 'B7alt',
    Fm: 'C7alt',
    'F#m': 'C#7alt',
    Gm: 'D7alt',
    'G#m': 'D#7alt',
  };
  return symbols[key];
};

const iSymbolForKey = (key: MinorKey): string => `${key.slice(0, -1)}mM7`;

const notesFromEntry = (
  entry: AdvancedVoicingEntry,
): readonly [string, string, string, string, string] => entry.notes;

const buildKeySetFromLookup = (key: MinorKey): MinorIiViKeySet => {
  const iiSymbol = iiSymbolForKey(key);
  const vSymbol = vSymbolForKey(key);
  const iSymbol = iSymbolForKey(key);
  const iiEntry = M7B5_911_VOICINGS[iiSymbol];
  const vEntry = UST_BVI_7ALT_VOICINGS[vSymbol];
  const iEntry = MM7_913_VOICINGS[iSymbol];
  if (!iiEntry || !vEntry || !iEntry) {
    throw new Error(`Missing voicing lookup for key ${key}`);
  }
  return {
    key,
    keyFifths: KEY_FIFTHS_BY_MINOR[key],
    chords: [
      chord(iiEntry.symbol, notesFromEntry(iiEntry)),
      chord(vEntry.symbol, notesFromEntry(vEntry)),
      chord(iEntry.symbol, notesFromEntry(iEntry)),
    ],
  };
};

/** ユーザー指定のマイナー 251 音域（Am 最低域など単体表と異なるキー） */
const MINOR_II_VI_REGISTER_OVERRIDES: Partial<Record<MinorKey, MinorIiViKeySet>> = {
  Am: {
    key: 'Am',
    keyFifths: KEY_FIFTHS_BY_MINOR.Am,
    chords: [
      chord('Bm7b5', ['B2', 'F3', 'A3', 'C#4', 'E4']),
      chord('E7alt', ['D3', 'Ab3', 'C4', 'E4', 'G4']),
      chord('AmM7', ['F#3', 'C4', 'E4', 'G#4', 'B4']),
    ],
  },
  Bbm: {
    key: 'Bbm',
    keyFifths: KEY_FIFTHS_BY_MINOR.Bbm,
    chords: [
      chord('Cm7b5', ['C3', 'Gb3', 'Bb3', 'D4', 'F4']),
      chord('F7alt', ['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']),
      chord('BbmM7', ['G3', 'Db4', 'F4', 'A4', 'C5']),
    ],
  },
  Bm: {
    key: 'Bm',
    keyFifths: KEY_FIFTHS_BY_MINOR.Bm,
    chords: [
      chord('C#m7b5', ['C#3', 'G3', 'B3', 'D#4', 'F#4']),
      chord('F#7alt', ['E3', 'Bb3', 'D4', 'F#4', 'A4']),
      chord('BmM7', ['G#3', 'D4', 'F#4', 'A#4', 'C#5']),
    ],
  },
  Cm: {
    key: 'Cm',
    keyFifths: KEY_FIFTHS_BY_MINOR.Cm,
    chords: [
      chord('Dm7b5', ['D3', 'Ab3', 'C4', 'E4', 'G4']),
      chord('G7alt', ['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']),
      chord('CmM7', ['A3', 'Eb4', 'G4', 'B4', 'D5']),
    ],
  },
  'C#m': {
    key: 'C#m',
    keyFifths: KEY_FIFTHS_BY_MINOR['C#m'],
    chords: [
      chord('D#m7b5', ['D#3', 'A3', 'C#4', 'E#4', 'G#4']),
      chord('G#7alt', ['F#3', 'C4', 'E4', 'G#4', 'B4']),
      chord('C#mM7', ['A#3', 'E4', 'G#4', 'B#4', 'D#5']),
    ],
  },
  Dm: {
    key: 'Dm',
    keyFifths: KEY_FIFTHS_BY_MINOR.Dm,
    chords: [
      chord('Em7b5', ['E3', 'Bb3', 'D4', 'F#4', 'A4']),
      chord('A7alt', ['G3', 'Db4', 'F4', 'A4', 'C5']),
      chord('DmM7', ['B3', 'F4', 'A4', 'C#5', 'E5']),
    ],
  },
  Ebm: {
    key: 'Ebm',
    keyFifths: KEY_FIFTHS_BY_MINOR.Ebm,
    chords: [
      chord('Fm7b5', ['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']),
      chord('Bb7alt', ['Ab3', 'Ebb4', 'Gb4', 'Bb4', 'Db5']),
      chord('EbmM7', ['C4', 'Gb4', 'Bb4', 'D5', 'F5']),
    ],
  },
  Em: {
    key: 'Em',
    keyFifths: KEY_FIFTHS_BY_MINOR.Em,
    chords: [
      chord('F#m7b5', ['F#3', 'C4', 'E4', 'G#4', 'B4']),
      chord('B7alt', ['A3', 'Eb4', 'G4', 'B4', 'D5']),
      chord('EmM7', ['C#4', 'G4', 'B4', 'D#5', 'F#5']),
    ],
  },
  Fm: {
    key: 'Fm',
    keyFifths: KEY_FIFTHS_BY_MINOR.Fm,
    chords: [
      chord('Gm7b5', ['G3', 'Db4', 'F4', 'A4', 'C5']),
      chord('C7alt', ['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']),
      chord('FmM7', ['D4', 'Ab4', 'C5', 'E5', 'G5']),
    ],
  },
  'F#m': {
    key: 'F#m',
    keyFifths: KEY_FIFTHS_BY_MINOR['F#m'],
    chords: [
      chord('G#m7b5', ['G#3', 'D4', 'F#4', 'A#4', 'C#5']),
      chord('C#7alt', ['B3', 'F4', 'A4', 'C#5', 'E5']),
      chord('F#mM7', ['D#4', 'A4', 'C#5', 'E#5', 'G#5']),
    ],
  },
  Gm: {
    key: 'Gm',
    keyFifths: KEY_FIFTHS_BY_MINOR.Gm,
    chords: [
      chord('Am7b5', ['A3', 'Eb4', 'G4', 'B4', 'D5']),
      chord('D7alt', ['C4', 'Gb4', 'Bb4', 'D5', 'F5']),
      chord('GmM7', ['E4', 'Bb4', 'D5', 'F#5', 'A5']),
    ],
  },
  'G#m': {
    key: 'G#m',
    keyFifths: KEY_FIFTHS_BY_MINOR['G#m'],
    chords: [
      chord('A#m7b5', ['A#3', 'E4', 'G#4', 'B#4', 'D#5']),
      chord('D#7alt', ['C#4', 'G4', 'B4', 'D#5', 'F#5']),
      chord('G#mM7', ['E#4', 'B4', 'D#5', 'F##5', 'A#5']),
    ],
  },
};

export const MINOR_II_VI_VOICINGS_BY_KEY: Record<MinorKey, MinorIiViKeySet> = (
  ALL_MINOR_KEYS.reduce<Record<MinorKey, MinorIiViKeySet>>((acc, key) => {
    const override = MINOR_II_VI_REGISTER_OVERRIDES[key];
    acc[key] = override ?? buildKeySetFromLookup(key);
    return acc;
  }, {} as Record<MinorKey, MinorIiViKeySet>)
);

const progression = (
  progressionKey: string,
  titleJa: string,
  titleEn: string,
  keys: readonly MinorKey[],
  isSummary = false,
): MinorIiViProgressionSpec => ({
  progressionKey,
  titleJa,
  titleEn,
  keys,
  isSummary,
});

const MINOR_II_VI_KEY_PAIRS: readonly (readonly [MinorKey, MinorKey])[] = [
  ['Cm', 'Fm'],
  ['Bbm', 'Ebm'],
  ['G#m', 'C#m'],
  ['F#m', 'Bm'],
  ['Em', 'Am'],
  ['Dm', 'Gm'],
];

export const TWO_HAND_VOICING_ADVANCED_MINOR_II_VI_LESSON: TwoHandVoicingAdvancedMinorIiViLessonSpec = {
  lessonKey: 'b1-minor-ii-v-i',
  orderIndex: 7,
  titleJa: 'マイナー II-V-I',
  titleEn: 'Minor II-V-I',
  progressions: [
    ...MINOR_II_VI_KEY_PAIRS.map(([keyA, keyB], index) => (
      progression(
        `p${index + 1}`,
        `Key of ${keyA} & ${keyB}`,
        `Key of ${keyA} & ${keyB}`,
        [keyA, keyB],
      )
    )),
    progression('summary', '全キーまとめ', 'All keys', ALL_MINOR_KEYS, true),
  ],
  survivalBlockKey: 'II-V-i',
};

export const getAdvancedMinorIiViLessonKey = (
  lesson: TwoHandVoicingAdvancedMinorIiViLessonSpec = TWO_HAND_VOICING_ADVANCED_MINOR_II_VI_LESSON,
): string => (
  `thva-${lesson.lessonKey}`
);

export const getAdvancedMinorIiViStageKey = (
  progression: MinorIiViProgressionSpec,
  mode: 'quiz' | 'survival',
): string => (
  `${getAdvancedMinorIiViLessonKey()}-${progression.progressionKey}-${mode}`
);

export const resolveAdvancedMinorIiViSurvivalStageNumber = (
  progressionIndex: number,
): number => (
  ADVANCED_MINOR_II_VI_SURVIVAL_STAGE_BASE + progressionIndex
);

export const resolveAdvancedMinorIiViSurvivalStageNumberForProgression = (
  progression: MinorIiViProgressionSpec,
): number => {
  const progressionIndex = TWO_HAND_VOICING_ADVANCED_MINOR_II_VI_LESSON.progressions.findIndex(
    (entry) => entry.progressionKey === progression.progressionKey,
  );
  return resolveAdvancedMinorIiViSurvivalStageNumber(progressionIndex);
};

const CHORDS_PER_KEY = 3;

export const getMinorIiViProgressionChords = (
  progressionSpec: MinorIiViProgressionSpec,
): SurvivalProgressionChordJson[] => {
  const chords: SurvivalProgressionChordJson[] = [];
  for (const key of progressionSpec.keys) {
    const keySet = MINOR_II_VI_VOICINGS_BY_KEY[key];
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

export const buildMinorIiViQuizItems = (
  progressionSpec: MinorIiViProgressionSpec,
): QuizItemSpec[] => {
  const progressionChords = getMinorIiViProgressionChords(progressionSpec);
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

export const resolveMinorIiViQuizLoopMeasures = (
  progressionSpec: MinorIiViProgressionSpec,
): number => (
  progressionSpec.isSummary
    ? CHORDS_PER_KEY
    : progressionSpec.keys.length * CHORDS_PER_KEY
);
