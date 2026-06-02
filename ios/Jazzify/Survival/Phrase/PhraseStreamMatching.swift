import Foundation

/// Sequential prefix matching for phrase note streams (pitch class sequences).
enum PhraseStreamMatching {
    static func normalizedPitchClass(_ pitchClass: Int) -> Int {
        ((pitchClass % 12) + 12) % 12
    }

    struct SequentialAdvanceResult: Equatable {
        let matchedLength: Int
        let resync: Bool
    }

    static func advanceSequential(
        pattern: [Int],
        matchedLength: Int,
        pitchClass: Int
    ) -> SequentialAdvanceResult {
        guard !pattern.isEmpty else {
            return SequentialAdvanceResult(matchedLength: 0, resync: false)
        }

        let pc = normalizedPitchClass(pitchClass)
        let before = max(0, min(matchedLength, pattern.count))

        if before < pattern.count, pattern[before] == pc {
            return SequentialAdvanceResult(matchedLength: before + 1, resync: false)
        }

        if before > 0, pattern[0] == pc {
            return SequentialAdvanceResult(matchedLength: 1, resync: true)
        }

        return SequentialAdvanceResult(matchedLength: 0, resync: false)
    }

    static func prefixIndexSet(_ length: Int) -> Set<Int> {
        guard length > 0 else { return [] }
        return Set(0..<length)
    }

    struct PitchPatternCache {
        let pattern: [Int]
    }

    private static var compositeCache: [ObjectIdentifier: PitchPatternCache] = [:]
    private static var chordNotesCache: [ObjectIdentifier: PitchPatternCache] = [:]

    static func chordPitchPattern(
        notes: [SurvivalPhraseChordNote]
    ) -> [Int] {
        notes.map { normalizedPitchClass($0.pitchClass) }
    }

    static func getChordPatternCache(notes: [SurvivalPhraseChordNote]) -> PitchPatternCache {
        let key = ObjectIdentifier(notes as NSArray)
        if let cached = chordNotesCache[key] {
            return cached
        }
        let pattern = chordPitchPattern(notes: notes)
        let entry = PitchPatternCache(pattern: pattern)
        chordNotesCache[key] = entry
        return entry
    }

    static func getChordKmpCache(notes: [SurvivalPhraseChordNote]) -> PitchPatternCache {
        getChordPatternCache(notes: notes)
    }

    static func compositePitchPattern(chords: [SurvivalPhraseChord]) -> [Int] {
        var out: [Int] = []
        for chord in chords {
            for note in chord.notes {
                out.append(normalizedPitchClass(note.pitchClass))
            }
        }
        return out
    }

    static func getCompositePatternCache(chords: [SurvivalPhraseChord]) -> PitchPatternCache {
        let key = ObjectIdentifier(chords as NSArray)
        if let cached = compositeCache[key] {
            return cached
        }
        let pattern = compositePitchPattern(chords: chords)
        let entry = PitchPatternCache(pattern: pattern)
        compositeCache[key] = entry
        return entry
    }

    static func getCompositeKmpCache(chords: [SurvivalPhraseChord]) -> PitchPatternCache {
        getCompositePatternCache(chords: chords)
    }

    static func matchedLengthFromCoordinates(
        chords: [SurvivalPhraseChord],
        chordIndex: Int,
        targetNoteIndex: Int
    ) -> Int {
        var length = 0
        let safeChordIndex = min(chordIndex, chords.count)

        for i in 0..<safeChordIndex {
            length += chords[i].notes.count
        }

        return length + targetNoteIndex
    }

    static func coordinateFromMatchedLength(
        chords: [SurvivalPhraseChord],
        matchedLength: Int
    ) -> (chordIndex: Int, targetNoteIndex: Int) {
        var remaining = max(0, matchedLength)

        for chordIndex in 0..<chords.count {
            let len = chords[chordIndex].notes.count

            if remaining < len {
                return (chordIndex, remaining)
            }

            if remaining == len {
                if chordIndex + 1 < chords.count {
                    return (chordIndex + 1, 0)
                }
                return (chordIndex, len)
            }

            remaining -= len
        }

        return (0, 0)
    }

    static func isNonFinalMeasureBoundary(
        chords: [SurvivalPhraseChord],
        matchedLength: Int
    ) -> Bool {
        guard matchedLength > 0, chords.count > 1 else { return false }

        var acc = 0
        for i in 0..<(chords.count - 1) {
            acc += chords[i].notes.count
            if matchedLength == acc {
                return true
            }
        }

        return false
    }

    static func earTrainingCompositePitchPattern(
        chords: [EarTrainingCompositePhraseChord]
    ) -> [Int] {
        var out: [Int] = []
        for chord in chords {
            for note in chord.notes {
                out.append(normalizedPitchClass(note.pitchClass))
            }
        }
        return out
    }

    static func getEarTrainingCompositePatternCache(
        chords: [EarTrainingCompositePhraseChord]
    ) -> PitchPatternCache {
        let key = ObjectIdentifier(chords as NSArray)
        if let cached = compositeCache[key] {
            return cached
        }
        let pattern = earTrainingCompositePitchPattern(chords: chords)
        let entry = PitchPatternCache(pattern: pattern)
        compositeCache[key] = entry
        return entry
    }

    static func getEarTrainingCompositeKmpCache(
        chords: [EarTrainingCompositePhraseChord]
    ) -> PitchPatternCache {
        getEarTrainingCompositePatternCache(chords: chords)
    }

    static func matchedLengthFromEarTrainingCoordinates(
        chords: [EarTrainingCompositePhraseChord],
        chordIndex: Int,
        targetNoteIndex: Int
    ) -> Int {
        var length = 0
        let safeChordIndex = min(chordIndex, chords.count)

        for i in 0..<safeChordIndex {
            length += chords[i].notes.count
        }

        return length + targetNoteIndex
    }

    static func coordinateFromEarTrainingMatchedLength(
        chords: [EarTrainingCompositePhraseChord],
        matchedLength: Int
    ) -> (chordIndex: Int, targetNoteIndex: Int) {
        var remaining = max(0, matchedLength)

        for chordIndex in 0..<chords.count {
            let len = chords[chordIndex].notes.count

            if remaining < len {
                return (chordIndex, remaining)
            }

            if remaining == len {
                if chordIndex + 1 < chords.count {
                    return (chordIndex + 1, 0)
                }
                return (chordIndex, len)
            }

            remaining -= len
        }

        return (0, 0)
    }

    static func isEarTrainingNonFinalMeasureBoundary(
        chords: [EarTrainingCompositePhraseChord],
        matchedLength: Int
    ) -> Bool {
        guard matchedLength > 0, chords.count > 1 else { return false }

        var acc = 0
        for i in 0..<(chords.count - 1) {
            acc += chords[i].notes.count
            if matchedLength == acc {
                return true
            }
        }

        return false
    }
}
