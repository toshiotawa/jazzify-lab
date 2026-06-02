import {
  advanceKmp,
  buildKmpTable,
  coordinateFromMatchedLength,
  getChordKmpCache,
  isNonFinalMeasureBoundary,
  matchedLengthFromCoordinates,
  normalizePitchClass,
  prefixIndexSet,
} from '@/utils/phraseStreamMatching';

describe('phraseStreamMatching', () => {
  it('normalizes pitch class modulo 12', () => {
    expect(normalizePitchClass(-1)).toBe(11);
    expect(normalizePitchClass(14)).toBe(2);
  });

  it('advances KMP prefix on phrase restart mid-progress', () => {
    const pattern = [2, 4, 5, 7];
    const table = buildKmpTable(pattern);

    let matched = 0;
    for (const pc of [2, 4, 5]) {
      matched = advanceKmp(pattern, table, matched, pc);
    }
    expect(matched).toBe(3);

    matched = advanceKmp(pattern, table, matched, 2);
    expect(matched).toBe(1);
  });

  it('prefixIndexSet builds contiguous indices', () => {
    expect([...prefixIndexSet(3)]).toEqual([0, 1, 2]);
  });

  it('caches chord kmp tables', () => {
    const notes = [{ pitchClass: 0 }, { pitchClass: 4 }];
    const a = getChordKmpCache(notes);
    const b = getChordKmpCache(notes);
    expect(a.table).toBe(b.table);
  });

  it('maps matched length to chord coordinates', () => {
    const phrase = {
      chords: [
        { notes: [{ pitchClass: 0 }, { pitchClass: 4 }] },
        { notes: [{ pitchClass: 7 }] },
      ],
    };

    expect(matchedLengthFromCoordinates(phrase, 0, 0)).toBe(0);
    expect(matchedLengthFromCoordinates(phrase, 1, 0)).toBe(2);
    expect(coordinateFromMatchedLength(phrase, 2)).toEqual({
      chordIndex: 1,
      targetNoteIndex: 0,
    });
    expect(isNonFinalMeasureBoundary(phrase, 2)).toBe(true);
    expect(isNonFinalMeasureBoundary(phrase, 3)).toBe(false);
  });
});
