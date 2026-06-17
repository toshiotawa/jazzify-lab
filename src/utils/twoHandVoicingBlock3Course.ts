/**
 * 両手ヴォイシングコース(中級) Block 3 — Drop 2 Resolution 基礎編。
 * DB マイグレーション生成とテストで共有。
 */
import {
  TWO_HAND_VOICING_GRAND_STAFF,
  buildSurvivalChordJson,
  noteNamesToMidi,
  type QuizItemSpec,
  type SurvivalProgressionChordJson,
  type VoicingPhraseChordSpec,
  type VoicingPhraseSpec,
} from '@/utils/twoHandVoicingIntermediateCourse';

export const TWO_HAND_VOICING_BLOCK3_META = {
  blockNumber: 3 as const,
  blockNameJa: 'Drop 2 Resolution 基礎編',
  blockNameEn: 'Drop 2 Resolution Basics',
};

export const BLOCK3_SURVIVAL_STAGE_BASE = 1215;
export const BLOCK3_EXT_SURVIVAL_STAGE_BASE = 1234;

export type Block3ChordCategory = 'M7' | 'm7' | '7alt' | 'mM7' | '7' | 'm7b5';

export interface Block3DualVoicingEntry {
  readonly symbol: string;
  readonly keyFifths: number;
  readonly voicingA: readonly [string, string, string, string];
  readonly voicingB: readonly [string, string, string, string];
}

export interface Block3ProgressionSpec {
  readonly progressionKey: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly chordSymbols: readonly string[];
  readonly isSummary: boolean;
}

export interface TwoHandVoicingBlock3LessonSpec {
  readonly lessonKey: string;
  readonly category: Block3ChordCategory;
  readonly orderIndex: number;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly progressions: readonly Block3ProgressionSpec[];
  readonly survivalBlockKey: string;
  readonly survivalStageBase?: number;
}

export interface Block3QuizItemSpec extends QuizItemSpec {
  readonly beatOffset: number;
}

export interface Block3VoicingPhraseChordSpec extends VoicingPhraseChordSpec {
  readonly beatOffset: number;
}

const dual = (
  symbol: string,
  keyFifths: number,
  voicingA: readonly [string, string, string, string],
  voicingB: readonly [string, string, string, string],
): Block3DualVoicingEntry => ({
  symbol,
  keyFifths,
  voicingA,
  voicingB,
});

/** M7 Drop2 + 6th Drop2（表記は M7 で統一） */
export const M7_RESOLUTION_VOICINGS: Record<string, Block3DualVoicingEntry> = {
  FM7: dual('FM7', -1, ['E3', 'A3', 'C4', 'G4'], ['D3', 'A3', 'C4', 'F4']),
  GbM7: dual('GbM7', -6, ['F3', 'Bb3', 'Db4', 'Ab4'], ['Eb3', 'Bb3', 'Db4', 'Gb4']),
  GM7: dual('GM7', 1, ['F#3', 'B3', 'D4', 'A4'], ['E3', 'B3', 'D4', 'G4']),
  AbM7: dual('AbM7', -4, ['G3', 'C4', 'Eb4', 'Bb4'], ['F3', 'C4', 'Eb4', 'Ab4']),
  AM7: dual('AM7', 3, ['G#3', 'C#4', 'E4', 'B4'], ['F#3', 'C#4', 'E4', 'A4']),
  BbM7: dual('BbM7', -2, ['A3', 'D4', 'F4', 'C5'], ['G3', 'D4', 'F4', 'Bb4']),
  BM7: dual('BM7', 5, ['A#3', 'D#4', 'F#4', 'C#5'], ['G#3', 'D#4', 'F#4', 'B4']),
  CM7: dual('CM7', 0, ['B3', 'E4', 'G4', 'D5'], ['A3', 'E4', 'G4', 'C5']),
  DbM7: dual('DbM7', -5, ['C4', 'F4', 'Ab4', 'Eb5'], ['Bb3', 'F4', 'Ab4', 'Db5']),
  DM7: dual('DM7', 2, ['C#4', 'F#4', 'A4', 'E5'], ['B3', 'F#4', 'A4', 'D5']),
  EbM7: dual('EbM7', -3, ['D4', 'G4', 'Bb4', 'F5'], ['C4', 'G4', 'Bb4', 'Eb5']),
  EM7: dual('EM7', 4, ['D#4', 'G#4', 'B4', 'F#5'], ['C#4', 'G#4', 'B4', 'E5']),
};

