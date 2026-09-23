import Foundation

struct ExpectedPitchCandidates: Equatable {
    let pitchClassMask: Int
    let midis: [Int]
    /// 同音連打待ち: この pitch class だけ再発音条件を厳格化する。0 で無効。
    let repeatPitchClassMask: Int

    static let empty = ExpectedPitchCandidates(pitchClassMask: 0, midis: [], repeatPitchClassMask: 0)

    static func build(from midis: [Int], repeatPitchClassMask: Int = 0) -> ExpectedPitchCandidates {
        var unique: [Int] = []
        var seen = Set<Int>()
        for midi in midis {
            guard seen.insert(midi).inserted else { continue }
            unique.append(midi)
        }
        var mask = 0
        for midi in unique {
            let pitchClass = ((midi % 12) + 12) % 12
            mask |= 1 << pitchClass
        }
        return ExpectedPitchCandidates(
            pitchClassMask: mask,
            midis: unique,
            repeatPitchClassMask: repeatPitchClassMask & 0xFFF
        )
    }
}

enum SamePitchRepeatGate {
    static func isTooSoon(
        inputPitchClass: Int,
        lastAcceptedPitchClass: Int?,
        lastAcceptedAtMs: Double?,
        inputTimeMs: Double,
        minIntervalMs: Double
    ) -> Bool {
        guard let lastAcceptedPitchClass, let lastAcceptedAtMs else { return false }
        guard inputPitchClass == lastAcceptedPitchClass else { return false }
        return inputTimeMs - lastAcceptedAtMs < minIntervalMs
    }

    static func minIntervalMsForEighthNote(bpm: Double, ratio: Double = 0.5) -> Double {
        guard bpm > 0 else { return 0 }
        return (60_000 / bpm / 2) * ratio
    }

    static func minIntervalMsForWrittenSpacing(prevSec: Double, nextSec: Double, ratio: Double = 0.5) -> Double {
        max(0, (nextSec - prevSec) * 1000 * ratio)
    }
}

enum ExpectedPitchCandidateCollectors {
    private static func pitchClass(from midi: Int) -> Int {
        ((midi % 12) + 12) % 12
    }

    private struct ChordOsmdSamePitchRepeatContext {
        let pendingIndex: Int
        let pendingMidi: Int
    }

    private static func resolveChordOsmdSamePitchRepeatContext(
        targetCount: Int,
        phraseTimeSec: Double,
        judgedTargetTimeSec: (Int) -> Double,
        runtimeAt: (Int) -> (completed: Bool, failed: Bool, remainingMidis: [Int])?,
        targetMidisAt: (Int) -> [Int],
        lateSec: Double
    ) -> ChordOsmdSamePitchRepeatContext? {
        for index in 0..<targetCount {
            guard let runtime = runtimeAt(index) else { continue }
            guard !runtime.completed, !runtime.failed else { continue }
            let judged = judgedTargetTimeSec(index)
            let delta = phraseTimeSec - judged
            if delta > lateSec { continue }
            let targetMidis = targetMidisAt(index)
            guard targetMidis.count == 1, let pendingMidi = targetMidis.first else { return nil }
            guard index > 0 else { return nil }
            guard let previousRuntime = runtimeAt(index - 1), previousRuntime.completed else { return nil }
            let previousMidis = targetMidisAt(index - 1)
            guard previousMidis.count == 1, let previousMidi = previousMidis.first else { return nil }
            let previousPc = pitchClass(from: previousMidi)
            let pendingPc = pitchClass(from: pendingMidi)
            guard previousPc == pendingPc else { return nil }
            return ChordOsmdSamePitchRepeatContext(pendingIndex: index, pendingMidi: pendingMidi)
        }
        return nil
    }

    private static func chordOsmdRepeatMask(
        targetCount: Int,
        phraseTimeSec: Double,
        judgedTargetTimeSec: (Int) -> Double,
        runtimeAt: (Int) -> (completed: Bool, failed: Bool, remainingMidis: [Int])?,
        targetMidisAt: (Int) -> [Int],
        earlySec: Double,
        lateSec: Double
    ) -> Int {
        guard let context = resolveChordOsmdSamePitchRepeatContext(
            targetCount: targetCount,
            phraseTimeSec: phraseTimeSec,
            judgedTargetTimeSec: judgedTargetTimeSec,
            runtimeAt: runtimeAt,
            targetMidisAt: targetMidisAt,
            lateSec: lateSec
        ) else { return 0 }
        let pendingPc = pitchClass(from: context.pendingMidi)
        return 1 << pendingPc
    }

