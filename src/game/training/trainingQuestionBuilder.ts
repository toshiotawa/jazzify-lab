import { distance, transpose } from 'tonal';

import type {
  TrainingQuestion,
  TrainingQuestionBuilderOptions,
  TrainingQuestionNote,
} from '@/game/training/trainingTypes';
import { CHORD_TEMPLATES, SCALE_TEMPLATES } from '@/utils/chord-templates';
import type { ChordQuality, ScaleType } from '@/utils/chord-templates';
import {
  getNotationInstrumentPreset,
  getWrittenSemitoneOffset,
  normalizeNotationInstrumentId,
} from '@/utils/notationInstrument';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

type Clef = 'treble' | 'bass';
type StaffNumber = 1 | 2;

const NATURAL_PITCH_CLASSES: ReadonlySet<number> = new Set([0, 2, 4, 5, 7, 9, 11]);

const naturalMidisInRange = (min: number, max: number): number[] => {
  const out: number[] = [];
  for (let midi = min; midi <= max; midi += 1) {
    if (NATURAL_PITCH_CLASSES.has(((midi % 12) + 12) % 12)) out.push(midi);
  }
  return out;
};

/** 譜読み: 加線1本までの幹音（記譜音）。ト音 C4-A5 / ヘ音 E2-C4 */
const NOTE_READING_CANDIDATES: Record<Clef, readonly number[]> = {
  treble: naturalMidisInRange(60, 81),
  bass: naturalMidisInRange(40, 60),
};

/** コンサート音高を♭系の綴りで音名にする（移調楽器は全て♭系のため記譜上は幹音になる） */
const FLAT_PITCH_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
const flatSpelledName = (midi: number): string => {
  const pc = ((midi % 12) + 12) % 12;
  return `${FLAT_PITCH_NAMES[pc] ?? 'C'}${Math.floor(midi / 12) - 1}`;
};

/** 和音・スケール・音程: 5線内に収まる最低音（記譜音）。ト音 E4 / ヘ音 G2 */
const STAFF_BOTTOM_MIDI: Record<Clef, number> = {
  treble: 64,
  bass: 43,
};

/** 音程トレーニングの基準音候補（綴りを固定） */
const INTERVAL_BASE_SPELLINGS: readonly string[] = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
];

/** 出題コードネーム用のクオリティ表記 */
const CHORD_SYMBOL_SUFFIX: Partial<Record<ChordQuality, string>> = {
  maj: '',
  min: 'm',
  dim: 'dim',
  aug: 'aug',
  sus4: 'sus4',
  maj7: 'M7',
  m7: 'm7',
  '7': '7',
  m7b5: 'm7(b5)',
  dim7: 'dim7',
  '7sus4': '7sus4',
  '6': '6',
  m6: 'm6',
  mM7: 'mM7',
};

const pickRandom = <T,>(items: readonly T[]): T => {
  if (items.length === 0) {
    throw new Error('pickRandom: empty');
  }
  return items[Math.floor(Math.random() * items.length)] as T;
};

const normalizePitchClass = (midi: number): number => ((midi % 12) + 12) % 12;

const accidentalText = (alter: number): string => {
  if (alter === 2) return 'x';
  if (alter === 1) return '#';
  if (alter === -1) return 'b';
  if (alter === -2) return 'bb';
  return '';
};

const normalizeSpelling = (name: string): string => name.replace(/##/g, 'x');

const midiOf = (name: string): number => parseVoicingNoteName(name).midi;

/** 綴りを保ってオクターブだけずらす */
const shiftOctave = (name: string, delta: number): string => {
  const parsed = parseVoicingNoteName(name);
  return `${parsed.step}${accidentalText(parsed.alter)}${parsed.octave + delta}`;
};

/** 最低音が [minMidi, minMidi + 12) に入る最も低いオクターブへ全音を平行移動する */
const placeLowestInOctaveAbove = (names: readonly string[], minMidi: number): string[] => {
  if (names.length === 0) return [];
  let lowest = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const midi = midiOf(name);
    if (midi < lowest) lowest = midi;
  }
  const octaveDelta = Math.ceil((minMidi - lowest) / 12);
  if (octaveDelta === 0) return names.slice();
  return names.map((name) => shiftOctave(name, octaveDelta));
};

const spelledFromIntervals = (rootWithOctave: string, intervals: readonly string[]): string[] =>
  intervals.map((interval) => {
    const note = transpose(rootWithOctave, interval);
    if (!note) {
      throw new Error(`transpose failed: ${rootWithOctave} + ${interval}`);
    }
    return normalizeSpelling(note);
  });

const transposeVoicingToRoot = (
  voicingNotes: readonly string[],
  referenceRoot: string,
  targetRoot: string,
): string[] => {
  const interval = distance(referenceRoot, targetRoot);
  if (!interval || interval === '1P') {
    return voicingNotes.slice();
  }
  return voicingNotes.map((name) => {
    const transposed = transpose(name, interval);
    if (!transposed) {
      throw new Error(`transpose failed: ${name} + ${interval}`);
    }
    return normalizeSpelling(transposed);
  });
};