/** m7(9,11) Drop2 + m7 Drop2（表記は m7 で統一） */
export const M7_MINOR_RESOLUTION_VOICINGS: Record<string, Block3DualVoicingEntry> = {
  Dm7: dual('Dm7', 2, ['E3', 'A3', 'C4', 'G4'], ['D3', 'A3', 'C4', 'F4']),
  Ebm7: dual('Ebm7', -3, ['F3', 'Bb3', 'Db4', 'Ab4'], ['Eb3', 'Bb3', 'Db4', 'Gb4']),
  Em7: dual('Em7', 2, ['F#3', 'B3', 'D4', 'A4'], ['E3', 'B3', 'D4', 'G4']),
  Fm7: dual('Fm7', -1, ['G3', 'C4', 'Eb4', 'Bb4'], ['F3', 'C4', 'Eb4', 'Ab4']),
  'F#m7': dual('F#m7', 4, ['G#3', 'C#4', 'E4', 'B4'], ['F#3', 'C#4', 'E4', 'A4']),
  Gm7: dual('Gm7', 1, ['A3', 'D4', 'F4', 'C5'], ['G3', 'D4', 'F4', 'Bb4']),
  Abm7: dual('Abm7', -4, ['Bb3', 'Eb4', 'Gb4', 'Db5'], ['Ab3', 'Eb4', 'Gb4', 'Cb5']),
  Am7: dual('Am7', 3, ['B3', 'E4', 'G4', 'D5'], ['A3', 'E4', 'G4', 'C5']),
  Bbm7: dual('Bbm7', -2, ['C4', 'F4', 'Ab4', 'Eb5'], ['Bb3', 'F4', 'Ab4', 'Db5']),
  Bm7: dual('Bm7', 3, ['C#4', 'F#4', 'A4', 'E5'], ['B3', 'F#4', 'A4', 'D5']),
  Cm7: dual('Cm7', 0, ['D4', 'G4', 'Bb4', 'F5'], ['C4', 'G4', 'Bb4', 'Eb5']),
  'C#m7': dual('C#m7', 5, ['D#4', 'G#4', 'B4', 'F#5'], ['C#4', 'G#4', 'B4', 'E5']),
};

/** 7alt + resolved（表記は 7alt で統一、3rd は b4th 表記） */
export const ALT7_RESOLUTION_VOICINGS: Record<string, Block3DualVoicingEntry> = {
  E7alt: dual('E7alt', 4, ['E3', 'Ab3', 'C4', 'G4'], ['D3', 'Ab3', 'C4', 'F4']),
  F7alt: dual('F7alt', -1, ['F3', 'Bbb3', 'Db4', 'Ab4'], ['Eb3', 'Bbb3', 'Db4', 'Gb4']),
  'F#7alt': dual('F#7alt', 4, ['F#3', 'Bb3', 'D4', 'A4'], ['E3', 'Bb3', 'D4', 'G4']),
  G7alt: dual('G7alt', 1, ['G3', 'Cb4', 'Eb4', 'Bb4'], ['F3', 'Cb4', 'Eb4', 'Ab4']),
  'G#7alt': dual('G#7alt', 5, ['G#3', 'C4', 'E4', 'B4'], ['F#3', 'C4', 'E4', 'A4']),
  A7alt: dual('A7alt', 3, ['A3', 'Db4', 'F4', 'C5'], ['G3', 'Db4', 'F4', 'Bb4']),
  Bb7alt: dual('Bb7alt', -2, ['Bb3', 'Ebb4', 'Gb4', 'Db5'], ['Ab3', 'Ebb4', 'Gb4', 'Cb5']),
  B7alt: dual('B7alt', 5, ['B3', 'Eb4', 'G4', 'D5'], ['A3', 'Eb4', 'G4', 'C5']),
  C7alt: dual('C7alt', 0, ['C4', 'Fb4', 'Ab4', 'Eb5'], ['Bb3', 'Fb4', 'Ab4', 'Db5']),
  'C#7alt': dual('C#7alt', 5, ['C#4', 'F4', 'A4', 'E5'], ['B3', 'F4', 'A4', 'D5']),
  D7alt: dual('D7alt', 2, ['D4', 'Gb4', 'Bb4', 'F5'], ['C4', 'Gb4', 'Bb4', 'Eb5']),
  'D#7alt': dual('D#7alt', 4, ['D#4', 'G4', 'B4', 'F#5'], ['C#4', 'G4', 'B4', 'E5']),
  Eb7alt: dual('Eb7alt', -3, ['Eb4', 'Ab4', 'Bb4', 'Gb5'], ['Db4', 'Ab4', 'Bb4', 'Fb5']),
  Ab7alt: dual('Ab7alt', -4, ['Ab3', 'Db4', 'F4', 'C5'], ['G3', 'Db4', 'F4', 'Bb4']),
  Db7alt: dual('Db7alt', -5, ['Db4', 'Gb4', 'Bb4', 'F5'], ['C4', 'Gb4', 'Bb4', 'Eb5']),
};

