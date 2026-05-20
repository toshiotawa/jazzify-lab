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
 * 鍵盤 HINT ハイライトと同一のアルゴリズム。
 * `SurvivalGameScreen.tsx` の `baseOctave = 4`（= MIDI 48 起点）に合わせ、
 * 並び順は `slot.chord.notes`（= sortedVoicing 昇順）の最初に出現したピッチクラス順、
 * 各音は直前より厳密に大きい MIDI へオクターブ補正する。
 *
 * 例: `FM7(9) [E4,G4,A4,C5]` → `[E3,G3,A3,C4]`（top = 中央 C）。
 */
const HINT_BASE_MIDI = 48;

const reconstructHintMidisByPitchClass = (
  sortedVoicing: readonly number[],
): Map<number, number> => {
  const orderedPcs: number[] = [];
  const seenPc = new Set<number>();
  for (const midi of sortedVoicing) {
    const pc = ((midi % 12) + 12) % 12;
    if (!seenPc.has(pc)) {
      seenPc.add(pc);
      orderedPcs.push(pc);
    }
  }
  const out = new Map<number, number>();
  let last = -1;
  for (const pc of orderedPcs) {
    let m = pc + HINT_BASE_MIDI;
    while (m <= last) m += 12;
    out.set(pc, m);
    last = m;
  }
  return out;
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

/**
 * スタッフ用に MIDI 昇順の綴り列を生成する。
 * - 綴り（step + accidental）は DB の `voicing_names` を尊重。
 * - オクターブは `reconstructHintMidisByPitchClass` の結果に揃え、鍵盤 HINT と完全一致させる。
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
      parallel = [];
    }
  }

  if (parallel.length !== entry.voicing.length) {
    return [];
  }

  const sortedVoicing = [...entry.voicing].sort((a, b) => a - b);
  const hintMidiByPc = reconstructHintMidisByPitchClass(sortedVoicing);

  type Pair = { readonly midi: number; readonly nm: string };

  const pairs: Pair[] = entry.voicing.map((rawMidi, ix) => {
    const pc = ((rawMidi % 12) + 12) % 12;
    const aligned = hintMidiByPc.get(pc) ?? rawMidi;
    return { midi: aligned, nm: alignNameOctaveToMidi(parallel[ix], aligned) };
  });

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

export const buildProgressionChordDefinitions = (
  entries: readonly SurvivalChordProgressionEntry[] | undefined,
): SurvivalProgressionBuiltChord[] => {
  if (!entries || entries.length === 0) return [];

  const classed = entries.map(en => classifySurvivalProgressionChordName(en.name));

  const inferredKeys = buildProgressionChordKeyFifths(classed);

  return entries.map((entry, idx) => buildProgressionChordDefinition(entry, idx, inferredKeys[idx]));
};
