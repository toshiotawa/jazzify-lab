import Foundation
import CoreGraphics

/// Web `earTrainingPrecisionJudge.ts` 相当。
enum EarTrainingPrecisionJudge {
    static let judgmentWindowSec: Double = 0.25
    static let noteCullMarginPx: CGFloat = 20

    enum NoteJudgment: Equatable, Sendable {
        case pending
        case good
        case miss
    }

    struct NoteRuntimeState: Equatable, Sendable {
        var judgment: NoteJudgment
        var hitAtSec: Double?
        var releasedEarly: Bool?
        var hiddenFromLane: Bool?

        init(judgment: NoteJudgment = .pending) {
            self.judgment = judgment
        }
    }

    enum LessonRank: String, Sendable {
        case s = "S"
        case a = "A"
        case b = "B"
        case c = "C"
        case d = "D"
    }

    static func createRuntimeStates(notes: [EarTrainingPrecisionNote]) -> [String: NoteRuntimeState] {
        var map: [String: NoteRuntimeState] = [:]
        map.reserveCapacity(notes.count)
        for note in notes {
            map[note.id] = NoteRuntimeState()
        }
        return map
    }

    static func resetRuntimeStatesFromTime(
        notes: [EarTrainingPrecisionNote],
        states: inout [String: NoteRuntimeState],
        phraseTimeSec: Double,
        windowSec: Double
    ) {
        for note in notes {
            guard var state = states[note.id] else { continue }
            let endWindow = note.startSec + windowSec
            if phraseTimeSec <= endWindow {
                state.judgment = .pending
                state.hitAtSec = nil
                state.releasedEarly = nil
                state.hiddenFromLane = nil
                states[note.id] = state
                continue
            }
            // 練習モードのシーク: シーク位置以降（判定窓内）の good ノーツを pending に戻して復活させる
            if note.startSec >= phraseTimeSec - windowSec {
                state.judgment = .pending
                state.hitAtSec = nil
                state.releasedEarly = nil
                state.hiddenFromLane = nil
                states[note.id] = state
                continue
            }
            if state.judgment == .good {
                continue
            }
            state.judgment = .miss
            state.hitAtSec = nil
            state.releasedEarly = nil
            state.hiddenFromLane = nil
            states[note.id] = state
        }
    }

    static func findNoteForInput(
        notes: [EarTrainingPrecisionNote],
        states: [String: NoteRuntimeState],
        midi: Int,
        phraseTimeSec: Double,
        windowSec: Double
    ) -> EarTrainingPrecisionNote? {
        let roundedMidi = midi
        for note in notes {
            guard note.midi == roundedMidi else { continue }
            guard let state = states[note.id], state.judgment == .pending else { continue }
            if abs(phraseTimeSec - note.startSec) <= windowSec {
                return note
            }
        }
        return nil
    }

    static func shouldCullNoteFromLane(
        judgment: NoteJudgment,
        bottom: CGFloat,
        top: CGFloat,
        noteLaneHeight: CGFloat,
        canvasHeight: CGFloat,
        margin: CGFloat = noteCullMarginPx
    ) -> Bool {
        if bottom < -margin {
            return true
        }
        if judgment == .pending {
            return top > noteLaneHeight + margin
        }
        return top > canvasHeight + margin
    }

    @discardableResult
    static func markExpiredNotesAsMiss(
        notes: [EarTrainingPrecisionNote],
        states: inout [String: NoteRuntimeState],
        phraseTimeSec: Double,
        windowSec: Double
    ) -> Int {
        var newlyMissed = 0
        for note in notes {
            guard var state = states[note.id], state.judgment == .pending else { continue }
            if phraseTimeSec > note.startSec + windowSec {
                state.judgment = .miss
                states[note.id] = state
                newlyMissed += 1
            }
        }
        return newlyMissed
    }

    struct JudgmentCounts: Equatable, Sendable {
        let good: Int
        let miss: Int
        let pending: Int
        let total: Int
    }

    static func countJudgments(
        notes: [EarTrainingPrecisionNote],
        states: [String: NoteRuntimeState]
    ) -> JudgmentCounts {
        var good = 0
        var miss = 0
        var pending = 0
        for note in notes {
            guard let state = states[note.id], state.judgment != .pending else {
                pending += 1
                continue
            }
            if state.judgment == .good {
                good += 1
            } else {
                miss += 1
            }
        }
        return JudgmentCounts(good: good, miss: miss, pending: pending, total: notes.count)
    }

    static func goodRate(
        notes: [EarTrainingPrecisionNote],
        states: [String: NoteRuntimeState]
    ) -> Double {
        let counts = countJudgments(notes: notes, states: states)
        guard counts.total > 0 else { return 0 }
        return Double(counts.good) / Double(counts.total)
    }

    static func rankForGoodRate(_ goodRate: Double) -> LessonRank {
        if goodRate >= 0.95 { return .s }
        if goodRate >= 0.9 { return .a }
        if goodRate >= 0.8 { return .b }
        if goodRate >= 0.7 { return .c }
        return .d
    }

    static func isClearRank(_ rank: LessonRank) -> Bool {
        rank != .d
    }

    static func mapRankToLessonRank(_ rank: LessonRank) -> String {
        switch rank {
        case .s: return "S"
        case .a: return "A"
        case .b: return "B"
        case .c, .d: return "C"
        }
    }
}
