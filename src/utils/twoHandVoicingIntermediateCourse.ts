/**
 * 両手ヴォイシングコース(中級) — Drop2 II-V-I A-B-A / B-A-B 定義。
 * DB マイグレーション生成とテストで共有。
 */
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

export const TWO_HAND_VOICING_UUID_NS = 'a0000000-0000-4000-8000-000000000001';
export const TWO_HAND_VOICING_COURSE_KEY = 'course-two-hand-voicing-intermediate';
export const TWO_HAND_VOICING_BGM_URL =
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3';

export const TWO_HAND_VOICING_GRAND_STAFF: readonly [2, 1, 1, 1] = [2, 1, 1, 1];

export type TwoHandVoicingForm = 'aba' | 'bab';

export type MajorKey =
  | 'C'
  | 'F'
  | 'Bb'
  | 'Eb'
  | 'Ab'
  | 'Db'
  | 'Gb'
  | 'B'
  | 'E'
  | 'A'
  | 'D'
  | 'G';

export const ALL_MAJOR_KEYS: readonly MajorKey[] = [
  'C',
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
  'Gb',
  'B',
  'E',
  'A',
  'D',
  'G',
];

export const KEY_FIFTHS_BY_MAJOR: Record<MajorKey, number> = {
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
  F: -1,
  Bb: -2,
  Eb: -3,
  Ab: -4,
  Db: -5,
  Gb: -6,
};

export interface TwoHandVoicingChordSpec {
  readonly symbol: string;
  readonly displayName: string;
  readonly notes: readonly [string, string, string, string];
}

export interface TwoHandVoicingKeySet {
  readonly key: MajorKey;
  readonly keyFifths: number;
  readonly ii: TwoHandVoicingChordSpec;
  readonly v: TwoHandVoicingChordSpec;
  readonly i: TwoHandVoicingChordSpec;
}

export interface TwoHandVoicingLessonSpec {
  readonly lessonKey: string;
  readonly blockNumber: 1 | 2;
  readonly questIndex: number;
  readonly orderIndex: number;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly keys: readonly MajorKey[];
  readonly isSummary: boolean;
}

export interface SurvivalProgressionChordJson {
  readonly name: string;
  readonly voicing: readonly number[];
  readonly voicing_names: readonly string[];
  readonly key_fifths: number;
  readonly voicing_staves: readonly number[];
}

export interface QuizItemSpec {
  readonly orderIndex: number;
  readonly measureNumber: number;
  readonly chordName: string;
  readonly notes: readonly string[];
  readonly keyFifths: number;
}

export interface VoicingPhraseChordSpec {
  readonly orderIndex: number;
  readonly chordName: string;
  readonly measureNumber: number;
  readonly startTimeSec: number;
  readonly endTimeSec: number;
  readonly notes: readonly string[];
  readonly keyFifths: number;
}

export interface VoicingPhraseSpec {
  readonly phraseIndex: number;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly keyFifths: number;
  readonly chords: readonly VoicingPhraseChordSpec[];
}

const chord = (
  symbol: string,
  notes: readonly [string, string, string, string],
): TwoHandVoicingChordSpec => ({
  symbol,
  displayName: `${symbol}(9)`,
  notes,
});

const vChord = (
  symbol: string,
  notes: readonly [string, string, string, string],
): TwoHandVoicingChordSpec => ({
  symbol,
  displayName: `${symbol}(9.13)`,
  notes,
});

const iChord = (
  symbol: string,
  notes: readonly [string, string, string, string],
): TwoHandVoicingChordSpec => ({
  symbol,
  displayName: `${symbol}(9)`,
  notes,
});

const buildKeySet = (
  key: MajorKey,
  ii: TwoHandVoicingChordSpec,
  v: TwoHandVoicingChordSpec,
  i: TwoHandVoicingChordSpec,
): TwoHandVoicingKeySet => ({
  key,
  keyFifths: KEY_FIFTHS_BY_MAJOR[key],
  ii,
  v,
  i,
});

