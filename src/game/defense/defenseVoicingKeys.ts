/**
 * Chord voicing mode: 12-key cycle, transposition, octave repositioning.
 */
import { distance, transpose } from 'tonal';

import type { DefensePhrase, DefensePhraseChord, DefenseStage } from '@/game/defense/defenseTypes';
import {
  ALL_MAJOR_KEYS,
  KEY_FIFTHS_BY_MAJOR,
  type MajorKey,
} from '@/utils/twoHandVoicingIntermediateCourse';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

export type DefenseVoicingKeyMode = 'order' | 'random';

export const DEFENSE_MAJOR_KEYS: readonly MajorKey[] = ALL_MAJOR_KEYS;

export const isDefenseMajorKey = (value: string): value is MajorKey => (
  DEFENSE_MAJOR_KEYS.includes(value as MajorKey)
);

export const isDefenseChordVoicingStage = (
  stage: Pick<DefenseStage, 'playStyle'>,
): boolean => stage.playStyle === 'chord_voicing';

const normalizeSpelling = (name: string): string => name.replace(/##/g, 'x');

const midiOf = (name: string): number => parseVoicingNoteName(name).midi;

const shiftOctave = (name: string, delta: number): string => {
  const parsed = parseVoicingNoteName(name);
  const accidental = parsed.alter === 2 ? 'x'
    : parsed.alter === 1 ? '#'
      : parsed.alter === -1 ? 'b'
        : parsed.alter === -2 ? 'bb'
          : '';
  return `${parsed.step}${accidental}${parsed.octave + delta}`;
};

/** Lowest note in [minMidi, minMidi + 12) via parallel shift. */
export const placeLowestInOctaveAbove = (
  names: readonly string[],
  minMidi: number,
): string[] => {
  if (names.length === 0) return [];
  let lowest = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const midi = midiOf(name);
    if (midi < lowest) lowest = midi;
  }
  const octaveDelta = Math.ceil((minMidi - lowest) / 12);
  if (octaveDelta === 0) return [...names];
  return names.map((name) => shiftOctave(name, octaveDelta));
};

export const buildOrderedKeyCycle = (startKey: MajorKey): readonly MajorKey[] => {
  const startIndex = ALL_MAJOR_KEYS.indexOf(startKey);
  if (startIndex < 0) {
    return ALL_MAJOR_KEYS;
  }
  return [
    ...ALL_MAJOR_KEYS.slice(startIndex),
    ...ALL_MAJOR_KEYS.slice(0, startIndex),
  ];
};

const shuffleInPlace = <T,>(items: T[]): void => {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const tmp = items[index];
    items[index] = items[swapIndex] ?? tmp;
    items[swapIndex] = tmp;
  }
};

/** Random bag of 12 keys; first key differs from avoidKey when provided. */
export const buildRandomKeyBag = (avoidKey: MajorKey | null): readonly MajorKey[] => {
  const bag = [...ALL_MAJOR_KEYS];
  shuffleInPlace(bag);
  if (avoidKey != null && bag[0] === avoidKey && bag.length > 1) {
    const swapIndex = 1 + Math.floor(Math.random() * (bag.length - 1));
    const tmp = bag[0];
    bag[0] = bag[swapIndex] ?? tmp;
    bag[swapIndex] = tmp;
  }
  return bag;
};

export interface DefenseVoicingKeyState {
  readonly mode: DefenseVoicingKeyMode;
  readonly keys: readonly MajorKey[];
  readonly index: number;
}

export const createInitialVoicingKeyState = (
  mode: DefenseVoicingKeyMode,
  startKey: MajorKey,
): DefenseVoicingKeyState => ({
  mode,
  keys: mode === 'order' ? buildOrderedKeyCycle(startKey) : buildRandomKeyBag(null),
  index: 0,
});

export const currentVoicingKey = (state: DefenseVoicingKeyState): MajorKey => (
  state.keys[state.index] ?? state.keys[0] ?? 'C'
);

