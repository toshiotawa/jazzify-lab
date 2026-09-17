import { distance, transpose } from 'tonal';

import type { TrainingProgressionEntry } from '@/game/training/trainingTypes';
import {
  ALL_MAJOR_KEYS,
  KEY_FIFTHS_BY_MAJOR,
  type MajorKey,
} from '@/utils/twoHandVoicingIntermediateCourse';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

export const SIX_NOTE_SCALE_BGM_URL =
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3';

export const SIX_NOTE_SCALE_UUID_NS = 'b0000000-0000-4000-8000-000000000001';

export type SixNotePatternId =
  | 'abc'
  | 'bca'
  | 'aprime_abc'
  | 'eca'
  | 'abda'
  | 'ada'
  | 'abc_inversion';

export const SIX_NOTE_PATTERN_LABELS: Record<SixNotePatternId, { ja: string; en: string }> = {
  abc: { ja: 'A-B-C', en: 'A-B-C' },
  bca: { ja: 'B-C-A', en: 'B-C-A' },
  aprime_abc: { ja: "A' A-B-C", en: "A' A-B-C" },
  eca: { ja: 'E-C-A', en: 'E-C-A' },
  abda: { ja: 'A-B-D-A', en: 'A-B-D-A' },
  ada: { ja: 'A-D-A', en: 'A-D-A' },
  abc_inversion: { ja: 'A-B-C(inversion)', en: 'A-B-C(inversion)' },
};

export interface SixNoteScaleTrainingSpec {
  readonly slug: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly sortOrder: number;
  readonly unitSize: number;
  readonly progression: readonly TrainingProgressionEntry[];
}

interface SixNotePatternSet {
  readonly abc: readonly string[];
  readonly bca: readonly string[];
  readonly aprime_abc: readonly string[];
  readonly eca: readonly string[];
  readonly abda: readonly string[];
  readonly ada: readonly string[];
  readonly abc_inversion?: readonly string[];
}

interface SixNoteMajorPatternSet {
  readonly abc: readonly string[];
  readonly abc_inversion: readonly string[];
  readonly aprime_abc: readonly string[];
}

interface SixNoteProgressionChordTemplate {
  readonly chordName: string;
  readonly patterns: SixNotePatternSet | SixNoteMajorPatternSet;
}

interface SixNoteProgressionTemplate {
  readonly referenceKey: MajorKey;
  readonly chords: readonly SixNoteProgressionChordTemplate[];
  readonly patternId: SixNotePatternId;
}

