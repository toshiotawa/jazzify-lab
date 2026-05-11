/**
 * サバイバル Progression 用: コード進行文字列 → `{ name, voicing }[]` 生成ヘルパー。
 * ゲーム実行時には使わず、DB 投入・AI Agent 下書き用の事前生成のみ。
 */

import { note as parseNote } from 'tonal';

import type { SurvivalChordProgressionEntry } from '../components/survival/SurvivalStageDefinitions';
import { ALL_17_ROOTS } from './chord-templates';

export const SURVIVAL_VOICING_MIDDLE_C = 60;

/** プランで対象となったコード種別（内部キー） */
export type SurvivalProgressionVoicingKind =
  | 'M7_9'
  | 'm7'
  | '7_9_13'
  | '7_9'
  | '7_b9_b13'
  | 'm7b5'
  | '6_9'
  | 'dim7'
  | 'm6_9'
  | 'mM7_9'
  | 'dom7'
  | 'aug7';

export type SurvivalVoicingForm = 'A' | 'B' | 'C';

/** 1 コード種 × 1 ルートの A/B/C 別 MIDI（進行でフォームを選ぶ） */
export interface SurvivalProgressionVoicingForms {
  readonly kind: SurvivalProgressionVoicingKind;
  readonly root: string;
  readonly A: readonly number[];
  readonly B: readonly number[];
  /** EbM7(9) の C フォームのみ */
  readonly C?: readonly number[];
}

export interface SurvivalProgressionAnalyzeEntry {
  readonly name: string;
  readonly kind: SurvivalProgressionVoicingKind;
  readonly root: string;
  readonly form: SurvivalVoicingForm;
  readonly voicing: readonly number[];
  readonly warnings: readonly string[];
}

export interface SurvivalProgressionAnalyzeResult {
  readonly entries: readonly SurvivalProgressionAnalyzeEntry[];
  readonly progression: readonly SurvivalChordProgressionEntry[];
  readonly warnings: readonly string[];
}

/** 表示名のサフィックス（17 ルート × キー用） */
const KIND_DISPLAY_SUFFIX: Record<SurvivalProgressionVoicingKind, string> = {
  M7_9: 'M7(9)',
  m7: 'm7',
  '7_9_13': '7(9.13)',
  '7_9': '7(9)',
  '7_b9_b13': '7(b9.b13)',
  m7b5: 'm7(b5)',
  '6_9': '6(9)',
  dim7: 'dim7',
  m6_9: 'm6(9)',
  mM7_9: 'mM7(9)',
  dom7: '7',
  aug7: '7aug',
};

/**
 * A/B は「3rd 始まり」「7th(b7 or M7) / 6th 始まり」の4声。
 * 値はルートからの半音（負も可; MIDI 化時にオクターブ補正して昇順にする）。
 */
const KIND_RELATIVE_SEMITONES: Record<
  SurvivalProgressionVoicingKind,
  { readonly A: readonly number[]; readonly B: readonly number[] }
> = {
  M7_9: { A: [4, 7, 11, 14], B: [11, 14, 16, 19] },
  m7: { A: [3, 7, 10, 14], B: [10, 14, 15, 19] },
  '7_9_13': { A: [4, 9, 10, 14], B: [10, 14, 16, 21] },
  '7_9': { A: [4, 7, 10, 14], B: [10, 14, 16, 19] },
  '7_b9_b13': { A: [4, 8, 10, 13], B: [10, 13, 16, 20] },
  m7b5: { A: [3, 6, 10, 14], B: [10, 14, 15, 18] },
  '6_9': { A: [4, 7, 9, 14], B: [9, 14, 16, 19] },
  // dim7 は他種と異なり、A=R 3 5 7（R 始まり）、B=5 7 R 3（5th 始まり）。
  // フォーム選択は「(root-4半音) を 7(b9.b13) のルートと見なした既定」と一致させる。
  dim7: { A: [0, 3, 6, 9], B: [6, 9, 12, 15] },
  m6_9: { A: [3, 7, 9, 14], B: [9, 14, 15, 19] },
  mM7_9: { A: [3, 7, 11, 14], B: [11, 14, 15, 19] },
  dom7: { A: [4, 7, 10, 13], B: [10, 13, 16, 19] },
  aug7: { A: [4, 8, 10, 14], B: [10, 14, 16, 20] },
};

