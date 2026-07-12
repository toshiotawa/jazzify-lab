import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import { getChordDefinition } from '@/components/survival/SurvivalGameEngine';
import type { EarTrainingStage } from '@/types';
import { forEachChordOsmdNoteCluster, parseMusicXmlNoteElementToMidi } from '@/utils/earTrainingChordOsmd';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';
import { maxSurvivalHintMidiFromChordNotes } from '@/utils/survivalProgressionChords';
import type { SurvivalPhraseDefinition } from '@/utils/survivalPhraseDefinitions';

export type WebKeyboardDisplayMode = 'questionRangeFit' | 'full88';

export interface WebKeyboardRange {
  minMidi: number;
  maxMidi: number;
}

export const FULL_88_KEYBOARD_RANGE: WebKeyboardRange = {
  minMidi: 21,
  maxMidi: 108,
};

export const DEFAULT_WEB_KEYBOARD_DISPLAY_MODE: WebKeyboardDisplayMode = 'questionRangeFit';

const KEYBOARD_FIRST_MIDI = 21;
const KEYBOARD_LAST_MIDI = 108;
const WHITE_KEY_INSET = 1;

/** PC/タブレットの出題音域フィット時に確保する最低表示幅（2オクターブ） */
export const MIN_DISPLAY_SPAN_SEMITONES = 24;

export interface WebKeyboardDisplayRangeOptions {
  ensureMinTwoOctaves?: boolean;
}

export const isPianoBlackKey = (midi: number): boolean => {
  switch (((midi % 12) + 12) % 12) {
    case 1:
    case 3:
    case 6:
    case 8:
    case 10:
      return true;
    default:
      return false;
  }
};

export const whiteMidiNotesInRange = (
  firstMidi: number = KEYBOARD_FIRST_MIDI,
  lastMidi: number = KEYBOARD_LAST_MIDI,
): readonly number[] => {
  const whites: number[] = [];
  for (let midi = firstMidi; midi <= lastMidi; midi += 1) {
    if (!isPianoBlackKey(midi)) {
      whites.push(midi);
    }
  }
  return whites;
};

export const countWhiteKeysInMidiRange = (minMidi: number, maxMidi: number): number => {
  let count = 0;
  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    if (!isPianoBlackKey(midi)) {
      count += 1;
    }
  }
  return count;
};

const whiteKeyIndexAtOrBelow = (midi: number, whites: readonly number[]): number => {
  let index = 0;
  for (let i = 0; i < whites.length; i += 1) {
    const whiteMidi = whites[i];
    if (whiteMidi <= midi) {
      index = i;
    }
  }
  return index;
};

const whiteKeyIndexAtOrAbove = (midi: number, whites: readonly number[]): number => {
  for (let i = 0; i < whites.length; i += 1) {
    const whiteMidi = whites[i];
    if (whiteMidi >= midi) {
      return i;
    }
  }
  return whites.length - 1;
};

const whiteStrictlyBelow = (midi: number, whites: readonly number[]): number | null => {
  for (let i = whites.length - 1; i >= 0; i -= 1) {
    const whiteMidi = whites[i];
    if (whiteMidi < midi) {
      return whiteMidi;
    }
  }
  return null;
};

const whiteStrictlyAbove = (midi: number, whites: readonly number[]): number | null => {
  for (let i = 0; i < whites.length; i += 1) {
    const whiteMidi = whites[i];
    if (whiteMidi > midi) {
      return whiteMidi;
    }
  }
  return null;
};

/** 最低音より厳密に低い直近白鍵、最高音より厳密に高い直近白鍵を表示端にする。 */
export const expandMidiRangeWithWhiteKeyPadding = (
  minNoteMidi: number,
  maxNoteMidi: number,
  _insetWhiteKeys: number = WHITE_KEY_INSET,
  firstMidi: number = KEYBOARD_FIRST_MIDI,
  lastMidi: number = KEYBOARD_LAST_MIDI,
): WebKeyboardRange => {
  const whites = whiteMidiNotesInRange(firstMidi, lastMidi);
  if (whites.length === 0) {
    return {
      minMidi: Math.max(firstMidi, minNoteMidi),
      maxMidi: Math.min(lastMidi, maxNoteMidi),
    };
  }

  const minMidi = whiteStrictlyBelow(minNoteMidi, whites)
    ?? whites[whiteKeyIndexAtOrBelow(minNoteMidi, whites)]
    ?? firstMidi;
  const maxMidi = whiteStrictlyAbove(maxNoteMidi, whites)
    ?? whites[whiteKeyIndexAtOrAbove(maxNoteMidi, whites)]
    ?? lastMidi;

  return {
    minMidi: Math.max(firstMidi, minMidi),
    maxMidi: Math.min(lastMidi, maxMidi),
  };
};

