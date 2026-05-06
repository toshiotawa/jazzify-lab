/**
 * サバイバル ステージモード ステージ定義
 * - メタ情報は Supabase の survival_stages テーブルが正となる。
 * - ランダムタイプの allowedChords は実行時に生成（buildAllowedChords / buildMixedAllowedChords）。
 * - Progression（コード進行）タイプは `chord_progression` JSONB カラムに保存された
 *   `[{ name, voicing }]` 配列をそのままコード列として使う。MusicXML は使用しない。
 */

import { SurvivalDifficulty } from './SurvivalTypes';
import { getSupabaseClient } from '@/platform/supabaseClient';

export type RootPattern = 'cde' | 'fgab' | 'sharp' | 'flat' | 'all';

export type StageType = 'random' | 'progression';

export type MixedGroupKey = 'easy' | 'normalA' | 'normalB' | 'hard' | 'extreme';

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
  /** ステージ種別: 'random' = 既存の出題, 'progression' = コード進行 */
  stageType: StageType;
  chordSuffix: string;
  chordDisplayName: string;
  chordDisplayNameEn: string;
  rootPattern: RootPattern | null;
  rootPatternName: string;
  rootPatternNameEn: string;
  /** ランダム出題用コード集合（progression時は空配列でも可） */
  allowedChords: string[];
  /** 所属ブロック */
  blockKey: BlockKey;
  /** ブロック末尾の Mixed ステージ */
  isMixedStage?: boolean;
  /** Mixed の対象難易度グループ（DB由来） */
  mixedGroupKey?: MixedGroupKey;
  /** Progressionタイプ用コード進行（DB `chord_progression` の値）。Random時は undefined。 */
  chordProgression?: SurvivalChordProgressionEntry[];
}

/**
 * Progression ステージ用 1 コード分のエントリ。
 * - `name`: 表示用コード名（例: "FM7", "G7"）
 * - `voicing`: 演奏する MIDI ノート番号（実音域。練習モードの鍵盤ハイライト用）
 *   正解判定はオクターブ無視（mod 12）で行う。
 */
export interface SurvivalChordProgressionEntry {
  name: string;
  voicing: number[];
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

/** 難易度グループ別 Mixed の対象コードタイプ suffix 群 */
const MIXED_GROUP_SUFFIXES: Record<MixedGroupKey, string[]> = {
  easy: ['', 'm'],
  normalA: ['M7', 'm7', '7', 'm7b5'],
  normalB: ['mM7', 'dim7', 'aug7', '6', 'm6'],
  hard: ['M7(9)', 'm7(9)', '7(9.6th)', '7(b9.b6th)', '6(9)', 'm6(9)'],
  extreme: ['7(b9.6th)', '7(#9.b6th)', 'm7(b5)(11)', 'dim(M7)'],
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

/** chord_progression JSONB の正規化（不正値はスキップ） */
function parseChordProgression(raw: unknown): SurvivalChordProgressionEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const entries: SurvivalChordProgressionEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const name = typeof record.name === 'string' ? record.name.trim() : '';
    const voicingRaw = record.voicing;
    if (!name || !Array.isArray(voicingRaw)) continue;
    const voicing: number[] = [];
    for (const v of voicingRaw) {
      const num = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(num)) voicing.push(Math.round(num));
    }
    if (voicing.length === 0) continue;
    entries.push({ name, voicing });
  }
  return entries.length > 0 ? entries : undefined;
}

/** survival_stages 行 → StageDefinition への変換（ランダムタイプの allowedChords を実行時生成） */
function rowToStageDefinition(row: Record<string, unknown>): StageDefinition {
  const stageType: StageType = (row.stage_type as StageType) || 'random';
  const isMixedStage = Boolean(row.is_mixed_stage);
  const mixedGroupKey = (row.mixed_group_key as MixedGroupKey | null) ?? undefined;
  const chordSuffix = (row.chord_suffix as string) ?? '';
  const rootPattern = (row.root_pattern as RootPattern | null) ?? null;

  let allowedChords: string[] = [];
  if (stageType === 'random') {
    if (isMixedStage && mixedGroupKey && MIXED_GROUP_SUFFIXES[mixedGroupKey]) {
      allowedChords = buildMixedAllowedChords(MIXED_GROUP_SUFFIXES[mixedGroupKey]);
    } else if (rootPattern && ROOTS_BY_PATTERN[rootPattern]) {
      allowedChords = buildAllowedChords(ROOTS_BY_PATTERN[rootPattern], chordSuffix);
    }
  }

  return {
    stageNumber: Number(row.stage_number),
    name: row.name as string,
    nameEn: row.name_en as string,
    difficulty: row.difficulty as SurvivalDifficulty,
    stageType,
    chordSuffix,
    chordDisplayName: (row.chord_display_name as string) ?? '',
    chordDisplayNameEn: (row.chord_display_name_en as string) ?? '',
    rootPattern,
    rootPatternName: (row.root_pattern_name as string) ?? '',
    rootPatternNameEn: (row.root_pattern_name_en as string) ?? '',
    allowedChords,
    blockKey: row.block_key as BlockKey,
    isMixedStage,
    mixedGroupKey,
    chordProgression: parseChordProgression(row.chord_progression),
  };
}

