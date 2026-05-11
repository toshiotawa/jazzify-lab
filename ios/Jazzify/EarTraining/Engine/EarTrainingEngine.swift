import Foundation

/// 耳コピバトルの採点 / ランク計算 / ダメージ算出ロジック。
/// Web 版 [src/utils/earTrainingEngine.ts](src/utils/earTrainingEngine.ts) を 1:1 で移植する。
enum EarTrainingEngine {
    /// Web の `MAX_MISSES_PER_NOTE` と一致。
    static let maxMissesPerNote = 5

    /// Web の NOTE_NAMES_BY_PITCH_CLASS
    static let noteNamesByPitchClass: [String] = [
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
    ]

    static func midiToPitchClass(_ midiNote: Int) -> Int {
        let rounded = midiNote
        return ((rounded % 12) + 12) % 12
    }

    /// Web `noteNameToPitchClass` を素朴な音名パーサで実装。
    /// `C`, `Db`, `D#`, `Eb` ... と 0-9 までの末尾 octave を許容する。
    static func noteNameToPitchClass(_ noteName: String) -> Int? {
        let trimmed = noteName.trimmingCharacters(in: .whitespaces)
        guard let first = trimmed.first else { return nil }
        let upper = String(first).uppercased()
        let baseMap: [String: Int] = [
            "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11
        ]
        guard var pc = baseMap[upper] else { return nil }
        var index = trimmed.index(after: trimmed.startIndex)
        while index < trimmed.endIndex {
            let ch = trimmed[index]
            if ch == "#" {
                pc += 1
            } else if ch == "b" || ch == "♭" {
                pc -= 1
            } else if ch == "♯" {
                pc += 1
            } else {
                break
            }
            index = trimmed.index(after: index)
        }
        return ((pc % 12) + 12) % 12
    }

    /// Web `getDisplayNoteName` 相当（末尾の数字を除去）。
    static func displayNoteName(for note: EarTrainingPhraseNoteDetail) -> String {
        let name = note.noteName.trimmingCharacters(in: .whitespaces)
        if !name.isEmpty {
            // 末尾連続数字を除去
            var endIndex = name.endIndex
            while endIndex > name.startIndex {
                let prev = name.index(before: endIndex)
                if name[prev].isNumber {
                    endIndex = prev
                } else {
                    break
                }
            }
            let stripped = String(name[..<endIndex])
            if !stripped.isEmpty {
                return stripped
            }
        }
        if note.pitchClass >= 0 && note.pitchClass < noteNamesByPitchClass.count {
            return noteNamesByPitchClass[note.pitchClass]
        }
        return "?"
    }

    static func isMatchingPitchClass(_ expected: EarTrainingPhraseNoteDetail, inputMidiNote: Int) -> Bool {
        let expectedPitchClass = noteNameToPitchClass(expected.noteName) ?? expected.pitchClass
        return expectedPitchClass == midiToPitchClass(inputMidiNote)
    }

    static func createPhraseAttempt(_ phrase: EarTrainingPhraseDetail, audioTime: Double = 0) -> EarTrainingPhraseAttempt {
        EarTrainingPhraseAttempt(
            phraseId: phrase.id,
            currentNoteIndex: 0,
            revealedNotes: [],
            missedNoteCounts: [:],
            startedAtAudioTime: audioTime,
            completed: false,
            failed: false
        )
    }

    static func nextPhraseIndex(currentIndex: Int, totalPhrases: Int) -> Int {
        guard totalPhrases > 0 else { return 0 }
        return (currentIndex + 1) % totalPhrases
    }

    static func calculateRank(missedNoteCounts: [Int: Int], rule: EarTrainingRankRule) -> EarTrainingRank {
        let missCount = missedNoteCounts.values.reduce(0, +)
        if missCount <= rule.perfectMaxMisses {
            return .perfect
        }
        if missCount <= rule.greatMaxMisses {
            return .great
        }
        return .good
    }

    static func completionDamage(rank: EarTrainingRank, damage: EarTrainingDamageConfig) -> Int {
        switch rank {
        case .perfect: return damage.perfect
        case .great: return damage.great
        case .good: return damage.good
        case .fail: return 0
        }
    }

