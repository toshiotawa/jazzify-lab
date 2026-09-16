import type {
  TrainingProgressionCursor,
  TrainingProgressionEntry,
  TrainingProgressionUnit,
  TrainingQuestion,
  TrainingQuestionNote,
  TrainingReferenceChord,
  TrainingRow,
} from '@/game/training/trainingTypes';
import {
  ALL_MAJOR_KEYS,
  ABA_VOICINGS_BY_KEY,
  BAB_VOICINGS_BY_KEY,
  TWO_HAND_VOICING_GRAND_STAFF,
} from '@/utils/twoHandVoicingIntermediateCourse';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

const normalizePitchClass = (midi: number): number => ((midi % 12) + 12) % 12;

const midiOf = (name: string): number => parseVoicingNoteName(name).midi;

/** コード記号のルート（例: Gm7(9) → G, Bb7(b9.b13) → Bb） */
export const parseProgressionChordRoot = (chordName: string): string | null => {
  const match = chordName.trim().match(/^([A-G](?:bb|##|b|#|x)?)/);
  return match?.[1] ?? null;
};

/** 最低音の直下にあるルート音（正解時に鳴らす音） */
export const rootMidiBelow = (root: string, lowestMidi: number): number => {
  const rootPc = normalizePitchClass(midiOf(`${root}4`));
  let midi = lowestMidi - ((normalizePitchClass(lowestMidi) - rootPc + 12) % 12);
  if (midi >= lowestMidi) midi -= 12;
  return midi;
};

const buildQuestionFromChord = (
  unitIndex: number,
  chordIndex: number,
  chordName: string,
  noteNames: readonly string[],
  staves: readonly (1 | 2)[],
  keyFifths: number,
  useKeySignature: boolean,
): TrainingQuestion => {
  const notes: TrainingQuestionNote[] = noteNames.map((noteName, index) => {
    const midi = midiOf(noteName);
    return {
      noteName,
      midi,
      pitchClass: normalizePitchClass(midi),
      staff: staves[index] ?? 1,
      isTarget: true,
    };
  });
  const lowestMidi = Math.min(...noteNames.map(midiOf));
  const root = parseProgressionChordRoot(chordName);
  return {
    questionKey: `progression:${unitIndex}:${chordIndex}:${chordName}`,
    promptLabel: chordName,
    notes,
    layout: 'stacked',
    ordered: false,
    keyFifths: useKeySignature ? keyFifths : 0,
    rootMidi: root != null ? rootMidiBelow(root, lowestMidi) : null,
  };
};

const toStaves = (
  staves: readonly number[] | undefined,
  count: number,
  fallback: 1 | 2,
): (1 | 2)[] => {
  const out: (1 | 2)[] = [];
  for (let i = 0; i < count; i += 1) {
    const s = staves?.[i];
    out.push(s === 2 ? 2 : s === 1 ? 1 : fallback);
  }
  if (out.length === 0 && count > 0) {
    return Array.from({ length: count }, () => fallback);
  }
  return out;
};

const defaultStaffForClef = (clefMode: TrainingRow['clefMode']): 1 | 2 => (
  clefMode === 'bass_concert' ? 2 : 1
);

const buildUnitsFromProgression = (
  training: TrainingRow,
  progression: readonly TrainingProgressionEntry[],
  unitSize: number,
): TrainingProgressionUnit[] => {
  const fallbackStaff = defaultStaffForClef(training.clefMode);
  const units: TrainingProgressionUnit[] = [];
  for (let unitStart = 0; unitStart < progression.length; unitStart += unitSize) {
    const slice = progression.slice(unitStart, unitStart + unitSize);
    if (slice.length === 0) continue;
    const unitIndex = unitStart / unitSize;
    const keyFifths = slice[0]?.keyFifths ?? 0;
    const questions = slice.map((entry, chordIndex) => {
      const staves = toStaves(entry.voicingStaves, entry.voicingNames.length, fallbackStaff);
      return buildQuestionFromChord(
        unitIndex,
        chordIndex,
        entry.name,
        entry.voicingNames,
        staves,
        entry.keyFifths,
        training.useKeySignature,
      );
    });
    units.push({ unitIndex, keyFifths, questions });
  }
  return units;
};

const buildUnitsFromVoicingForm = (
  training: TrainingRow,
  form: 'aba' | 'bab',
  stavesConfig: readonly number[] | undefined,
): TrainingProgressionUnit[] => {
  const table = form === 'aba' ? ABA_VOICINGS_BY_KEY : BAB_VOICINGS_BY_KEY;
  const fallbackStaff = defaultStaffForClef(training.clefMode);
  const staves = toStaves(
    stavesConfig ?? [...TWO_HAND_VOICING_GRAND_STAFF],
    TWO_HAND_VOICING_GRAND_STAFF.length,
    fallbackStaff,
  );
  return ALL_MAJOR_KEYS.map((key, unitIndex) => {
    const set = table[key];
    const sequence = [set.ii, set.v, set.i] as const;
    const questions = sequence.map((chordSpec, chordIndex) =>
      buildQuestionFromChord(
        unitIndex,
        chordIndex,
        chordSpec.displayName,
        [...chordSpec.notes],
        staves,
        set.keyFifths,
        training.useKeySignature,
      ));
    return { unitIndex, keyFifths: set.keyFifths, questions };
  });
};

const buildUnitsFromReference = (
  training: TrainingRow,
  referenceChords: readonly TrainingReferenceChord[],
  stavesConfig: readonly number[] | undefined,
  voicingForm: 'aba' | 'bab' | undefined,
): TrainingProgressionUnit[] => {
  if (voicingForm === 'aba' || voicingForm === 'bab') {
    return buildUnitsFromVoicingForm(training, voicingForm, stavesConfig);
  }
  throw new Error(`Training ${training.slug}: reference progression requires voicing_form aba or bab`);
};

export const buildTrainingProgressionUnits = (training: TrainingRow): readonly TrainingProgressionUnit[] => {
  const config = training.config;
  if (config.referenceChords && config.referenceChords.length > 0 && config.referenceKey) {
    return buildUnitsFromReference(
      training,
      config.referenceChords,
      config.staves,
      config.voicingForm,
    );
  }
  if (config.progression && config.progression.length > 0) {
    const unitSize = config.unitSize != null && config.unitSize > 0
      ? config.unitSize
      : config.progression.length;
    return buildUnitsFromProgression(training, config.progression, unitSize);
  }
  throw new Error(`Training ${training.slug}: progression config missing`);
};

export const pickInitialProgressionCursor = (
  units: readonly TrainingProgressionUnit[],
  shuffleUnits: boolean,
): TrainingProgressionCursor => {
  if (units.length === 0) {
    throw new Error('progression units empty');
  }
  const unitIndex = shuffleUnits
    ? Math.floor(Math.random() * units.length)
    : 0;
  return { unitIndex, chordIndex: 0 };
};

export const questionAtProgressionCursor = (
  units: readonly TrainingProgressionUnit[],
  cursor: TrainingProgressionCursor,
): TrainingQuestion => {
  const unit = units[cursor.unitIndex];
  const question = unit?.questions[cursor.chordIndex];
  if (!unit || !question) {
    throw new Error(`Invalid progression cursor: ${cursor.unitIndex}/${cursor.chordIndex}`);
  }
  return question;
};

export const advanceTrainingProgressionCursor = (
  units: readonly TrainingProgressionUnit[],
  cursor: TrainingProgressionCursor,
  shuffleUnits: boolean,
): TrainingProgressionCursor => {
  const unit = units[cursor.unitIndex];
  if (!unit) {
    return { unitIndex: 0, chordIndex: 0 };
  }
  if (cursor.chordIndex + 1 < unit.questions.length) {
    return { unitIndex: cursor.unitIndex, chordIndex: cursor.chordIndex + 1 };
  }
  if (units.length <= 1) {
    return { unitIndex: 0, chordIndex: 0 };
  }
  if (shuffleUnits) {
    let nextUnit = cursor.unitIndex;
    while (nextUnit === cursor.unitIndex) {
      nextUnit = Math.floor(Math.random() * units.length);
    }
    return { unitIndex: nextUnit, chordIndex: 0 };
  }
  const nextUnit = (cursor.unitIndex + 1) % units.length;
  return { unitIndex: nextUnit, chordIndex: 0 };
};

export const collectTrainingProgressionMidis = (
  units: readonly TrainingProgressionUnit[],
): number[] => {
  const midis: number[] = [];
  for (const unit of units) {
    for (const question of unit.questions) {
      for (const note of question.notes) {
        midis.push(note.midi);
      }
    }
  }
  return midis;
};