/** 最低音の直下にあるルート音（正解時に鳴らす音） */
const rootMidiBelow = (root: string, lowestMidi: number): number => {
  const rootPc = normalizePitchClass(midiOf(`${root}4`));
  let midi = lowestMidi - ((normalizePitchClass(lowestMidi) - rootPc + 12) % 12);
  if (midi >= lowestMidi) midi -= 12;
  return midi;
};

/** 音程トレーニングでは重変化記号と E# / B# / Cb / Fb を避ける */
const isSimpleSpelling = (name: string): boolean => {
  const parsed = parseVoicingNoteName(name);
  if (Math.abs(parsed.alter) > 1) return false;
  if (parsed.alter === 1 && (parsed.step === 'E' || parsed.step === 'B')) return false;
  if (parsed.alter === -1 && (parsed.step === 'C' || parsed.step === 'F')) return false;
  return true;
};

const resolveEffectiveClef = (
  trainingClefMode: TrainingQuestionBuilderOptions['training']['clefMode'],
  instrumentClef: 'treble' | 'bass' | 'grand',
  configClef: 'auto' | 'treble' | 'bass' | undefined,
): Clef | 'grand' => {
  if (trainingClefMode === 'bass_concert') return 'bass';
  if (trainingClefMode === 'grand_concert') return 'grand';
  if (configClef === 'treble') return 'treble';
  if (configClef === 'bass') return 'bass';
  return instrumentClef === 'grand' ? 'treble' : instrumentClef;
};

const buildNotes = (
  names: readonly string[],
  staves: readonly StaffNumber[],
  targets: readonly boolean[],
): TrainingQuestionNote[] => names.map((noteName, index) => {
  const midi = midiOf(noteName);
  return {
    noteName,
    midi,
    pitchClass: normalizePitchClass(midi),
    staff: staves[index] ?? 1,
    isTarget: targets[index] ?? true,
  };
});

const toStaves = (staves: readonly number[] | undefined, count: number, fallback: StaffNumber): StaffNumber[] => {
  const out: StaffNumber[] = [];
  for (let i = 0; i < count; i += 1) {
    const s = staves?.[i];
    out.push(s === 2 ? 2 : s === 1 ? 1 : fallback);
  }
  return out;
};

const allTrue = (count: number): boolean[] => Array.from({ length: count }, () => true);

