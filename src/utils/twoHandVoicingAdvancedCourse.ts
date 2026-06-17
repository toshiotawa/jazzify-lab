/**
 * 両手ヴォイシングコース(上級) — So What / UST 5 音ヴォイシング。
 */
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';
import {
  noteNamesToMidi,
  type QuizItemSpec,
  type SurvivalProgressionChordJson,
  type VoicingPhraseChordSpec,
  type VoicingPhraseSpec,
} from '@/utils/twoHandVoicingIntermediateCourse';

export const TWO_HAND_VOICING_ADVANCED_UUID_NS = 'a0000000-0000-4000-8000-000000000002';
export const TWO_HAND_VOICING_ADVANCED_COURSE_KEY = 'course-two-hand-voicing-advanced';
export const TWO_HAND_VOICING_ADVANCED_BGM_URL =
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3';

export const ADVANCED_SURVIVAL_STAGE_BASE = 1253;
export const ADVANCED_EXT_SURVIVAL_STAGE_BASE = 1272;
export const ADVANCED_TREBLE_STAFF_THRESHOLD_MIDI = 60;

export const TWO_HAND_VOICING_ADVANCED_BLOCK_META = {
  blockNumber: 1 as const,
  blockNameJa: 'So What / UST ヴォイシング',
  blockNameEn: 'So What / UST Voicings',
};

export type AdvancedChordCategory = 'm7' | 'M7' | '7alt' | 'mM7' | 'm7b5' | '7(#11)';

export interface AdvancedVoicingEntry {
  readonly symbol: string;
  readonly keyFifths: number;
  readonly notes: readonly [string, string, string, string, string];
}

export interface AdvancedProgressionSpec {
  readonly progressionKey: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly chordSymbols: readonly string[];
  readonly isSummary: boolean;
}

export interface TwoHandVoicingAdvancedLessonSpec {
  readonly lessonKey: string;
  readonly category: AdvancedChordCategory;
  readonly orderIndex: number;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly progressions: readonly AdvancedProgressionSpec[];
  readonly survivalBlockKey: string;
  readonly survivalStageBase?: number;
}

const entry = (
  symbol: string,
  keyFifths: number,
  notes: readonly [string, string, string, string, string],
): AdvancedVoicingEntry => ({ symbol, keyFifths, notes });

/** So What m7 — 形: R 11 b7 b3 5 */
export const SO_WHAT_M7_VOICINGS: Record<string, AdvancedVoicingEntry> = {
  Am7: entry('Am7', 3, ['A3', 'D4', 'G4', 'C5', 'E5']),
  Bbm7: entry('Bbm7', -2, ['Bb3', 'Eb4', 'Ab4', 'Db5', 'F5']),
  Bm7: entry('Bm7', 3, ['B3', 'E4', 'A4', 'D5', 'F#5']),
  Cm7: entry('Cm7', 0, ['C3', 'F3', 'Bb3', 'Eb4', 'G4']),
  'C#m7': entry('C#m7', 5, ['C#3', 'F#3', 'B3', 'E4', 'G#4']),
  Dm7: entry('Dm7', 2, ['D3', 'G3', 'C4', 'F4', 'A4']),
  Ebm7: entry('Ebm7', -3, ['Eb3', 'Ab3', 'Db4', 'Gb4', 'Bb4']),
  Em7: entry('Em7', 4, ['E3', 'A3', 'D4', 'G4', 'B4']),
  Fm7: entry('Fm7', -1, ['F3', 'Bb3', 'Eb4', 'Ab4', 'C5']),
  'F#m7': entry('F#m7', 4, ['F#3', 'B3', 'E4', 'A4', 'C#5']),
  Gm7: entry('Gm7', 1, ['G3', 'C4', 'F4', 'Bb4', 'D5']),
  'G#m7': entry('G#m7', 5, ['G#3', 'C#4', 'F#4', 'B4', 'D#5']),
};