export const advanceVoicingKey = (
  state: DefenseVoicingKeyState,
): DefenseVoicingKeyState => {
  const nextIndex = state.index + 1;
  if (nextIndex < state.keys.length) {
    return { ...state, index: nextIndex };
  }
  if (state.mode === 'order') {
    return { ...state, index: 0 };
  }
  const lastKey = currentVoicingKey(state);
  return {
    mode: state.mode,
    keys: buildRandomKeyBag(lastKey),
    index: 0,
  };
};

export const stepVoicingKey = (
  state: DefenseVoicingKeyState,
  delta: -1 | 1,
): DefenseVoicingKeyState => {
  const count = state.keys.length;
  if (count === 0) return state;
  const nextIndex = (state.index + delta + count) % count;
  return { ...state, index: nextIndex };
};

const transposeNoteName = (name: string, interval: string): string => {
  const transposed = transpose(name, interval);
  if (!transposed) {
    throw new Error(`transpose failed: ${name} + ${interval}`);
  }
  return normalizeSpelling(transposed);
};

const transposeSingleChordSymbol = (chordName: string, interval: string): string => {
  const match = chordName.trim().match(/^([A-G](?:bb|##|b|#|x)?)([\s\S]*)$/);
  if (!match) return chordName;
  const root = interval === '1P'
    ? match[1]
    : transpose(match[1] ?? 'C', interval);
  if (!root) return chordName;
  return `${normalizeSpelling(root)}${match[2] ?? ''}`;
};

const transposeChordSymbol = (chordName: string, interval: string): string => {
  if (interval === '1P') return chordName;
  const parts = chordName.split(' | ');
  if (parts.length > 1) {
    return parts.map((part) => transposeSingleChordSymbol(part, interval)).join(' | ');
  }
  return transposeSingleChordSymbol(chordName, interval);
};

const staffForMidi = (midi: number): 1 | 2 => (midi < 60 ? 2 : 1);

const transposePhraseChord = (
  chord: DefensePhraseChord,
  interval: string,
  minLowestNote: string,
): DefensePhraseChord => {
  const rawNames = chord.notes.map((note) => note.noteName);
  const transposedNames = interval === '1P'
    ? rawNames
    : rawNames.map((name) => transposeNoteName(name, interval));
  const repositioned = placeLowestInOctaveAbove(transposedNames, midiOf(minLowestNote));

  const notes = chord.notes.map((note, noteIndex) => {
    const noteName = repositioned[noteIndex] ?? note.noteName;
    const midi = midiOf(noteName);
    return {
      ...note,
      noteName,
      pitchMidi: midi,
      pitchClass: ((midi % 12) + 12) % 12,
      staff: staffForMidi(midi),
      staffChordName: note.staffChordName
        ? transposeChordSymbol(note.staffChordName, interval)
        : undefined,
    };
  });

  return {
    ...chord,
    chordName: transposeChordSymbol(chord.chordName, interval),
    notes,
  };
};

export const transposeDefensePhraseToKey = (
  template: DefensePhrase,
  referenceKey: MajorKey,
  targetKey: MajorKey,
  minLowestNote: string,
): DefensePhrase => {
  const interval = distance(referenceKey, targetKey);
  if (!interval) {
    throw new Error(`distance failed: ${referenceKey} -> ${targetKey}`);
  }
  const keyFifths = KEY_FIFTHS_BY_MAJOR[targetKey];
  const chords = template.chords.map((chord) => (
    transposePhraseChord(chord, interval, minLowestNote)
  ));
  return {
    ...template,
    title: targetKey,
    keyFifths,
    chords,
  };
};

export const buildTransposedVoicingPhrases = (
  stage: DefenseStage,
  keyState: DefenseVoicingKeyState,
): readonly DefensePhrase[] => {
  if (!isDefenseChordVoicingStage(stage)) {
    return stage.phrases;
  }
  const template = stage.phrases[0];
  if (!template) return stage.phrases;
  const targetKey = currentVoicingKey(keyState);
  const referenceKey = stage.voicingLowestKey ?? 'C';
  const minNote = stage.voicingMinLowestNote ?? 'C3';
  return [
    transposeDefensePhraseToKey(template, referenceKey, targetKey, minNote),
  ];
};
