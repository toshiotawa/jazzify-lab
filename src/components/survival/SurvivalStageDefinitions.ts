/**
 * サバイバル ステージモード ステージ定義
 * - メタ情報は Supabase の survival_stages テーブルが正となる。
 * - ランダムタイプの allowedChords は実行時に生成（buildAllowedChords / buildMixedAllowedChords）。
 * - Progression（コード進行）タイプは `chord_progression` JSONB カラムに保存された
 *   `[{ name, voicing }]` 配列をそのままコード列として使う。MusicXML は使用しない。
 */

import {
  SurvivalDifficulty,
  SurvivalMapCategory,
  DEFAULT_SURVIVAL_MAP_CATEGORY,
  SURVIVAL_MAP_CATEGORIES,
} from './SurvivalTypes';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { buildAllowedChordsForSuffix } from '@/utils/survivalQuestionTypes';

export type RootPattern = 'cde' | 'fgab' | 'sharp' | 'flat' | 'all';

export type StageType = 'random' | 'progression';

export type MixedGroupKey = 'easy' | 'normalA' | 'normalB' | 'hard' | 'extreme';

/**
 * ブロックキーは Supabase `survival_stage_blocks.block_key` の値そのまま。
 * クライアント側で固定列挙はせず、DB に追加された任意のキーを受け入れる。
 */
export type BlockKey = string;

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
  /** マップカテゴリ（basic / songs / phrases / lesson） */
  mapCategory: SurvivalMapCategory;
  /** DB `lesson_only`。マップ非表示のレッスン専用行など */
  lessonOnly?: boolean;
}

/**
 * Progression ステージ用 1 コード分のエントリ。
 * - `name`: 表示用コード名（例: "FM7", "G7"）
 * - `voicing`: 演奏する MIDI ノート番号（実音域。練習モードの鍵盤ハイライト用）
 *   正解判定はオクターブ無視（mod 12）で行う。
 * - `voicingNames` / `keyFifths`: DB の `voicing_names` / `key_fifths`。旧クライアントは ignore、未設定時は生成フォールバック。
 */
export interface SurvivalChordProgressionEntry {
  name: string;
  voicing: number[];
  voicingNames?: readonly string[];
  keyFifths?: number;
  /** MusicXML 準拠: 1 = ト音、2 = ヘ音（大譜表テスト・チュートリアル向け）。 */
  voicing_staves?: readonly (1 | 2)[];
}

type SurvivalStageBattleKind = 'random' | 'progression' | 'boss';