/** So What M7(#5,9,13) — 表記 M7 */
export const SO_WHAT_MAJOR_M7_VOICINGS: Record<string, AdvancedVoicingEntry> = {
  AbM7: entry('AbM7', -4, ['C3', 'F3', 'Bb3', 'E4', 'G4']),
  AM7: entry('AM7', 3, ['C#3', 'F#3', 'B3', 'E#4', 'G#4']),
  BbM7: entry('BbM7', -2, ['D3', 'G3', 'C4', 'F#4', 'A4']),
  BM7: entry('BM7', 5, ['D#3', 'G#3', 'C#4', 'F##4', 'A#4']),
  CM7: entry('CM7', 0, ['E3', 'A3', 'D4', 'G#4', 'B4']),
  DbM7: entry('DbM7', -5, ['F3', 'Bb3', 'Eb4', 'A4', 'C5']),
  DM7: entry('DM7', 2, ['F#3', 'B3', 'E4', 'A#4', 'C#5']),
  EbM7: entry('EbM7', -3, ['G3', 'C4', 'F4', 'B4', 'D5']),
  EM7: entry('EM7', 4, ['G#3', 'C#4', 'F#4', 'B#4', 'D#5']),
  FM7: entry('FM7', -1, ['A3', 'D4', 'G4', 'C#5', 'E5']),
  GbM7: entry('GbM7', -6, ['Bb3', 'Eb4', 'Ab4', 'D5', 'F5']),
  GM7: entry('GM7', 1, ['B3', 'E4', 'A4', 'D#5', 'F#5']),
};

/** UST bVI 7alt — 3rd は b4 表記 */
export const UST_BVI_7ALT_VOICINGS: Record<string, AdvancedVoicingEntry> = {
  A7alt: entry('A7alt', 3, ['G3', 'Db4', 'F4', 'A4', 'C5']),
  Bb7alt: entry('Bb7alt', -2, ['Ab3', 'Ebb4', 'Gb4', 'Bb4', 'Db5']),
  B7alt: entry('B7alt', 5, ['A3', 'Eb4', 'G4', 'B4', 'D5']),
  C7alt: entry('C7alt', 0, ['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']),
  'C#7alt': entry('C#7alt', 5, ['B3', 'F4', 'A4', 'C#5', 'E5']),
  D7alt: entry('D7alt', 2, ['C3', 'Gb3', 'Bb3', 'D4', 'F4']),
  'D#7alt': entry('D#7alt', 4, ['C#3', 'G3', 'B3', 'D#4', 'F#4']),
  E7alt: entry('E7alt', 4, ['D3', 'Ab3', 'C4', 'E4', 'G4']),
  F7alt: entry('F7alt', -1, ['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']),
  'F#7alt': entry('F#7alt', 4, ['E3', 'Bb3', 'D4', 'F#4', 'A4']),
  G7alt: entry('G7alt', 1, ['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']),
  'G#7alt': entry('G#7alt', 5, ['F#3', 'C4', 'E4', 'G#4', 'B4']),
};

/** mM7(9,13) — 表記 mM7 */
export const MM7_913_VOICINGS: Record<string, AdvancedVoicingEntry> = {
  AmM7: entry('AmM7', 3, ['F#3', 'C4', 'E4', 'G#4', 'B4']),
  BbmM7: entry('BbmM7', -2, ['G3', 'Db4', 'F4', 'A4', 'C5']),
  BmM7: entry('BmM7', 5, ['G#3', 'D4', 'F#4', 'A#4', 'C#5']),
  CmM7: entry('CmM7', 0, ['A3', 'Eb4', 'G4', 'B4', 'D5']),
  DbmM7: entry('DbmM7', -5, ['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']),
  DmM7: entry('DmM7', 2, ['B3', 'F4', 'A4', 'C#5', 'E5']),
  EbmM7: entry('EbmM7', -3, ['C3', 'Gb3', 'Bb3', 'D4', 'F4']),
  EmM7: entry('EmM7', 4, ['C#3', 'G3', 'B3', 'D#4', 'F#4']),
  FmM7: entry('FmM7', -1, ['D3', 'Ab3', 'C4', 'E4', 'G4']),
  GbmM7: entry('GbmM7', -6, ['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']),
  GmM7: entry('GmM7', 1, ['E3', 'Bb3', 'D4', 'F#4', 'A4']),
  AbmM7: entry('AbmM7', -4, ['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']),
};