/** A-B-A: F メジャーを最低音域に、半音上行で全キー展開 */
export const ABA_VOICINGS_BY_KEY: Record<MajorKey, TwoHandVoicingKeySet> = {
  F: buildKeySet(
    'F',
    chord('Gm7', ['F3', 'Bb3', 'D4', 'A4']),
    vChord('C7', ['E3', 'Bb3', 'D4', 'A4']),
    iChord('FM7', ['E3', 'A3', 'C4', 'G4']),
  ),
  Gb: buildKeySet(
    'Gb',
    chord('Abm7', ['Gb3', 'Cb4', 'Eb4', 'Bb4']),
    vChord('Db7', ['F3', 'Cb4', 'Eb4', 'Bb4']),
    iChord('GbM7', ['F3', 'Bb3', 'Db4', 'Ab4']),
  ),
  G: buildKeySet(
    'G',
    chord('Am7', ['G3', 'C4', 'E4', 'B4']),
    vChord('D7', ['F#3', 'C4', 'E4', 'B4']),
    iChord('GM7', ['F#3', 'B3', 'D4', 'A4']),
  ),
  Ab: buildKeySet(
    'Ab',
    chord('Bbm7', ['Ab3', 'Db4', 'F4', 'C5']),
    vChord('Eb7', ['G3', 'Db4', 'F4', 'C5']),
    iChord('AbM7', ['G3', 'C4', 'Eb4', 'Bb4']),
  ),
  A: buildKeySet(
    'A',
    chord('Bm7', ['A3', 'D4', 'F#4', 'C#5']),
    vChord('E7', ['G#3', 'D4', 'F#4', 'C#5']),
    iChord('AM7', ['G#3', 'C#4', 'E4', 'B4']),
  ),
  Bb: buildKeySet(
    'Bb',
    chord('Cm7', ['Bb3', 'Eb4', 'G4', 'D5']),
    vChord('F7', ['A3', 'Eb4', 'G4', 'D5']),
    iChord('BbM7', ['A3', 'D4', 'F4', 'C5']),
  ),
  B: buildKeySet(
    'B',
    chord('C#m7', ['B3', 'E4', 'G#4', 'D#5']),
    vChord('F#7', ['A#3', 'E4', 'G#4', 'D#5']),
    iChord('BM7', ['A#3', 'D#4', 'F#4', 'C#5']),
  ),
  C: buildKeySet(
    'C',
    chord('Dm7', ['C4', 'F4', 'A4', 'E5']),
    vChord('G7', ['B3', 'F4', 'A4', 'E5']),
    iChord('CM7', ['B3', 'E4', 'G4', 'D5']),
  ),
  Db: buildKeySet(
    'Db',
    chord('Ebm7', ['Db4', 'Gb4', 'Bb4', 'F5']),
    vChord('Ab7', ['C4', 'Gb4', 'Bb4', 'F5']),
    iChord('DbM7', ['C4', 'F4', 'Ab4', 'Eb5']),
  ),
  D: buildKeySet(
    'D',
    chord('Em7', ['D4', 'G4', 'B4', 'F#5']),
    vChord('A7', ['C#4', 'G4', 'B4', 'F#5']),
    iChord('DM7', ['C#4', 'F#4', 'A4', 'E5']),
  ),
  Eb: buildKeySet(
    'Eb',
    chord('Fm7', ['Eb4', 'Ab4', 'C5', 'G5']),
    vChord('Bb7', ['D4', 'Ab4', 'C5', 'G5']),
    iChord('EbM7', ['D4', 'G4', 'Bb4', 'F5']),
  ),
  E: buildKeySet(
    'E',
    chord('F#m7', ['E4', 'A4', 'C#5', 'G#5']),
    vChord('B7', ['D#4', 'A4', 'C#5', 'G#5']),
    iChord('EM7', ['D#4', 'G#4', 'B4', 'F#5']),
  ),
};

