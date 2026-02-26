/**
 * サバイバル ステージモード ステージ定義
 * 全105ステージ: 21コードタイプ × 5ルートパターン
 */

import { SurvivalDifficulty } from './SurvivalTypes';

export type RootPattern = 'cde' | 'fgab' | 'sharp' | 'flat' | 'all';

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
  suffix: string;
  displayJa: string;
  displayEn: string;
  difficulty: SurvivalDifficulty;
}

const CHORD_TYPES: ChordTypeDef[] = [
  // Easy (2)
  { suffix: '', displayJa: 'メジャー', displayEn: 'Major', difficulty: 'easy' },
  { suffix: 'm', displayJa: 'マイナー', displayEn: 'Minor', difficulty: 'easy' },
  // Normal (9)
  { suffix: 'M7', displayJa: 'M7', displayEn: 'M7', difficulty: 'normal' },
  { suffix: 'm7', displayJa: 'm7', displayEn: 'm7', difficulty: 'normal' },
  { suffix: '7', displayJa: '7', displayEn: '7', difficulty: 'normal' },
  { suffix: 'm7b5', displayJa: 'm7b5', displayEn: 'm7b5', difficulty: 'normal' },
  { suffix: 'mM7', displayJa: 'mM7', displayEn: 'mM7', difficulty: 'normal' },
  { suffix: 'dim7', displayJa: 'dim7', displayEn: 'dim7', difficulty: 'normal' },
  { suffix: 'aug7', displayJa: 'aug7', displayEn: 'aug7', difficulty: 'normal' },
  { suffix: '6', displayJa: '6', displayEn: '6', difficulty: 'normal' },
  { suffix: 'm6', displayJa: 'm6', displayEn: 'm6', difficulty: 'normal' },
  // Hard (6)
  { suffix: 'M7(9)', displayJa: 'M7(9)', displayEn: 'M7(9)', difficulty: 'hard' },
  { suffix: 'm7(9)', displayJa: 'm7(9)', displayEn: 'm7(9)', difficulty: 'hard' },
  { suffix: '7(9.6th)', displayJa: '7(9.13)', displayEn: '7(9.13)', difficulty: 'hard' },
  { suffix: '7(b9.b6th)', displayJa: '7(b9.b13)', displayEn: '7(b9.b13)', difficulty: 'hard' },
  { suffix: '6(9)', displayJa: '6(9)', displayEn: '6(9)', difficulty: 'hard' },
  { suffix: 'm6(9)', displayJa: 'm6(9)', displayEn: 'm6(9)', difficulty: 'hard' },
  // Extreme (4)
  { suffix: '7(b9.6th)', displayJa: '7(b9.13)', displayEn: '7(b9.13)', difficulty: 'extreme' },
  { suffix: '7(#9.b6th)', displayJa: '7(#9.b13)', displayEn: '7(#9.b13)', difficulty: 'extreme' },
  { suffix: 'm7(b5)(11)', displayJa: 'm7(b5)(11)', displayEn: 'm7(b5)(11)', difficulty: 'extreme' },
  { suffix: 'dim(M7)', displayJa: 'dim(M7)', displayEn: 'dim(M7)', difficulty: 'extreme' },
];

function buildAllowedChords(roots: string[], suffix: string): string[] {
  return roots.map(r => `${r}${suffix}`);
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