/** m7b5(9,11) — 表記 m7b5 */
export const M7B5_911_VOICINGS: Record<string, AdvancedVoicingEntry> = {
  Am7b5: entry('Am7b5', 3, ['A3', 'Eb4', 'G4', 'B4', 'D5']),
  Bbm7b5: entry('Bbm7b5', -2, ['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']),
  Bm7b5: entry('Bm7b5', 3, ['B3', 'F4', 'A4', 'C#5', 'E5']),
  Cm7b5: entry('Cm7b5', 0, ['C3', 'Gb3', 'Bb3', 'D4', 'F4']),
  'C#m7b5': entry('C#m7b5', 5, ['C#3', 'G3', 'B3', 'D#4', 'F#4']),
  Dm7b5: entry('Dm7b5', 2, ['D3', 'Ab3', 'C4', 'E4', 'G4']),
  Ebm7b5: entry('Ebm7b5', -3, ['Eb3', 'Bbb3', 'Db4', 'F4', 'Ab4']),
  Em7b5: entry('Em7b5', 2, ['E3', 'Bb3', 'D4', 'F#4', 'A4']),
  Fm7b5: entry('Fm7b5', -1, ['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']),
  'F#m7b5': entry('F#m7b5', 4, ['F#3', 'C4', 'E4', 'G#4', 'B4']),
  Gm7b5: entry('Gm7b5', 1, ['G3', 'Db4', 'F4', 'A4', 'C5']),
  'G#m7b5': entry('G#m7b5', 5, ['G#3', 'D4', 'F#4', 'A#4', 'C#5']),
};

/** 7(9,#11,13) Lydian dominant — 表記 7(#11)、黒鍵ルートはフラット表記 */
export const LYDIAN_DOM7_VOICINGS: Record<string, AdvancedVoicingEntry> = {
  Ab7: entry('Ab7', -4, ['C3', 'Gb3', 'Bb3', 'D4', 'F4']),
  A7: entry('A7', 3, ['C#3', 'G3', 'B3', 'D#4', 'F#4']),
  Bb7: entry('Bb7', -2, ['D3', 'Ab3', 'C4', 'E4', 'G4']),
  B7: entry('B7', 5, ['D#3', 'A3', 'C#4', 'E#4', 'G#4']),
  C7: entry('C7', 0, ['E3', 'Bb3', 'D4', 'F#4', 'A4']),
  Db7: entry('Db7', -5, ['F3', 'Cb4', 'Eb4', 'G4', 'Bb4']),
  D7: entry('D7', 2, ['F#3', 'C4', 'E4', 'G#4', 'B4']),
  Eb7: entry('Eb7', -3, ['G3', 'Db4', 'F4', 'A4', 'C5']),
  E7: entry('E7', 4, ['G#3', 'D4', 'F#4', 'A#4', 'C#5']),
  F7: entry('F7', -1, ['A3', 'Eb4', 'G4', 'B4', 'D5']),
  Gb7: entry('Gb7', -6, ['Bb3', 'Fb4', 'Ab4', 'C5', 'Eb5']),
  G7: entry('G7', 1, ['B3', 'F4', 'A4', 'C#5', 'E5']),
};

const progression = (
  progressionKey: string,
  titleJa: string,
  titleEn: string,
  chordSymbols: readonly string[],
  isSummary = false,
): AdvancedProgressionSpec => ({
  progressionKey,
  titleJa,
  titleEn,
  chordSymbols,
  isSummary,
});

const M7_MINOR_PROGRESSIONS: readonly AdvancedProgressionSpec[] = [
  progression('p1', 'Cm7-Fm7-Bbm7-Ebm7', 'Cm7-Fm7-Bbm7-Ebm7', ['Cm7', 'Fm7', 'Bbm7', 'Ebm7']),
  progression('p2', 'C#m7-F#m7-Bm7-Em7', 'C#m7-F#m7-Bm7-Em7', ['C#m7', 'F#m7', 'Bm7', 'Em7']),
  progression('p3', 'Gm7-Am7-Dm7-G#m7', 'Gm7-Am7-Dm7-G#m7', ['Gm7', 'Am7', 'Dm7', 'G#m7']),
  progression(
    'summary',
    '全キーまとめ',
    'All keys',
    ['Cm7', 'Fm7', 'Bbm7', 'Ebm7', 'C#m7', 'F#m7', 'Bm7', 'Em7', 'Gm7', 'Am7', 'Dm7', 'G#m7'],
    true,
  ),
];

