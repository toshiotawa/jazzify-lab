/**
 * 横スクロールコードラン:中級 — 36 クエストのコード進行定義。
 * DB マイグレーション生成とテストで共有。
 */
import { CODE_RUN_LESSON_BGM_OVERRIDE } from './codeRunBgm';
import {
  buildAugmentedChordProgressionForStage,
  type SurvivalProgressionDbChord,
} from './survivalProgressionMigrationGenerator';
import { analyzeSurvivalChordProgression } from './survivalProgressionVoicings';

export interface ChordRunIntermediateQuestDefinition {
  readonly lessonKey: string;
  readonly orderIndex: number;
  readonly blockNumber: number;
  readonly blockName: string;
  readonly blockNameEn: string;
  readonly blockKey: string;
  readonly questIndex: number;
  readonly stageNumber: number;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly chordNames: readonly string[];
}

export const CHORD_RUN_INTERMEDIATE_BGM_OVERRIDE = CODE_RUN_LESSON_BGM_OVERRIDE;

const parseProgressionLine = (line: string): readonly string[] =>
  line.split('-').map((token) => token.trim()).filter(Boolean);

const BLOCK1_LINES = [
  'Dm7(9)-G7(9.13)-CM7(9)-Gm7(9)-C7(9.13)-FM7(9)',
  'Cm7(9)-F7(9.13)-BbM7(9)-Fm7(9)-Bb7(9.13)-EbM7(9)',
  'Bbm7(9)-Eb7(9.13)-AbM7(9)-Ebm7(9)-Ab7(9.13)-DbM7(9)',
  'Abm7(9)-Db7(9.13)-GbM7(9)-C#m7(9)-F#7(9.13)-BM7(9)',
  'F#m7(9)-B7(9.13)-EM7(9)-Bm7(9)-E7(9.13)-AM7(9)',
  'Em7(9)-A7(9.13)-DM7(9)-Am7(9)-D7(9.13)-GM7(9)',
] as const;

const BLOCK2_LINES = [
  'CM7(9)-A7(b9.b13)-Dm7(9)-G7(9.13)',
  'FM7(9)-D7(b9.b13)-Gm7(9)-C7(9.13)',
  'BbM7(9)-G7(b9.b13)-Cm7(9)-F7(9.13)',
  'EbM7(9)-C7(b9.b13)-Fm7(9)-Bb7(9.13)',
  'AbM7(9)-F7(b9.b13)-Bbm7(9)-Eb7(9.13)',
  'DbM7(9)-Bb7(b9.b13)-Ebm7(9)-Ab7(9.13)',
  'GbM7(9)-Eb7(b9.b13)-Abm7(9)-Db7(9.13)',
  'BM7(9)-G#7(b9.b13)-C#m7(9)-F#7(9.13)',
  'EM7(9)-C#7(b9.b13)-F#m7(9)-B7(9.13)',
  'AM7(9)-F#7(b9.b13)-C#m7(9)-F#7(b9.b13)',
  'DM7(9)-B7(b9.b13)-Em7(9)-A7(9.13)',
  'GM7(9)-E7(b9.b13)-Am7(9)-D7(9.13)',
] as const;

const BLOCK3_LINES = [
  'Dm7(9)-G7(b9.b13)-CM7(9)-Gm7(9)-C7(b9.b13)-FM7(9)',
  'Cm7(9)-F7(b9.b13)-BbM7(9)-Fm7(9)-Bb7(b9.b13)-EbM7(9)',
  'Bbm7(9)-Eb7(b9.b13)-AbM7(9)-Ebm7(9)-Ab7(b9.b13)-DbM7(9)',
  'Abm7(9)-Db7(b9.b13)-GbM7(9)-C#m7(9)-F#7(b9.b13)-BM7(9)',
  'F#m7(9)-B7(b9.b13)-EM7(9)-Bm7(9)-E7(b9.b13)-AM7(9)',
  'Em7(9)-A7(b9.b13)-DM7(9)-Am7(9)-D7(b9.b13)-GM7(9)',
] as const;