const LOCAL_CACHE_KEY = 'survival_stages_cache_v1';

function readLocalCache(): StageDefinition[] | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map(rowToStageDefinition);
  } catch {
    return null;
  }
}

function writeLocalCache(rows: Array<Record<string, unknown>>): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(rows));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * グローバルにキャッシュされたステージ一覧。
 * fetchAllStages() で初期化されるまで空配列。
 */
export let ALL_STAGES: StageDefinition[] = [];
export let TOTAL_STAGES = 0;

let fetchPromise: Promise<StageDefinition[]> | null = null;

export const STAGE_TIME_LIMIT_SECONDS = 90;
export const STAGE_KILL_QUOTA = 150;

/**
 * survival_stages を Supabase から取得し、`ALL_STAGES` を更新する。
 * 結果はメモリ + localStorage にキャッシュされる。
 */
export async function fetchAllStages(): Promise<StageDefinition[]> {
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('survival_stages')
        .select('*')
        .order('stage_number', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      if (rows.length === 0) {
        const cached = readLocalCache();
        if (cached) {
          ALL_STAGES = cached;
          TOTAL_STAGES = cached.length;
          return cached;
        }
        return [];
      }
      const stages = rows.map(rowToStageDefinition);
      ALL_STAGES = stages;
      TOTAL_STAGES = stages.length;
      writeLocalCache(rows);
      return stages;
    } catch {
      const cached = readLocalCache();
      if (cached) {
        ALL_STAGES = cached;
        TOTAL_STAGES = cached.length;
        return cached;
      }
      return [];
    } finally {
      // 一度成功したら以後はメモリキャッシュを使う
    }
  })();

  return fetchPromise;
}

/** テスト/再ロード用: キャッシュをクリアし次回 fetch を強制する */
export function resetStageCache(): void {
  fetchPromise = null;
  ALL_STAGES = [];
  TOTAL_STAGES = 0;
}

export function getStageByNumber(stageNumber: number): StageDefinition | undefined {
  return ALL_STAGES.find(s => s.stageNumber === stageNumber);
}

export function getDifficultyForStage(stageNumber: number): SurvivalDifficulty {
  const stage = getStageByNumber(stageNumber);
  return stage?.difficulty ?? 'easy';
}

/** 指定ステージが所属ブロックの最終ステージ（扉の敵＝ボス戦）かを判定する */
export function isBlockLastStage(stageNumber: number): boolean {
  const current = getStageByNumber(stageNumber);
  if (!current) return false;
  const next = getStageByNumber(stageNumber + 1);
  if (!next) return true;
  return next.blockKey !== current.blockKey;
}

/** ブロックキーの出現順（21 要素） */
const BLOCK_ORDER: BlockKey[] = [
  'major',
  'minor',
  'M7',
  'm7',
  '7',
  'm7b5',
  'mM7',
  'dim7',
  'aug7',
  '6',
  'm6',
  'M7_9',
  'm7_9',
  '7_9_13',
  '7_b9_b13',
  '6_9',
  'm6_9',
  '7_b9_13',
  '7_sharp9_b13',
  'm7b5_11',
  'dimM7',
];

export type SurvivalBossType = 'A' | 'B' | 'C';

/** ブロック順にボスタイプ A→B→C をローテーション */
export function getBossTypeForBlock(blockKey: BlockKey): SurvivalBossType {
  const index = BLOCK_ORDER.indexOf(blockKey);
  const safeIndex = index < 0 ? 0 : index;
  const types: SurvivalBossType[] = ['A', 'B', 'C'];
  return types[((safeIndex % 3) + 3) % 3];
}