    /// Web `mapEarTrainingRankToLessonRank`。
    static func lessonRank(from rank: EarTrainingRank) -> String {
        switch rank {
        case .perfect: return "S"
        case .great: return "A"
        case .good: return "B"
        case .fail: return "C"
        }
    }

    struct InputResult {
        var attempt: EarTrainingPhraseAttempt
        var correct: Bool
        var completed: Bool
        var revealedNote: String?
        var enemyDamage: Int
        var playerDamage: Int
        var evaluationMissAdded: Bool
    }

    static func handleNoteInput(
        phrase: EarTrainingPhraseDetail,
        attempt: EarTrainingPhraseAttempt,
        inputMidiNote: Int,
        damage: EarTrainingDamageConfig
    ) -> InputResult {
        let notes = phrase.notes ?? []
        let expectedIndex = attempt.currentNoteIndex
        guard expectedIndex >= 0 && expectedIndex < notes.count, !attempt.completed, !attempt.failed else {
            return InputResult(
                attempt: attempt,
                correct: false,
                completed: attempt.completed,
                revealedNote: nil,
                enemyDamage: 0,
                playerDamage: 0,
                evaluationMissAdded: false
            )
        }
        let expected = notes[expectedIndex]

        if isMatchingPitchClass(expected, inputMidiNote: inputMidiNote) {
            let revealedNote = displayNoteName(for: expected)
            let nextIndex = attempt.currentNoteIndex + 1
            let completed = nextIndex >= notes.count
            var nextAttempt = attempt
            nextAttempt.currentNoteIndex = nextIndex
            nextAttempt.revealedNotes.append(revealedNote)
            nextAttempt.completed = completed
            return InputResult(
                attempt: nextAttempt,
                correct: true,
                completed: completed,
                revealedNote: revealedNote,
                enemyDamage: damage.perCorrectNote,
                playerDamage: 0,
                evaluationMissAdded: false
            )
        }

        let noteIndex = attempt.currentNoteIndex
        var missed = attempt.missedNoteCounts
        let currentMissCount = missed[noteIndex] ?? 0
        let evaluationMissAdded = currentMissCount < maxMissesPerNote
        if evaluationMissAdded {
            missed[noteIndex] = currentMissCount + 1
        }
        var nextAttempt = attempt
        nextAttempt.missedNoteCounts = missed
        return InputResult(
            attempt: nextAttempt,
            correct: false,
            completed: false,
            revealedNote: nil,
            enemyDamage: 0,
            playerDamage: evaluationMissAdded ? damage.miss : 0,
            evaluationMissAdded: evaluationMissAdded
        )
    }

    enum Outcome {
        case stageClear
        case gameOver
        case timeUp
        case phraseComplete
        case phraseFail
        case input
    }

    static func resolveOutcome(
        enemyHp: Int,
        playerHp: Int,
        timeRemainingSec: Int,
        phraseCompleted: Bool,
        phraseFailed: Bool
    ) -> Outcome {
        if enemyHp <= 0 { return .stageClear }
        if playerHp <= 0 { return .gameOver }
        if timeRemainingSec <= 0 { return .timeUp }
        if phraseCompleted { return .phraseComplete }
        if phraseFailed { return .phraseFail }
        return .input
    }

    /// Web `NEXT_PHRASE_AT_MEASURE_END_LEAD_SEC` と一致。
    private static let nextPhraseAtMeasureEndLeadSec: Double = 0.001

    /// Web `getNextMeasureDelaySec` 相当（現在小節終端から `nextPhraseAtMeasureEndLeadSec` 手前）。
    static func nextMeasureDelaySec(currentAudioTimeSec: Double, loopDurationSec: Double, loopMeasures: Int) -> Double {
        let measures = max(1, loopMeasures)
        let measureDurationSec = loopDurationSec / Double(measures)
        guard measureDurationSec > 0 else { return 0 }
        let positionInMeasure = currentAudioTimeSec.truncatingRemainder(dividingBy: measureDurationSec)
        let toBoundarySec = measureDurationSec - positionInMeasure
        return max(0, toBoundarySec - nextPhraseAtMeasureEndLeadSec)
    }
}
