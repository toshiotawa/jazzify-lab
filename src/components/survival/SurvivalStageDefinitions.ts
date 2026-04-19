/**
 * サバイバル ステージモード ステージ定義
 * 21ブロック構成（コードタイプ単位、各5ステージ。ミックスを含むブロックのみ6ステージ）
 * 合計 110 ステージ = 21 × 5 + 5 Mixed
 */

import { SurvivalDifficulty } from './SurvivalTypes';

export type RootPattern = 'cde' | 'fgab' | 'sharp' | 'flat' | 'all';

/** 21ブロックのコードタイプID（UI用・順序はステージ番号順） */
export type BlockKey =
  | 'major'
  | 'minor'
  | 'M7'
  | 'm7'
  | '7'
  | 'm7b5'
  | 'mM7'
  | 'dim7'
  | 'aug7'
  | '6'
  | 'm6'
  | 'M7_9'
  | 'm7_9'
  | '7_9_13'
  | '7_b9_b13'
  | '6_9'
  | 'm6_9'
  | '7_b9_13'
  | '7_sharp9_b13'
  | 'm7b5_11'
  | 'dimM7';

export interface StageDefinition {
  stageNumber: number;
  name: string;
  nameEn: string;
  difficulty: SurvivalDifficulty;
  chordSuffix: string;
  chordDisplayName: string;
  chordDisplayNameEn: string;
  rootPattern: RootPattern;
  rootPatternName: string;
  rootPatternNameEn: string;
  allowedChords: string[];
  /** 所属ブロック */
  blockKey: BlockKey;
  /** ブロック末尾の Mixed ステージ（そのブロックのコードタイプ群のミックス） */
  isMixedStage?: boolean;
}

const ROOT_CDE = ['C', 'D', 'E'];
const ROOT_FGAB = ['F', 'G', 'A', 'B'];
const ROOT_SHARP = ['C#', 'D#', 'F#', 'G#', 'A#'];
const ROOT_FLAT = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];
const ROOT_ALL = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

const ROOTS_BY_PATTERN: Record<RootPattern, string[]> = {
  cde: ROOT_CDE,
  fgab: ROOT_FGAB,
  sharp: ROOT_SHARP,
  flat: ROOT_FLAT,
  all: ROOT_ALL,
};

const PATTERN_NAMES: Record<RootPattern, { ja: string; en: string }> = {
  cde: { ja: 'CDE', en: 'CDE' },
  fgab: { ja: 'FGAB', en: 'FGAB' },
  sharp: { ja: '#系のみ', en: 'Sharps' },
  flat: { ja: '♭系のみ', en: 'Flats' },
  all: { ja: '白鍵黒鍵全て', en: 'All Keys' },
};

const PATTERNS: RootPattern[] = ['cde', 'fgab', 'sharp', 'flat', 'all'];

interface ChordTypeDef {
  blockKey: BlockKey;
  suffix: string;
  displayJa: string;
  displayEn: string;
  difficulty: SurvivalDifficulty;
  /** true のときこのブロック末尾に難易度グループ用 Mixed ステージを挿入 */
  trailingMixedGroup?: 'easy' | 'normalA' | 'normalB' | 'hard' | 'extreme';
}

const CHORD_TYPES: ChordTypeDef[] = [
  // Easy (2 blocks)
  { blockKey: 'major', suffix: '', displayJa: 'メジャー', displayEn: 'Major', difficulty: 'easy' },
  { blockKey: 'minor', suffix: 'm', displayJa: 'マイナー', displayEn: 'Minor', difficulty: 'easy', trailingMixedGroup: 'easy' },
  // Normal 前半 (4 blocks)
  { blockKey: 'M7', suffix: 'M7', displayJa: 'M7', displayEn: 'M7', difficulty: 'normal' },
  { blockKey: 'm7', suffix: 'm7', displayJa: 'm7', displayEn: 'm7', difficulty: 'normal' },
  { blockKey: '7', suffix: '7', displayJa: '7', displayEn: '7', difficulty: 'normal' },
  { blockKey: 'm7b5', suffix: 'm7b5', displayJa: 'm7b5', displayEn: 'm7b5', difficulty: 'normal', trailingMixedGroup: 'normalA' },
  // Normal 後半 (5 blocks)
  { blockKey: 'mM7', suffix: 'mM7', displayJa: 'mM7', displayEn: 'mM7', difficulty: 'normal' },
  { blockKey: 'dim7', suffix: 'dim7', displayJa: 'dim7', displayEn: 'dim7', difficulty: 'normal' },
  { blockKey: 'aug7', suffix: 'aug7', displayJa: 'aug7', displayEn: 'aug7', difficulty: 'normal' },
  { blockKey: '6', suffix: '6', displayJa: '6', displayEn: '6', difficulty: 'normal' },
  { blockKey: 'm6', suffix: 'm6', displayJa: 'm6', displayEn: 'm6', difficulty: 'normal', trailingMixedGroup: 'normalB' },
  // Hard (6 blocks)
  { blockKey: 'M7_9', suffix: 'M7(9)', displayJa: 'M7(9)', displayEn: 'M7(9)', difficulty: 'hard' },
  { blockKey: 'm7_9', suffix: 'm7(9)', displayJa: 'm7(9)', displayEn: 'm7(9)', difficulty: 'hard' },
  { blockKey: '7_9_13', suffix: '7(9.6th)', displayJa: '7(9.13)', displayEn: '7(9.13)', difficulty: 'hard' },
  { blockKey: '7_b9_b13', suffix: '7(b9.b6th)', displayJa: '7(b9.b13)', displayEn: '7(b9.b13)', difficulty: 'hard' },
  { blockKey: '6_9', suffix: '6(9)', displayJa: '6(9)', displayEn: '6(9)', difficulty: 'hard' },
  { blockKey: 'm6_9', suffix: 'm6(9)', displayJa: 'm6(9)', displayEn: 'm6(9)', difficulty: 'hard', trailingMixedGroup: 'hard' },
  // Extreme (4 blocks)
  { blockKey: '7_b9_13', suffix: '7(b9.6th)', displayJa: '7(b9.13)', displayEn: '7(b9.13)', difficulty: 'extreme' },
  { blockKey: '7_sharp9_b13', suffix: '7(#9.b6th)', displayJa: '7(#9.b13)', displayEn: '7(#9.b13)', difficulty: 'extreme' },
  { blockKey: 'm7b5_11', suffix: 'm7(b5)(11)', displayJa: 'm7(b5)(11)', displayEn: 'm7(b5)(11)', difficulty: 'extreme' },
  { blockKey: 'dimM7', suffix: 'dim(M7)', displayJa: 'dim(M7)', displayEn: 'dim(M7)', difficulty: 'extreme', trailingMixedGroup: 'extreme' },
];