const normalizeSpelling = (name: string): string => name.replace(/##/g, 'x');

const midiOf = (name: string): number => parseVoicingNoteName(name).midi;

const transposeNote = (name: string, interval: string): string => {
  const transposed = transpose(name, interval);
  if (!transposed) {
    throw new Error(`transpose failed: ${name} + ${interval}`);
  }
  return normalizeSpelling(transposed);
};

const transposeNotes = (notes: readonly string[], interval: string): string[] => {
  if (!interval || interval === '1P') {
    return [...notes];
  }
  return notes.map((note) => transposeNote(note, interval));
};

const transposeChordName = (chordName: string, interval: string): string => {
  if (!interval || interval === '1P') {
    return chordName;
  }
  const match = chordName.trim().match(/^([A-G](?:bb|##|b|#|x)?)([\s\S]*)$/);
  if (!match) {
    return chordName;
  }
  const [, root, rest] = match;
  const transposedRoot = transpose(root ?? 'C', interval);
  if (!transposedRoot) {
    return chordName;
  }
  const transposedRest = rest.replace(
    /\(([A-G](?:bb|##|b|#|x)?)([^)]*)\)/g,
    (_full, innerRoot: string, innerSuffix: string) => {
      const transposedInnerRoot = transpose(innerRoot, interval);
      return `(${transposedInnerRoot ?? innerRoot}${innerSuffix})`;
    },
  );
  return `${normalizeSpelling(transposedRoot)}${transposedRest}`;
};

const buildEntry = (
  name: string,
  noteNames: readonly string[],
  keyFifths: number,
): TrainingProgressionEntry => ({
  name,
  voicing: noteNames.map((note) => midiOf(note)),
  voicingNames: [...noteNames],
  keyFifths,
});

/** ① m7 — Dm7 / C / 低音 D */
const M7_MINOR6_PATTERNS: SixNotePatternSet = {
  abc: ['D4', 'E4', 'F4', 'G4', 'A4', 'C5'],
  bca: ['G5', 'F5', 'C5', 'A4', 'E5', 'D5'],
  aprime_abc: ['E4', 'C#4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5'],
  eca: ['E4', 'F4', 'A4', 'C5', 'E5', 'D5'],
  abda: ['D4', 'E4', 'F4', 'G4', 'A4', 'F4', 'E4', 'D4'],
  ada: ['E5', 'D5', 'A4', 'F4', 'E4', 'D4'],
};

/** ③ 7alt(m7b5) — G7alt(Fm7b5) / C / 低音 G */
const ALT_M7B5_PATTERNS: SixNotePatternSet = {
  abc: ['F4', 'G4', 'Ab4', 'Bb4', 'Cb5', 'Eb5'],
  bca: ['Bb5', 'Ab5', 'Eb5', 'Cb5', 'G5', 'F5'],
  aprime_abc: ['G4', 'E4', 'F4', 'G4', 'Ab4', 'Bb4', 'Cb5', 'Eb5'],
  eca: ['G4', 'Ab4', 'Cb5', 'Eb5', 'G5', 'F5'],
  abda: ['F4', 'G4', 'Ab4', 'Bb4', 'Cb5', 'Ab4', 'G4', 'F4'],
  ada: ['G5', 'F5', 'Cb5', 'Ab4', 'G4', 'F4'],
  abc_inversion: ['G5', 'F5', 'Bb4', 'Ab4', 'Eb5', 'Cb5'],
};

/** ④ 7alt(mM7 omit 6) — G7alt(AbmM7 omit 6) / C / 低音 G */
const ALT_MM7_OMIT6_PATTERNS: SixNotePatternSet = {
  abc: ['Ab4', 'Bb4', 'Cb5', 'Db5', 'Eb5', 'G5'],
  bca: ['Db6', 'Cb6', 'G5', 'Eb5', 'Bb5', 'Ab5'],
  aprime_abc: ['Bb4', 'G4', 'Ab4', 'Bb4', 'Cb5', 'Db5', 'Eb5', 'G5'],
  eca: ['Bb4', 'Cb5', 'Eb5', 'G5', 'Bb5', 'Ab5'],
  abda: ['Ab4', 'Bb4', 'Cb5', 'Db5', 'Eb5', 'Cb5', 'Bb4', 'Ab4'],
  ada: ['Bb5', 'Ab5', 'Eb5', 'Cb5', 'Bb4', 'Ab4'],
};

/** ⑤ M7 — CM7 / C / 低音 C */
const MAJOR_3_PATTERNS: SixNoteMajorPatternSet = {
  abc: ['C4', 'D4', 'E4', 'G4', 'A4', 'B4'],
  abc_inversion: ['D5', 'C5', 'G4', 'E4', 'B4', 'A4'],
  aprime_abc: ['D5', 'B4', 'C5', 'D5', 'E5', 'G5', 'A5', 'B5'],
};

/** ⑥ mM7(omit 6) — CmM7(omit 6) / Eb / 低音 C */
const MM7_OMIT6_MINOR6_PATTERNS: SixNotePatternSet = {
  abc: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'B4'],
  bca: ['F5', 'Eb5', 'B4', 'G4', 'D5', 'C5'],
  aprime_abc: ['D5', 'B4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'B5'],
  eca: ['D4', 'Eb4', 'G4', 'B4', 'D5', 'C5'],
  abda: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Eb4', 'D4', 'C4'],
  ada: ['D5', 'C5', 'G4', 'Eb4', 'D4', 'C4'],
};

/** ⑧ m7b5 — Am7b5 / Eb / 低音 A */
const M7B5_PATTERNS: SixNotePatternSet = {
  abc: ['A4', 'B4', 'C5', 'D5', 'Eb5', 'G5'],
  bca: ['D6', 'C6', 'G5', 'Eb5', 'B5', 'A5'],
  aprime_abc: ['B4', 'G#4', 'A4', 'B4', 'C5', 'D5', 'Eb5', 'G5'],
  eca: ['B4', 'C5', 'Eb5', 'G5', 'B5', 'A5'],
  abda: ['A4', 'B4', 'C5', 'D5', 'Eb5', 'C5', 'B4', 'A4'],
  ada: ['B5', 'A5', 'Eb5', 'C5', 'B4', 'A4'],
};

/** ⑩ 7(#11)(mM7 omit 6) — D7(#11)(AmM7 omit 6) / C / 低音 D */
const SHARP11_MM7_OMIT6_PATTERNS: SixNotePatternSet = {
  abc: ['A4', 'B4', 'C5', 'D5', 'E5', 'G#5'],
  bca: ['D6', 'C6', 'G#5', 'E5', 'B5', 'A5'],
  aprime_abc: ['B4', 'G#4', 'A4', 'B4', 'C5', 'D5', 'E5', 'G#5'],
  eca: ['B4', 'C5', 'E5', 'G#5', 'B5', 'A5'],
  abda: ['A4', 'B4', 'C5', 'D5', 'E5', 'C5', 'B4', 'A4'],
  ada: ['B5', 'A5', 'E5', 'C5', 'B4', 'A4'],
};

const PROG1_DM7_PATTERNS: SixNotePatternSet = {
  abc: ['D4', 'E4', 'F4', 'G4', 'A4', 'C5'],
  bca: ['G5', 'F5', 'C5', 'A4', 'E5', 'D5'],
  aprime_abc: ['E4', 'C#4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5'],
  eca: ['E4', 'F4', 'A4', 'C5', 'E5', 'D5'],
  abda: ['D4', 'E4', 'F4', 'G4', 'A4', 'F4', 'E4', 'D4'],
  ada: ['E5', 'D5', 'A4', 'F4', 'E4', 'D4'],
};

const PROG3_DM7B5_PATTERNS: SixNotePatternSet = {
  abc: ['F4', 'G4', 'Ab4', 'Bb4', 'C5', 'E5'],
  bca: ['Bb5', 'Ab5', 'E5', 'C5', 'G5', 'F5'],
  aprime_abc: ['G4', 'E4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5', 'E5'],
  eca: ['G4', 'Ab4', 'C5', 'E5', 'G5', 'F5'],
  abda: ['F4', 'G4', 'Ab4', 'Bb4', 'C5', 'Ab4', 'G4', 'F4'],
  ada: ['G5', 'F5', 'C5', 'Ab4', 'G4', 'F4'],
};

export const MINOR6_PATTERN_IDS: readonly SixNotePatternId[] = [
  'abc', 'bca', 'aprime_abc', 'eca', 'abda', 'ada',
];

export const MAJOR3_PATTERN_IDS: readonly SixNotePatternId[] = [
  'abc', 'abc_inversion', 'aprime_abc',
];

export const PROG_II_V_PATTERN_IDS: readonly SixNotePatternId[] = [
  'abc', 'bca', 'aprime_abc',
];

const getPatternNotes = (
  patterns: SixNotePatternSet | SixNoteMajorPatternSet,
  patternId: SixNotePatternId,
): readonly string[] => {
  const notes = patterns[patternId as keyof typeof patterns];
  if (!notes) {
    throw new Error(`Missing six-note pattern ${patternId}`);
  }
  return notes;
};

const buildSingleChordProgression = (
  referenceKey: MajorKey,
  chordName: string,
  patterns: SixNotePatternSet | SixNoteMajorPatternSet,
  patternId: SixNotePatternId,
): readonly TrainingProgressionEntry[] => {
  const entries: TrainingProgressionEntry[] = [];
  for (const key of ALL_MAJOR_KEYS) {
    const interval = distance(referenceKey, key);
    if (!interval) {
      throw new Error(`distance failed: ${referenceKey} -> ${key}`);
    }
    const keyFifths = KEY_FIFTHS_BY_MAJOR[key];
    const noteNames = transposeNotes(getPatternNotes(patterns, patternId), interval);
    entries.push(buildEntry(transposeChordName(chordName, interval), noteNames, keyFifths));
  }
  return entries;
};

const buildProgressionTemplateEntries = (
  template: SixNoteProgressionTemplate,
): readonly TrainingProgressionEntry[] => {
  const entries: TrainingProgressionEntry[] = [];
  for (const key of ALL_MAJOR_KEYS) {
    const interval = distance(template.referenceKey, key);
    if (!interval) {
      throw new Error(`distance failed: ${template.referenceKey} -> ${key}`);
    }
    const keyFifths = KEY_FIFTHS_BY_MAJOR[key];
    for (const chord of template.chords) {
      const noteNames = transposeNotes(getPatternNotes(chord.patterns, template.patternId), interval);
      entries.push(buildEntry(transposeChordName(chord.chordName, interval), noteNames, keyFifths));
    }
  }
  return entries;
};

const patternTitle = (chordTitle: string, patternId: SixNotePatternId): { ja: string; en: string } => {
  const label = SIX_NOTE_PATTERN_LABELS[patternId];
  return {
    ja: `${chordTitle} ${label.ja}`,
    en: `${chordTitle} ${label.en}`,
  };
};

const slugSuffix = (patternId: SixNotePatternId): string => patternId.replace(/_/g, '-');

interface SingleChordSpec {
  readonly slugBase: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly sortOrderBase: number;
  readonly referenceKey: MajorKey;
  readonly chordName: string;
  readonly patterns: SixNotePatternSet | SixNoteMajorPatternSet;
  readonly patternIds: readonly SixNotePatternId[];
}

const SINGLE_CHORD_SPECS: readonly SingleChordSpec[] = [
  {
    slugBase: 'six-note-scale-m7',
    titleJa: 'm7',
    titleEn: 'm7',
    sortOrderBase: 1,
    referenceKey: 'C',
    chordName: 'Dm7',
    patterns: M7_MINOR6_PATTERNS,
    patternIds: MINOR6_PATTERN_IDS,
  },
  {
    slugBase: 'six-note-scale-7-m7',
    titleJa: '7(m7)',
    titleEn: '7(m7)',
    sortOrderBase: 7,
    referenceKey: 'C',
    chordName: 'G7(Dm7)',
    patterns: M7_MINOR6_PATTERNS,
    patternIds: MINOR6_PATTERN_IDS,
  },
  {
    slugBase: 'six-note-scale-7alt-m7b5',
    titleJa: '7alt(m7♭5)',
    titleEn: '7alt(m7♭5)',
    sortOrderBase: 13,
    referenceKey: 'C',
    chordName: 'G7alt(Fm7♭5)',
    patterns: ALT_M7B5_PATTERNS,
    patternIds: MINOR6_PATTERN_IDS,
  },
  {
    slugBase: 'six-note-scale-7alt-mm7-omit6',
    titleJa: '7alt(mM7 omit 6)',
    titleEn: '7alt(mM7 omit 6)',
    sortOrderBase: 19,
    referenceKey: 'C',
    chordName: 'G7alt(A♭mM7 omit 6)',
    patterns: ALT_MM7_OMIT6_PATTERNS,
    patternIds: MINOR6_PATTERN_IDS,
  },
  {
    slugBase: 'six-note-scale-maj7',
    titleJa: 'M7',
    titleEn: 'M7',
    sortOrderBase: 25,
    referenceKey: 'C',
    chordName: 'CM7',
    patterns: MAJOR_3_PATTERNS,
    patternIds: MAJOR3_PATTERN_IDS,
  },
  {
    slugBase: 'six-note-scale-mm7-omit6',
    titleJa: 'mM7(omit 6)',
    titleEn: 'mM7(omit 6)',
    sortOrderBase: 28,
    referenceKey: 'Eb',
    chordName: 'CmM7(omit 6)',
    patterns: MM7_OMIT6_MINOR6_PATTERNS,
    patternIds: MINOR6_PATTERN_IDS,
  },
  {
    slugBase: 'six-note-scale-mm7-omit4',
    titleJa: 'mM7(omit 4)',
    titleEn: 'mM7(omit 4)',
    sortOrderBase: 34,
    referenceKey: 'Eb',
    chordName: 'CmM7(omit 4)',
    patterns: MAJOR_3_PATTERNS,
    patternIds: MAJOR3_PATTERN_IDS,
  },
  {
    slugBase: 'six-note-scale-m7b5',
    titleJa: 'm7♭5',
    titleEn: 'm7♭5',
    sortOrderBase: 37,
    referenceKey: 'Eb',
    chordName: 'Am7♭5',
    patterns: M7B5_PATTERNS,
    patternIds: MINOR6_PATTERN_IDS,
  },
  {
    slugBase: 'six-note-scale-m7b5-mm7-omit6',
    titleJa: 'm7♭5(mM7 omit 6)',
    titleEn: 'm7♭5(mM7 omit 6)',
    sortOrderBase: 43,
    referenceKey: 'Eb',
    chordName: 'Am7♭5(CmM7 omit 6)',
    patterns: MM7_OMIT6_MINOR6_PATTERNS,
    patternIds: MINOR6_PATTERN_IDS,
  },
  {
    slugBase: 'six-note-scale-7-sharp11-mm7-omit6',
    titleJa: '7(♯11)(mM7 omit 6)',
    titleEn: '7(♯11)(mM7 omit 6)',
    sortOrderBase: 49,
    referenceKey: 'C',
    chordName: 'D7(♯11)(AmM7 omit 6)',
    patterns: SHARP11_MM7_OMIT6_PATTERNS,
    patternIds: MINOR6_PATTERN_IDS,
  },
];

interface ProgressionSpec {
  readonly slugBase: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly sortOrderBase: number;
  readonly template: Omit<SixNoteProgressionTemplate, 'patternId'>;
  readonly patternIds: readonly SixNotePatternId[];
}

const PROGRESSION_SPECS: readonly ProgressionSpec[] = [
  {
    slugBase: 'six-note-scale-prog-ii-v7alt-mm7-omit6',
    titleJa: 'II–V7alt(mM7 omit 6)',
    titleEn: 'II–V7alt(mM7 omit 6)',
    sortOrderBase: 55,
    template: {
      referenceKey: 'C',
      chords: [
        { chordName: 'Dm7', patterns: PROG1_DM7_PATTERNS },
        { chordName: 'G7alt(A♭mM7 omit 6)', patterns: ALT_MM7_OMIT6_PATTERNS },
      ],
    },
    patternIds: PROG_II_V_PATTERN_IDS,
  },
  {
    slugBase: 'six-note-scale-prog-ii-v7alt-m7b5',
    titleJa: 'II–V7alt(m7♭5)',
    titleEn: 'II–V7alt(m7♭5)',
    sortOrderBase: 58,
    template: {
      referenceKey: 'C',
      chords: [
        { chordName: 'Dm7', patterns: PROG1_DM7_PATTERNS },
        { chordName: 'G7alt(Fm7♭5)', patterns: ALT_M7B5_PATTERNS },
      ],
    },
    patternIds: PROG_II_V_PATTERN_IDS,
  },
  {
    slugBase: 'six-note-scale-prog-minor-ii-v-i',
    titleJa: 'Minor II–V–I',
    titleEn: 'Minor II–V–I',
    sortOrderBase: 61,
    template: {
      referenceKey: 'Eb',
      chords: [
        { chordName: 'Dm7♭5(FmM7 omit 6)', patterns: PROG3_DM7B5_PATTERNS },
        { chordName: 'G7alt(A♭mM7 omit 6)', patterns: ALT_MM7_OMIT6_PATTERNS },
        { chordName: 'CmM7(omit 6)', patterns: MM7_OMIT6_MINOR6_PATTERNS },
      ],
    },
    patternIds: MINOR6_PATTERN_IDS,
  },
];

export const buildSixNoteScaleTrainingSpecs = (): readonly SixNoteScaleTrainingSpec[] => {
  const singles: SixNoteScaleTrainingSpec[] = [];
  for (const spec of SINGLE_CHORD_SPECS) {
    spec.patternIds.forEach((patternId, index) => {
      const titles = patternTitle(spec.titleJa, patternId);
      singles.push({
        slug: `${spec.slugBase}-${slugSuffix(patternId)}`,
        titleJa: titles.ja,
        titleEn: titles.en,
        sortOrder: spec.sortOrderBase + index,
        unitSize: 1,
        progression: buildSingleChordProgression(
          spec.referenceKey,
          spec.chordName,
          spec.patterns,
          patternId,
        ),
      });
    });
  }

  const progressions: SixNoteScaleTrainingSpec[] = [];
  for (const spec of PROGRESSION_SPECS) {
    spec.patternIds.forEach((patternId, index) => {
      const titles = patternTitle(spec.titleJa, patternId);
      progressions.push({
        slug: `${spec.slugBase}-${slugSuffix(patternId)}`,
        titleJa: titles.ja,
        titleEn: titles.en,
        sortOrder: spec.sortOrderBase + index,
        unitSize: spec.template.chords.length,
        progression: buildProgressionTemplateEntries({
          ...spec.template,
          patternId,
        }),
      });
    });
  }

  return [...singles, ...progressions];
};