/** 最長一致用: 入力サフィックス → 種別 */
const SUFFIX_MATCHERS: ReadonlyArray<{ readonly suffix: string; readonly kind: SurvivalProgressionVoicingKind }> = [
  { suffix: 'M7(9)', kind: 'M7_9' },
  { suffix: 'mM7(9)', kind: 'mM7_9' },
  { suffix: 'm7(b5)', kind: 'm7b5' },
  { suffix: '7(9.13)', kind: '7_9_13' },
  { suffix: '7(b9.b13)', kind: '7_b9_b13' },
  { suffix: 'm6(9)', kind: 'm6_9' },
  { suffix: '6(9)', kind: '6_9' },
  { suffix: 'm7(9)', kind: 'm7' },
  { suffix: '7(9)', kind: '7_9' },
  { suffix: 'dim7', kind: 'dim7' },
  { suffix: '7aug', kind: 'aug7' },
  { suffix: 'aug7', kind: 'aug7' },
  { suffix: 'm7', kind: 'm7' },
  { suffix: '7', kind: 'dom7' },
];

const normalizeChordToken = (raw: string): string => raw.trim();

const assertFourUniquePitchClasses = (midis: readonly number[], label: string): void => {
  if (midis.length !== 4) {
    throw new Error(`${label}: voicing must have 4 notes`);
  }
  const pcs = new Set(midis.map(m => ((m % 12) + 12) % 12));
  if (pcs.size !== 4) {
    throw new Error(`${label}: duplicate pitch classes in voicing`);
  }
};

/**
 * ルート基準オクターブを選び、相対半音列を昇順 MIDI に展開する。
 */
const relativeSemitonesToAscendingMidi = (
  root: string,
  relativeSemitones: readonly number[],
  preferredRootOctave: number,
): number[] => {
  const r0 = parseNote(`${root}${preferredRootOctave}`);
  if (!r0 || typeof r0.midi !== 'number') {
    throw new Error(`Invalid root for MIDI build: ${root}`);
  }
  const base = r0.midi;
  const midis: number[] = relativeSemitones.map(off => base + off);
  for (let i = 1; i < midis.length; i += 1) {
    while (midis[i] <= midis[i - 1]) {
      midis[i] += 12;
    }
  }
  return midis;
};