/** mM7(9) Drop2 + m6 Drop2（表記は mM7 で統一） */
export const MM7_RESOLUTION_VOICINGS: Record<string, Block3DualVoicingEntry> = {
  FmM7: dual('FmM7', -1, ['E3', 'Ab3', 'C4', 'G4'], ['D3', 'Ab3', 'C4', 'F4']),
  'F#mM7': dual('F#mM7', 4, ['E#3', 'A3', 'C#4', 'G#4'], ['D#3', 'A3', 'C#4', 'F#4']),
  GmM7: dual('GmM7', 1, ['F#3', 'Bb3', 'D4', 'A4'], ['E3', 'Bb3', 'D4', 'G4']),
  AbmM7: dual('AbmM7', -4, ['G3', 'Cb4', 'Eb4', 'Bb4'], ['F3', 'Cb4', 'Eb4', 'Ab4']),
  AmM7: dual('AmM7', 3, ['G#3', 'C4', 'E4', 'B4'], ['F#3', 'C4', 'E4', 'A4']),
  BbmM7: dual('BbmM7', -2, ['A3', 'Db4', 'F4', 'C5'], ['G3', 'Db4', 'F4', 'Bb4']),
  BmM7: dual('BmM7', 5, ['A#3', 'D4', 'F#4', 'C#5'], ['G#3', 'D4', 'F#4', 'B4']),
  CmM7: dual('CmM7', 0, ['B3', 'Eb4', 'G4', 'D5'], ['A3', 'Eb4', 'G4', 'C5']),
  DbmM7: dual('DbmM7', -5, ['C4', 'E4', 'Ab4', 'Eb5'], ['Bb3', 'E4', 'Ab4', 'Db5']),
  DmM7: dual('DmM7', 2, ['C#4', 'F4', 'A4', 'E5'], ['B3', 'F4', 'A4', 'D5']),
  EbmM7: dual('EbmM7', -3, ['D4', 'Gb4', 'Bb4', 'F5'], ['C4', 'Gb4', 'Bb4', 'Eb5']),
  EmM7: dual('EmM7', 4, ['D#4', 'G4', 'B4', 'F#5'], ['C#4', 'G4', 'B4', 'E5']),
  GbmM7: dual('GbmM7', -6, ['F3', 'Bb3', 'Db4', 'Ab4'], ['Eb3', 'Bb3', 'Db4', 'Gb4']),
};