/** 難易度グループ別 Mixed の対象コードタイプ suffix 群 */
const MIXED_GROUPS: Record<Exclude<ChordTypeDef['trailingMixedGroup'], undefined>, { suffixes: string[]; difficulty: SurvivalDifficulty; blockKey: BlockKey }> = {
  easy: { suffixes: ['', 'm'], difficulty: 'easy', blockKey: 'minor' },
  normalA: { suffixes: ['M7', 'm7', '7', 'm7b5'], difficulty: 'normal', blockKey: 'm7b5' },
  normalB: { suffixes: ['mM7', 'dim7', 'aug7', '6', 'm6'], difficulty: 'normal', blockKey: 'm6' },
  hard: { suffixes: ['M7(9)', 'm7(9)', '7(9.6th)', '7(b9.b6th)', '6(9)', 'm6(9)'], difficulty: 'hard', blockKey: 'm6_9' },
  extreme: { suffixes: ['7(b9.6th)', '7(#9.b6th)', 'm7(b5)(11)', 'dim(M7)'], difficulty: 'extreme', blockKey: 'dimM7' },
};

function buildAllowedChords(roots: string[], suffix: string): string[] {
  return roots.map(r => `${r}${suffix}`);
}

function buildMixedAllowedChords(suffixes: string[]): string[] {
  const combined: string[] = [];
  for (const suffix of suffixes) {
    combined.push(...buildAllowedChords(ROOT_ALL, suffix));
  }
  return combined;
}

function generateAllStages(): StageDefinition[] {
  const stages: StageDefinition[] = [];
  let stageNum = 1;

  for (const chordType of CHORD_TYPES) {
    for (const pattern of PATTERNS) {
      const roots = ROOTS_BY_PATTERN[pattern];
      const patternName = PATTERN_NAMES[pattern];
      stages.push({
        stageNumber: stageNum,
        name: `${stageNum}. ${chordType.displayJa} ${patternName.ja}`,
        nameEn: `${stageNum}. ${chordType.displayEn} ${patternName.en}`,
        difficulty: chordType.difficulty,
        chordSuffix: chordType.suffix,
        chordDisplayName: chordType.displayJa,
        chordDisplayNameEn: chordType.displayEn,
        rootPattern: pattern,
        rootPatternName: patternName.ja,
        rootPatternNameEn: patternName.en,
        allowedChords: buildAllowedChords(roots, chordType.suffix),
        blockKey: chordType.blockKey,
      });
      stageNum++;
    }

    if (chordType.trailingMixedGroup) {
      const group = MIXED_GROUPS[chordType.trailingMixedGroup];
      const patternAll = PATTERN_NAMES.all;
      stages.push({
        stageNumber: stageNum,
        name: `${stageNum}. ミックス ${patternAll.ja}`,
        nameEn: `${stageNum}. Mixed ${patternAll.en}`,
        difficulty: group.difficulty,
        chordSuffix: 'mixed',
        chordDisplayName: 'ミックス',
        chordDisplayNameEn: 'Mixed',
        rootPattern: 'all',
        rootPatternName: patternAll.ja,
        rootPatternNameEn: patternAll.en,
        allowedChords: buildMixedAllowedChords(group.suffixes),
        blockKey: group.blockKey,
        isMixedStage: true,
      });
      stageNum++;
    }
  }

  return stages;
}

export const ALL_STAGES: StageDefinition[] = generateAllStages();
export const TOTAL_STAGES = ALL_STAGES.length;
export const STAGE_TIME_LIMIT_SECONDS = 90;
export const STAGE_KILL_QUOTA = 300;

export function getStageByNumber(stageNumber: number): StageDefinition | undefined {
  return ALL_STAGES.find(s => s.stageNumber === stageNumber);
}

export function getDifficultyForStage(stageNumber: number): SurvivalDifficulty {
  const stage = getStageByNumber(stageNumber);
  return stage?.difficulty ?? 'easy';
}