const M7_MAJOR_PROGRESSIONS: readonly AdvancedProgressionSpec[] = [
  progression('p1', 'AbM7-AM7-BbM7-BM7', 'AbM7-AM7-BbM7-BM7', ['AbM7', 'AM7', 'BbM7', 'BM7']),
  progression('p2', 'CM7-DbM7-DM7-EbM7', 'CM7-DbM7-DM7-EbM7', ['CM7', 'DbM7', 'DM7', 'EbM7']),
  progression('p3', 'EM7-FM7-GbM7-GM7', 'EM7-FM7-GbM7-GM7', ['EM7', 'FM7', 'GbM7', 'GM7']),
  progression(
    'summary',
    '全キーまとめ',
    'All keys',
    ['AbM7', 'AM7', 'BbM7', 'BM7', 'CM7', 'DbM7', 'DM7', 'EbM7', 'EM7', 'FM7', 'GbM7', 'GM7'],
    true,
  ),
];

const ALT7_PROGRESSIONS: readonly AdvancedProgressionSpec[] = [
  progression('p1', 'D7alt-D#7alt-E7alt-F7alt', 'D7alt-D#7alt-E7alt-F7alt', ['D7alt', 'D#7alt', 'E7alt', 'F7alt']),
  progression('p2', 'F#7alt-G7alt-G#7alt-A7alt', 'F#7alt-G7alt-G#7alt-A7alt', ['F#7alt', 'G7alt', 'G#7alt', 'A7alt']),
  progression('p3', 'Bb7alt-B7alt-C7alt-C#7alt', 'Bb7alt-B7alt-C7alt-C#7alt', ['Bb7alt', 'B7alt', 'C7alt', 'C#7alt']),
  progression(
    'summary',
    '全キーまとめ',
    'All keys',
    ['D7alt', 'D#7alt', 'E7alt', 'F7alt', 'F#7alt', 'G7alt', 'G#7alt', 'A7alt', 'Bb7alt', 'B7alt', 'C7alt', 'C#7alt'],
    true,
  ),
];

const MM7_PROGRESSIONS: readonly AdvancedProgressionSpec[] = [
  progression('p1', 'CmM7-FmM7-BbmM7-EbmM7', 'CmM7-FmM7-BbmM7-EbmM7', ['CmM7', 'FmM7', 'BbmM7', 'EbmM7']),
  progression('p2', 'AbmM7-DbmM7-GbmM7-BmM7', 'AbmM7-DbmM7-GbmM7-BmM7', ['AbmM7', 'DbmM7', 'GbmM7', 'BmM7']),
  progression('p3', 'EmM7-AmM7-DmM7-GmM7', 'EmM7-AmM7-DmM7-GmM7', ['EmM7', 'AmM7', 'DmM7', 'GmM7']),
  progression(
    'summary',
    '全キーまとめ',
    'All keys',
    ['CmM7', 'FmM7', 'BbmM7', 'EbmM7', 'AbmM7', 'DbmM7', 'GbmM7', 'BmM7', 'EmM7', 'AmM7', 'DmM7', 'GmM7'],
    true,
  ),
];

const M7B5_PROGRESSIONS: readonly AdvancedProgressionSpec[] = [
  progression('p1', 'Am7b5-Dm7b5-Gm7b5-Cm7b5', 'Am7b5-Dm7b5-Gm7b5-Cm7b5', ['Am7b5', 'Dm7b5', 'Gm7b5', 'Cm7b5']),
  progression('p2', 'Fm7b5-Bbm7b5-Ebm7b5-G#m7b5', 'Fm7b5-Bbm7b5-Ebm7b5-G#m7b5', ['Fm7b5', 'Bbm7b5', 'Ebm7b5', 'G#m7b5']),
  progression('p3', 'C#m7b5-F#m7b5-Bm7b5-Em7b5', 'C#m7b5-F#m7b5-Bm7b5-Em7b5', ['C#m7b5', 'F#m7b5', 'Bm7b5', 'Em7b5']),
  progression(
    'summary',
    '全キーまとめ',
    'All keys',
    ['Am7b5', 'Dm7b5', 'Gm7b5', 'Cm7b5', 'Fm7b5', 'Bbm7b5', 'Ebm7b5', 'G#m7b5', 'C#m7b5', 'F#m7b5', 'Bm7b5', 'Em7b5'],
    true,
  ),
];