/** 7(9,#11,13) + 7(9) Lydian dominant（表記は 7 で統一、黒鍵ルートはフラット表記） */
export const DOM7_LYDIAN_RESOLUTION_VOICINGS: Record<string, Block3DualVoicingEntry> = {
  Bb7: dual('Bb7', -2, ['E3', 'Ab3', 'C4', 'G4'], ['D3', 'Ab3', 'C4', 'F4']),
  B7: dual('B7', 5, ['E#3', 'A3', 'C#4', 'G#4'], ['D#3', 'A3', 'C#4', 'F#4']),
  C7: dual('C7', 0, ['F#3', 'Bb3', 'D4', 'A4'], ['E3', 'Bb3', 'D4', 'G4']),
  Db7: dual('Db7', -5, ['G3', 'Cb4', 'Eb4', 'Bb4'], ['F3', 'Cb4', 'Eb4', 'Ab4']),
  D7: dual('D7', 2, ['G#3', 'C4', 'E4', 'B4'], ['F#3', 'C4', 'E4', 'A4']),
  Eb7: dual('Eb7', -3, ['A3', 'Db4', 'F4', 'C5'], ['G3', 'Db4', 'F4', 'Bb4']),
  E7: dual('E7', 4, ['A#3', 'D4', 'F#4', 'C#5'], ['G#3', 'D4', 'F#4', 'B4']),
  F7: dual('F7', -1, ['B3', 'Eb4', 'G4', 'D5'], ['A3', 'Eb4', 'G4', 'C5']),
  Gb7: dual('Gb7', -6, ['C4', 'Fb4', 'Ab4', 'Eb5'], ['Bb3', 'Fb4', 'Ab4', 'Db5']),
  G7: dual('G7', 1, ['C#4', 'F4', 'A4', 'E5'], ['B3', 'F4', 'A4', 'D5']),
  Ab7: dual('Ab7', -4, ['D4', 'Gb4', 'Bb4', 'F5'], ['C4', 'Gb4', 'Bb4', 'Eb5']),
  A7: dual('A7', 3, ['D#4', 'G4', 'B4', 'F#5'], ['C#4', 'G4', 'B4', 'E5']),
};

/** m7b5(9,11) Drop2 + m7b5 Drop2（表記は m7b5 で統一） */
export const M7B5_RESOLUTION_VOICINGS: Record<string, Block3DualVoicingEntry> = {
  Am7b5: dual('Am7b5', 3, ['B3', 'Eb4', 'G4', 'D5'], ['A3', 'Eb4', 'G4', 'C5']),
  Bbm7b5: dual('Bbm7b5', -2, ['C4', 'E4', 'Ab4', 'Eb5'], ['Bb3', 'E4', 'Ab4', 'Db5']),
  Bm7b5: dual('Bm7b5', 3, ['C#4', 'F4', 'A4', 'E5'], ['B3', 'F4', 'A4', 'D5']),
  Cm7b5: dual('Cm7b5', 0, ['D4', 'Gb4', 'Bb4', 'F5'], ['C4', 'Gb4', 'Bb4', 'Eb5']),
  'C#m7b5': dual('C#m7b5', 5, ['D#4', 'G4', 'B4', 'F#5'], ['C#4', 'G4', 'B4', 'E5']),
  Dm7b5: dual('Dm7b5', 2, ['E3', 'Ab3', 'C4', 'G4'], ['D3', 'Ab3', 'C4', 'F4']),
  Ebm7b5: dual('Ebm7b5', -3, ['F3', 'Bb3', 'Db4', 'Ab4'], ['Eb3', 'Bb3', 'Db4', 'Gb4']),
  Em7b5: dual('Em7b5', 2, ['F#3', 'Bb3', 'D4', 'A4'], ['E3', 'Bb3', 'D4', 'G4']),
  Fm7b5: dual('Fm7b5', -1, ['G3', 'Cb4', 'Eb4', 'Bb4'], ['F3', 'Cb4', 'Eb4', 'Ab4']),
  'F#m7b5': dual('F#m7b5', 4, ['G#3', 'C4', 'E4', 'B4'], ['F#3', 'C4', 'E4', 'A4']),
  Gm7b5: dual('Gm7b5', 1, ['A3', 'Db4', 'F4', 'C5'], ['G3', 'Db4', 'F4', 'Bb4']),
  Abm7b5: dual('Abm7b5', -4, ['Bb3', 'Eb4', 'Gb4', 'Db5'], ['Ab3', 'Eb4', 'Gb4', 'Cb5']),
};

const progression = (
  progressionKey: string,
  titleJa: string,
  titleEn: string,
  chordSymbols: readonly string[],
  isSummary = false,
): Block3ProgressionSpec => ({
  progressionKey,
  titleJa,
  titleEn,
  chordSymbols,
  isSummary,
});

