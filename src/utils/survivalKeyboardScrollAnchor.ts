import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import { getChordDefinition } from '@/components/survival/SurvivalGameEngine';
import { maxSurvivalHintMidiFromChordNotes } from '@/utils/survivalProgressionChords';
import type { SurvivalPhraseDefinition } from '@/utils/survivalPhraseDefinitions';

const trailingInsetWhiteKeys = 1;

const isBlackKey = (midi: number): boolean => {
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

/**
 * `ios/Jazzify/Survival/Phrase/SurvivalPhraseEngine.swift` の `SurvivalPhraseKeyboardScroll.scrollAnchorWhiteMidi` と同一。
 */
export const scrollAnchorWhiteMidi = (
  maxPhraseMidi: number,
  firstMidi: number = 21,
  lastMidi: number = 108,
): number => {
  const whites: number[] = [];
  for (let midi = firstMidi; midi <= lastMidi; midi += 1) {
    if (!isBlackKey(midi)) {
      whites.push(midi);
    }
  }
  if (whites.length === 0) {
    return Math.max(firstMidi, Math.min(lastMidi, maxPhraseMidi));
  }
  let highestWhiteIndex = 0;
  for (let index = 0; index < whites.length; index += 1) {
    const midi = whites[index];
    if (midi <= maxPhraseMidi) {
      highestWhiteIndex = index;
    }
  }
  const anchorIndex = Math.min(highestWhiteIndex + trailingInsetWhiteKeys, whites.length - 1);
  return whites[anchorIndex];
};

export const maxPitchMidiFromPhraseDefinition = (
  phrase: SurvivalPhraseDefinition | null | undefined,
): number | null => {
  if (!phrase?.chords) {
    return null;
  }
  let maxValue: number | null = null;
  for (const chord of phrase.chords) {
    for (const note of chord.notes) {
      const v = note.pitchMidi;
      if (maxValue === null || v > maxValue) {
        maxValue = v;
      }
    }
  }
  return maxValue;
};

const maxPitchMidiFromChordDefinitions = (
  chords: readonly ChordDefinition[] | null | undefined,
): number | null => {
  if (!chords || chords.length === 0) {
    return null;
  }
  let maxValue: number | null = null;
  for (const chord of chords) {
    for (const n of chord.notes) {
      if (maxValue === null || n > maxValue) {
        maxValue = n;
      }
    }
  }
  return maxValue;
};

const maxHintMidiFromAllowedChordIds = (
  allowedChords: readonly string[] | null | undefined,
): number | null => {
  if (!allowedChords || allowedChords.length === 0) {
    return null;
  }
  let poolMax: number | null = null;
  for (const id of allowedChords) {
    const chord = getChordDefinition(id);
    if (!chord?.notes?.length) {
      continue;
    }
    const m = maxSurvivalHintMidiFromChordNotes(chord.notes);
    if (m !== null && (poolMax === null || m > poolMax)) {
      poolMax = m;
    }
  }
  return poolMax;
};

type SurvivalKeyboardScrollSource =
  | { readonly kind: 'phrase'; readonly phrase: SurvivalPhraseDefinition | null | undefined }
  | { readonly kind: 'progression'; readonly chords: readonly ChordDefinition[] | null | undefined }
  | { readonly kind: 'random'; readonly allowedChordIds: readonly string[] | null | undefined };

/** スクロール不要な画面では無視できる。narrow レイアウトで trailing に合わせる白鍵 MIDI。 */
export const computeSurvivalKeyboardScrollAnchor = (source: SurvivalKeyboardScrollSource): number | null => {
  let maxMidi: number | null = null;
  if (source.kind === 'phrase') {
    maxMidi = maxPitchMidiFromPhraseDefinition(source.phrase);
  } else if (source.kind === 'progression') {
    maxMidi = maxPitchMidiFromChordDefinitions(source.chords);
  } else {
    maxMidi = maxHintMidiFromAllowedChordIds(source.allowedChordIds);
  }
  return maxMidi === null ? null : scrollAnchorWhiteMidi(maxMidi);
};
