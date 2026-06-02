import Foundation

struct EarTrainingPhrasePairAdlibStep: Equatable, Sendable, Identifiable {
    let id: UUID
    let orderIndex: Int
    let chordName: String
    let patternGroupId: UUID
    let measureNumber: Int?
    let startTimeSec: Double
    let endTimeSec: Double
    let quote: String?
    let inputDisabled: Bool
}

struct EarTrainingPhrasePairAdlibBootstrap: Equatable, Sendable {
    let bgmUrl: String
    let keyFifths: Int
    let loopDurationSec: Double
    let steps: [EarTrainingPhrasePairAdlibStep]
    let patternsByGroupId: [UUID: [EarTrainingPhrasePairEngine.Pattern]]
}

enum EarTrainingPhrasePairTimeline {
    static func step(
        at loopTimeSec: Double,
        steps: [EarTrainingPhrasePairAdlibStep],
        loopDurationSec: Double
    ) -> EarTrainingPhrasePairAdlibStep? {
        guard !steps.isEmpty, loopDurationSec > 0 else { return nil }
        let normalized = loopTimeSec.truncatingRemainder(dividingBy: loopDurationSec)
        let safe = normalized < 0 ? normalized + loopDurationSec : normalized
        for step in steps where safe >= step.startTimeSec && safe < step.endTimeSec {
            return step
        }
        return steps.last
    }

    static func patterns(
        for step: EarTrainingPhrasePairAdlibStep?,
        patternsByGroupId: [UUID: [EarTrainingPhrasePairEngine.Pattern]]
    ) -> [EarTrainingPhrasePairEngine.Pattern] {
        guard let step else { return [] }
        return patternsByGroupId[step.patternGroupId] ?? []
    }

    static func nextBoundarySec(
        steps: [EarTrainingPhrasePairAdlibStep],
        loopTimeSec: Double,
        loopDurationSec: Double
    ) -> Double? {
        guard let current = step(at: loopTimeSec, steps: steps, loopDurationSec: loopDurationSec) else {
            return nil
        }
        if let next = steps.first(where: { $0.orderIndex == current.orderIndex + 1 }) {
            return next.startTimeSec
        }
        return loopDurationSec
    }
}

enum EarTrainingPhrasePairBattleEngine {
    static let maxFireballsPerStep = 16

    struct WindowState: Sendable, Equatable {
        var stepId: UUID?
        var fireCount: Int
    }

    struct NoteResult: Sendable, Equatable {
        let evaluation: EarTrainingPhrasePairEngine.Evaluation
        let nextMatcherState: EarTrainingPhrasePairEngine.RuntimeState
        let nextWindow: WindowState
        let shouldFire: Bool
        let enemyDamage: Int
        let playerDamage: Int
    }

    static func createWindow(stepId: UUID? = nil) -> WindowState {
        WindowState(stepId: stepId, fireCount: 0)
    }

    static func applyStepTransition(_ current: WindowState, stepId: UUID?) -> WindowState {
        if current.stepId == stepId { return current }
        return createWindow(stepId: stepId)
    }

    static func handleNoteOn(
        matcherState: EarTrainingPhrasePairEngine.RuntimeState,
        window: WindowState,
        patterns: [EarTrainingPhrasePairEngine.Pattern],
        midiNote: Int,
        damage: EarTrainingDamageConfig
    ) -> NoteResult {
        let evaluation = EarTrainingPhrasePairEngine.evaluateNoteOn(
            state: matcherState,
            pitchClass: midiNote,
            patterns: patterns
        )

        if evaluation.result == .miss {
            return NoteResult(
                evaluation: evaluation,
                nextMatcherState: evaluation.nextState,
                nextWindow: window,
                shouldFire: false,
                enemyDamage: 0,
                playerDamage: damage.miss
            )
        }

        let shouldFire =
            evaluation.result == .complete
            && window.fireCount < maxFireballsPerStep

        let nextWindow: WindowState
        if shouldFire {
            nextWindow = WindowState(stepId: window.stepId, fireCount: window.fireCount + 1)
        } else {
            nextWindow = window
        }

        return NoteResult(
            evaluation: evaluation,
            nextMatcherState: evaluation.nextState,
            nextWindow: nextWindow,
            shouldFire: shouldFire,
            enemyDamage: shouldFire ? damage.perCorrectNote : 0,
            playerDamage: 0
        )
    }
}