const DOM7_PROGRESSIONS: readonly AdvancedProgressionSpec[] = [
  progression('p1', 'C7-F7-Bb7-Eb7', 'C7-F7-Bb7-Eb7', ['C7', 'F7', 'Bb7', 'Eb7']),
  progression('p2', 'Ab7-Db7-Gb7-B7', 'Ab7-Db7-Gb7-B7', ['Ab7', 'Db7', 'Gb7', 'B7']),
  progression('p3', 'E7-A7-D7-G7', 'E7-A7-D7-G7', ['E7', 'A7', 'D7', 'G7']),
  progression(
    'summary',
    '全キーまとめ',
    'All keys',
    ['C7', 'F7', 'Bb7', 'Eb7', 'Ab7', 'Db7', 'Gb7', 'B7', 'E7', 'A7', 'D7', 'G7'],
    true,
  ),
];

export const TWO_HAND_VOICING_ADVANCED_LESSONS: readonly TwoHandVoicingAdvancedLessonSpec[] = [
  {
    lessonKey: 'b1-m7',
    category: 'm7',
    orderIndex: 0,
    titleJa: 'So What Voicing m7',
    titleEn: 'So What Voicing m7',
    progressions: M7_MINOR_PROGRESSIONS,
    survivalBlockKey: 'm7',
  },
  {
    lessonKey: 'b1-M7',
    category: 'M7',
    orderIndex: 1,
    titleJa: 'So What Voicing M7',
    titleEn: 'So What Voicing M7',
    progressions: M7_MAJOR_PROGRESSIONS,
    survivalBlockKey: 'M7',
  },
  {
    lessonKey: 'b1-7alt',
    category: '7alt',
    orderIndex: 2,
    titleJa: 'UST bVI / 7alt',
    titleEn: 'UST bVI / 7alt',
    progressions: ALT7_PROGRESSIONS,
    survivalBlockKey: '7alt',
  },
];

export const TWO_HAND_VOICING_ADVANCED_EXT_LESSONS: readonly TwoHandVoicingAdvancedLessonSpec[] = [
  {
    lessonKey: 'b1-mm7',
    category: 'mM7',
    orderIndex: 4,
    titleJa: 'mM7(9,13)',
    titleEn: 'mM7(9,13)',
    progressions: MM7_PROGRESSIONS,
    survivalBlockKey: 'mM7',
    survivalStageBase: ADVANCED_EXT_SURVIVAL_STAGE_BASE,
  },
  {
    lessonKey: 'b1-m7b5',
    category: 'm7b5',
    orderIndex: 5,
    titleJa: 'm7b5(9,11)',
    titleEn: 'm7b5(9,11)',
    progressions: M7B5_PROGRESSIONS,
    survivalBlockKey: 'm7b5',
    survivalStageBase: ADVANCED_EXT_SURVIVAL_STAGE_BASE,
  },
  {
    lessonKey: 'b1-7s11',
    category: '7(#11)',
    orderIndex: 6,
    titleJa: '7 Lydian dominant',
    titleEn: '7 Lydian dominant',
    progressions: DOM7_PROGRESSIONS,
    survivalBlockKey: '7(#11)',
    survivalStageBase: ADVANCED_EXT_SURVIVAL_STAGE_BASE,
  },
];

const ALL_ADVANCED_SINGLE_LESSONS: readonly TwoHandVoicingAdvancedLessonSpec[] = [
  ...TWO_HAND_VOICING_ADVANCED_LESSONS,
  ...TWO_HAND_VOICING_ADVANCED_EXT_LESSONS,
];

export const resolveAdvancedVoicingStaves = (
  notes: readonly string[],
): readonly (1 | 2)[] => (
  notes.map((noteName, index) => {
    const midi = parseVoicingNoteName(noteName).midi;
    if (index >= 2) {
      return 1;
    }
    return midi >= ADVANCED_TREBLE_STAFF_THRESHOLD_MIDI ? 1 : 2;
  })
);

export const buildAdvancedSurvivalChordJson = (
  displayName: string,
  notes: readonly string[],
  keyFifths: number,
): SurvivalProgressionChordJson => ({
  name: displayName,
  voicing: noteNamesToMidi(notes),
  voicing_names: [...notes],
  key_fifths: keyFifths,
  voicing_staves: [...resolveAdvancedVoicingStaves(notes)],
});

export const resolveAdvancedVoicingTable = (
  category: AdvancedChordCategory,
): Record<string, AdvancedVoicingEntry> => {
  if (category === 'm7') {
    return SO_WHAT_M7_VOICINGS;
  }
  if (category === 'M7') {
    return SO_WHAT_MAJOR_M7_VOICINGS;
  }
  if (category === '7alt') {
    return UST_BVI_7ALT_VOICINGS;
  }
  if (category === 'mM7') {
    return MM7_913_VOICINGS;
  }
  if (category === 'm7b5') {
    return M7B5_911_VOICINGS;
  }
  return LYDIAN_DOM7_VOICINGS;
};

