#!/usr/bin/env node
/**
 * Training mode seed migration SQL generator.
 * Usage: node scripts/generate-training-seed.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
/**
 * 20260910130100 / 20260910130300 / 20260910130400 は適用済み。再出力しない。
 * 定義修正は upsert 用の新マイグレーション（inversionOut）のみ出力する。
 */

const NS = 'b0000000-0000-4000-8000-000000000001';
const DEFAULT_BGM =
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3';

const W = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ROOT_SETS = {
  /** 白鍵 + Db Eb Gb Ab Bb（メジャー系） */
  A: [...W, 'Db', 'Eb', 'Gb', 'Ab', 'Bb'],
  /** 白鍵 + C# D# Eb F# Ab Bb（マイナー系） */
  B: [...W, 'C#', 'D#', 'Eb', 'F#', 'Ab', 'Bb'],
  /** 白鍵 + C# D# Eb F# G# Ab Bb（dim / aug / m7b5） */
  C: [...W, 'C#', 'D#', 'Eb', 'F#', 'G#', 'Ab', 'Bb'],
  /** 白鍵 + 全ての黒鍵異名同音（ドミナント系 / モード） */
  D: [...W, 'C#', 'Db', 'D#', 'Eb', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb'],
  /** 白鍵 + Db Eb F# Gb Ab Bb（メジャースケール） */
  SCALE_MAJOR: [...W, 'Db', 'Eb', 'F#', 'Gb', 'Ab', 'Bb'],
  /** 白鍵 + C# Db Eb F# Ab Bb（マイナースケール系） */
  SCALE_MINOR: [...W, 'C#', 'Db', 'Eb', 'F#', 'Ab', 'Bb'],
};

/** tonal interval -> Japanese label (from INTERVAL_DEFINITIONS) */
const INTERVAL_LABELS_JA = {
  '2m': '短2度',
  '2M': '長2度',
  '3m': '短3度',
  '3M': '長3度',
  '4P': '完全4度',
  '4A': '増4度',
  '5P': '完全5度',
  '6m': '短6度',
  '6M': '長6度',
  '7m': '短7度',
  '7M': '長7度',
};

const INTERVAL_LABELS_EN = {
  '2m': 'Minor 2nd',
  '2M': 'Major 2nd',
  '3m': 'Minor 3rd',
  '3M': 'Major 3rd',
  '4P': 'Perfect 4th',
  '4A': 'Augmented 4th',
  '5P': 'Perfect 5th',
  '6m': 'Minor 6th',
  '6M': 'Major 6th',
  '7m': 'Minor 7th',
  '7M': 'Major 7th',
};

const TRIAD_TITLES = {
  maj: { ja: 'メジャー', en: 'Major' },
  min: { ja: 'マイナー', en: 'Minor' },
  dim: { ja: 'ディミニッシュ', en: 'Diminished' },
  aug: { ja: 'オーギュメント', en: 'Augmented' },
  sus4: { ja: 'サス4', en: 'Sus4' },
};

const TRIAD_INVERSION_NAMES = {
  maj: { ja: 'メジャートライアド', en: 'Major Triad' },
  min: { ja: 'マイナートライアド', en: 'Minor Triad' },
  dim: { ja: 'ディミニッシュトライアド', en: 'Diminished Triad' },
  aug: { ja: 'オーギュメントトライアド', en: 'Augmented Triad' },
  sus4: { ja: 'サス4トライアド', en: 'Sus4 Triad' },
};

const INVERSION_LABELS_JA = ['基本形', '第一転回形', '第二転回形', '第三転回形'];
const INVERSION_LABELS_EN = ['Root Position', '1st Inversion', '2nd Inversion', '3rd Inversion'];

const SEVENTH_TITLES = {
  maj7: { ja: 'メジャー7th', en: 'Major 7th' },
  m7: { ja: 'マイナー7th', en: 'Minor 7th' },
  7: { ja: 'ドミナント7th', en: 'Dominant 7th' },
  m7b5: { ja: 'マイナー7♭5', en: 'Minor 7 b5' },
  dim7: { ja: 'ディミニッシュ7th', en: 'Diminished 7th' },
  '7sus4': { ja: '7サス4', en: '7 Sus4' },
  6: { ja: '6和音', en: '6th Chord' },
  m6: { ja: 'マイナー6', en: 'Minor 6th' },
  mM7: { ja: 'マイナーメジャー7th', en: 'Minor-Major 7th' },
};

const SCALE_TITLES = {
  major: { ja: 'メジャースケール', en: 'Major Scale' },
  natural_minor: { ja: 'ナチュラルマイナースケール', en: 'Natural Minor Scale' },
  harmonic_minor: { ja: 'ハーモニックマイナースケール', en: 'Harmonic Minor Scale' },
  melodic_minor: { ja: 'メロディックマイナースケール', en: 'Melodic Minor Scale' },
  dorian: { ja: 'ドリアンスケール', en: 'Dorian Scale' },
  phrygian: { ja: 'フリジアンスケール', en: 'Phrygian Scale' },
  lydian: { ja: 'リディアンスケール', en: 'Lydian Scale' },
  mixolydian: { ja: 'ミクソリディアンスケール', en: 'Mixolydian Scale' },
  locrian: { ja: 'ロクリアンスケール', en: 'Locrian Scale' },
  half_whole_diminished: { ja: 'ハーフホールディミニッシュ', en: 'Half-Whole Diminished' },
  whole_half_diminished: { ja: 'ホールハーフディミニッシュ', en: 'Whole-Half Diminished' },
  altered: { ja: 'オルタード', en: 'Altered Scale' },
  lydian_dominant: { ja: 'リディアンドミナント', en: 'Lydian Dominant' },
  locrian_natural2: { ja: 'ロクリアン♮2', en: 'Locrian Natural 2' },
  mixolydian_b6: { ja: 'ミクソリディアン♭6', en: 'Mixolydian b6' },
  whole_tone: { ja: '全音階', en: 'Whole Tone' },
};

const uuid = (key) => `uuid_generate_v5('${NS}'::uuid, '${key}')`;
const sqlStr = (value) => `'${String(value).replace(/'/g, "''")}'`;
const sqlJson = (value) => `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;

const categories = [
  { sort_order: 1, slug: 'intro', title_ja: '入門', title_en: 'Introduction', is_free: true },
  { sort_order: 2, slug: 'interval', title_ja: '音程', title_en: 'Intervals', is_free: false },
  {
    sort_order: 3,
    slug: 'triad',
    title_ja: '3和音(転回形指定無し)',
    title_en: 'Triads (Unspecified)',
    is_free: false,
  },
  {
    sort_order: 4,
    slug: 'triad_inversion',
    title_ja: '3和音(転回形)',
    title_en: 'Triads (Inversions)',
    is_free: false,
  },
  {
    sort_order: 5,
    slug: 'seventh',
    title_ja: '4和音(転回形指定無し)',
    title_en: 'Seventh Chords (Unspecified)',
    is_free: false,
  },
  {
    sort_order: 6,
    slug: 'seventh_inversion',
    title_ja: '4和音(転回形)',
    title_en: 'Seventh Chords (Inversions)',
    is_free: false,
  },
  { sort_order: 7, slug: 'scale_basic', title_ja: '初級スケール', title_en: 'Basic Scales', is_free: false },
  {
    sort_order: 8,
    slug: 'scale_intermediate',
    title_ja: '中級スケール',
    title_en: 'Intermediate Scales',
    is_free: false,
  },
  {
    sort_order: 9,
    slug: 'scale_advanced',
    title_ja: '上級スケール',
    title_en: 'Advanced Scales',
    is_free: false,
  },
  {
    sort_order: 10,
    slug: 'tension_voicing',
    title_ja: 'テンションヴォイシング(転回形指定無し)',
    title_en: 'Tension Voicings (Unspecified)',
    is_free: false,
  },
  {
    sort_order: 11,
    slug: 'tension_voicing_ab',
    title_ja: 'テンションヴォイシング(A/Bフォーム)',
    title_en: 'Tension Voicings (A/B Forms)',
    is_free: false,
  },
  {
    sort_order: 12,
    slug: 'two_hand_voicing',
    title_ja: '両手ヴォイシング',
    title_en: 'Two-Hand Voicings',
    is_free: false,
  },
];

/** @type {Array<{
 *   categorySlug: string;
 *   slug: string;
 *   title_ja: string;
 *   title_en: string;
 *   sort_order: number;
 *   kind: string;
 *   clef_mode: string;
 *   play_root_on_correct?: boolean;
 *   config: Record<string, unknown>;
 * }>} */
const trainings = [];

const addTraining = (categorySlug, entry) => {
  const playRootOnCorrect = entry.play_root_on_correct ?? (entry.kind === 'chord' || entry.kind === 'voicing');
  trainings.push({ categorySlug, ...entry, play_root_on_correct: playRootOnCorrect });
};

// Cat 1: intro (譜読み 4 種)
addTraining('intro', {
  slug: 'note-reading-treble',
  title_ja: '音符の読み方(ト音記号)',
  title_en: 'Note Reading (Treble)',
  sort_order: 1,
  kind: 'note_reading',
  clef_mode: 'instrument',
  config: { clef: 'auto', include_accidentals: false },
});
addTraining('intro', {
  slug: 'note-reading-bass',
  title_ja: '音符の読み方(ヘ音記号・In C固定)',
  title_en: 'Note Reading (Bass, In C)',
  sort_order: 2,
  kind: 'note_reading',
  clef_mode: 'bass_concert',
  config: { clef: 'bass', include_accidentals: false },
});
addTraining('intro', {
  slug: 'note-reading-treble-accidentals',
  title_ja: '音符の読み方(ト音記号・シャープフラットあり)',
  title_en: 'Note Reading (Treble, Accidentals)',
  sort_order: 3,
  kind: 'note_reading',
  clef_mode: 'instrument',
  config: { clef: 'auto', include_accidentals: true },
});
addTraining('intro', {
  slug: 'note-reading-bass-accidentals',
  title_ja: '音符の読み方(ヘ音記号・シャープフラットあり・In C固定)',
  title_en: 'Note Reading (Bass, Accidentals, In C)',
  sort_order: 4,
  kind: 'note_reading',
  clef_mode: 'bass_concert',
  config: { clef: 'bass', include_accidentals: true },
});

// Cat 2: intervals
const intervalTonal = ['2m', '2M', '3m', '3M', '4P', '4A', '5P', '6m', '6M', '7m', '7M'];
let intervalSort = 1;
for (const interval of intervalTonal) {
  for (const direction of ['up', 'down']) {
    const dirJa = direction === 'up' ? '上' : '下';
    const dirEn = direction === 'up' ? 'Up' : 'Down';
    addTraining('interval', {
      slug: `interval-${interval}-${direction}`,
      title_ja: `${INTERVAL_LABELS_JA[interval]}${dirJa}`,
      title_en: `${INTERVAL_LABELS_EN[interval]} ${dirEn}`,
      sort_order: intervalSort,
      kind: 'interval',
      clef_mode: 'instrument',
      config: { interval, direction },
    });
    intervalSort += 1;
  }
}

addTraining('interval', {
  slug: 'interval-mixed-up',
  title_ja: '度数まとめ上',
  title_en: 'Mixed Intervals Up',
  sort_order: intervalSort,
  kind: 'interval',
  clef_mode: 'instrument',
  config: { direction: 'up' },
});
intervalSort += 1;
addTraining('interval', {
  slug: 'interval-mixed-down',
  title_ja: '度数まとめ下',
  title_en: 'Mixed Intervals Down',
  sort_order: intervalSort,
  kind: 'interval',
  clef_mode: 'instrument',
  config: { direction: 'down' },
});

// Cat 3: triads
const triads = [
  { quality: 'maj', roots: 'A' },
  { quality: 'min', roots: 'B' },
  { quality: 'dim', roots: 'C' },
  { quality: 'aug', roots: 'C' },
  { quality: 'sus4', roots: 'A' },
];
triads.forEach(({ quality, roots }, index) => {
  addTraining('triad', {
    slug: `triad-${quality}`,
    title_ja: TRIAD_TITLES[quality].ja,
    title_en: TRIAD_TITLES[quality].en,
    sort_order: index + 1,
    kind: 'chord',
    clef_mode: 'instrument',
    config: { quality, roots: ROOT_SETS[roots] },
  });
});

// Cat 3b: triad inversions (基本形 / 第一 / 第二)
let triadInvSort = 1;
for (const { quality, roots } of triads) {
  const names = TRIAD_INVERSION_NAMES[quality];
  for (let inversion = 0; inversion <= 2; inversion += 1) {
    addTraining('triad_inversion', {
      slug: `triad-${quality}-inv${inversion}`,
      title_ja: `${names.ja}(${INVERSION_LABELS_JA[inversion]})`,
      title_en: `${names.en} (${INVERSION_LABELS_EN[inversion]})`,
      sort_order: triadInvSort,
      kind: 'chord',
      clef_mode: 'instrument',
      config: { quality, roots: ROOT_SETS[roots], inversion, ordered: true },
    });
    triadInvSort += 1;
  }
}

// Cat 4: seventh chords
const sevenths = [
  { quality: 'maj7', roots: 'A' },
  { quality: 'm7', roots: 'B' },
  { quality: '7', roots: 'D' },
  { quality: 'm7b5', roots: 'C' },
  { quality: 'dim7', roots: 'C' },
  { quality: '7sus4', roots: 'D' },
  { quality: '6', roots: 'A' },
  { quality: 'm6', roots: 'B' },
  { quality: 'mM7', roots: 'B' },
];
sevenths.forEach(({ quality, roots }, index) => {
  addTraining('seventh', {
    slug: `seventh-${quality}`,
    title_ja: SEVENTH_TITLES[quality].ja,
    title_en: SEVENTH_TITLES[quality].en,
    sort_order: index + 1,
    kind: 'chord',
    clef_mode: 'instrument',
    config: { quality, roots: ROOT_SETS[roots] },
  });
});

// Cat 4b: seventh inversions (基本形 / 第一 / 第二 / 第三)
let seventhInvSort = 1;
for (const { quality, roots } of sevenths) {
  const names = SEVENTH_TITLES[quality];
  for (let inversion = 0; inversion <= 3; inversion += 1) {
    addTraining('seventh_inversion', {
      slug: `seventh-${quality}-inv${inversion}`,
      title_ja: `${names.ja}(${INVERSION_LABELS_JA[inversion]})`,
      title_en: `${names.en} (${INVERSION_LABELS_EN[inversion]})`,
      sort_order: seventhInvSort,
      kind: 'chord',
      clef_mode: 'instrument',
      config: { quality, roots: ROOT_SETS[roots], inversion, ordered: true },
    });
    seventhInvSort += 1;
  }
}

// Cat 5: basic scales
['major', 'natural_minor', 'harmonic_minor', 'melodic_minor'].forEach((scale, index) => {
  addTraining('scale_basic', {
    slug: `scale-${scale}`,
    title_ja: SCALE_TITLES[scale].ja,
    title_en: SCALE_TITLES[scale].en,
    sort_order: index + 1,
    kind: 'scale',
    clef_mode: 'instrument',
    config: {
      scale,
      roots: scale === 'major' ? ROOT_SETS.SCALE_MAJOR : ROOT_SETS.SCALE_MINOR,
    },
  });
});

// Cat 6: intermediate scales
['dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'].forEach((scale, index) => {
  addTraining('scale_intermediate', {
    slug: `scale-${scale}`,
    title_ja: SCALE_TITLES[scale].ja,
    title_en: SCALE_TITLES[scale].en,
    sort_order: index + 1,
    kind: 'scale',
    clef_mode: 'instrument',
    config: { scale, roots: ROOT_SETS.D },
  });
});

// Cat 7: advanced scales
[
  'half_whole_diminished',
  'whole_half_diminished',
  'altered',
  'lydian_dominant',
  'locrian_natural2',
  'mixolydian_b6',
  'whole_tone',
].forEach((scale, index) => {
  addTraining('scale_advanced', {
    slug: `scale-${scale}`,
    title_ja: SCALE_TITLES[scale].ja,
    title_en: SCALE_TITLES[scale].en,
    sort_order: index + 1,
    kind: 'scale',
    clef_mode: 'instrument',
    config: { scale, roots: ROOT_SETS.D },
  });
});

// Cat 8: tension voicings (bass concert)
// intervals はルートからの tonal 表記（ルートレスの場合は 1P を含まない）。
// min_lowest_note: 「最低コード」の最低音。各ルートはこの音以上で最も低いオクターブに配置する。
const tensionVoicings = [
  {
    slug: 'tension-maj7-9',
    title: 'M7(9)',
    intervals: ['3M', '5P', '7M', '9M'],
    roots: 'A',
    min_lowest_note: 'E3', // CM7(9): E3 G3 B3 D4
  },
  {
    slug: 'tension-m7-9',
    title: 'm7(9)',
    intervals: ['3m', '5P', '7m', '9M'],
    roots: 'B',
    min_lowest_note: 'Eb3', // Cm7(9): Eb3 G3 Bb3 D4
  },
  {
    slug: 'tension-7-9-6th',
    title: '7(9.13)',
    intervals: ['3M', '6M', '7m', '9M'],
    roots: 'D',
    min_lowest_note: 'E3', // C7(9.13): E3 A3 Bb3 D4
  },
  {
    slug: 'tension-7-b9-b6th',
    title: '7(b9.b13)',
    intervals: ['3M', '6m', '7m', '9m'],
    roots: 'D',
    min_lowest_note: 'E3', // C7(b9.b13): E3 Ab3 Bb3 Db4
  },
  {
    slug: 'tension-m7b5-11',
    title: 'm7(b5)(11)',
    intervals: ['1P', '4P', '5d', '7m'],
    roots: 'C',
    min_lowest_note: 'E3', // Em7(b5)(11): E3 A3 Bb3 D4
  },
  {
    slug: 'tension-6-9',
    title: '6(9)',
    intervals: ['3M', '5P', '6M', '9M'],
    roots: 'A',
    min_lowest_note: 'E3', // C6(9): E3 G3 A3 D4
  },
  {
    slug: 'tension-m6-9',
    title: 'm6(9)',
    intervals: ['3m', '5P', '6M', '9M'],
    roots: 'B',
    min_lowest_note: 'Eb3', // Cm6(9): Eb3 G3 A3 D4
  },
  {
    slug: 'tension-mm7-9',
    title: 'mM7(9)',
    intervals: ['3m', '5P', '7M', '9M'],
    roots: 'B',
    min_lowest_note: 'Eb3', // CmM7(9): Eb3 G3 B3 D4
  },
];
tensionVoicings.forEach((item, index) => {
  const config = {
    roots: ROOT_SETS[item.roots],
    intervals: item.intervals,
    min_lowest_note: item.min_lowest_note,
  };
  addTraining('tension_voicing', {
    slug: item.slug,
    title_ja: item.title,
    title_en: item.title,
    sort_order: index + 1,
    kind: 'voicing',
    clef_mode: 'bass_concert',
    config,
  });
});

// Cat 8b: tension voicings A/B forms (treble clef, ordered bottom-up)
const tensionVoicingsAB = [
  {
    slug: 'tension-maj7-9',
    title: 'M7(9)',
    aIntervals: ['3M', '5P', '7M', '9M'],
    bIntervals: ['7M', '9M', '10M', '12P'],
    roots: 'A',
  },
  {
    slug: 'tension-m7-9',
    title: 'm7(9)',
    aIntervals: ['3m', '5P', '7m', '9M'],
    bIntervals: ['7m', '9M', '10m', '12P'],
    roots: 'B',
  },
  {
    slug: 'tension-7-9-6th',
    title: '7(9.13)',
    aIntervals: ['3M', '6M', '7m', '9M'],
    bIntervals: ['7m', '9M', '10M', '13M'],
    roots: 'D',
  },
  {
    slug: 'tension-7-b9-b6th',
    title: '7(b9.b13)',
    aIntervals: ['3M', '6m', '7m', '9m'],
    bIntervals: ['7m', '9m', '10M', '13m'],
    roots: 'D',
  },
  {
    slug: 'tension-m7b5-11',
    title: 'm7(b5)(11)',
    aIntervals: ['1P', '4P', '5d', '7m'],
    bIntervals: ['7m', '8P', '11P', '12d'],
    roots: 'C',
  },
  {
    slug: 'tension-6-9',
    title: '6(9)',
    aIntervals: ['3M', '5P', '6M', '9M'],
    bIntervals: ['6M', '9M', '10M', '12P'],
    roots: 'A',
  },
  {
    slug: 'tension-m6-9',
    title: 'm6(9)',
    aIntervals: ['3m', '5P', '6M', '9M'],
    bIntervals: ['6M', '9M', '10m', '12P'],
    roots: 'B',
  },
  {
    slug: 'tension-mm7-9',
    title: 'mM7(9)',
    aIntervals: ['3m', '5P', '7M', '9M'],
    bIntervals: ['7M', '9M', '10m', '12P'],
    roots: 'B',
  },
];
let tensionAbSort = 1;
for (const item of tensionVoicingsAB) {
  for (const form of ['a', 'b']) {
    const formLabelJa = form === 'a' ? 'Aフォーム' : 'Bフォーム';
    const formLabelEn = form === 'a' ? 'Form A' : 'Form B';
    addTraining('tension_voicing_ab', {
      slug: `${item.slug}-${form}`,
      title_ja: `${item.title}(${formLabelJa})`,
      title_en: `${item.title} (${formLabelEn})`,
      sort_order: tensionAbSort,
      kind: 'voicing',
      clef_mode: 'instrument',
      config: {
        roots: ROOT_SETS[item.roots],
        intervals: form === 'a' ? item.aIntervals : item.bIntervals,
        clef: 'treble',
        ordered: true,
      },
    });
    tensionAbSort += 1;
  }
}

// Cat 9: two-hand voicings (grand concert)
// voicing_notes は reference_root = C のときの実音（下から順）。各ルートへは綴りを保って移調する。
// min_lowest_note: 「最低コード」の最低音。
const twoHandVoicings = [
  {
    slug: 'two-hand-m7-so-what',
    title: 'M7 So What',
    voicing_notes: ['E3', 'A3', 'D4', 'G4', 'B4'],
    staves: [2, 2, 1, 1, 1],
    roots: 'A',
    min_lowest_note: 'E3', // CM7
  },
  {
    slug: 'two-hand-m7-so-what-minor',
    title: 'm7 So What',
    voicing_notes: ['C3', 'F3', 'Bb3', 'Eb4', 'G4'],
    staves: [2, 2, 2, 1, 1],
    roots: 'B',
    min_lowest_note: 'C3', // Cm7
  },
  {
    slug: 'two-hand-7-mixo-4th',
    title: '7 mixo 4th',
    voicing_notes: ['Bb2', 'E3', 'A3', 'D4', 'G4', 'C5'],
    staves: [2, 2, 2, 1, 1, 1],
    roots: 'D',
    min_lowest_note: 'Db3', // Eb7
  },
  {
    slug: 'two-hand-7-alt-4th',
    title: '7 alt 4th',
    voicing_notes: ['E3', 'Bb3', 'Eb4', 'Ab4', 'Db5'],
    staves: [2, 2, 2, 1, 1],
    roots: 'D',
    min_lowest_note: 'D3', // Bb7
  },
  {
    slug: 'two-hand-7-sharp11-ust-ii',
    title: '7#11 UST II',
    voicing_notes: ['E3', 'Bb3', 'D4', 'F#4', 'A4'],
    staves: [2, 2, 1, 1, 1],
    roots: 'D',
    min_lowest_note: 'D3', // Bb7
  },
  {
    slug: 'two-hand-7-alt-ust-bvi',
    title: '7 alt UST bVI',
    voicing_notes: ['Bb2', 'Fb3', 'Ab3', 'C4', 'Eb4'],
    staves: [2, 2, 2, 1, 1],
    roots: 'D',
    min_lowest_note: 'D3', // E7
  },
  {
    slug: 'two-hand-mm7-ust-v',
    title: 'mM7 UST V',
    voicing_notes: ['A2', 'Eb3', 'G3', 'B3', 'D4'],
    staves: [2, 2, 1, 1, 1],
    roots: 'B',
    min_lowest_note: 'D3', // FmM7
  },
  {
    slug: 'two-hand-m7b5-ust-bvii',
    title: 'm7b5 UST bVII',
    voicing_notes: ['C3', 'Gb3', 'Bb3', 'D4', 'F4'],
    staves: [2, 2, 2, 1, 1],
    roots: 'C',
    min_lowest_note: 'D3', // Dm7b5
  },
];
twoHandVoicings.forEach((item, index) => {
  addTraining('two_hand_voicing', {
    slug: item.slug,
    title_ja: item.title,
    title_en: item.title,
    sort_order: index + 1,
    kind: 'voicing',
    clef_mode: 'grand_concert',
    config: {
      voicing_notes: item.voicing_notes,
      staves: item.staves,
      roots: ROOT_SETS[item.roots],
      min_lowest_note: item.min_lowest_note,
      reference_root: 'C',
    },
  });
});

// Inversions + A/B forms (upsert only; output as 20260926120000)
const inversionOut = join(
  repoRoot,
  'supabase',
  'migrations',
  '20260926120000_training_inversions.sql',
);
const inversionCategorySlugs = new Set([
  'triad',
  'triad_inversion',
  'seventh',
  'seventh_inversion',
  'scale_basic',
  'scale_intermediate',
  'scale_advanced',
  'tension_voicing',
  'tension_voicing_ab',
  'two_hand_voicing',
]);
const inversionCategories = categories.filter((c) => inversionCategorySlugs.has(c.slug));
const inversionCategoryRows = inversionCategories
  .map(
    (category) =>
      `  (${uuid(`training-category-${category.slug}`)}, ${sqlStr(category.slug)}, ${sqlStr(category.title_ja)}, ${sqlStr(category.title_en)}, ${category.sort_order}, ${category.is_free})`,
  )
  .join(',\n');
const inversionTrainingSlugs = new Set([
  ...trainings.filter((t) => t.categorySlug === 'triad_inversion').map((t) => t.slug),
  ...trainings.filter((t) => t.categorySlug === 'seventh_inversion').map((t) => t.slug),
  ...trainings.filter((t) => t.categorySlug === 'tension_voicing_ab').map((t) => t.slug),
]);
const inversionTrainings = trainings.filter((t) => inversionTrainingSlugs.has(t.slug));
const inversionTrainingRows = inversionTrainings
  .map((training) => {
    const categoryId = uuid(`training-category-${training.categorySlug}`);
    const trainingId = uuid(`training-${training.slug}`);
    return `  (${trainingId}, ${categoryId}, ${sqlStr(training.slug)}, ${sqlStr(training.title_ja)}, ${sqlStr(training.title_en)}, ${training.sort_order}, ${sqlStr(training.kind)}, ${sqlStr(training.clef_mode)}, false, ${training.play_root_on_correct}, ${sqlStr(DEFAULT_BGM)}, ${sqlJson(training.config)}, true)`;
  })
  .join(',\n');
const inversionSql = `-- Training mode: inversions + A/B tension voicings (generated by scripts/generate-training-seed.mjs)
BEGIN;

INSERT INTO public.training_categories (
  id, slug, title_ja, title_en, sort_order, is_free
) VALUES
${inversionCategoryRows}
ON CONFLICT (slug) DO UPDATE SET
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  is_free = EXCLUDED.is_free,
  updated_at = now();

INSERT INTO public.trainings (
  id,
  category_id,
  slug,
  title_ja,
  title_en,
  sort_order,
  kind,
  clef_mode,
  use_key_signature,
  play_root_on_correct,
  bgm_url,
  config,
  is_active
) VALUES
${inversionTrainingRows}
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  kind = EXCLUDED.kind,
  clef_mode = EXCLUDED.clef_mode,
  use_key_signature = EXCLUDED.use_key_signature,
  play_root_on_correct = EXCLUDED.play_root_on_correct,
  bgm_url = EXCLUDED.bgm_url,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Training category badges (rename existing + add new categories)
INSERT INTO public.badges (id, category, rank, name, name_en, condition_type, condition_value, condition_text, condition_text_en, image_path, sort_order)
SELECT
  'training_' || tc.slug || '_b_' || v.rank::text,
  'training_' || tc.slug,
  v.rank,
  tc.title_ja || ' ' || v.label_ja,
  tc.title_en || ' ' || v.label_en,
  'training_category_rank',
  v.threshold,
  tc.title_ja || 'の全課題を' || v.label_ja || '以上でクリア',
  'Clear all ' || tc.title_en || ' trainings at ' || v.label_en || ' or better',
  '/achivement/achievement_monster_33.png',
  200 + tc.sort_order * 3 + v.rank
FROM public.training_categories AS tc
CROSS JOIN (
  VALUES
    (1, 2, 'B以上', 'B+'),
    (2, 3, 'A以上', 'A+'),
    (3, 4, 'S以上', 'S+')
) AS v(rank, threshold, label_ja, label_en)
WHERE tc.slug IN (
  'triad',
  'triad_inversion',
  'seventh',
  'seventh_inversion',
  'tension_voicing',
  'tension_voicing_ab'
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  condition_text = EXCLUDED.condition_text,
  condition_text_en = EXCLUDED.condition_text_en,
  updated_at = now();

COMMIT;
`;
writeFileSync(inversionOut, inversionSql, 'utf8');
process.stdout.write(`Wrote ${inversionOut}\n`);
process.stdout.write(`Categories (total): ${categories.length}\n`);
process.stdout.write(`Trainings (total): ${trainings.length}\n`);
process.stdout.write(`Inversion categories upserted: ${inversionCategories.length}\n`);
process.stdout.write(`Inversion trainings upserted: ${inversionTrainings.length}\n`);
