/**
 * サバイバル random ステージ用: 度数・テンション出題 ID の規約と解決。
 *
 * DB `chord_suffix` 例:
 * - `interval:m3:up` / `interval:M3:down`
 * - `tension:9:up` / `tension:#9:up`（テンションは上のみ）
 *
 * 生成される allowed ID 例:
 * - `interval:C:m3:up`
 * - `tension:Db:#9:up`
 */

import { note as parseNote, transpose } from 'tonal';

import { INTERVAL_DEFINITIONS, INTERVAL_NAME_TO_TONAL } from '@/utils/chord-templates';
import { resolveInterval } from '@/utils/chord-utils';

export type SurvivalQuestionKind = 'interval' | 'tension';
export type SurvivalQuestionDirection = 'up' | 'down';

export interface ParsedSurvivalQuestionId {
  readonly kind: SurvivalQuestionKind;
  readonly root: string;
  readonly intervalName: string;
  readonly direction: SurvivalQuestionDirection;
}

export interface ResolvedSurvivalQuestion {
  readonly id: string;
  readonly kind: SurvivalQuestionKind;
  readonly root: string;
  readonly intervalName: string;
  readonly direction: SurvivalQuestionDirection;
  readonly midi: number;
  readonly pitchClass: number;
  readonly noteName: string;
  readonly typeDisplayNameEn: string;
  readonly typeDisplayNameJa: string;
}

interface TensionDef {
  readonly name: string;
  readonly tonalInterval: string;
  readonly staffInterval: string;
  readonly labelJa: string;
  readonly labelEn: string;
}

export const TENSION_DEFINITIONS: readonly TensionDef[] = [
  { name: '9', tonalInterval: '9M', staffInterval: '2M', labelJa: '9th', labelEn: '9th' },
  { name: 'b9', tonalInterval: '9m', staffInterval: '2m', labelJa: 'b9th', labelEn: 'b9th' },
  { name: '#9', tonalInterval: '9A', staffInterval: '3m', labelJa: '#9th', labelEn: '#9th' },
  { name: '11', tonalInterval: '11P', staffInterval: '4P', labelJa: '11th', labelEn: '11th' },
  { name: '#11', tonalInterval: '11A', staffInterval: '4A', labelJa: '#11th', labelEn: '#11th' },
  { name: '13', tonalInterval: '13M', staffInterval: '6M', labelJa: '13th', labelEn: '13th' },
  { name: 'b13', tonalInterval: '13m', staffInterval: '6m', labelJa: 'b13th', labelEn: 'b13th' },
] as const;

const TENSION_BY_NAME: ReadonlyMap<string, TensionDef> = new Map(
  TENSION_DEFINITIONS.map(def => [def.name, def]),
);

const INTERVAL_LABEL_JA: Readonly<Record<string, string>> = Object.fromEntries(
  INTERVAL_DEFINITIONS.map(def => {
    const short = def.label.replace(/\s*\([^)]*\)\s*$/, '').trim();
    return [def.name, short];
  }),
);

const INTERVAL_LABEL_EN: Readonly<Record<string, string>> = {
  m2: 'Minor 2nd',
  M2: 'Major 2nd',
  m3: 'Minor 3rd',
  M3: 'Major 3rd',
  P4: 'Perfect 4th',
  aug4: 'Augmented 4th',
  dim5: 'Diminished 5th',
  P5: 'Perfect 5th',
  aug5: 'Augmented 5th',
  m6: 'Minor 6th',
  M6: 'Major 6th',
  m7: 'Minor 7th',
  M7: 'Major 7th',
};

const toTonalSpelling = (stepName: string): string => stepName.replace(/x/g, '##');

/** 単音出題の表示・判定用: 過剰な理論異名同音を実用的な綴りへ（dim7 等のコード全体綴りには使わない）。 */
const simplifySingleTargetSpelling = (noteName: string): string => {
  const map: Record<string, string> = {
    Bbb: 'Bb',
    Abb: 'Ab',
    Ebb: 'Eb',
    Dbb: 'Db',
    Cbb: 'Cb',
    Fbb: 'Fb',
    Gbb: 'Gb',
    'C##': 'D',
    'D##': 'E',
    'E##': 'F#',
    'F##': 'G',
    'G##': 'A',
    'A##': 'B',
    'B##': 'C#',
    Cb: 'B',
    Fb: 'E',
    'B#': 'C',
    'E#': 'F',
  };
  return map[noteName] ?? noteName;
};

