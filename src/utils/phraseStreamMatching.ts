/**
 * Sequential prefix matching for phrase note streams (pitch class sequences).
 * Advances only on the next expected note; opening-pitch replay mid-progress resyncs to index 1.
 */

export function normalizePitchClass(pitchClass: number): number {
  return ((pitchClass % 12) + 12) % 12;
}

export interface SequentialAdvanceResult {
  readonly matchedLength: number;
  readonly resync: boolean;
}

export function advanceSequential(
  pattern: readonly number[],
  matchedLength: number,
  pitchClass: number,
): SequentialAdvanceResult {
  if (pattern.length === 0) {
    return { matchedLength: 0, resync: false };
  }

  const pc = normalizePitchClass(pitchClass);
  const before = Math.max(0, Math.min(matchedLength, pattern.length));

  if (before < pattern.length && pattern[before] === pc) {
    return { matchedLength: before + 1, resync: false };
  }

  if (before > 0 && pattern[0] === pc) {
    return { matchedLength: 1, resync: true };
  }

  return { matchedLength: 0, resync: false };
}

export function prefixIndexSet(length: number): ReadonlySet<number> {
  const out = new Set<number>();
  for (let i = 0; i < length; i += 1) {
    out.add(i);
  }
  return out;
}

export interface PitchPatternCache {
  readonly pattern: readonly number[];
}

const chordPatternCache = new WeakMap<
  readonly { readonly pitchClass: number }[],
  PitchPatternCache
>();

export function chordPitchPattern(
  notes: readonly { readonly pitchClass: number }[],
): readonly number[] {
  return notes.map((n) => normalizePitchClass(n.pitchClass));
}

export function getChordPatternCache(
  notes: readonly { readonly pitchClass: number }[],
): PitchPatternCache {
  const cached = chordPatternCache.get(notes);
  if (cached) return cached;

  const entry: PitchPatternCache = { pattern: chordPitchPattern(notes) };
  chordPatternCache.set(notes, entry);
  return entry;
}

/** @deprecated Use getChordPatternCache */
export const getChordKmpCache = getChordPatternCache;

export interface CompositePhraseLike {
  readonly chords: readonly {
    readonly notes: readonly { readonly pitchClass: number }[];
  }[];
}

const compositePatternCache = new WeakMap<CompositePhraseLike, PitchPatternCache>();

export function compositePitchPattern(phrase: CompositePhraseLike): readonly number[] {
  const out: number[] = [];
  for (const chord of phrase.chords) {
    for (const note of chord.notes) {
      out.push(normalizePitchClass(note.pitchClass));
    }
  }
  return out;
}

export function getCompositePatternCache(phrase: CompositePhraseLike): PitchPatternCache {
  const cached = compositePatternCache.get(phrase);
  if (cached) return cached;

  const entry: PitchPatternCache = { pattern: compositePitchPattern(phrase) };
  compositePatternCache.set(phrase, entry);
  return entry;
}

/** @deprecated Use getCompositePatternCache */
export const getCompositeKmpCache = getCompositePatternCache;

export function matchedLengthFromCoordinates(
  phrase: CompositePhraseLike,
  chordIndex: number,
  targetNoteIndex: number,
): number {
  let length = 0;
  const safeChordIndex = Math.min(chordIndex, phrase.chords.length);

  for (let i = 0; i < safeChordIndex; i += 1) {
    length += phrase.chords[i]?.notes.length ?? 0;
  }

  return length + targetNoteIndex;
}

export function coordinateFromMatchedLength(
  phrase: CompositePhraseLike,
  matchedLength: number,
): { chordIndex: number; targetNoteIndex: number } {
  let remaining = Math.max(0, matchedLength);

  for (let chordIndex = 0; chordIndex < phrase.chords.length; chordIndex += 1) {
    const chord = phrase.chords[chordIndex];
    const len = chord.notes.length;

    if (remaining < len) {
      return { chordIndex, targetNoteIndex: remaining };
    }

    if (remaining === len) {
      if (chordIndex + 1 < phrase.chords.length) {
        return { chordIndex: chordIndex + 1, targetNoteIndex: 0 };
      }
      return { chordIndex, targetNoteIndex: len };
    }

    remaining -= len;
  }

  return { chordIndex: 0, targetNoteIndex: 0 };
}

export function isNonFinalMeasureBoundary(
  phrase: CompositePhraseLike,
  matchedLength: number,
): boolean {
  if (matchedLength <= 0) return false;

  let acc = 0;
  for (let i = 0; i < phrase.chords.length - 1; i += 1) {
    acc += phrase.chords[i]?.notes.length ?? 0;
    if (matchedLength === acc) {
      return true;
    }
  }

  return false;
}