const M7_PROGRESSIONS: readonly Block3ProgressionSpec[] = [
  progression('p1', 'CM7-FM7-BbM7-EbM7', 'CM7-FM7-BbM7-EbM7', ['CM7', 'FM7', 'BbM7', 'EbM7']),
  progression('p2', 'AbM7-DbM7-GbM7-BM7', 'AbM7-DbM7-GbM7-BM7', ['AbM7', 'DbM7', 'GbM7', 'BM7']),
  progression('p3', 'EM7-AM7-DM7-GM7', 'EM7-AM7-DM7-GM7', ['EM7', 'AM7', 'DM7', 'GM7']),
  progression(
    'summary',
    '全キーまとめ',
    'All keys',
    ['CM7', 'FM7', 'BbM7', 'EbM7', 'AbM7', 'DbM7', 'GbM7', 'BM7', 'EM7', 'AM7', 'DM7', 'GM7'],
    true,
  ),
];

const MN7_PROGRESSIONS: readonly Block3ProgressionSpec[] = [
  progression('p1', 'Am7-Dm7-Gm7-Cm7', 'Am7-Dm7-Gm7-Cm7', ['Am7', 'Dm7', 'Gm7', 'Cm7']),
  progression('p2', 'Fm7-Bbm7-Ebm7-Abm7', 'Fm7-Bbm7-Ebm7-Abm7', ['Fm7', 'Bbm7', 'Ebm7', 'Abm7']),
  progression('p3', 'C#m7-F#m7-Bm7-Em7', 'C#m7-F#m7-Bm7-Em7', ['C#m7', 'F#m7', 'Bm7', 'Em7']),
  progression(
    'summary',
    '全キーまとめ',
    'All keys',
    ['Am7', 'Dm7', 'Gm7', 'Cm7', 'Fm7', 'Bbm7', 'Ebm7', 'Abm7', 'C#m7', 'F#m7', 'Bm7', 'Em7'],
    true,
  ),
];

const ALT7_PROGRESSIONS: readonly Block3ProgressionSpec[] = [
  progression('p1', 'G7alt-C7alt-F7alt-Bb7alt', 'G7alt-C7alt-F7alt-Bb7alt', ['G7alt', 'C7alt', 'F7alt', 'Bb7alt']),
  progression('p2', 'Eb7alt-Ab7alt-Db7alt-F#7alt', 'Eb7alt-Ab7alt-Db7alt-F#7alt', ['Eb7alt', 'Ab7alt', 'Db7alt', 'F#7alt']),
  progression('p3', 'B7alt-E7alt-A7alt-D7alt', 'B7alt-E7alt-A7alt-D7alt', ['B7alt', 'E7alt', 'A7alt', 'D7alt']),
  progression(
    'summary',
    '全キーまとめ',
    'All keys',
    ['G7alt', 'C7alt', 'F7alt', 'Bb7alt', 'Eb7alt', 'Ab7alt', 'Db7alt', 'F#7alt', 'B7alt', 'E7alt', 'A7alt', 'D7alt'],
    true,
  ),
];

