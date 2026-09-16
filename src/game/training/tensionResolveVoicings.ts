import { distance, transpose } from 'tonal';

import type { TrainingProgressionEntry } from '@/game/training/trainingTypes';
import {
  ALL_MAJOR_KEYS,
  KEY_FIFTHS_BY_MAJOR,
  type MajorKey,
} from '@/utils/twoHandVoicingIntermediateCourse';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

export const TENSION_RESOLVE_BGM_URL =
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3';

export const TENSION_RESOLVE_UUID_NS = 'b0000000-0000-4000-8000-000000000001';

/** 単発コードの12ルート（In C固定・無調号） */
const TENSION_RESOLVE_SINGLE_ROOTS: readonly string[] = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B',
];

interface TensionResolveChordTemplate {
  readonly referenceRoot: string;
  readonly suffix: string;
  readonly voicingSlots: readonly (readonly string[])[];
}

interface TensionResolveProgressionTemplate {
  readonly referenceKey: MajorKey;
  readonly chords: readonly {
    readonly referenceRoot: string;
    readonly suffix: string;
    readonly voicingSlots: readonly (readonly string[])[];
  }[];
}

const normalizeSpelling = (name: string): string => name.replace(/##/g, 'x');

const transposeNote = (name: string, interval: string): string => {
  const transposed = transpose(name, interval);
  if (!transposed) {
    throw new Error(`transpose failed: ${name} + ${interval}`);
  }
  return normalizeSpelling(transposed);
};

const transposeSlots = (
  slots: readonly (readonly string[])[],
  interval: string,
): string[][] => slots.map((slot) => slot.map((note) => transposeNote(note, interval)));

const transposeRoot = (root: string, interval: string): string => {
  const transposed = transpose(root, interval);
  if (!transposed) {
    throw new Error(`transpose root failed: ${root} + ${interval}`);
  }
  return normalizeSpelling(transposed);
};

const chordNameFromParts = (root: string, suffix: string): string => `${root}${suffix}`;

const staffForNote = (noteName: string): 1 | 2 => (
  parseVoicingNoteName(noteName).midi < 60 ? 2 : 1
);

const stavesForSlots = (slots: readonly (readonly string[])[]): number[] => {
  const out: number[] = [];
  for (const slot of slots) {
    for (const note of slot) {
      out.push(staffForNote(note));
    }
  }
  return out;
};

const buildProgressionEntry = (
  name: string,
  voicingSlots: readonly (readonly string[])[],
  keyFifths: number,
): TrainingProgressionEntry & { voicingSlots: readonly (readonly string[])[] } => {
  const firstSlot = voicingSlots[0] ?? [];
  return {
    name,
    voicing: firstSlot.map((note) => parseVoicingNoteName(note).midi),
    voicingNames: [...firstSlot],
    voicingStaves: stavesForSlots(voicingSlots),
    keyFifths,
    voicingSlots,
  };
};

export const buildSingleChordProgression = (
  template: TensionResolveChordTemplate,
): readonly (TrainingProgressionEntry & { voicingSlots: readonly (readonly string[])[] })[] =>
  TENSION_RESOLVE_SINGLE_ROOTS.map((targetRoot) => {
    const interval = distance(template.referenceRoot, targetRoot);
    if (!interval || interval === '1P') {
      return buildProgressionEntry(
        chordNameFromParts(targetRoot, template.suffix),
        template.voicingSlots,
        0,
      );
    }
    const slots = transposeSlots(template.voicingSlots, interval);
    return buildProgressionEntry(
      chordNameFromParts(targetRoot, template.suffix),
      slots,
      0,
    );
  });

export const buildKeyProgression = (
  template: TensionResolveProgressionTemplate,
  targetKey: MajorKey,
): readonly (TrainingProgressionEntry & { voicingSlots: readonly (readonly string[])[] })[] => {
  const interval = distance(template.referenceKey, targetKey);
  if (!interval) {
    throw new Error(`distance failed: ${template.referenceKey} -> ${targetKey}`);
  }
  const keyFifths = KEY_FIFTHS_BY_MAJOR[targetKey];
  return template.chords.map((chord) => {
    const root = interval === '1P'
      ? chord.referenceRoot
      : transposeRoot(chord.referenceRoot, interval);
    const slots = interval === '1P'
      ? chord.voicingSlots
      : transposeSlots(chord.voicingSlots, interval);
    return buildProgressionEntry(
      chordNameFromParts(root, chord.suffix),
      slots,
      keyFifths,
    );
  });
};

const buildAllKeyProgressions = (
  template: TensionResolveProgressionTemplate,
): readonly (TrainingProgressionEntry & { voicingSlots: readonly (readonly string[])[] })[] =>
  ALL_MAJOR_KEYS.flatMap((key) => [...buildKeyProgression(template, key)]);

/** 単発: m7 / M7 / 7(mixo) — 1つ目 D3 G3 Bb3 F4, 2つ目 C3 Eb4（Cm7 基準） */
const SLOTS_M7_FAMILY: readonly (readonly string[])[] = [
  ['D3', 'G3', 'Bb3', 'F4'],
  ['C3', 'Eb4'],
];

/** 単発: 7(alt) / m7(b5) / 7(#11) / m6 — 1つ目 D3 Gb3 Bb3 F4, 2つ目 C3 Eb4 */
const SLOTS_ALT_FAMILY: readonly (readonly string[])[] = [
  ['D3', 'Gb3', 'Bb3', 'F4'],
  ['C3', 'Eb4'],
];

export const TENSION_RESOLVE_SINGLE_TEMPLATES = {
  m7: {
    referenceRoot: 'C',
    suffix: 'm7',
    voicingSlots: SLOTS_M7_FAMILY,
  },
  maj7: {
    referenceRoot: 'Eb',
    suffix: 'M7',
    voicingSlots: SLOTS_M7_FAMILY,
  },
  mixo7: {
    referenceRoot: 'F',
    suffix: '7(mixo)',
    voicingSlots: SLOTS_M7_FAMILY,
  },
  alt7: {
    referenceRoot: 'D',
    suffix: '7(alt)',
    voicingSlots: SLOTS_ALT_FAMILY,
  },
  m7b5: {
    referenceRoot: 'C',
    suffix: 'm7(b5)',
    voicingSlots: SLOTS_ALT_FAMILY,
  },
  sharp11_7: {
    referenceRoot: 'Ab',
    suffix: '7(#11)',
    voicingSlots: SLOTS_ALT_FAMILY,
  },
  m6: {
    referenceRoot: 'Eb',
    suffix: 'm6',
    voicingSlots: SLOTS_ALT_FAMILY,
  },
} as const satisfies Record<string, TensionResolveChordTemplate>;

const F7_ALT_SLOTS: readonly (readonly string[])[] = [
  ['F3', 'Bbb3', 'Db4', 'Ab4'],
  ['Eb3', 'Gb4'],
];

const BBM7_III_SLOTS: readonly (readonly string[])[] = [
  ['D3', 'A3', 'C4', 'F4'],
  ['A3', 'D4', 'F4', 'C5'],
  ['G3', 'Bb4'],
];

export const TENSION_RESOLVE_PROGRESSION_TEMPLATES = {
  iiV_i: {
    referenceKey: 'Bb',
    chords: [
      { referenceRoot: 'C', suffix: 'm7', voicingSlots: SLOTS_M7_FAMILY },
      { referenceRoot: 'F', suffix: '7(alt)', voicingSlots: F7_ALT_SLOTS },
      { referenceRoot: 'Bb', suffix: 'M7', voicingSlots: BBM7_III_SLOTS },
    ],
  },
  iViIiV: {
    referenceKey: 'Bb',
    chords: [
      {
        referenceRoot: 'Bb',
        suffix: 'M7',
        voicingSlots: [
          ['A3', 'D4', 'F4', 'C5'],
          ['G3', 'Bb4'],
        ],
      },
      {
        referenceRoot: 'G',
        suffix: '7(alt)',
        voicingSlots: [
          ['G3', 'Cb4', 'Eb4', 'Bb4'],
          ['F3', 'Ab4'],
        ],
      },
      {
        referenceRoot: 'C',
        suffix: 'm7',
        voicingSlots: [
          ['Eb3', 'Bb3', 'D4', 'G4'],
          ['D3', 'G3', 'Bb3', 'F4'],
          ['C3', 'Eb4'],
        ],
      },
      { referenceRoot: 'F', suffix: '7(alt)', voicingSlots: F7_ALT_SLOTS },
    ],
  },
  minorIiV_i: {
    referenceKey: 'Db',
    chords: [
      { referenceRoot: 'C', suffix: 'm7(b5)', voicingSlots: SLOTS_ALT_FAMILY },
      { referenceRoot: 'F', suffix: '7(alt)', voicingSlots: F7_ALT_SLOTS },
      {
        referenceRoot: 'Bb',
        suffix: 'm6',
        voicingSlots: [
          ['Db3', 'G3', 'C4', 'F4'],
          ['A3', 'Db4', 'F4', 'C5'],
          ['G3', 'Bb4'],
        ],
      },
    ],
  },
} as const satisfies Record<string, TensionResolveProgressionTemplate>;

export interface TensionResolveTrainingSpec {
  readonly slug: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly sortOrder: number;
  readonly useKeySignature: boolean;
  readonly unitSize: number;
  readonly progression: readonly TrainingProgressionEntry[];
}

export const buildTensionResolveTrainingSpecs = (): readonly TensionResolveTrainingSpec[] => {
  const singleDefs: readonly {
    readonly slug: string;
    readonly titleJa: string;
    readonly titleEn: string;
    readonly template: TensionResolveChordTemplate;
  }[] = [
    { slug: 'tension-resolve-m7', titleJa: 'm7', titleEn: 'm7', template: TENSION_RESOLVE_SINGLE_TEMPLATES.m7 },
    { slug: 'tension-resolve-maj7', titleJa: 'M7', titleEn: 'M7', template: TENSION_RESOLVE_SINGLE_TEMPLATES.maj7 },
    { slug: 'tension-resolve-7-mixo', titleJa: '7(mixo)', titleEn: '7(mixo)', template: TENSION_RESOLVE_SINGLE_TEMPLATES.mixo7 },
    { slug: 'tension-resolve-7-alt', titleJa: '7(alt)', titleEn: '7(alt)', template: TENSION_RESOLVE_SINGLE_TEMPLATES.alt7 },
    { slug: 'tension-resolve-m7b5', titleJa: 'm7(b5)', titleEn: 'm7(b5)', template: TENSION_RESOLVE_SINGLE_TEMPLATES.m7b5 },
    { slug: 'tension-resolve-7-sharp11', titleJa: '7(#11)', titleEn: '7(#11)', template: TENSION_RESOLVE_SINGLE_TEMPLATES.sharp11_7 },
    { slug: 'tension-resolve-m6', titleJa: 'm6', titleEn: 'm6', template: TENSION_RESOLVE_SINGLE_TEMPLATES.m6 },
  ];

  const singles: TensionResolveTrainingSpec[] = singleDefs.map(({ slug, titleJa, titleEn, template }, index) => ({
    slug,
    titleJa,
    titleEn,
    sortOrder: index + 1,
    useKeySignature: false,
    unitSize: 1,
    progression: buildSingleChordProgression(template),
  }));

  const progressions: TensionResolveTrainingSpec[] = [
    {
      slug: 'tension-resolve-ii-v-i',
      titleJa: 'II-V-I',
      titleEn: 'II-V-I',
      sortOrder: 8,
      useKeySignature: true,
      unitSize: 3,
      progression: buildAllKeyProgressions(TENSION_RESOLVE_PROGRESSION_TEMPLATES.iiV_i),
    },
    {
      slug: 'tension-resolve-i-vi-ii-v',
      titleJa: 'I-VI-II-V',
      titleEn: 'I-VI-II-V',
      sortOrder: 9,
      useKeySignature: true,
      unitSize: 4,
      progression: buildAllKeyProgressions(TENSION_RESOLVE_PROGRESSION_TEMPLATES.iViIiV),
    },
    {
      slug: 'tension-resolve-minor-ii-v-i',
      titleJa: 'Minor II-V-I',
      titleEn: 'Minor II-V-I',
      sortOrder: 10,
      useKeySignature: true,
      unitSize: 3,
      progression: buildAllKeyProgressions(TENSION_RESOLVE_PROGRESSION_TEMPLATES.minorIiV_i),
    },
  ];

  return [...singles, ...progressions];
};