export const getAdvancedLessonKey = (lesson: TwoHandVoicingAdvancedLessonSpec): string => (
  `thva-${lesson.lessonKey}`
);

export const getAdvancedStageKey = (
  lesson: TwoHandVoicingAdvancedLessonSpec,
  progression: AdvancedProgressionSpec,
  mode: 'quiz' | 'voicing' | 'survival',
): string => (
  `${getAdvancedLessonKey(lesson)}-${progression.progressionKey}-${mode}`
);

export const resolveAdvancedSurvivalStageNumberForProgression = (
  lesson: TwoHandVoicingAdvancedLessonSpec,
  progression: AdvancedProgressionSpec,
): number => {
  const base = lesson.survivalStageBase ?? ADVANCED_SURVIVAL_STAGE_BASE;
  const lessonsInGroup = ALL_ADVANCED_SINGLE_LESSONS.filter(
    (entry) => (entry.survivalStageBase ?? ADVANCED_SURVIVAL_STAGE_BASE) === base,
  );
  const lessonIndex = lessonsInGroup.findIndex((entry) => entry.lessonKey === lesson.lessonKey);
  const progressionIndex = lesson.progressions.findIndex(
    (entry) => entry.progressionKey === progression.progressionKey,
  );
  return base + lessonIndex * 4 + progressionIndex;
};

const lookupVoicing = (
  table: Record<string, AdvancedVoicingEntry>,
  symbol: string,
): AdvancedVoicingEntry => {
  const voicingEntry = table[symbol];
  if (!voicingEntry) {
    throw new Error(`Unknown chord symbol: ${symbol}`);
  }
  return voicingEntry;
};

export const buildAdvancedQuizItems = (
  progressionSpec: AdvancedProgressionSpec,
  category: AdvancedChordCategory,
): QuizItemSpec[] => {
  const table = resolveAdvancedVoicingTable(category);
  return progressionSpec.chordSymbols.map((symbol, orderIndex) => {
    const voicingEntry = lookupVoicing(table, symbol);
    return {
      orderIndex,
      measureNumber: orderIndex + 1,
      chordName: voicingEntry.symbol,
      notes: [...voicingEntry.notes],
      keyFifths: voicingEntry.keyFifths,
    };
  });
};

const SEC_PER_MEASURE_AT_100 = 2.4;

export const buildAdvancedVoicingPhrase = (
  progressionSpec: AdvancedProgressionSpec,
  category: AdvancedChordCategory,
): VoicingPhraseSpec => {
  const table = resolveAdvancedVoicingTable(category);
  const chords: VoicingPhraseChordSpec[] = progressionSpec.chordSymbols.map((symbol, chordIndex) => {
    const voicingEntry = lookupVoicing(table, symbol);
    const startTimeSec = chordIndex * SEC_PER_MEASURE_AT_100;
    const endTimeSec = (chordIndex + 1) * SEC_PER_MEASURE_AT_100;
    return {
      orderIndex: chordIndex,
      chordName: voicingEntry.symbol,
      measureNumber: chordIndex + 1,
      startTimeSec,
      endTimeSec,
      notes: [...voicingEntry.notes],
      keyFifths: voicingEntry.keyFifths,
    };
  });

  const firstEntry = lookupVoicing(table, progressionSpec.chordSymbols[0]);

  return {
    phraseIndex: 0,
    titleJa: progressionSpec.titleJa,
    titleEn: progressionSpec.titleEn,
    keyFifths: firstEntry.keyFifths,
    chords,
  };
};

export const buildAdvancedSurvivalProgression = (
  progressionSpec: AdvancedProgressionSpec,
  category: AdvancedChordCategory,
): SurvivalProgressionChordJson[] => {
  const table = resolveAdvancedVoicingTable(category);
  return progressionSpec.chordSymbols.map((symbol) => {
    const voicingEntry = lookupVoicing(table, symbol);
    return buildAdvancedSurvivalChordJson(
      voicingEntry.symbol,
      voicingEntry.notes,
      voicingEntry.keyFifths,
    );
  });
};

export { noteNamesToMidi };
