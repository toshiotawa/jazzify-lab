/**
 * 既存の survival_stages.chord_progression を再ビルドし、
 * voicing_names / key_fifths を付与した JSON と UPDATE SQL を生成する。
 *
 * 実行時には使われない（マイグレーション生成 CLI 専用）。
 */
import type { SurvivalChordProgressionEntry } from '@/components/survival/SurvivalStageDefinitions';

import { buildProgressionChordKeyFifths } from './survivalProgressionKeyInference';
import {
  analyzeSurvivalChordProgression,
  buildStaffVoicingNamesForProgressionChord,
  classifySurvivalProgressionChordName,
} from './survivalProgressionVoicings';

/**
 * - inferred: II-V-I 自動判定（既存の `buildProgressionChordKeyFifths`）。
 * - fixed: 全コードに同じ key_fifths を割り当て（Blues / Songs ホームキー固定）。
 */
export type SurvivalStageKeyPolicy =
  | { readonly kind: 'inferred' }
  | { readonly kind: 'fixed'; readonly keyFifths: number };

export interface SurvivalProgressionStageMigrationInput {
  readonly mapCategory: 'songs' | 'basic';
  readonly stageNumber: number;
  readonly chordProgression: readonly SurvivalChordProgressionEntry[];
  readonly keyPolicy: SurvivalStageKeyPolicy;
}

export interface SurvivalProgressionDbChord {
  readonly name: string;
  readonly voicing: readonly number[];
  readonly voicing_names?: readonly string[];
  readonly key_fifths: number;
}

const ascendingStaffNames = (
  entry: SurvivalChordProgressionEntry,
): readonly string[] | null => {
  if (entry.voicing.length !== 4) return null;
  const distinctCount = new Set(entry.voicing.map(m => ((m % 12) + 12) % 12)).size;
  if (distinctCount !== entry.voicing.length) return null;
  const parallel = buildStaffVoicingNamesForProgressionChord({
    name: entry.name,
    voicing: entry.voicing,
  });
  if (!parallel || parallel.length !== entry.voicing.length) return null;
  const pairs = entry.voicing.map((midi, ix) => ({ midi, nm: parallel[ix] }));
  pairs.sort((a, b) => a.midi - b.midi);
  return pairs.map(p => p.nm);
};

const KEY_FIFTHS_MIN = -6;
const KEY_FIFTHS_MAX = 5;
const clampFifths = (k: number): number =>
  Math.max(KEY_FIFTHS_MIN, Math.min(KEY_FIFTHS_MAX, Math.trunc(k)));

/** コード名のみから voicing を再生成（種別の半音定義変更時の DB 再投入用）。 */
export const rebuildProgressionVoicingsFromNames = (
  names: readonly string[],
): SurvivalChordProgressionEntry[] => {
  if (names.length === 0) {
    throw new Error('rebuildProgressionVoicingsFromNames: empty names');
  }
  const input = names.join(' ');
  const result = analyzeSurvivalChordProgression(input);
  if (result.progression.length !== names.length) {
    throw new Error(
      `rebuildProgressionVoicingsFromNames: expected ${names.length} chords, got ${result.progression.length}`,
    );
  }
  for (let i = 0; i < names.length; i += 1) {
    const expected = names[i];
    const actual = result.progression[i]?.name;
    if (actual !== expected) {
      throw new Error(
        `rebuildProgressionVoicingsFromNames: name mismatch at ${i}: "${actual}" vs "${expected}"`,
      );
    }
  }
  return [...result.progression];
};

export interface SurvivalSongsStageExportRow {
  readonly stageNumber: number;
  readonly mapCategory: 'songs' | 'basic';
  readonly chordNames: readonly string[];
  readonly keyFifths: readonly number[];
}

export const buildAugmentedFromChordNamesAndKeyFifths = (
  names: readonly string[],
  keyFifths: readonly number[],
): SurvivalProgressionDbChord[] => {
  if (names.length !== keyFifths.length) {
    throw new Error(
      `buildAugmentedFromChordNamesAndKeyFifths: names (${names.length}) vs keyFifths (${keyFifths.length})`,
    );
  }
  const progression = rebuildProgressionVoicingsFromNames(names);
  return progression.map((entry, idx) => {
    const namesForStaff = ascendingStaffNames(entry);
    const row: SurvivalProgressionDbChord = namesForStaff
      ? {
          name: entry.name,
          voicing: [...entry.voicing],
          voicing_names: [...namesForStaff],
          key_fifths: clampFifths(keyFifths[idx]),
        }
      : {
          name: entry.name,
          voicing: [...entry.voicing],
          key_fifths: clampFifths(keyFifths[idx]),
        };
    return row;
  });
};

export const buildSurvivalProgressionMigrationSqlFromStageExports = (
  rows: readonly SurvivalSongsStageExportRow[],
  header: string,
): string => {
  const lines: string[] = [];
  lines.push(header);
  lines.push('BEGIN;');
  lines.push('');
  for (const row of rows) {
    const chords = buildAugmentedFromChordNamesAndKeyFifths(row.chordNames, row.keyFifths);
    const json = JSON.stringify(chords);
    lines.push(`UPDATE public.survival_stages`);
    lines.push(`SET chord_progression = '${escapeSqlString(json)}'::jsonb`);
    lines.push(
      `WHERE map_category = '${row.mapCategory}' AND stage_number = ${row.stageNumber};`,
    );
    lines.push('');
  }
  lines.push('COMMIT;');
  return `${lines.join('\n')}\n`;
};

export const buildAugmentedChordProgressionForStage = (
  input: SurvivalProgressionStageMigrationInput,
): SurvivalProgressionDbChord[] => {
  const entries = input.chordProgression;
  const keys: number[] = (() => {
    if (input.keyPolicy.kind === 'fixed') {
      const fixed = clampFifths(input.keyPolicy.keyFifths);
      return entries.map(() => fixed);
    }
    const classed = entries.map(en => classifySurvivalProgressionChordName(en.name));
    return Array.from(buildProgressionChordKeyFifths(classed), clampFifths);
  })();

  return entries.map((entry, idx) => {
    const names = ascendingStaffNames(entry);
    const row: SurvivalProgressionDbChord = names
      ? {
          name: entry.name,
          voicing: [...entry.voicing],
          voicing_names: [...names],
          key_fifths: keys[idx],
        }
      : {
          name: entry.name,
          voicing: [...entry.voicing],
          key_fifths: keys[idx],
        };
    return row;
  });
};

const escapeSqlString = (value: string): string => value.replace(/'/g, "''");

export const buildSurvivalProgressionMigrationSql = (
  inputs: readonly SurvivalProgressionStageMigrationInput[],
  header: string,
): string => {
  const lines: string[] = [];
  lines.push(header);
  lines.push('BEGIN;');
  lines.push('');
  for (const inp of inputs) {
    const rows = buildAugmentedChordProgressionForStage(inp);
    const json = JSON.stringify(rows);
    lines.push(`UPDATE public.survival_stages`);
    lines.push(`SET chord_progression = '${escapeSqlString(json)}'::jsonb`);
    lines.push(`WHERE map_category = '${inp.mapCategory}' AND stage_number = ${inp.stageNumber};`);
    lines.push('');
  }
  lines.push('COMMIT;');
  return `${lines.join('\n')}\n`;
};
