/**
 * サバイバル ランダムステージ + HINT 時の五線譜用: コード ID から `ChordVoicingStaff` 向け音名（オクターブ付き）を生成。
 * 調号は常に C（keyFifths = 0）。ト音記号は `SurvivalProgressionStaff` の `staffClef` で切り替え。
 */

import { getChordDefinition } from '@/components/survival/SurvivalGameEngine';
import { alignStaffSpellingsToDirectMidis } from '@/utils/survivalProgressionChords';
import { note as parseNote, transpose } from 'tonal';

import type { ChordQuality } from '@/utils/chord-templates';
import { CHORD_TEMPLATES } from '@/utils/chord-templates';
import { parseChordName } from '@/utils/chord-utils';
import { buildSurvivalQuestionStaffVoicingNames } from '@/utils/survivalQuestionTypes';
import { SURVIVAL_PROGRESSION_VOICING_MAP, buildStaffVoicingNamesForProgressionChord } from '@/utils/survivalProgressionVoicings';

const PROGRESSION_PARSE_NORMALIZATIONS: ReadonlyArray<{ readonly from: string; readonly to: string }> = [
  { from: '7(9.6th)', to: '7(9.13)' },
  { from: '7(b9.b6th)', to: '7(b9.b13)' },
];

const normalizeChordSymbolForProgressionParse = (raw: string): string => {
  let s = raw.trim();
  for (const { from, to } of PROGRESSION_PARSE_NORMALIZATIONS) {
    if (s.includes(from)) {
      s = s.split(from).join(to);
    }
  }
  return s;
};

const progressionMapKey = (root: string, quality: ChordQuality): string | null => {
  switch (quality) {
    case 'maj7_9':
      return `${root}M7(9)`;
    case 'm7_9':
      return `${root}m7(9)`;
    case '7_9_6th':
      return `${root}7(9.13)`;
    case '7_b9_b6th':
      return `${root}7(b9.b13)`;
    case '6_9':
      return `${root}6(9)`;
    case 'm6_9':
      return `${root}m6(9)`;
    default:
      return null;
  }
};

const toTonalSpelling = (stepName: string): string => stepName.replace(/x/g, '##');

/**
 * `getChordDefinition` と同様: ルート 4 番オクターブ基準で厳密昇順 MIDI の綴り列。
 * `dim7` はテンプレの 6M ではなく減 7 度（`7d`）で Bbb 等を生成する。
 */
const buildTemplateStaffVoicingNames = (root: string, quality: ChordQuality): readonly string[] | null => {
  const intervals =
    quality === 'dim7'
      ? (['1P', '3m', '5d', '7d'] as const)
      : CHORD_TEMPLATES[quality];
  if (!intervals || intervals.length === 0) {
    return null;
  }

  const tonalRoot = toTonalSpelling(root);
  const bassOct = 4;
  let prevMidi = -Infinity;
  const out: string[] = [];

  for (const interval of intervals) {
    let oct = bassOct;
    let candidate = transpose(`${tonalRoot}${oct}`, interval);
    if (!candidate) {
      return null;
    }
    let parsed = parseNote(candidate);
    let midi = parsed?.midi;
    if (typeof midi !== 'number') {
      return null;
    }
    while (midi <= prevMidi) {
      oct += 1;
      candidate = transpose(`${tonalRoot}${oct}`, interval);
      if (!candidate) {
        return null;
      }
      parsed = parseNote(candidate);
      if (!parsed || typeof parsed.midi !== 'number') {
        return null;
      }
      midi = parsed.midi;
    }
    prevMidi = midi;
    const noOct = candidate.replace(/\d+$/, '');
    const octDigits = candidate.match(/(\d+)$/)?.[1];
    if (!octDigits) {
      return null;
    }
    out.push(`${noOct.replace(/##/g, 'x')}${octDigits}`);
  }

  return out;
};

export interface SurvivalRandomHintStaffVoicing {
  readonly voicingNames: readonly string[];
  readonly keyFifths: 0;
}

/**
 * ランダムコード ID（例 `BbM7(9)`, `C#dim7`）から HINT 譜面用の音名列を返す。
 * - テンション系ジャズ 4 声は `SURVIVAL_PROGRESSION_VOICING_MAP` + `buildStaffVoicingNamesForProgressionChord`（1 オクターブ上げ）
 * - それ以外はコードテンプレの理論綴り（`dim7` は `7d`）
 */
export const buildSurvivalRandomHintStaffVoicing = (chordId: string): SurvivalRandomHintStaffVoicing | null => {
  const trimmed = chordId.trim();
  const questionStaff = buildSurvivalQuestionStaffVoicingNames(trimmed);
  if (questionStaff && questionStaff.length > 0) {
    return { voicingNames: questionStaff, keyFifths: 0 };
  }

  const numerator = trimmed.includes('/') ? (trimmed.split('/')[0]?.trim() ?? trimmed) : trimmed;
  const parsed = parseChordName(numerator);
  if (!parsed) {
    return null;
  }

  const mapKey = progressionMapKey(parsed.root, parsed.quality);
  if (mapKey) {
    const mapEntry = SURVIVAL_PROGRESSION_VOICING_MAP[mapKey];
    if (mapEntry && mapEntry.voicing.length === 4) {
      const voicing = mapEntry.voicing.map(m => m + 12);
      const parseName = normalizeChordSymbolForProgressionParse(numerator);
      const names = buildStaffVoicingNamesForProgressionChord({ name: parseName, voicing });
      if (names && names.length === voicing.length) {
        return { voicingNames: names, keyFifths: 0 };
      }
    }
  }

  const basic = buildTemplateStaffVoicingNames(parsed.root, parsed.quality);
  if (!basic || basic.length === 0) {
    return null;
  }

  return { voicingNames: basic, keyFifths: 0 };
};

const midiToLetterWithOctave = (midi: number): string => {
  const letters = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${letters[pc] ?? 'C'}${octave}`;
};

/**
 * ランダムコードの `getChordDefinition().notes`（実 MIDI）に合わせた譜面用音名。
 * 綴りは `buildSurvivalRandomHintStaffVoicing` をピッチクラス対応でオクターブ合わせする。
 */
export const buildSurvivalRandomDirectStaffVoicing = (
  chordId: string,
): SurvivalRandomHintStaffVoicing | null => {
  const trimmed = chordId.trim();
  const chord = getChordDefinition(trimmed);
  if (!chord?.notes?.length) {
    return null;
  }
  const sortedMidis = Array.from(new Set<number>(chord.notes)).sort((a, b) => a - b);

  const spellingSource = buildSurvivalRandomHintStaffVoicing(trimmed);
  if (spellingSource) {
    const aligned = alignStaffSpellingsToDirectMidis(spellingSource.voicingNames, sortedMidis);
    if (aligned) {
      return { voicingNames: aligned, keyFifths: spellingSource.keyFifths };
    }
  }

  return {
    voicingNames: sortedMidis.map(midiToLetterWithOctave),
    keyFifths: 0,
  };
};