const BLOCK4_LINES = [
  'Bm7(b5)-E7(b9.b13)-Am6(9)',
  'Em7(b5)-A7(b9.b13)-Dm6(9)',
  'Am7(b5)-D7(b9.b13)-Gm6(9)',
  'Dm7(b5)-G7(b9.b13)-Cm6(9)',
  'Gm7(b5)-C7(b9.b13)-Fm6(9)',
  'Cm7(b5)-F7(b9.b13)-Bbm6(9)',
  'Fm7(b5)-Bb7(b9.b13)-Ebm6(9)',
  'Bbm7(b5)-Eb7(b9.b13)-Abm6(9)',
  'Ebm7(b5)-Ab7(b9.b13)-Dbm6(9)',
  'G#m7(b5)-C#7(b9.b13)-F#m6(9)',
  'C#m7(b5)-F#7(b9.b13)-Bm6(9)',
  'F#m7(b5)-B7(b9.b13)-Em6(9)',
] as const;

const buildBlockQuests = (
  blockNumber: number,
  blockKey: string,
  blockName: string,
  blockNameEn: string,
  titlePrefix: string,
  titlePrefixEn: string,
  lines: readonly string[],
  startStageNumber: number,
  startOrderIndex: number,
): ChordRunIntermediateQuestDefinition[] => {
  const quests: ChordRunIntermediateQuestDefinition[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const questIndex = i + 1;
    quests.push({
      lessonKey: `b${blockNumber}-q${questIndex}`,
      orderIndex: startOrderIndex + i,
      blockNumber,
      blockName,
      blockNameEn,
      blockKey,
      questIndex,
      stageNumber: startStageNumber + i,
      titleJa: `${titlePrefix} ${questIndex}`,
      titleEn: `${titlePrefixEn} ${questIndex}`,
      chordNames: parseProgressionLine(lines[i]),
    });
  }
  return quests;
};

export const CHORD_RUN_INTERMEDIATE_QUESTS: readonly ChordRunIntermediateQuestDefinition[] = [
  ...buildBlockQuests(1, 'ii_v_i', 'II-V-I', 'II-V-I', 'II-V-I', 'II-V-I', BLOCK1_LINES, 140, 0),
  ...buildBlockQuests(
    2,
    'i_vi_ii_v',
    'I-VI-II-V',
    'I-VI-II-V',
    'I-VI-II-V',
    'I-VI-II-V',
    BLOCK2_LINES,
    146,
    6,
  ),
  ...buildBlockQuests(
    3,
    'ii_v7alt_i',
    'II-V7(alt)-I',
    'II-V7(alt)-I',
    'II-V7(alt)-I',
    'II-V7(alt)-I',
    BLOCK3_LINES,
    158,
    18,
  ),
  ...buildBlockQuests(
    4,
    'minor_ii_v_i',
    'マイナー II-V-I',
    'Minor II-V-I',
    'Minor II-V-I',
    'Minor II-V-I',
    BLOCK4_LINES,
    164,
    24,
  ),
];

export const buildChordRunIntermediateDbProgression = (
  chordNames: readonly string[],
): SurvivalProgressionDbChord[] => {
  const analyzed = analyzeSurvivalChordProgression(chordNames.join(' '));
  if (analyzed.progression.length !== chordNames.length) {
    throw new Error(
      `Expected ${chordNames.length} chords, got ${analyzed.progression.length}`,
    );
  }
  for (let i = 0; i < chordNames.length; i += 1) {
    if (analyzed.progression[i]?.name !== chordNames[i]) {
      throw new Error(
        `Name mismatch at ${i}: "${analyzed.progression[i]?.name}" vs "${chordNames[i]}"`,
      );
    }
  }
  return buildAugmentedChordProgressionForStage({
    mapCategory: 'basic',
    stageNumber: 0,
    chordProgression: analyzed.progression,
    keyPolicy: { kind: 'inferred' },
  });
};

export const CHORD_RUN_INTERMEDIATE_MAP_IDS = [
  'snow_run_01',
  'dev_run_06',
  'dev_run_07',
  'dev_run_08',
  'dev_run_09',
  'dev_run_10',
] as const;

export const resolveChordRunIntermediateRunMapId = (stageNumber: number): string => {
  const offset = stageNumber - 140;
  const index = ((offset % CHORD_RUN_INTERMEDIATE_MAP_IDS.length) + CHORD_RUN_INTERMEDIATE_MAP_IDS.length)
    % CHORD_RUN_INTERMEDIATE_MAP_IDS.length;
  return CHORD_RUN_INTERMEDIATE_MAP_IDS[index] ?? 'snow_run_01';
};
