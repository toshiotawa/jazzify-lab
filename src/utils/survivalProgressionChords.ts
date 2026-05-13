/**
 * Progression（コード進行）ステージ用のコード列ヘルパー。
 *
 * - DB の `survival_stages.chord_progression` に保存された JSON を利用する。
 * - `voicing_names` / `key_fifths` はオプション。欠落時は補間する。
 */

import type { SurvivalChordProgressionEntry } from '@/components/survival/SurvivalStageDefinitions';

/** Web の `ChordDefinition` と構造互換（サバイバル Progression のみ）。Fantasy への依存を避ける。 */
export interface SurvivalProgressionBuiltChord {
  id: string;
  displayName: string;
  notes: number[];
  noteNames: string[];
  quality: 'progression';
  root: string;
  progressionStaffVoicingNames?: readonly string[];
  progressionStaffKeyFifths?: number;
}
import { parseChordName } from '@/utils/chord-utils';
import { buildProgressionChordKeyFifths } from '@/utils/survivalProgressionKeyInference';
import {
  buildStaffVoicingNamesForProgressionChord,
  classifySurvivalProgressionChordName,
} from '@/utils/survivalProgressionVoicings';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const midiToPitchClassLetter = (midi: number): string => {
  const pitchClass = ((midi % 12) + 12) % 12;
  return NOTE_NAMES[pitchClass];
};

const progressionChordSymbolRoot = (chordSymbol: string): string | null => {
  let numerator = chordSymbol.trim();
  if (numerator.includes('/')) {
    const parts = numerator.split('/');
    if (parts[0]) numerator = parts[0].trim();
  }
  const parsed = parseChordName(numerator);
  return parsed?.root ?? null;
};

const clampKeyFifths = (value: number): number => Math.max(-7, Math.min(7, Math.trunc(value)));

/** `ChordDefinition.notes` と同様に MIDI 昇順のスタッフ用文字列へ。 */
const progressionStaffAscendingNames = (entry: SurvivalChordProgressionEntry): readonly string[] => {
  const distinctCount = new Set<number>(entry.voicing.map(m => ((m % 12) + 12) % 12)).size;
  if (entry.voicing.length !== distinctCount) return [];

  let parallel = entry.voicingNames;
  if (!parallel || parallel.length !== entry.voicing.length) {
    if (entry.voicing.length === 4) {
      parallel = buildStaffVoicingNamesForProgressionChord({
        name: entry.name,
        voicing: entry.voicing,
      }) ?? [];
    } else {
      parallel = [];
    }
  }

  if (parallel.length !== entry.voicing.length) {
    return [];
  }

  type Pair = { readonly midi: number; readonly nm: string };

  const pairs: Pair[] = entry.voicing.map((midi, ix) => ({ midi, nm: parallel[ix] }));

  pairs.sort((p, q) => p.midi - q.midi);

  return pairs.map(p => p.nm);
};

/**
 * 1 件の Progression エントリをランタイム用コードオブジェクトへ変換する。
 */
export const buildProgressionChordDefinition = (
  entry: SurvivalChordProgressionEntry,
  index: number,
  inferredKeyFifths: number,
): SurvivalProgressionBuiltChord => {
  const sortedVoicing = Array.from(new Set<number>(entry.voicing)).sort((a, b) => a - b);
  const noteNames = sortedVoicing.map(midiToPitchClassLetter);
  const symbolRoot = progressionChordSymbolRoot(entry.name);
  const id = `prog:${index}:${entry.name}:${sortedVoicing.join(',')}`;
  const staffNames = progressionStaffAscendingNames(entry);
  const keyFifth = typeof entry.keyFifths === 'number'
    ? clampKeyFifths(entry.keyFifths)
    : clampKeyFifths(inferredKeyFifths);

  const base: SurvivalProgressionBuiltChord = {
    id,
    displayName: entry.name,
    notes: sortedVoicing,
    noteNames,
    quality: 'progression',
    root: symbolRoot ?? noteNames[0] ?? 'C',
    progressionStaffKeyFifths: keyFifth,
  };

  if (staffNames.length === sortedVoicing.length && staffNames.length > 0) {
    return { ...base, progressionStaffVoicingNames: staffNames };
  }

  return base;
};

export const buildProgressionChordDefinitions = (
  entries: readonly SurvivalChordProgressionEntry[] | undefined,
): SurvivalProgressionBuiltChord[] => {
  if (!entries || entries.length === 0) return [];

  const classed = entries.map(en => classifySurvivalProgressionChordName(en.name));

  const inferredKeys = buildProgressionChordKeyFifths(classed);

  return entries.map((entry, idx) => buildProgressionChordDefinition(entry, idx, inferredKeys[idx]));
};