const MM7_PROGRESSIONS: readonly Block3ProgressionSpec[] = [
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

const DOM7_PROGRESSIONS: readonly Block3ProgressionSpec[] = [
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

const M7B5_PROGRESSIONS: readonly Block3ProgressionSpec[] = [
  progression('p1', 'Am7b5-Dm7b5-Gm7b5-Cm7b5', 'Am7b5-Dm7b5-Gm7b5-Cm7b5', ['Am7b5', 'Dm7b5', 'Gm7b5', 'Cm7b5']),
  progression('p2', 'Fm7b5-Bbm7b5-Ebm7b5-Abm7b5', 'Fm7b5-Bbm7b5-Ebm7b5-Abm7b5', ['Fm7b5', 'Bbm7b5', 'Ebm7b5', 'Abm7b5']),
  progression('p3', 'C#m7b5-F#m7b5-Bm7b5-Em7b5', 'C#m7b5-F#m7b5-Bm7b5-Em7b5', ['C#m7b5', 'F#m7b5', 'Bm7b5', 'Em7b5']),
  progression(
    'summary',
    '全キーまとめ',
    'All keys',
    ['Am7b5', 'Dm7b5', 'Gm7b5', 'Cm7b5', 'Fm7b5', 'Bbm7b5', 'Ebm7b5', 'Abm7b5', 'C#m7b5', 'F#m7b5', 'Bm7b5', 'Em7b5'],
    true,
  ),
];

export const TWO_HAND_VOICING_BLOCK3_LESSONS: readonly TwoHandVoicingBlock3LessonSpec[] = [
  {
    lessonKey: 'b3-m7',
    category: 'M7',
    orderIndex: 14,
    titleJa: 'メジャーセブンス',
    titleEn: 'Major sevenths',
    progressions: M7_PROGRESSIONS,
    survivalBlockKey: 'M7',
  },
  {
    lessonKey: 'b3-mn7',
    category: 'm7',
    orderIndex: 15,
    titleJa: 'マイナーセブンス',
    titleEn: 'Minor sevenths',
    progressions: MN7_PROGRESSIONS,
    survivalBlockKey: 'm7',
  },
  {
    lessonKey: 'b3-7alt',
    category: '7alt',
    orderIndex: 16,
    titleJa: 'セブンスオルタード',
    titleEn: 'Altered sevenths',
    progressions: ALT7_PROGRESSIONS,
    survivalBlockKey: '7_b9_b13',
  },
];

export const TWO_HAND_VOICING_BLOCK3_EXT_LESSONS: readonly TwoHandVoicingBlock3LessonSpec[] = [
  {
    lessonKey: 'b3-mm7',
    category: 'mM7',
    orderIndex: 18,
    titleJa: 'マイナーメジャーセブンス',
    titleEn: 'Minor major sevenths',
    progressions: MM7_PROGRESSIONS,
    survivalBlockKey: 'mM7',
    survivalStageBase: BLOCK3_EXT_SURVIVAL_STAGE_BASE,
  },
  {
    lessonKey: 'b3-7',
    category: '7',
    orderIndex: 19,
    titleJa: 'リディアンドミナントセブンス',
    titleEn: 'Lydian dominant sevenths',
    progressions: DOM7_PROGRESSIONS,
    survivalBlockKey: '7',
    survivalStageBase: BLOCK3_EXT_SURVIVAL_STAGE_BASE,
  },
  {
    lessonKey: 'b3-m7b5',
    category: 'm7b5',
    orderIndex: 20,
    titleJa: 'マイナーセブンスフラットファイブス',
    titleEn: 'Half-diminished sevenths',
    progressions: M7B5_PROGRESSIONS,
    survivalBlockKey: 'm7b5',
    survivalStageBase: BLOCK3_EXT_SURVIVAL_STAGE_BASE,
  },
];

const ALL_BLOCK3_DUAL_LESSONS: readonly TwoHandVoicingBlock3LessonSpec[] = [
  ...TWO_HAND_VOICING_BLOCK3_LESSONS,
  ...TWO_HAND_VOICING_BLOCK3_EXT_LESSONS,
];

export const resolveBlock3VoicingTable = (
  category: Block3ChordCategory,
): Record<string, Block3DualVoicingEntry> => {
  if (category === 'M7') {
    return M7_RESOLUTION_VOICINGS;
  }
  if (category === 'm7') {
    return M7_MINOR_RESOLUTION_VOICINGS;
  }
  if (category === '7alt') {
    return ALT7_RESOLUTION_VOICINGS;
  }
  if (category === 'mM7') {
    return MM7_RESOLUTION_VOICINGS;
  }
  if (category === '7') {
    return DOM7_LYDIAN_RESOLUTION_VOICINGS;
  }
  return M7B5_RESOLUTION_VOICINGS;
};

export const getBlock3LessonKey = (lesson: TwoHandVoicingBlock3LessonSpec): string => (
  `thvi-${lesson.lessonKey}`
);

export const getBlock3StageKey = (
  lesson: TwoHandVoicingBlock3LessonSpec,
  progression: Block3ProgressionSpec,
  mode: 'quiz' | 'voicing' | 'survival',
): string => (
  `${getBlock3LessonKey(lesson)}-${progression.progressionKey}-${mode}`
);

export const resolveBlock3SurvivalStageNumber = (
  lessonIndex: number,
  progressionIndex: number,
): number => (
  BLOCK3_SURVIVAL_STAGE_BASE + lessonIndex * 4 + progressionIndex
);

export const resolveBlock3SurvivalStageNumberForProgression = (
  lesson: TwoHandVoicingBlock3LessonSpec,
  progression: Block3ProgressionSpec,
): number => {
  const base = lesson.survivalStageBase ?? BLOCK3_SURVIVAL_STAGE_BASE;
  const lessonsInGroup = ALL_BLOCK3_DUAL_LESSONS.filter(
    (entry) => (entry.survivalStageBase ?? BLOCK3_SURVIVAL_STAGE_BASE) === base,
  );
  const lessonIndex = lessonsInGroup.findIndex((entry) => entry.lessonKey === lesson.lessonKey);
  const progressionIndex = lesson.progressions.findIndex(
    (entry) => entry.progressionKey === progression.progressionKey,
  );
  return base + lessonIndex * 4 + progressionIndex;
};

export const lookupVoicing = (
  table: Record<string, Block3DualVoicingEntry>,
  symbol: string,
): Block3DualVoicingEntry => {
  const entry = table[symbol];
  if (!entry) {
    throw new Error(`Unknown chord symbol: ${symbol}`);
  }
  return entry;
};

export const buildBlock3QuizItems = (
  progressionSpec: Block3ProgressionSpec,
  category: Block3ChordCategory,
): Block3QuizItemSpec[] => {
  const table = resolveBlock3VoicingTable(category);
  const items: Block3QuizItemSpec[] = [];
  let orderIndex = 0;

  progressionSpec.chordSymbols.forEach((symbol, chordIndex) => {
    const entry = lookupVoicing(table, symbol);
    const measureNumber = progressionSpec.isSummary
      ? chordIndex + 1
      : chordIndex + 1;

    items.push({
      orderIndex,
      measureNumber,
      beatOffset: 1,
      chordName: entry.symbol,
      notes: [...entry.voicingA],
      keyFifths: entry.keyFifths,
    });
    orderIndex += 1;

    items.push({
      orderIndex,
      measureNumber,
      beatOffset: 3,
      chordName: entry.symbol,
      notes: [...entry.voicingB],
      keyFifths: entry.keyFifths,
    });
    orderIndex += 1;
  });

  return items;
};

const SEC_PER_MEASURE_AT_100 = 2.4;

export const buildBlock3VoicingPhrase = (
  progressionSpec: Block3ProgressionSpec,
  category: Block3ChordCategory,
): VoicingPhraseSpec => {
  const table = resolveBlock3VoicingTable(category);
  const chords: Block3VoicingPhraseChordSpec[] = [];
  let orderIndex = 0;

  progressionSpec.chordSymbols.forEach((symbol, chordIndex) => {
    const entry = lookupVoicing(table, symbol);
    const measureNumber = chordIndex + 1;
    const startTimeSec = chordIndex * SEC_PER_MEASURE_AT_100;
    const endTimeSec = (chordIndex + 1) * SEC_PER_MEASURE_AT_100;

    chords.push({
      orderIndex,
      chordName: entry.symbol,
      measureNumber,
      beatOffset: 1,
      startTimeSec,
      endTimeSec,
      notes: [...entry.voicingA],
      keyFifths: entry.keyFifths,
    });
    orderIndex += 1;

    chords.push({
      orderIndex,
      chordName: entry.symbol,
      measureNumber,
      beatOffset: 3,
      startTimeSec,
      endTimeSec,
      notes: [...entry.voicingB],
      keyFifths: entry.keyFifths,
    });
    orderIndex += 1;
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

export const buildBlock3SurvivalProgression = (
  progressionSpec: Block3ProgressionSpec,
  category: Block3ChordCategory,
): SurvivalProgressionChordJson[] => {
  const table = resolveBlock3VoicingTable(category);
  const chords: SurvivalProgressionChordJson[] = [];

  for (const symbol of progressionSpec.chordSymbols) {
    const entry = lookupVoicing(table, symbol);
    chords.push(
      buildSurvivalChordJson(entry.symbol, entry.voicingA, entry.keyFifths),
      buildSurvivalChordJson(entry.symbol, entry.voicingB, entry.keyFifths),
    );
  }

  return chords;
};

export const buildBlock3SummarySurvivalProgression = (
  category: Block3ChordCategory,
): SurvivalProgressionChordJson[] => {
  const lesson = ALL_BLOCK3_DUAL_LESSONS.find((entry) => entry.category === category);
  if (!lesson) {
    throw new Error(`Unknown category: ${category}`);
  }
  const summary = lesson.progressions.find((entry) => entry.isSummary);
  if (!summary) {
    throw new Error(`Summary progression missing for category: ${category}`);
  }
  return buildBlock3SurvivalProgression(summary, category);
};

export { TWO_HAND_VOICING_GRAND_STAFF, noteNamesToMidi };
