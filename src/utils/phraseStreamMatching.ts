/**
 * KMP-style prefix matching for phrase note streams (pitch class sequences).
 */

export function normalizePitchClass(pitchClass: number): number {
  return ((pitchClass % 12) + 12) % 12;
}

export function buildKmpTable(pattern: readonly number[]): number[] {
  const table = new Array<number>(pattern.length).fill(0);
  let j = 0;

  for (let i = 1; i < pattern.length; i += 1) {
    while (j > 0 && pattern[i] !== pattern[j]) {
      j = table[j - 1] ?? 0;
    }
    if (pattern[i] === pattern[j]) {
      j += 1;
    }
    table[i] = j;
  }

  return table;
}

export function advanceKmp(
  pattern: readonly number[],
  table: readonly number[],
  matchedLength: number,
  pitchClass: number,
): number {
  if (pattern.length === 0) return 0;

  const pc = normalizePitchClass(pitchClass);
  let j = Math.max(0, Math.min(matchedLength, pattern.length));

  if (j === pattern.length) {
    j = table[j - 1] ?? 0;
  }

  while (j > 0 && pattern[j] !== pc) {
    j = table[j - 1] ?? 0;
  }

  if (pattern[j] === pc) {
    j += 1;
  }

  return j;
}

export function prefixIndexSet(length: number): ReadonlySet<number> {
  const out = new Set<number>();
  for (let i = 0; i < length; i += 1) {
    out.add(i);
  }
  return out;
}

export interface KmpPatternCache {
  readonly pattern: readonly number[];
  readonly table: readonly number[];
}

const chordPatternCache = new WeakMap<
  readonly { readonly pitchClass: number }[],
  KmpPatternCache
>();

export function chordPitchPattern(
  notes: readonly { readonly pitchClass: number }[],
): readonly number[] {
  return notes.map((n) => normalizePitchClass(n.pitchClass));
}

export function getChordKmpCache(
  notes: readonly { readonly pitchClass: number }[],
): KmpPatternCache {
  const cached = chordPatternCache.get(notes);
  if (cached) return cached;

  const pattern = chordPitchPattern(notes);
  const entry: KmpPatternCache = { pattern, table: buildKmpTable(pattern) };
  chordPatternCache.set(notes, entry);
  return entry;
}

export interface CompositePhraseLike {
  readonly chords: readonly {
    readonly notes: readonly { readonly pitchClass: number }[];
  }[];
}

const compositePatternCache = new WeakMap<CompositePhraseLike, KmpPatternCache>();

export function compositePitchPattern(phrase: CompositePhraseLike): readonly number[] {
  const out: number[] = [];
  for (const chord of phrase.chords) {
    for (const note of chord.notes) {
      out.push(normalizePitchClass(note.pitchClass));
    }
  }
  return out;
}

export function getCompositeKmpCache(phrase: CompositePhraseLike): KmpPatternCache {
  const cached = compositePatternCache.get(phrase);
  if (cached) return cached;

  const pattern = compositePitchPattern(phrase);
  const entry: KmpPatternCache = { pattern, table: buildKmpTable(pattern) };
  compositePatternCache.set(phrase, entry);
  return entry;
}

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