export const buildTrainingQuestion = (
  options: TrainingQuestionBuilderOptions,
): TrainingQuestion => {
  const { training, previousQuestionKey } = options;
  const preset = getNotationInstrumentPreset(normalizeNotationInstrumentId(options.notationInstrumentId));
  const writtenOffset = options.ignoreNotationInstrument
    ? 0
    : getWrittenSemitoneOffset(preset, options.notationOctaveShift);
  // 調号は常にコンサート C（0）。移調楽器の調号は ChordVoicingStaff 側で writtenOffset から算出する。
  const keyFifths = 0;
  const config = options.lessonItems && options.lessonItems.length > 0
    ? { ...training.config, ...options.lessonItems[options.lessonItemIndex ?? 0] }
    : training.config;

  const roots = options.lessonRoots ?? config.roots ?? ['C'];
  const root = options.lessonOrder === 'sequential' && options.lessonItemIndex != null
    ? roots[options.lessonItemIndex % roots.length] ?? 'C'
    : pickRandom(roots);

  const effectiveClef = resolveEffectiveClef(training.clefMode, preset.clef, config.clef);
  const singleClef: Clef = effectiveClef === 'bass' ? 'bass' : 'treble';
  const defaultStaff: StaffNumber = singleClef === 'bass' ? 2 : 1;
  // 記譜上の5線最低音をコンサート音高に戻す
  const concertStaffBottom = STAFF_BOTTOM_MIDI[singleClef] - writtenOffset;

  const makeQuestion = (
    questionKey: string,
    promptLabel: string,
    noteNames: readonly string[],
    staves: readonly StaffNumber[],
    targets: readonly boolean[],
    layout: 'stacked' | 'horizontal',
    ordered: boolean,
    rootMidi: number | null,
  ): TrainingQuestion => ({
    questionKey,
    promptLabel,
    notes: buildNotes(noteNames, staves, targets),
    layout,
    ordered,
    keyFifths,
    rootMidi,
  });

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (training.kind === 'note_reading') {
      // 記譜上の白鍵（幹音）のみを出題する
      const writtenMidi = pickRandom(NOTE_READING_CANDIDATES[singleClef]);
      const concertMidi = writtenMidi - writtenOffset;
      const questionKey = `note:${concertMidi}`;
      if (questionKey === previousQuestionKey) continue;
      return makeQuestion(
        questionKey,
        '',
        [flatSpelledName(concertMidi)],
        [defaultStaff],
        [true],
        'stacked',
        false,
        concertMidi,
      );
    }

    if (training.kind === 'interval') {
      const interval = config.interval ?? '2m';
      const direction = config.direction ?? 'up';
      const tonalInterval = direction === 'up' ? interval : `-${interval}`;
      const candidates: { base: string; target: string }[] = [];
      for (const spelling of INTERVAL_BASE_SPELLINGS) {
        const [base] = placeLowestInOctaveAbove([`${spelling}4`], concertStaffBottom);
        if (!base) continue;
        const target = transpose(base, tonalInterval);
        if (!target) continue;
        const normalizedTarget = normalizeSpelling(target);
        if (!isSimpleSpelling(normalizedTarget)) continue;
        if (midiOf(normalizedTarget) < concertStaffBottom) {
          candidates.push({ base: shiftOctave(base, 1), target: shiftOctave(normalizedTarget, 1) });
        } else {
          candidates.push({ base, target: normalizedTarget });
        }
      }
      if (candidates.length === 0) {
        throw new Error(`Training ${training.slug}: no interval candidates`);
      }
      const picked = pickRandom(candidates);
      const questionKey = `interval:${picked.base}:${picked.target}`;
      if (questionKey === previousQuestionKey) continue;
      return makeQuestion(
        questionKey,
        training.titleJa,
        [picked.base, picked.target],
        [defaultStaff, defaultStaff],
        [false, true],
        'stacked',
        false,
        midiOf(picked.base),
      );
    }

    if (training.kind === 'scale') {
      const scaleType = (config.scale ?? 'major') as ScaleType;
      const intervals = SCALE_TEMPLATES[scaleType];
      if (!intervals) {
        throw new Error(`Training ${training.slug}: unknown scale ${scaleType}`);
      }
      const names = placeLowestInOctaveAbove(spelledFromIntervals(`${root}4`, intervals), concertStaffBottom);
      const questionKey = `scale:${root}:${scaleType}`;
      if (questionKey === previousQuestionKey) continue;
      return makeQuestion(
        questionKey,
        `${root} ${training.titleJa}`,
        names,
        toStaves(undefined, names.length, defaultStaff),
        allTrue(names.length),
        'horizontal',
        true,
        midiOf(names[0] ?? `${root}4`),
      );
    }

    if (training.kind === 'chord' || training.kind === 'voicing') {
      let names: string[];
      let staves: StaffNumber[];

      if (config.voicingNotes && config.voicingNotes.length > 0) {
        const transposed = transposeVoicingToRoot(config.voicingNotes, config.referenceRoot ?? 'C', root);
        names = config.minLowestNote
          ? placeLowestInOctaveAbove(transposed, midiOf(config.minLowestNote))
          : placeLowestInOctaveAbove(transposed, concertStaffBottom);
        staves = toStaves(config.staves, names.length, defaultStaff);
      } else if (config.intervals && config.intervals.length > 0) {
        const raw = spelledFromIntervals(`${root}3`, config.intervals);
        names = placeLowestInOctaveAbove(
          raw,
          config.minLowestNote ? midiOf(config.minLowestNote) : concertStaffBottom,
        );
        staves = toStaves(config.staves, names.length, defaultStaff);
      } else if (config.quality) {
        const intervals = CHORD_TEMPLATES[config.quality];
        if (!intervals) {
          throw new Error(`Training ${training.slug}: unknown quality ${config.quality}`);
        }
        names = placeLowestInOctaveAbove(spelledFromIntervals(`${root}4`, intervals), concertStaffBottom);
        staves = toStaves(undefined, names.length, defaultStaff);
      } else {
        throw new Error(`Training ${training.slug}: missing chord/voicing config`);
      }

      const questionKey = `chord:${root}:${names.join('|')}`;
      if (questionKey === previousQuestionKey) continue;
      const suffix = training.kind === 'chord' && config.quality
        ? CHORD_SYMBOL_SUFFIX[config.quality] ?? config.quality
        : training.titleEn;
      const lowestMidi = Math.min(...names.map(midiOf));
      return makeQuestion(
        questionKey,
        `${root}${suffix}`,
        names,
        staves,
        allTrue(names.length),
        'stacked',
        false,
        rootMidiBelow(root, lowestMidi),
      );
    }

    throw new Error(`Unsupported training kind: ${training.kind}`);
  }

  return buildTrainingQuestion({ ...options, previousQuestionKey: null });
};

export const createInitialTrainingRuntime = (): import('@/game/training/trainingTypes').TrainingRuntime => ({
  durationSec: 60,
  elapsedSec: 0,
  score: 0,
  result: 'playing',
  enemy: { typeIndex: 0, active: true, fadeAlpha: 1, slashUntilSec: 0 },
  question: null,
  correctTargetIndices: [],
  nextQuestionKey: null,
});
