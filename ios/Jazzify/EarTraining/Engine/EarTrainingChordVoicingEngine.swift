import Foundation

/// Web `EarTrainingChordVoicingAttempt` ([src/types/index.ts]) と同等。
struct EarTrainingChordVoicingAttempt: Sendable, Equatable {
    let phraseId: UUID
    var pressedByChord: [UUID: Set<Int>]
    var missByChord: [UUID: Int]
    var completedChordIds: Set<UUID>
    var awardedChordIds: Set<UUID>
    var failedChordIds: Set<UUID>
}

/// Web `earTrainingChordVoicingEngine.ts` を 1:1 で移植する。
enum EarTrainingChordVoicingEngine {
    static let maxMissesPerChord = 5

    static func midiToPitchClass(_ midiNote: Int) -> Int {
        ((midiNote % 12) + 12) % 12
    }

    /// Web `noteNameToPitchClass` 相当（ダブル臨時記号にも対応）。
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
            if ch == "x" {
                pc += 2
            } else if ch == "#" || ch == "♯" {
                pc += 1
            } else if ch == "b" || ch == "♭" {
                pc -= 1
            } else {
                break
            }
            index = trimmed.index(after: index)
        }
        return ((pc % 12) + 12) % 12
    }

    static func voicingPitchClasses(for chord: EarTrainingPhraseChordDetail) -> [Int] {
        guard let voicing = chord.voicing, !voicing.isEmpty else { return [] }
        var seen = Set<Int>()
        var ordered: [Int] = []
        for name in voicing {
            if let pc = noteNameToPitchClass(name), !seen.contains(pc) {
                seen.insert(pc)
                ordered.append(pc)
            }
        }
        return ordered
    }

    static func rootNoteName(for chord: EarTrainingPhraseChordDetail) -> String? {
        let trimmed = chord.chordName.trimmingCharacters(in: .whitespaces)
        guard let first = trimmed.first else { return nil }
        var root = String(first).uppercased()
        var index = trimmed.index(after: trimmed.startIndex)
        if index < trimmed.endIndex {
            let next = trimmed[index]
            if next == "#" || next == "♯" {
                root += "#"
                index = trimmed.index(after: index)
            } else if next == "b" || next == "♭" {
                root += "b"
                index = trimmed.index(after: index)
            }
        }
        return root.isEmpty ? nil : root
    }

    static func createAttempt(for phrase: EarTrainingPhraseDetail) -> EarTrainingChordVoicingAttempt {
        EarTrainingChordVoicingAttempt(
            phraseId: phrase.id,
            pressedByChord: [:],
            missByChord: [:],
            completedChordIds: [],
            awardedChordIds: [],
            failedChordIds: []
        )
    }

    struct InputResult {
        var attempt: EarTrainingChordVoicingAttempt
        var hitPitchClass: Int?
        var chordJustCompleted: Bool
        var rootNoteName: String?
        var enemyDamage: Int
        var playerDamage: Int
        var evaluationMissAdded: Bool
    }

    static func handleNoteOn(
        attempt: EarTrainingChordVoicingAttempt,
        activeChord: EarTrainingPhraseChordDetail?,
        midiNote: Int,
        damage: EarTrainingDamageConfig
    ) -> InputResult {
        guard let chord = activeChord else {
            return InputResult(
                attempt: attempt,
                hitPitchClass: nil,
                chordJustCompleted: false,
                rootNoteName: nil,
                enemyDamage: 0,
                playerDamage: 0,
                evaluationMissAdded: false
            )
        }
        let chordId = chord.id
        if attempt.completedChordIds.contains(chordId) {
            return InputResult(
                attempt: attempt,
                hitPitchClass: nil,
                chordJustCompleted: false,
                rootNoteName: nil,
                enemyDamage: 0,
                playerDamage: 0,
                evaluationMissAdded: false
            )
        }
        let targetPcs = voicingPitchClasses(for: chord)
        let inputPc = midiToPitchClass(midiNote)
        var pressed = attempt.pressedByChord[chordId] ?? Set<Int>()
        let isTargetTone = targetPcs.contains(inputPc)
        if !isTargetTone {
            var next = attempt
            let currentMiss = next.missByChord[chordId] ?? 0
            let evaluationMissAdded = currentMiss < maxMissesPerChord
            if evaluationMissAdded {
                next.missByChord[chordId] = currentMiss + 1
            }
            return InputResult(
                attempt: next,
                hitPitchClass: nil,
                chordJustCompleted: false,
                rootNoteName: nil,
                enemyDamage: 0,
                playerDamage: evaluationMissAdded ? damage.miss : 0,
                evaluationMissAdded: evaluationMissAdded
            )
        }
        if pressed.contains(inputPc) {
            return InputResult(
                attempt: attempt,
                hitPitchClass: inputPc,
                chordJustCompleted: false,
                rootNoteName: nil,
                enemyDamage: 0,
                playerDamage: 0,
                evaluationMissAdded: false
            )
        }
        pressed.insert(inputPc)
        var next = attempt
        next.pressedByChord[chordId] = pressed
        let completed = !targetPcs.isEmpty && targetPcs.allSatisfy { pressed.contains($0) }
        if completed {
            next.completedChordIds.insert(chordId)
        }
        return InputResult(
            attempt: next,
            hitPitchClass: inputPc,
            chordJustCompleted: completed,
            rootNoteName: completed ? rootNoteName(for: chord) : nil,
            enemyDamage: damage.perCorrectNote,
            playerDamage: 0,
            evaluationMissAdded: false
        )
    }

    struct TickResult {
        var attempt: EarTrainingChordVoicingAttempt
        var failAdded: Bool
        var playerDamage: Int
    }

    static func advanceTick(
        attempt: EarTrainingChordVoicingAttempt,
        previousChord: EarTrainingPhraseChordDetail?,
        damage: EarTrainingDamageConfig
    ) -> TickResult {
        guard let chord = previousChord else {
            return TickResult(attempt: attempt, failAdded: false, playerDamage: 0)
        }
        let chordId = chord.id
        if attempt.completedChordIds.contains(chordId) || attempt.failedChordIds.contains(chordId) {
            return TickResult(attempt: attempt, failAdded: false, playerDamage: 0)
        }
        var next = attempt
        next.failedChordIds.insert(chordId)
        return TickResult(attempt: next, failAdded: true, playerDamage: damage.fail)
    }

    static func isAllChordsCompleted(
        phrase: EarTrainingPhraseDetail,
        attempt: EarTrainingChordVoicingAttempt
    ) -> Bool {
        let chords = phrase.chords ?? []
        guard !chords.isEmpty else { return false }
        return chords.allSatisfy { attempt.completedChordIds.contains($0.id) }
    }

    static func acknowledgeChordAward(
        attempt: EarTrainingChordVoicingAttempt,
        chordId: UUID
    ) -> EarTrainingChordVoicingAttempt {
        if attempt.awardedChordIds.contains(chordId) {
            return attempt
        }
        var next = attempt
        next.awardedChordIds.insert(chordId)
        return next
    }

    static func totalMissCount(_ attempt: EarTrainingChordVoicingAttempt) -> Int {
        attempt.missByChord.values.reduce(0, +)
    }

    /// 半拍早期遷移ロジック（Web `getEarTrainingChordDisplayAtTime`）。
    /// `loopTime` が次コードの開始まで半拍以下、かつ現コードが完成済み or 失敗扱いなら次コードを返す。
    static func chordDisplayAt(
        phrase: EarTrainingPhraseDetail,
        loopTime: Double,
        bpm: Int,
        completedChordIds: Set<UUID>
    ) -> EarTrainingPhraseChordDetail? {
        let chords = phrase.chords ?? []
        guard !chords.isEmpty else { return nil }
        let halfBeatSec = max(0.05, 60.0 / Double(bpm) * 0.5)
        var currentChord: EarTrainingPhraseChordDetail?
        for chord in chords {
            let start = chord.startTimeSec ?? 0
            if loopTime >= start - 1e-6 {
                currentChord = chord
            }
        }
        guard let resolved = currentChord, let index = chords.firstIndex(where: { $0.id == resolved.id }) else {
            return chords.first
        }
        if index + 1 < chords.count {
            let next = chords[index + 1]
            let nextStart = next.startTimeSec ?? Double.greatestFiniteMagnitude
            let timeUntilNext = nextStart - loopTime
            if timeUntilNext <= halfBeatSec, completedChordIds.contains(resolved.id) {
                return next
            }
        }
        return resolved
    }
}
