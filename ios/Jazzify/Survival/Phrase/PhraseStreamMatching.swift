import Foundation

/// KMP-style prefix matching for phrase note streams (pitch class sequences).
enum PhraseStreamMatching {
    static func normalizedPitchClass(_ pitchClass: Int) -> Int {
        ((pitchClass % 12) + 12) % 12
    }

    static func buildKmpTable(_ pattern: [Int]) -> [Int] {
        guard !pattern.isEmpty else { return [] }
        var table = Array(repeating: 0, count: pattern.count)
        var j = 0

        for i in 1..<pattern.count {
            while j > 0 && pattern[i] != pattern[j] {
                j = table[j - 1]
            }
            if pattern[i] == pattern[j] {
                j += 1
            }
            table[i] = j
        }

        return table
    }

    static func advanceKmp(
        pattern: [Int],
        table: [Int],
        matchedLength: Int,
        pitchClass: Int
    ) -> Int {
        guard !pattern.isEmpty else { return 0 }

        let pc = normalizedPitchClass(pitchClass)
        var j = max(0, min(matchedLength, pattern.count))

        if j == pattern.count {
            j = table[j - 1]
        }

        while j > 0 && pattern[j] != pc {
            j = table[j - 1]
        }

        if pattern[j] == pc {
            j += 1
        }

        return j
    }

    static func prefixIndexSet(_ length: Int) -> Set<Int> {
        guard length > 0 else { return [] }
        return Set(0..<length)
    }

    struct KmpPatternCache {
        let pattern: [Int]
        let table: [Int]
    }

    private static var compositeCache: [ObjectIdentifier: KmpPatternCache] = [:]
    private static var chordNotesCache: [ObjectIdentifier: KmpPatternCache] = [:]

    static func chordPitchPattern(
        notes: [SurvivalPhraseChordNote]
    ) -> [Int] {
        notes.map { normalizedPitchClass($0.pitchClass) }
    }

    static func getChordKmpCache(notes: [SurvivalPhraseChordNote]) -> KmpPatternCache {
        let key = ObjectIdentifier(notes as NSArray)
        if let cached = chordNotesCache[key] {
            return cached
        }
        let pattern = chordPitchPattern(notes: notes)
        let entry = KmpPatternCache(pattern: pattern, table: buildKmpTable(pattern))
        chordNotesCache[key] = entry
        return entry
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

    static func getCompositeKmpCache(chords: [SurvivalPhraseChord]) -> KmpPatternCache {
        let key = ObjectIdentifier(chords as NSArray)
        if let cached = compositeCache[key] {
            return cached
        }
        let pattern = compositePitchPattern(chords: chords)
        let entry = KmpPatternCache(pattern: pattern, table: buildKmpTable(pattern))
        compositeCache[key] = entry
        return entry
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

    static func getEarTrainingCompositeKmpCache(
        chords: [EarTrainingCompositePhraseChord]
    ) -> KmpPatternCache {
        let key = ObjectIdentifier(chords as NSArray)
        if let cached = compositeCache[key] {
            return cached
        }
        let pattern = earTrainingCompositePitchPattern(chords: chords)
        let entry = KmpPatternCache(pattern: pattern, table: buildKmpTable(pattern))
        compositeCache[key] = entry
        return entry
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