const alignRangeEndsToWhiteKeys = (
  minMidi: number,
  maxMidi: number,
  whites: readonly number[],
  firstMidi: number,
  lastMidi: number,
): WebKeyboardRange => {
  let min = minMidi;
  let max = maxMidi;

  if (isPianoBlackKey(min)) {
    min = whiteStrictlyBelow(min, whites)
      ?? whites[whiteKeyIndexAtOrBelow(min, whites)]
      ?? firstMidi;
  }
  if (isPianoBlackKey(max)) {
    max = whiteStrictlyAbove(max, whites)
      ?? whites[whiteKeyIndexAtOrAbove(max, whites)]
      ?? lastMidi;
  }

  return {
    minMidi: Math.max(firstMidi, min),
    maxMidi: Math.min(lastMidi, max),
  };
};

/** 表示レンジが最低幅未満なら出題中心で対称拡大し、88鍵端でクランプする。 */
export const ensureMinimumDisplaySpan = (
  range: WebKeyboardRange,
  minSpanSemitones: number = MIN_DISPLAY_SPAN_SEMITONES,
  firstMidi: number = KEYBOARD_FIRST_MIDI,
  lastMidi: number = KEYBOARD_LAST_MIDI,
): WebKeyboardRange => {
  if (range.maxMidi - range.minMidi >= minSpanSemitones) {
    return range;
  }

  const whites = whiteMidiNotesInRange(firstMidi, lastMidi);
  const center = (range.minMidi + range.maxMidi) / 2;
  let targetMin = Math.round(center - minSpanSemitones / 2);
  let targetMax = targetMin + minSpanSemitones;

  if (targetMin < firstMidi) {
    const shift = firstMidi - targetMin;
    targetMin = firstMidi;
    targetMax = Math.min(lastMidi, targetMax + shift);
  }
  if (targetMax > lastMidi) {
    const shift = targetMax - lastMidi;
    targetMax = lastMidi;
    targetMin = Math.max(firstMidi, targetMin - shift);
  }

  let aligned = alignRangeEndsToWhiteKeys(targetMin, targetMax, whites, firstMidi, lastMidi);
  if (aligned.maxMidi - aligned.minMidi >= minSpanSemitones) {
    return aligned;
  }

  const deficit = minSpanSemitones - (aligned.maxMidi - aligned.minMidi);
  let extraMin = 0;
  let extraMax = 0;
  let remaining = deficit;
  const roomBelow = aligned.minMidi - firstMidi;
  const roomAbove = lastMidi - aligned.maxMidi;

  const tryExpandBelow = (amount: number): void => {
    const can = Math.min(roomBelow - extraMin, amount);
    extraMin += can;
    remaining -= can;
  };

  const tryExpandAbove = (amount: number): void => {
    const can = Math.min(roomAbove - extraMax, amount);
    extraMax += can;
    remaining -= can;
  };

  tryExpandBelow(Math.floor(remaining / 2));
  tryExpandAbove(remaining);
  tryExpandBelow(remaining);

  targetMin = aligned.minMidi - extraMin;
  targetMax = aligned.maxMidi + extraMax;

  aligned = alignRangeEndsToWhiteKeys(targetMin, targetMax, whites, firstMidi, lastMidi);
  return aligned;
};

export const absorbMidiIntoRange = (
  current: WebKeyboardRange | null,
  midi: number,
): WebKeyboardRange => {
  if (current === null) {
    return { minMidi: midi, maxMidi: midi };
  }
  return {
    minMidi: Math.min(current.minMidi, midi),
    maxMidi: Math.max(current.maxMidi, midi),
  };
};

export const resolveWebKeyboardDisplayRange = (
  noteMidis: readonly number[],
  mode: WebKeyboardDisplayMode,
  options?: WebKeyboardDisplayRangeOptions,
): WebKeyboardRange => {
  if (mode === 'full88') {
    return FULL_88_KEYBOARD_RANGE;
  }
  if (noteMidis.length === 0) {
    return FULL_88_KEYBOARD_RANGE;
  }
  let minNote = noteMidis[0] ?? KEYBOARD_FIRST_MIDI;
  let maxNote = noteMidis[0] ?? KEYBOARD_LAST_MIDI;
  for (let i = 1; i < noteMidis.length; i += 1) {
    const midi = noteMidis[i] ?? minNote;
    if (midi < minNote) {
      minNote = midi;
    }
    if (midi > maxNote) {
      maxNote = midi;
    }
  }
  let range = expandMidiRangeWithWhiteKeyPadding(minNote, maxNote);
  if (options?.ensureMinTwoOctaves === true) {
    range = ensureMinimumDisplaySpan(range);
  }
  return range;
};