/** B-A-B: A メジャーを最低音域に設定 */
export const BAB_VOICINGS_BY_KEY: Record<MajorKey, TwoHandVoicingKeySet> = {
  A: buildKeySet(
    'A',
    chord('Bm7', ['D3', 'A3', 'C#4', 'F#4']),
    vChord('E7', ['D3', 'G#3', 'C#4', 'F#4']),
    iChord('AM7', ['C#3', 'G#3', 'B3', 'E4']),
  ),
  Bb: buildKeySet(
    'Bb',
    chord('Cm7', ['Eb3', 'Bb3', 'D4', 'G4']),
    vChord('F7', ['Eb3', 'A3', 'D4', 'G4']),
    iChord('BbM7', ['D3', 'A3', 'C4', 'F4']),
  ),
  B: buildKeySet(
    'B',
    chord('C#m7', ['E3', 'B3', 'D#4', 'G#4']),
    vChord('F#7', ['E3', 'A#3', 'D#4', 'G#4']),
    iChord('BM7', ['D#3', 'A#3', 'C#4', 'F#4']),
  ),
  C: buildKeySet(
    'C',
    chord('Dm7', ['F3', 'C4', 'E4', 'A4']),
    vChord('G7', ['F3', 'B3', 'E4', 'A4']),
    iChord('CM7', ['E3', 'B3', 'D4', 'G4']),
  ),
  Db: buildKeySet(
    'Db',
    chord('Ebm7', ['Gb3', 'Db4', 'F4', 'Bb4']),
    vChord('Ab7', ['Gb3', 'C4', 'F4', 'Bb4']),
    iChord('DbM7', ['F3', 'C4', 'Eb4', 'Ab4']),
  ),
  D: buildKeySet(
    'D',
    chord('Em7', ['G3', 'D4', 'F#4', 'B4']),
    vChord('A7', ['G3', 'C#4', 'F#4', 'B4']),
    iChord('DM7', ['F#3', 'C#4', 'E4', 'A4']),
  ),
  Eb: buildKeySet(
    'Eb',
    chord('Fm7', ['Ab3', 'Eb4', 'G4', 'C5']),
    vChord('Bb7', ['Ab3', 'D4', 'G4', 'C5']),
    iChord('EbM7', ['G3', 'D4', 'F4', 'Bb4']),
  ),
  E: buildKeySet(
    'E',
    chord('F#m7', ['A3', 'E4', 'G#4', 'C#5']),
    vChord('B7', ['A3', 'D#4', 'G#4', 'C#5']),
    iChord('EM7', ['G#3', 'D#4', 'F#4', 'B4']),
  ),
  F: buildKeySet(
    'F',
    chord('Gm7', ['Bb3', 'F4', 'A4', 'D5']),
    vChord('C7', ['Bb3', 'E4', 'A4', 'D5']),
    iChord('FM7', ['A3', 'E4', 'G4', 'C5']),
  ),
  Gb: buildKeySet(
    'Gb',
    chord('Abm7', ['Cb4', 'Gb4', 'Bb4', 'Eb5']),
    vChord('Db7', ['Cb4', 'F4', 'Bb4', 'Eb5']),
    iChord('GbM7', ['Bb3', 'F4', 'Ab4', 'Db5']),
  ),
  G: buildKeySet(
    'G',
    chord('Am7', ['C4', 'G4', 'B4', 'E5']),
    vChord('D7', ['C4', 'F#4', 'B4', 'E5']),
    iChord('GM7', ['B3', 'F#4', 'A4', 'D5']),
  ),
  Ab: buildKeySet(
    'Ab',
    chord('Bbm7', ['Db4', 'Ab4', 'C5', 'F5']),
    vChord('Eb7', ['Db4', 'G4', 'C5', 'F5']),
    iChord('AbM7', ['C4', 'G4', 'Bb4', 'Eb5']),
  ),
};

export const TWO_HAND_VOICING_BLOCK_META = {
  1: {
    blockNameJa: 'II-V-I Drop2 Voicing A-B-Aフォーム',
    blockNameEn: 'II-V-I Drop2 Voicing A-B-A Form',
    form: 'aba' as const,
  },
  2: {
    blockNameJa: 'II-V-I Drop2 Voicing B-A-Bフォーム',
    blockNameEn: 'II-V-I Drop2 Voicing B-A-B Form',
    form: 'bab' as const,
  },
} as const;

const LESSON_KEY_PAIRS: readonly (readonly [MajorKey, MajorKey])[] = [
  ['C', 'F'],
  ['Bb', 'Eb'],
  ['Ab', 'Db'],
  ['Gb', 'B'],
  ['E', 'A'],
  ['D', 'G'],
];

const buildLessonSpecsForBlock = (blockNumber: 1 | 2): TwoHandVoicingLessonSpec[] => {
  const baseOrder = blockNumber === 1 ? 0 : 7;
  const lessons: TwoHandVoicingLessonSpec[] = LESSON_KEY_PAIRS.map(([keyA, keyB], index) => ({
    lessonKey: `b${blockNumber}-q${index + 1}`,
    blockNumber,
    questIndex: index + 1,
    orderIndex: baseOrder + index,
    titleJa: `Key of ${keyA} & ${keyB}`,
    titleEn: `Key of ${keyA} & ${keyB}`,
    keys: [keyA, keyB],
    isSummary: false,
  }));
  lessons.push({
    lessonKey: `b${blockNumber}-q7`,
    blockNumber,
    questIndex: 7,
    orderIndex: baseOrder + 6,
    titleJa: 'まとめ',
    titleEn: 'All keys',
    keys: ALL_MAJOR_KEYS,
    isSummary: true,
  });
  return lessons;
};