const formatDisplayNote = (noteWithOctave: string): string => {
  const noOct = noteWithOctave.replace(/\d+$/, '');
  const octDigits = noteWithOctave.match(/(\d+)$/)?.[1];
  if (!octDigits) {
    return noOct.replace(/##/g, 'x');
  }
  return `${noOct.replace(/##/g, 'x')}${octDigits}`;
};

const alignSpelledNoteToMidi = (spelledNote: string, targetMidi: number): string | null => {
  let candidate = spelledNote;
  let parsed = parseNote(candidate);
  let midi = parsed?.midi;
  while (typeof midi === 'number' && midi < targetMidi) {
    const next = transpose(candidate, '8P');
    if (!next) {
      return null;
    }
    candidate = next;
    parsed = parseNote(candidate);
    midi = parsed?.midi;
  }
  while (typeof midi === 'number' && midi > targetMidi) {
    const next = transpose(candidate, '-8P');
    if (!next) {
      return null;
    }
    candidate = next;
    parsed = parseNote(candidate);
    midi = parsed?.midi;
  }
  if (typeof midi !== 'number' || midi !== targetMidi) {
    return null;
  }
  return formatDisplayNote(candidate);
};

const midiToOctave = (midi: number): number => Math.floor(midi / 12) - 1;

export const formatSurvivalQuestionTypeLabel = (
  kind: SurvivalQuestionKind,
  intervalName: string,
  direction: SurvivalQuestionDirection,
  lang: 'en' | 'ja',
): string => {
  const base = kind === 'tension'
    ? (() => {
        const def = TENSION_BY_NAME.get(intervalName);
        return lang === 'en' ? (def?.labelEn ?? intervalName) : (def?.labelJa ?? intervalName);
      })()
    : (lang === 'en'
        ? (INTERVAL_LABEL_EN[intervalName] ?? intervalName)
        : (INTERVAL_LABEL_JA[intervalName] ?? intervalName));

  if (kind === 'tension') {
    return lang === 'en' ? `${base} Up` : `${base}上`;
  }
  return lang === 'en'
    ? `${base} ${direction === 'up' ? 'Up' : 'Down'}`
    : `${base}${direction === 'up' ? '上' : '下'}`;
};

export const parseSurvivalQuestionSuffix = (
  chordSuffix: string,
): { kind: SurvivalQuestionKind; intervalName: string; direction: SurvivalQuestionDirection } | null => {
  const intervalMatch = /^interval:([^:]+):(up|down)$/.exec(chordSuffix);
  if (intervalMatch) {
    const intervalName = intervalMatch[1];
    const direction = intervalMatch[2] as SurvivalQuestionDirection;
    if (!INTERVAL_NAME_TO_TONAL[intervalName]) {
      return null;
    }
    return { kind: 'interval', intervalName, direction };
  }

  const tensionMatch = /^tension:([^:]+):up$/.exec(chordSuffix);
  if (tensionMatch) {
    const intervalName = tensionMatch[1];
    if (!TENSION_BY_NAME.has(intervalName)) {
      return null;
    }
    return { kind: 'tension', intervalName, direction: 'up' };
  }

  return null;
};

export const parseSurvivalQuestionId = (id: string): ParsedSurvivalQuestionId | null => {
  const trimmed = id.trim();
  const intervalMatch = /^interval:([^:]+):([^:]+):(up|down)$/.exec(trimmed);
  if (intervalMatch) {
    const root = intervalMatch[1];
    const intervalName = intervalMatch[2];
    const direction = intervalMatch[3] as SurvivalQuestionDirection;
    if (!INTERVAL_NAME_TO_TONAL[intervalName]) {
      return null;
    }
    return { kind: 'interval', root, intervalName, direction };
  }

  const tensionMatch = /^tension:([^:]+):([^:]+):up$/.exec(trimmed);
  if (tensionMatch) {
    const root = tensionMatch[1];
    const intervalName = tensionMatch[2];
    if (!TENSION_BY_NAME.has(intervalName)) {
      return null;
    }
    return { kind: 'tension', root, intervalName, direction: 'up' };
  }

  return null;
};

export const buildSurvivalAllowedQuestionIds = (roots: string[], chordSuffix: string): string[] | null => {
  const spec = parseSurvivalQuestionSuffix(chordSuffix);
  if (!spec) {
    return null;
  }

  if (spec.kind === 'interval') {
    return roots.map(root => `interval:${root}:${spec.intervalName}:${spec.direction}`);
  }

  return roots.map(root => `tension:${root}:${spec.intervalName}:up`);
};

export const buildAllowedChordsForSuffix = (roots: string[], suffix: string): string[] => {
  const special = buildSurvivalAllowedQuestionIds(roots, suffix);
  if (special) {
    return special;
  }
  if (suffix === '_note') {
    return roots.map(r => `${r}_note`);
  }
  return roots.map(r => `${r}${suffix}`);
};

const resolveTensionMidi = (
  root: string,
  tensionName: string,
  octave: number,
): { midi: number; noteName: string } | null => {
  const def = TENSION_BY_NAME.get(tensionName);
  if (!def) {
    return null;
  }
  const rootWithOctave = `${toTonalSpelling(root)}${octave}`;
  const result = transpose(rootWithOctave, def.tonalInterval);
  if (!result) {
    return null;
  }
  const parsed = parseNote(result);
  if (!parsed || typeof parsed.midi !== 'number') {
    return null;
  }
  const noteName = result.replace(/\d+$/, '').replace(/##/g, 'x');
  return { midi: parsed.midi, noteName };
};

export const resolveSurvivalQuestion = (
  questionId: string,
  octave: number = 4,
): ResolvedSurvivalQuestion | null => {
  const parsed = parseSurvivalQuestionId(questionId);
  if (!parsed) {
    return null;
  }

  if (parsed.kind === 'interval') {
    const resolved = resolveInterval(parsed.root, parsed.intervalName, parsed.direction, octave);
    if (!resolved) {
      return null;
    }
    const pitchClass = ((resolved.midi % 12) + 12) % 12;
    const noteName = simplifySingleTargetSpelling(resolved.noteName);
    return {
      id: questionId,
      kind: 'interval',
      root: parsed.root,
      intervalName: parsed.intervalName,
      direction: parsed.direction,
      midi: resolved.midi,
      pitchClass,
      noteName,
      typeDisplayNameEn: formatSurvivalQuestionTypeLabel('interval', parsed.intervalName, parsed.direction, 'en'),
      typeDisplayNameJa: formatSurvivalQuestionTypeLabel('interval', parsed.intervalName, parsed.direction, 'ja'),
    };
  }

  const resolved = resolveTensionMidi(parsed.root, parsed.intervalName, octave);
  if (!resolved) {
    return null;
  }
  const pitchClass = ((resolved.midi % 12) + 12) % 12;
  const noteName = simplifySingleTargetSpelling(resolved.noteName);
  return {
    id: questionId,
    kind: 'tension',
    root: parsed.root,
    intervalName: parsed.intervalName,
    direction: 'up',
    midi: resolved.midi,
    pitchClass,
    noteName,
    typeDisplayNameEn: formatSurvivalQuestionTypeLabel('tension', parsed.intervalName, 'up', 'en'),
    typeDisplayNameJa: formatSurvivalQuestionTypeLabel('tension', parsed.intervalName, 'up', 'ja'),
  };
};

/**
 * HINT 譜面用オクターブ付き音名。テンションは実音より 1 オクターブ下の度数綴り。
 */
export const buildSurvivalQuestionStaffVoicingNames = (
  questionId: string,
  octave: number = 4,
): readonly string[] | null => {
  const parsed = parseSurvivalQuestionId(questionId);
  if (!parsed) {
    return null;
  }

  const resolved = resolveSurvivalQuestion(questionId, octave);
  if (!resolved) {
    return null;
  }

  if (parsed.kind === 'interval') {
    const oct = midiToOctave(resolved.midi);
    return [`${resolved.noteName}${oct}`];
  }

  const def = TENSION_BY_NAME.get(parsed.intervalName);
  if (!def) {
    return null;
  }

  const staffMidi = resolved.midi - 12;
  const staffOct = midiToOctave(staffMidi);
  const rootSpelled = toTonalSpelling(parsed.root);
  const candidate = transpose(`${rootSpelled}${staffOct}`, def.staffInterval);
  if (!candidate) {
    return null;
  }
  const aligned = alignSpelledNoteToMidi(candidate, staffMidi);
  return aligned ? [aligned] : null;
};