const parseVoicingMidi = (noteName: string): number | null => {
  const trimmed = noteName.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return parseVoicingNoteName(trimmed).midi;
  } catch {
    return null;
  }
};

export const collectMidisFromVoicing = (voicing: readonly string[] | null | undefined): number[] => {
  if (!voicing?.length) {
    return [];
  }
  const midis: number[] = [];
  for (let i = 0; i < voicing.length; i += 1) {
    const midi = parseVoicingMidi(voicing[i] ?? '');
    if (midi !== null) {
      midis.push(midi);
    }
  }
  return midis;
};

export const computeEarTrainingStageMidiMidis = (stage: EarTrainingStage): number[] => {
  const midis: number[] = [];

  const absorbMany = (values: readonly number[]): void => {
    for (let i = 0; i < values.length; i += 1) {
      midis.push(values[i] ?? KEYBOARD_FIRST_MIDI);
    }
  };

  if (stage.phrases) {
    for (const phrase of stage.phrases) {
      if (phrase.notes) {
        for (const note of phrase.notes) {
          midis.push(note.pitch_midi);
        }
      }
      if (phrase.chords) {
        for (const chord of phrase.chords) {
          absorbMany(collectMidisFromVoicing(chord.voicing));
        }
      }
    }
  }

  if (stage.chord_quiz_items) {
    for (const item of stage.chord_quiz_items) {
      absorbMany(collectMidisFromVoicing(item.voicing));
    }
  }

  const composite = stage.compositePhraseBootstrap;
  if (composite?.definitions) {
    for (const definition of composite.definitions) {
      for (const chord of definition.chords) {
        for (const note of chord.notes) {
          const midi = parseVoicingMidi(note.noteName);
          if (midi !== null) {
            midis.push(midi);
          }
        }
      }
    }
  }

  const phrasePair = stage.phrasePairAdlibBootstrap;
  if (phrasePair?.patternsByGroupId) {
    for (const patterns of Object.values(phrasePair.patternsByGroupId)) {
      for (const pattern of patterns) {
        absorbMany(collectMidisFromVoicing(pattern.voicing));
      }
    }
  }

  return midis;
};

export const collectMidisFromMusicXmlText = (
  musicXmlText: string,
  transposeOffset = 0,
): number[] => {
  const midis: number[] = [];
  forEachChordOsmdNoteCluster(musicXmlText, ({ clusterNotes, timing }) => {
    for (const noteElement of clusterNotes) {
      const rawMidi = parseMusicXmlNoteElementToMidi(noteElement, timing.keyFifths);
      if (rawMidi !== null) {
        midis.push(rawMidi + transposeOffset);
      }
    }
  });
  return midis;
};

export const computeSurvivalSessionMidiMidis = (
  source:
    | { readonly kind: 'phrase'; readonly phrase: SurvivalPhraseDefinition | null | undefined }
    | { readonly kind: 'phrases'; readonly phrases: readonly SurvivalPhraseDefinition[] }
    | { readonly kind: 'progression'; readonly chords: readonly ChordDefinition[] | null | undefined }
    | { readonly kind: 'random'; readonly allowedChordIds: readonly string[] | null | undefined },
): number[] => {
  const midis: number[] = [];

  if (source.kind === 'phrases') {
    for (const phrase of source.phrases) {
      midis.push(...computeSurvivalSessionMidiMidis({ kind: 'phrase', phrase }));
    }
    return midis;
  }

  if (source.kind === 'phrase') {
    if (!source.phrase?.chords) {
      return midis;
    }
    for (const chord of source.phrase.chords) {
      for (const note of chord.notes) {
        midis.push(note.pitchMidi);
      }
    }
    return midis;
  }

  if (source.kind === 'progression') {
    if (!source.chords?.length) {
      return midis;
    }
    for (const chord of source.chords) {
      for (const note of chord.notes) {
        midis.push(note);
      }
    }
    return midis;
  }

  if (!source.allowedChordIds?.length) {
    return midis;
  }
  for (const id of source.allowedChordIds) {
    const chord = getChordDefinition(id);
    if (!chord?.notes?.length) {
      continue;
    }
    const maxHint = maxSurvivalHintMidiFromChordNotes(chord.notes);
    if (maxHint !== null) {
      for (const note of chord.notes) {
        midis.push(note);
      }
    }
  }
  return midis;
};

export const normalizeWebKeyboardDisplayMode = (
  value: unknown,
): WebKeyboardDisplayMode => (
  value === 'full88' ? 'full88' : DEFAULT_WEB_KEYBOARD_DISPLAY_MODE
);