export const TWO_HAND_VOICING_LESSONS: readonly TwoHandVoicingLessonSpec[] = [
  ...buildLessonSpecsForBlock(1),
  ...buildLessonSpecsForBlock(2),
];

export const resolveVoicingTable = (form: TwoHandVoicingForm): Record<MajorKey, TwoHandVoicingKeySet> => (
  form === 'aba' ? ABA_VOICINGS_BY_KEY : BAB_VOICINGS_BY_KEY
);

export const noteNamesToMidi = (noteNames: readonly string[]): number[] => (
  noteNames.map((noteName) => parseVoicingNoteName(noteName).midi)
);

export const buildSurvivalChordJson = (
  displayName: string,
  notes: readonly string[],
  keyFifths: number,
): SurvivalProgressionChordJson => ({
  name: displayName,
  voicing: noteNamesToMidi(notes),
  voicing_names: [...notes],
  key_fifths: keyFifths,
  voicing_staves: [...TWO_HAND_VOICING_GRAND_STAFF],
});

export const getLessonProgressionChords = (
  lesson: TwoHandVoicingLessonSpec,
  form: TwoHandVoicingForm,
): SurvivalProgressionChordJson[] => {
  const table = resolveVoicingTable(form);
  if (lesson.isSummary) {
    const chords: SurvivalProgressionChordJson[] = [];
    for (const key of lesson.keys) {
      const set = table[key];
      chords.push(
        buildSurvivalChordJson(set.ii.displayName, set.ii.notes, set.keyFifths),
        buildSurvivalChordJson(set.v.displayName, set.v.notes, set.keyFifths),
        buildSurvivalChordJson(set.i.displayName, set.i.notes, set.keyFifths),
      );
    }
    return chords;
  }
  const chords: SurvivalProgressionChordJson[] = [];
  for (const key of lesson.keys) {
    const set = table[key];
    chords.push(
      buildSurvivalChordJson(set.ii.displayName, set.ii.notes, set.keyFifths),
      buildSurvivalChordJson(set.v.displayName, set.v.notes, set.keyFifths),
      buildSurvivalChordJson(set.i.displayName, set.i.notes, set.keyFifths),
    );
  }
  return chords;
};

export const buildQuizItemsForLesson = (
  lesson: TwoHandVoicingLessonSpec,
  form: TwoHandVoicingForm,
): QuizItemSpec[] => {
  const progression = getLessonProgressionChords(lesson, form);
  if (lesson.isSummary) {
    return progression.map((chordEntry, orderIndex) => ({
      orderIndex,
      measureNumber: (orderIndex % 6) + 1,
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

const SEC_PER_MEASURE_AT_100 = 2.4;

export const buildVoicingPhrasesForLesson = (
  lesson: TwoHandVoicingLessonSpec,
  form: TwoHandVoicingForm,
): VoicingPhraseSpec[] => {
  if (lesson.isSummary) {
    return [];
  }
  const table = resolveVoicingTable(form);
  const phraseKeys = lesson.keys.slice(0, 2);
  return phraseKeys.map((key, phraseIndex) => {
    const set = table[key];
    const sequence = [set.ii, set.v, set.i, set.i];
    const chords: VoicingPhraseChordSpec[] = sequence.map((chordSpec, chordIndex) => ({
      orderIndex: chordIndex,
      chordName: chordSpec.displayName,
      measureNumber: chordIndex + 1,
      startTimeSec: chordIndex * SEC_PER_MEASURE_AT_100,
      endTimeSec: (chordIndex + 1) * SEC_PER_MEASURE_AT_100,
      notes: [...chordSpec.notes],
      keyFifths: set.keyFifths,
    }));
    return {
      phraseIndex,
      titleJa: `フレーズ${phraseIndex + 1}`,
      titleEn: `Phrase ${phraseIndex + 1}`,
      keyFifths: set.keyFifths,
      chords,
    };
  });
};

export const resolveSurvivalStageNumber = (lesson: TwoHandVoicingLessonSpec): number => {
  const blockOffset = lesson.blockNumber === 1 ? 0 : 7;
  return 1201 + blockOffset + (lesson.questIndex - 1);
};

export const getLessonKey = (lesson: TwoHandVoicingLessonSpec): string => (
  `thvi-${lesson.lessonKey}`
);
