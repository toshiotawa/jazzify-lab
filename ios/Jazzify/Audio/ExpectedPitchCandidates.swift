import Foundation

struct ExpectedPitchCandidates: Equatable {
    let pitchClassMask: Int
    let midis: [Int]

    static let empty = ExpectedPitchCandidates(pitchClassMask: 0, midis: [])

    static func build(from midis: [Int]) -> ExpectedPitchCandidates {
        var unique: [Int] = []
        var seen = Set<Int>()
        for raw in midis {
            let midi = Int(raw.rounded())
            guard seen.insert(midi).inserted else { continue }
            unique.append(midi)
        }
        var mask = 0
        for midi in unique {
            let pitchClass = ((midi % 12) + 12) % 12
            mask |= 1 << pitchClass
        }
        return ExpectedPitchCandidates(pitchClassMask: mask, midis: unique)
    }
}

enum ExpectedPitchCandidateCollectors {
    static func collectChordOsmd(
        targetCount: Int,
        phraseTimeSec: Double,
        judgedTargetTimeSec: (Int) -> Double,
        runtimeAt: (Int) -> (completed: Bool, failed: Bool, remainingMidis: [Int])?,
        earlySec: Double,
        lateSec: Double
    ) -> ExpectedPitchCandidates {
        var midis: [Int] = []
        for index in 0..<targetCount {
            guard let runtime = runtimeAt(index) else { continue }
            guard !runtime.completed, !runtime.failed else { continue }
            let judged = judgedTargetTimeSec(index)
            let delta = phraseTimeSec - judged
            if delta < -earlySec { break }
            if delta > lateSec { continue }
            for midi in runtime.remainingMidis where !midis.contains(midi) {
                midis.append(midi)
            }
        }
        return ExpectedPitchCandidates.build(from: midis)
    }

    static func collectPrecision(
        notes: [EarTrainingPrecisionNote],
        states: [String: EarTrainingPrecisionJudge.NoteRuntimeState],
        phraseTimeSec: Double,
        windowSec: Double
    ) -> ExpectedPitchCandidates {
        var midis: [Int] = []
        for note in notes {
            guard let state = states[note.id], state.judgment == .pending else { continue }
            let delta = phraseTimeSec - note.startSec
            if delta < -windowSec { break }
            if delta > windowSec { continue }
            if !midis.contains(note.midi) {
                midis.append(note.midi)
            }
        }
        return ExpectedPitchCandidates.build(from: midis)
    }
}