export function getSurvivalStageBattleKind(stageType: StageType, isBlockLast: boolean): SurvivalStageBattleKind {
  if (isBlockLast) {
    return 'boss';
  }
  return stageType === 'progression' ? 'progression' : 'random';
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

function buildMixedAllowedChords(suffixes: string[]): string[] {
  const combined: string[] = [];
  for (const suffix of suffixes) {
    combined.push(...buildAllowedChordsForSuffix(ROOT_ALL, suffix));
  }
  return combined;
}

interface SurvivalStageBlockRow {
  map_category: SurvivalMapCategory;
  block_key: BlockKey;
  label: string;
  label_en: string;
  sort_order: number;
}

const BLOCK_LABELS_FROM_DB: Record<
  SurvivalMapCategory,
  Record<string, { ja: string; en: string }>
> = {
  basic: {},
  songs: {},
  phrases: {},
  lesson: {},
};

const BLOCK_SORT_ORDER_FROM_DB: Record<SurvivalMapCategory, Map<string, number>> = {
  basic: new Map(),
  songs: new Map(),
  phrases: new Map(),
  lesson: new Map(),
};

function applySurvivalStageBlockLabels(rows: SurvivalStageBlockRow[]): void {
  for (const c of SURVIVAL_MAP_CATEGORIES) {
    BLOCK_LABELS_FROM_DB[c] = {};
    BLOCK_SORT_ORDER_FROM_DB[c].clear();
  }
  for (const row of rows) {
    if (!SURVIVAL_MAP_CATEGORIES.includes(row.map_category)) continue;
    const ja = row.label.trim();
    const en = row.label_en.trim();
    if (!ja || !en) continue;
    BLOCK_LABELS_FROM_DB[row.map_category][row.block_key] = { ja, en };
    BLOCK_SORT_ORDER_FROM_DB[row.map_category].set(row.block_key, row.sort_order);
  }
}

export function resolveSurvivalBlockLabel(
  category: SurvivalMapCategory,
  blockKey: BlockKey,
): { ja: string; en: string } | undefined {
  return BLOCK_LABELS_FROM_DB[category][blockKey];
}

export function resolveSurvivalBlockSortOrder(
  category: SurvivalMapCategory,
  blockKey: BlockKey,
): number | undefined {
  return BLOCK_SORT_ORDER_FROM_DB[category].get(blockKey);
}

function survivalStageBlockRowFromRecord(row: Record<string, unknown>): SurvivalStageBlockRow | null {
  const rawCategory = typeof row.map_category === 'string' ? row.map_category : '';
  const mapCategory: SurvivalMapCategory | null = SURVIVAL_MAP_CATEGORIES.includes(rawCategory as SurvivalMapCategory)
    ? (rawCategory as SurvivalMapCategory)
    : null;
  if (!mapCategory) return null;
  const blockKeyRaw = typeof row.block_key === 'string' ? row.block_key.trim() : '';
  if (!blockKeyRaw) return null;
  const label = typeof row.label === 'string' ? row.label.trim() : '';
  const label_en = typeof row.label_en === 'string' ? row.label_en.trim() : '';
  if (!label || !label_en) return null;
  const sortOrderRaw = row.sort_order;
  const sortOrder = typeof sortOrderRaw === 'number' && Number.isFinite(sortOrderRaw)
    ? sortOrderRaw
    : Number.MAX_SAFE_INTEGER;
  return { map_category: mapCategory, block_key: blockKeyRaw, label, label_en, sort_order: sortOrder };
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

    let voicingNames: string[] | undefined;
    const vn = record.voicing_names;
    if (Array.isArray(vn)) {
      const acc: string[] = [];
      for (const item of vn) {
        const s = typeof item === 'string' ? item.trim() : '';
        if (s) acc.push(s);
      }
      if (acc.length === voicing.length) {
        voicingNames = acc;
      }
    }

    const keyFifthsRaw = record.key_fifths;
    let keyFifths: number | undefined;
    if (typeof keyFifthsRaw === 'number' && Number.isFinite(keyFifthsRaw)) {
      keyFifths = Math.trunc(keyFifthsRaw);
    } else if (typeof keyFifthsRaw === 'string' && keyFifthsRaw.trim() !== '') {
      const parsed = Number(keyFifthsRaw);
      if (Number.isFinite(parsed)) keyFifths = Math.trunc(parsed);
    }

    entries.push({
      name,
      voicing,
      ...(voicingNames !== undefined ? { voicingNames } : {}),
      ...(keyFifths !== undefined ? { keyFifths } : {}),
    });
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
  const rawCategory = typeof row.map_category === 'string' ? (row.map_category as string) : DEFAULT_SURVIVAL_MAP_CATEGORY;
  const mapCategory: SurvivalMapCategory = SURVIVAL_MAP_CATEGORIES.includes(rawCategory as SurvivalMapCategory)
    ? (rawCategory as SurvivalMapCategory)
    : DEFAULT_SURVIVAL_MAP_CATEGORY;
  const lessonOnly = Boolean(row.lesson_only);

  let allowedChords: string[] = [];
  if (stageType === 'random') {
    if (isMixedStage && mixedGroupKey && MIXED_GROUP_SUFFIXES[mixedGroupKey]) {
      allowedChords = buildMixedAllowedChords(MIXED_GROUP_SUFFIXES[mixedGroupKey]);
    } else if (rootPattern && ROOTS_BY_PATTERN[rootPattern]) {
      allowedChords = buildAllowedChordsForSuffix(ROOTS_BY_PATTERN[rootPattern], chordSuffix);
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
    mapCategory,
    ...(lessonOnly ? { lessonOnly: true } : {}),
  };
}

const LOCAL_CACHE_KEY = 'survival_stages_cache_v2';

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
 * カテゴリ別のステージ一覧。
 * fetchAllStages() で初期化されるまで空配列。
 */
const STAGES_BY_CATEGORY: Record<SurvivalMapCategory, StageDefinition[]> = {
  basic: [],
  songs: [],
  phrases: [],
  lesson: [],
};

/**
 * 互換用: Basic マップの全ステージを返す（既存コード参照のため）。
 * 新規コードは getStagesByCategory(category) を使うこと。
 */
export let ALL_STAGES: StageDefinition[] = [];
/** 互換用: Basic マップの総ステージ数 */
export let TOTAL_STAGES = 0;

function applyStageCaches(stages: StageDefinition[]): void {
  STAGES_BY_CATEGORY.basic = stages.filter(s => s.mapCategory === 'basic');
  STAGES_BY_CATEGORY.songs = stages.filter(s => s.mapCategory === 'songs');
  STAGES_BY_CATEGORY.phrases = stages.filter(s => s.mapCategory === 'phrases');
  STAGES_BY_CATEGORY.lesson = stages.filter(s => s.mapCategory === 'lesson');
  ALL_STAGES = STAGES_BY_CATEGORY.basic;
  TOTAL_STAGES = STAGES_BY_CATEGORY.basic.length;
}

let fetchPromise: Promise<StageDefinition[]> | null = null;

export const STAGE_TIME_LIMIT_SECONDS = 90;
export const STAGE_KILL_QUOTA = 150;
/** 第一ブロック通常ステージ（ボス除く）の撃破ノルマ。Basic / Songs / Phrases 共通。 */
export const STAGE_FIRST_BLOCK_KILL_QUOTA = 10;
/** 第一ブロックボス戦の HP。 */
export const STAGE_FIRST_BLOCK_BOSS_MAX_HP = 7000;
/** 通常ステージ（非 Phrases・非ボス）のプレイヤー初期 HP。Phrases 1000・ボス戦は別定数。 */
export const STAGE_PLAYER_MAX_HP = 800;

/**
 * survival_stages を Supabase から取得し、カテゴリ別キャッシュを更新する。
 * 結果はメモリ + localStorage にキャッシュされる。
 */
export async function fetchAllStages(): Promise<StageDefinition[]> {
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const supabase = getSupabaseClient();
      const [stagesResponse, blocksResponse] = await Promise.all([
        supabase
          .from('survival_stages')
          .select('*')
          .order('map_category', { ascending: true })
          .order('stage_number', { ascending: true }),
        supabase
          .from('survival_stage_blocks')
          .select('map_category, block_key, label, label_en, sort_order')
          .order('map_category', { ascending: true })
          .order('sort_order', { ascending: true }),
      ]);
      if (stagesResponse.error) throw stagesResponse.error;
      if (blocksResponse.error) {
        applySurvivalStageBlockLabels([]);
      } else {
        const blockRows = (blocksResponse.data ?? [])
          .map(r => survivalStageBlockRowFromRecord(r as Record<string, unknown>))
          .filter((x): x is SurvivalStageBlockRow => x !== null);
        applySurvivalStageBlockLabels(blockRows);
      }
      const rows = (stagesResponse.data ?? []) as Array<Record<string, unknown>>;
      if (rows.length === 0) {
        const cached = readLocalCache();
        if (cached) {
          applySurvivalStageBlockLabels([]);
          applyStageCaches(cached);
          return cached;
        }
        return [];
      }
      const stages = rows.map(rowToStageDefinition);
      applyStageCaches(stages);
      writeLocalCache(rows);
      return stages;
    } catch {
      applySurvivalStageBlockLabels([]);
      const cached = readLocalCache();
      if (cached) {
        applyStageCaches(cached);
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
  STAGES_BY_CATEGORY.basic = [];
  STAGES_BY_CATEGORY.songs = [];
  STAGES_BY_CATEGORY.phrases = [];
  STAGES_BY_CATEGORY.lesson = [];
  ALL_STAGES = [];
  TOTAL_STAGES = 0;
  applySurvivalStageBlockLabels([]);
}

/** カテゴリ別のステージ一覧を返す（参照のみ。配列を変更しないこと） */
export function getStagesByCategory(category: SurvivalMapCategory): StageDefinition[] {
  return STAGES_BY_CATEGORY[category];
}

/** カテゴリ別の総ステージ数を返す */
export function getTotalStagesByCategory(category: SurvivalMapCategory): number {
  return STAGES_BY_CATEGORY[category].length;
}

export function getStageByNumber(
  stageNumber: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): StageDefinition | undefined {
  return STAGES_BY_CATEGORY[mapCategory].find(s => s.stageNumber === stageNumber);
}

export function getDifficultyForStage(
  stageNumber: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): SurvivalDifficulty {
  const stage = getStageByNumber(stageNumber, mapCategory);
  return stage?.difficulty ?? 'easy';
}

/** 指定ステージが所属ブロックの最終ステージ（扉の敵＝ボス戦）かを判定する */
export function isBlockLastStage(
  stageNumber: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): boolean {
  const current = getStageByNumber(stageNumber, mapCategory);
  if (!current) return false;
  const next = getStageByNumber(stageNumber + 1, mapCategory);
  if (!next) return true;
  return next.blockKey !== current.blockKey;
}

/** `lesson_songs.survival_map_category` / URL の mapCategory を正規化（不正・欠落時は basic） */
export function resolveLessonSurvivalMapCategory(raw: string | null | undefined): SurvivalMapCategory {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (v === 'basic' || v === 'songs' || v === 'phrases' || v === 'lesson') return v;
  return DEFAULT_SURVIVAL_MAP_CATEGORY;
}

export function findStageForLesson(
  stageNumber: number,
  mapCategory: SurvivalMapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
): StageDefinition | undefined {
  return getStageByNumber(stageNumber, mapCategory);
}

export function formatSurvivalStageModeLabel(stage: StageDefinition, isEnglish: boolean): string {
  if (stage.mapCategory === 'phrases') {
    return isEnglish ? 'Phrases' : 'フレーズ';
  }
  if (stage.stageType === 'progression') {
    return isEnglish ? 'Progression' : 'コード進行';
  }
  return isEnglish ? 'Random' : 'ランダム';
}

export function formatSurvivalEncounterLabel(stage: StageDefinition, isEnglish: boolean): string {
  const boss = isBlockLastStage(stage.stageNumber, stage.mapCategory);
  return boss ? (isEnglish ? 'Boss' : 'ボス') : (isEnglish ? 'Regular' : '通常');
}

export type SurvivalBossType = 'A' | 'B' | 'C';

const BOSS_TYPE_ROTATION: readonly SurvivalBossType[] = ['A', 'B', 'C'];

/** ブロック並び順 (blockIndex) からボスタイプ A→B→C をローテーション。 */
export function bossTypeForBlockIndex(blockIndex: number): SurvivalBossType {
  const safe = Number.isFinite(blockIndex) ? Math.trunc(blockIndex) : 0;
  return BOSS_TYPE_ROTATION[((safe % 3) + 3) % 3];
}
