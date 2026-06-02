import {
  advanceSequential,
  coordinateFromMatchedLength,
  getChordPatternCache,
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

  it('advances sequentially on expected notes', () => {
    const pattern = [2, 4, 5, 7];
    let matched = 0;
    for (const pc of [2, 4, 5] as const) {
      const step = advanceSequential(pattern, matched, pc);
      expect(step.resync).toBe(false);
      matched = step.matchedLength;
    }
    expect(matched).toBe(3);
  });

  it('resyncs to opening pitch when replayed mid-progress', () => {
    const pattern = [2, 4, 5, 7];
    let matched = 0;
    for (const pc of [2, 4, 5] as const) {
      matched = advanceSequential(pattern, matched, pc).matchedLength;
    }
    expect(matched).toBe(3);

    const replay = advanceSequential(pattern, matched, 2);
    expect(replay.resync).toBe(true);
    expect(replay.matchedLength).toBe(1);
  });

  it('returns miss on unexpected pitch', () => {
    const pattern = [2, 4, 5, 7];
    const miss = advanceSequential(pattern, 1, 0);
    expect(miss.matchedLength).toBe(0);
    expect(miss.resync).toBe(false);
  });

  it('prefixIndexSet builds contiguous indices', () => {
    expect([...prefixIndexSet(3)]).toEqual([0, 1, 2]);
  });

  it('caches chord pitch patterns', () => {
    const notes = [{ pitchClass: 0 }, { pitchClass: 4 }];
    const a = getChordPatternCache(notes);
    const b = getChordPatternCache(notes);
    expect(a.pattern).toBe(b.pattern);
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
