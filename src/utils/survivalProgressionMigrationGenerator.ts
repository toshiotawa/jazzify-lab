/**
 * 既存の survival_stages.chord_progression を再ビルドし、
 * voicing_names / key_fifths を付与した JSON と UPDATE SQL を生成する。
 *
 * 実行時には使われない（マイグレーション生成 CLI 専用）。
 */
import type { SurvivalChordProgressionEntry } from '@/components/survival/SurvivalStageDefinitions';

import { buildProgressionChordKeyFifths } from './survivalProgressionKeyInference';
import {
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
