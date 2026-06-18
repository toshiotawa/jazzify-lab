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
  progressionStaffVoicingStaves?: readonly (1 | 2)[];
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

/** 採用範囲は -6..+5（F# キーは Gb で表現する方針） */
const clampKeyFifths = (value: number): number => Math.max(-6, Math.min(5, Math.trunc(value)));

/**
 * コード `notes` / `midiNotes` 配列の最大 MIDI（鍵盤 HINT・スクロールアンカー共通）。
 */
export const maxSurvivalHintMidiFromChordNotes = (midiNotes: readonly number[]): number | null => {
  if (midiNotes.length === 0) {
    return null;
  }
  let maxValue: number | null = null;
  for (const note of midiNotes) {
    if (maxValue === null || note > maxValue) {
      maxValue = note;
    }
  }
  return maxValue;
};

const STEP_SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACCIDENTAL_ALTER: Record<string, number> = { '': 0, '#': 1, '##': 2, x: 2, b: -1, bb: -2 };
const NOTE_NAME_PATTERN = /^([A-G])(bb|##|#|b|x)?(-?\d+)$/;

/** 綴り（step + accidental）を保ったまま、オクターブだけ targetMidi に揃えた表記へ。 */
const alignNameOctaveToMidi = (name: string, targetMidi: number): string => {
  const matched = name.match(NOTE_NAME_PATTERN);
  if (!matched) return name;
  const step = matched[1];
  const accidental = matched[2] ?? '';
  const octave = Number.parseInt(matched[3], 10);
  if (!Number.isFinite(octave)) return name;
  const stepSemi = STEP_SEMITONE[step];
  const alter = ACCIDENTAL_ALTER[accidental];
  if (typeof stepSemi !== 'number' || typeof alter !== 'number') return name;
  const currentMidi = (octave + 1) * 12 + stepSemi + alter;
  const diffOct = Math.round((targetMidi - currentMidi) / 12);
  if (diffOct === 0) return name;
  return `${step}${accidental}${octave + diffOct}`;
};

const midiToLetterWithOctave = (midi: number): string => {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[pc]}${octave}`;
};

/**
 * 綴り列を target MIDI（昇順）へピッチクラス対応でオクターブ合わせする。
 * Random 譜面など、スペル源と実 MIDI が別経路のときに使う。
 */
export const alignStaffSpellingsToDirectMidis = (
  spelledNames: readonly string[],
  targetMidis: readonly number[],
): readonly string[] | null => {
  if (spelledNames.length !== targetMidis.length || targetMidis.length === 0) {
    return null;
  }
  const sortedTargets = [...targetMidis].sort((a, b) => a - b);
  type SpellingRow = { readonly pc: number; readonly name: string };
  const rows: SpellingRow[] = [];
  for (const name of spelledNames) {
    const matched = name.match(NOTE_NAME_PATTERN);
    if (!matched) {
      return null;
    }
    const step = matched[1];
    const accidental = matched[2] ?? '';
    const octave = Number.parseInt(matched[3], 10);
    if (!Number.isFinite(octave)) {
      return null;
    }
    const stepSemi = STEP_SEMITONE[step];
    const alter = ACCIDENTAL_ALTER[accidental];
    if (typeof stepSemi !== 'number' || typeof alter !== 'number') {
      return null;
    }
    const parsedMidi = (octave + 1) * 12 + stepSemi + alter;
    rows.push({ pc: ((parsedMidi % 12) + 12) % 12, name });
  }
  const out: string[] = [];
  for (const targetMidi of sortedTargets) {
    const tgtPc = ((targetMidi % 12) + 12) % 12;
    const row = rows.find((r) => r.pc === tgtPc);
    if (!row) {
      return null;
    }
    out.push(alignNameOctaveToMidi(row.name, targetMidi));
  }
  return out;
};

/**
 * スタッフ用に MIDI 昇順の綴り列を生成する。
 * - 綴り（step + accidental）は DB の `voicing_names` を尊重。
 * - オクターブは `voicing` の実 MIDI に揃える（鍵盤 HINT 再構築とは独立）。
 */
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
      parallel = entry.voicing.map(midiToLetterWithOctave);
    }
  }

  if (parallel.length !== entry.voicing.length) {
    return [];
  }

  type Pair = { readonly midi: number; readonly nm: string };

  const pairs: Pair[] = entry.voicing.map((rawMidi, ix) => ({
    midi: rawMidi,
    nm: alignNameOctaveToMidi(parallel[ix], rawMidi),
  }));

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

  let progressionStaffVoicingStaves: readonly (1 | 2)[] | undefined;
  const rawStaves = entry.voicing_staves;
  if (
    rawStaves
    && rawStaves.length === entry.voicing.length
    && sortedVoicing.length === rawStaves.length
  ) {
    const zipped = entry.voicing.map((m, i) => ({
      midi: m,
      staff: rawStaves[i] === 1 ? (1 as const) : (2 as const),
    }));
    zipped.sort((a, b) => a.midi - b.midi);
    progressionStaffVoicingStaves = zipped.map((z) => z.staff);
  }

  if (staffNames.length === sortedVoicing.length && staffNames.length > 0) {
    return {
      ...base,
      progressionStaffVoicingNames: staffNames,
      ...(progressionStaffVoicingStaves ? { progressionStaffVoicingStaves } : {}),
    };
  }

  return base;
};

const isGrandStaffSplit = (staves: readonly (1 | 2)[]): boolean =>
  staves.some((s) => s === 1) && staves.some((s) => s === 2);

const inferVoicingStavesFromMidis = (
  midis: readonly number[],
): readonly (1 | 2)[] => midis.map((m) => (m >= 60 ? (1 as const) : (2 as const)));

export interface ResolveProgressionStaffVoicingStavesParams {
  readonly voicingNames: readonly string[];
  readonly explicitStaves?: readonly (1 | 2)[];
  readonly midis?: readonly number[];
  readonly grandStaffMode: boolean;
}

/**
 * Progression 譜面の staff 割当。DB `voicing_staves` を優先し、
 * `grandStaffMode` かつ欠落／単一 staff のときのみ MIDI から推定する。
 */
export const resolveProgressionStaffVoicingStaves = (
  params: ResolveProgressionStaffVoicingStavesParams,
): readonly (1 | 2)[] | undefined => {
  const { voicingNames, explicitStaves, midis, grandStaffMode } = params;
  const nameLen = voicingNames.length;

  if (
    explicitStaves
    && explicitStaves.length === nameLen
    && (!grandStaffMode || isGrandStaffSplit(explicitStaves))
  ) {
    return explicitStaves;
  }

  if (!grandStaffMode) {
    if (explicitStaves && explicitStaves.length === nameLen) {
      return explicitStaves;
    }
    return undefined;
  }

  if (midis && midis.length === nameLen) {
    return inferVoicingStavesFromMidis(midis);
  }

  if (explicitStaves && explicitStaves.length === nameLen) {
    return explicitStaves;
  }
  return undefined;
};

export const buildProgressionChordDefinitions = (
  entries: readonly SurvivalChordProgressionEntry[] | undefined,
): SurvivalProgressionBuiltChord[] => {
  if (!entries || entries.length === 0) return [];

  const classed = entries.map(en => classifySurvivalProgressionChordName(en.name));

  const inferredKeys = buildProgressionChordKeyFifths(classed);

  return entries.map((entry, idx) => buildProgressionChordDefinition(entry, idx, inferredKeys[idx]));
};