    static func collectChordOsmd(
        targetCount: Int,
        phraseTimeSec: Double,
        judgedTargetTimeSec: (Int) -> Double,
        runtimeAt: (Int) -> (completed: Bool, failed: Bool, remainingMidis: [Int])?,
        earlySec: Double,
        lateSec: Double,
        targetMidisAt: ((Int) -> [Int])? = nil
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
        let repeatMask = targetMidisAt.map {
            chordOsmdRepeatMask(
                targetCount: targetCount,
                phraseTimeSec: phraseTimeSec,
                judgedTargetTimeSec: judgedTargetTimeSec,
                runtimeAt: runtimeAt,
                targetMidisAt: $0,
                earlySec: earlySec,
                lateSec: lateSec
            )
        } ?? 0
        return ExpectedPitchCandidates.build(from: midis, repeatPitchClassMask: repeatMask)
    }

    static func isChordOsmdWaitingForSamePitchRepeat(
        targetCount: Int,
        phraseTimeSec: Double,
        judgedTargetTimeSec: (Int) -> Double,
        runtimeAt: (Int) -> (completed: Bool, failed: Bool, remainingMidis: [Int])?,
        targetMidisAt: (Int) -> [Int],
        earlySec: Double,
        lateSec: Double
    ) -> Bool {
        chordOsmdRepeatMask(
            targetCount: targetCount,
            phraseTimeSec: phraseTimeSec,
            judgedTargetTimeSec: judgedTargetTimeSec,
            runtimeAt: runtimeAt,
            targetMidisAt: targetMidisAt,
            earlySec: earlySec,
            lateSec: lateSec
        ) != 0
    }

    static func resolveChordOsmdSamePitchRepeatMinIntervalMs(
        targetCount: Int,
        phraseTimeSec: Double,
        judgedTargetTimeSec: (Int) -> Double,
        runtimeAt: (Int) -> (completed: Bool, failed: Bool, remainingMidis: [Int])?,
        targetMidisAt: (Int) -> [Int],
        earlySec: Double,
        lateSec: Double
    ) -> Double? {
        guard let context = resolveChordOsmdSamePitchRepeatContext(
            targetCount: targetCount,
            phraseTimeSec: phraseTimeSec,
            judgedTargetTimeSec: judgedTargetTimeSec,
            runtimeAt: runtimeAt,
            targetMidisAt: targetMidisAt,
            lateSec: lateSec
        ) else { return nil }
        let prevSec = judgedTargetTimeSec(context.pendingIndex - 1)
        let nextSec = judgedTargetTimeSec(context.pendingIndex)
        return SamePitchRepeatGate.minIntervalMsForWrittenSpacing(prevSec: prevSec, nextSec: nextSec)
    }

    private static func precisionRepeatMask(
        notes: [EarTrainingPrecisionNote],
        states: [String: EarTrainingPrecisionJudge.NoteRuntimeState],
        phraseTimeSec: Double,
        windowSec: Double
    ) -> Int {
        for index in notes.indices {
            let note = notes[index]
            guard let state = states[note.id], state.judgment == .pending else { continue }
            let delta = phraseTimeSec - note.startSec
            if delta < -windowSec { break }
            if delta > windowSec { continue }
            guard index > 0 else { return 0 }
            let previous = notes[index - 1]
            guard let previousState = states[previous.id], previousState.judgment == .good else { return 0 }
            let previousPc = pitchClass(from: previous.midi)
            let pendingPc = pitchClass(from: note.midi)
            return previousPc == pendingPc ? (1 << pendingPc) : 0
        }
        return 0
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
        let repeatMask = precisionRepeatMask(
            notes: notes,
            states: states,
            phraseTimeSec: phraseTimeSec,
            windowSec: windowSec
        )
        return ExpectedPitchCandidates.build(from: midis, repeatPitchClassMask: repeatMask)
    }

    static func isPrecisionWaitingForSamePitchRepeat(
        notes: [EarTrainingPrecisionNote],
        states: [String: EarTrainingPrecisionJudge.NoteRuntimeState],
        phraseTimeSec: Double,
        windowSec: Double
    ) -> Bool {
        precisionRepeatMask(
            notes: notes,
            states: states,
            phraseTimeSec: phraseTimeSec,
            windowSec: windowSec
        ) != 0
    }

    static func resolvePrecisionSamePitchRepeatMinIntervalMs(
        notes: [EarTrainingPrecisionNote],
        states: [String: EarTrainingPrecisionJudge.NoteRuntimeState],
        phraseTimeSec: Double,
        windowSec: Double
    ) -> Double? {
        for index in notes.indices {
            let note = notes[index]
            guard let state = states[note.id], state.judgment == .pending else { continue }
            let delta = phraseTimeSec - note.startSec
            if delta < -windowSec { break }
            if delta > windowSec { continue }
            guard index > 0 else { return nil }
            let previous = notes[index - 1]
            guard let previousState = states[previous.id], previousState.judgment == .good else { return nil }
            let previousPc = pitchClass(from: previous.midi)
            let pendingPc = pitchClass(from: note.midi)
            guard previousPc == pendingPc else { return nil }
            return SamePitchRepeatGate.minIntervalMsForWrittenSpacing(
                prevSec: previous.startSec,
                nextSec: note.startSec
            )
        }
        return nil
    }
}