const computeMiddleCrossingWarning = (midis: readonly number[]): string | null => {
  if (midis.length === 0) return null;
  let min = midis[0];
  let max = midis[0];
  for (let i = 1; i < midis.length; i += 1) {
    const v = midis[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min < SURVIVAL_VOICING_MIDDLE_C && max > SURVIVAL_VOICING_MIDDLE_C) return null;
  return `middleC: voicing does not straddle MIDI ${SURVIVAL_VOICING_MIDDLE_C} (min=${min}, max=${max}); review octave visually`;
};

const choosePreferredRootOctave = (root: string, relative: readonly number[]): number => {
  for (let oct = 2; oct <= 4; oct += 1) {
    const v = relativeSemitonesToAscendingMidi(root, relative, oct);
    const w = computeMiddleCrossingWarning(v);
    if (!w) return oct;
  }
  return 3;
};

const buildFormMidis = (
  root: string,
  kind: SurvivalProgressionVoicingKind,
  form: SurvivalVoicingForm,
): number[] => {
  if (form === 'C') {
    if (kind !== 'M7_9' || root !== 'Eb') {
      throw new Error('C form is only defined for EbM7(9)');
    }
    const bRel = KIND_RELATIVE_SEMITONES.M7_9.B;
    const oct = choosePreferredRootOctave(root, bRel);
    const bMidis = relativeSemitonesToAscendingMidi(root, bRel, oct);
    return bMidis.map(m => m - 12);
  }
  const rel = form === 'A' ? KIND_RELATIVE_SEMITONES[kind].A : KIND_RELATIVE_SEMITONES[kind].B;
  const oct = choosePreferredRootOctave(root, rel);
  return relativeSemitonesToAscendingMidi(root, rel, oct);
};

/**
 * デフォルトフォームは「コード種別 + ルート音のピッチクラス」で決める。
 * 進行中の前コードには依存させず、コードマップとして固定する。
 * II-V-I / マイナー II-V-I は ii / V / I それぞれの固定フォームで A↔B 交替になる。
 * - Eb の M7(9) のみ C フォーム（呼び出し側で上書き）
 * - dim7 はこの関数を使わず、別途 (root-4半音) のピッチクラスで判定する
 */
const A_FORM_PITCH_CLASSES: ReadonlySet<number> = new Set<number>([0, 1, 2, 10, 11]);
const DOMINANT_A_FORM_PITCH_CLASSES: ReadonlySet<number> = new Set<number>([0, 1, 2, 8, 9, 10, 11]);
const MAJOR_TONIC_A_FORM_PITCH_CLASSES: ReadonlySet<number> = new Set<number>([0, 8, 9, 10, 11]);
const MINOR_TONIC_A_FORM_PITCH_CLASSES: ReadonlySet<number> = new Set<number>([0, 8, 9, 10, 11]);

const pitchClassOf = (root: string): number => {
  const n = parseNote(root);
  if (typeof n.chroma === 'number') return n.chroma;
  throw new Error(`Cannot resolve pitch class for root: ${root}`);
};

const defaultFormForRoot = (root: string): SurvivalVoicingForm =>
  A_FORM_PITCH_CLASSES.has(pitchClassOf(root)) ? 'A' : 'B';

const formFromPitchClassSet = (root: string, aFormPitchClasses: ReadonlySet<number>): SurvivalVoicingForm =>
  aFormPitchClasses.has(pitchClassOf(root)) ? 'A' : 'B';

/** dim7 のフォーム: (root - 4半音) を 7(b9.b13) のルートと見なした既定と同じ */
const defaultFormForDim7Root = (root: string): SurvivalVoicingForm => {
  const pc = ((pitchClassOf(root) - 4) % 12 + 12) % 12;
  return A_FORM_PITCH_CLASSES.has(pc) ? 'A' : 'B';
};

const defaultFormForRootByKind = (
  root: string,
  kind: SurvivalProgressionVoicingKind,
): SurvivalVoicingForm => {
  switch (kind) {
    case '7_9_13':
    case '7_9':
    case '7_b9_b13':
    case 'dom7':
    case 'aug7':
      return formFromPitchClassSet(root, DOMINANT_A_FORM_PITCH_CLASSES);
    case 'M7_9':
    case '6_9':
      return formFromPitchClassSet(root, MAJOR_TONIC_A_FORM_PITCH_CLASSES);
    case 'm6_9':
    case 'mM7_9':
      return formFromPitchClassSet(root, MINOR_TONIC_A_FORM_PITCH_CLASSES);
    case 'dim7':
      return defaultFormForDim7Root(root);
    case 'm7':
    case 'm7b5':
      return defaultFormForRoot(root);
  }
};

const parseChordToken = (token: string): { root: string; kind: SurvivalProgressionVoicingKind; name: string } => {
  const t = normalizeChordToken(token);
  if (!t) {
    throw new Error('Empty chord token');
  }
  const m = t.match(/^([A-G](?:bb|##|b|#|x)?)(.*)$/);
  if (!m) {
    throw new Error(`Unrecognized chord token: "${t}"`);
  }
  const root = m[1];
  const rest = m[2];
  for (const { suffix, kind } of SUFFIX_MATCHERS) {
    if (rest === suffix) {
      const name = `${root}${suffix}`;
      return { root, kind, name };
    }
  }
  throw new Error(`Unsupported chord type for survival voicing helper: "${t}"`);
};

const selectFormForProgressionIndex = (
  root: string,
  kind: SurvivalProgressionVoicingKind,
): SurvivalVoicingForm => {
  if (kind === 'M7_9' && root === 'Eb') {
    return 'C';
  }
  return defaultFormForRootByKind(root, kind);
};

/** 全ルート × 種別の A/B（+ Eb の M7_9 のみ C） */
export const buildSurvivalProgressionVoicingFormsMap = (): readonly SurvivalProgressionVoicingForms[] => {
  const kinds = Object.keys(KIND_DISPLAY_SUFFIX) as SurvivalProgressionVoicingKind[];
  const out: SurvivalProgressionVoicingForms[] = [];
  for (const root of ALL_17_ROOTS) {
    for (const kind of kinds) {
      const A = buildFormMidis(root, kind, 'A');
      const B = buildFormMidis(root, kind, 'B');
      assertFourUniquePitchClasses(A, `${root} ${kind} A`);
      assertFourUniquePitchClasses(B, `${root} ${kind} B`);
      const entry: SurvivalProgressionVoicingForms = { kind, root, A, B };
      if (kind === 'M7_9' && root === 'Eb') {
        const C = buildFormMidis(root, kind, 'C');
        assertFourUniquePitchClasses(C, `${root} M7_9 C`);
        out.push({ ...entry, C });
      } else {
        out.push(entry);
      }
    }
  }
  return out;
};

/**
 * デフォルトフォーム1種だけのルックアップ用マップ。
 * キー: `Cm7`, `CM7(9)` 形式のコード名。
 */
export const SURVIVAL_PROGRESSION_VOICING_MAP: Record<string, SurvivalChordProgressionEntry> = (() => {
  const map: Record<string, SurvivalChordProgressionEntry> = {};
  const kinds = Object.keys(KIND_DISPLAY_SUFFIX) as SurvivalProgressionVoicingKind[];
  for (const root of ALL_17_ROOTS) {
    for (const kind of kinds) {
      const suffix = KIND_DISPLAY_SUFFIX[kind];
      const name = `${root}${suffix}`;
      const form =
        kind === 'M7_9' && root === 'Eb'
          ? ('C' as const)
          : defaultFormForRootByKind(root, kind);
      const voicing =
        form === 'C'
          ? buildFormMidis(root, 'M7_9', 'C')
          : buildFormMidis(root, kind, form === 'A' ? 'A' : 'B');
      map[name] = { name, voicing };
    }
  }
  return map;
})();

const splitProgressionInput = (input: string): string[] => {
  const normalized = input.replace(/\|/g, ' ').replace(/,/g, ' ');
  return normalized
    .split(/\s+/)
    .map(normalizeChordToken)
    .filter(Boolean);
};

export const analyzeSurvivalChordProgression = (input: string): SurvivalProgressionAnalyzeResult => {
  const tokens = splitProgressionInput(input);
  if (tokens.length === 0) {
    throw new Error('No chord symbols in input');
  }
  const entries: SurvivalProgressionAnalyzeEntry[] = [];
  const progression: SurvivalChordProgressionEntry[] = [];
  const globalWarnings: string[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const { root, kind, name } = parseChordToken(tokens[i]);
    const form = selectFormForProgressionIndex(root, kind);
    const voicing = buildFormMidis(root, kind, form === 'C' ? 'C' : form);
    const w = computeMiddleCrossingWarning(voicing);
    const warnings = w ? [w] : [];
    if (w) globalWarnings.push(`${name}: ${w}`);
    entries.push({ name, kind, root, form, voicing, warnings });
    progression.push({ name, voicing });
  }

  return { entries, progression, warnings: globalWarnings };
};

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/** 実音名配列（表示用, MIDI 60 = C4） */
export const survivalVoicingToNoteNames = (voicing: readonly number[]): string[] =>
  voicing.map(midi => {
    const pc = ((midi % 12) + 12) % 12;
    const oct = Math.trunc(midi / 12) - 1;
    return `${SHARP_NAMES[pc]}${oct}`;
  });
