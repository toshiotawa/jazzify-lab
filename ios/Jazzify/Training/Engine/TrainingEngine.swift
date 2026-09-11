import Foundation

struct TrainingNoteEvaluationResult: Sendable {
    let accepted: Bool
    let completed: Bool
    let newCorrectIndices: [Int]
}

enum TrainingEngine {
    static func targetIndices(question: TrainingQuestion) -> [Int] {
        var out: [Int] = []
        for (index, note) in question.notes.enumerated() where note.isTarget {
            out.append(index)
        }
        return out
    }

    static func evaluateNoteOn(
        question: TrainingQuestion,
        correctIndices: [Int],
        midiNote: Int,
        sequential: Bool
    ) -> TrainingNoteEvaluationResult {
        let pitchClass = TrainingMusicTheory.normalizePitchClass(midiNote)
        let targets = targetIndices(question: question)
        let remaining = targets.filter { !correctIndices.contains($0) }

        if remaining.isEmpty {
            return TrainingNoteEvaluationResult(accepted: false, completed: true, newCorrectIndices: correctIndices)
        }

        if question.ordered {
            guard let nextIndex = remaining.first,
                  let expected = question.notes[safe: nextIndex],
                  expected.pitchClass == pitchClass
            else {
                return TrainingNoteEvaluationResult(accepted: false, completed: false, newCorrectIndices: correctIndices)
            }
            let newCorrect = correctIndices + [nextIndex]
            return TrainingNoteEvaluationResult(
                accepted: true,
                completed: newCorrect.count >= targets.count,
                newCorrectIndices: newCorrect
            )
        }

        let matchIndex: Int?
        if sequential {
            let pressedMidis = correctIndices.compactMap { question.notes[safe: $0]?.midi } + [midiNote]
            let expectedPcs = targets.compactMap { question.notes[safe: $0]?.pitchClass }
            let nextExpectedPc = expectedPcs[safe: correctIndices.count]
            if nextExpectedPc != pitchClass {
                return TrainingNoteEvaluationResult(accepted: false, completed: false, newCorrectIndices: correctIndices)
            }
            matchIndex = targets.first { index in
                question.notes[safe: index]?.pitchClass == pitchClass && !correctIndices.contains(index)
            }
        } else {
            matchIndex = targets.first { index in
                question.notes[safe: index]?.pitchClass == pitchClass && !correctIndices.contains(index)
            }
        }

        guard let matchIndex else {
            return TrainingNoteEvaluationResult(accepted: false, completed: false, newCorrectIndices: correctIndices)
        }

        let newCorrect = correctIndices + [matchIndex]
        return TrainingNoteEvaluationResult(
            accepted: true,
            completed: newCorrect.count >= targets.count,
            newCorrectIndices: newCorrect
        )
    }

    static func performDefeat(runtime: inout TrainingRuntime, nowSec: TimeInterval, guardPoseSec: TimeInterval = 0) {
        runtime.enemy.slashUntilSec = nowSec + DefenseEnemyConfig.slashSec
        runtime.enemy.fadeAlpha = 0.35
        if guardPoseSec > 0 {
            runtime.guardPoseUntilSec = nowSec + guardPoseSec
        }
    }

    static func tickEnemy(runtime: inout TrainingRuntime, nowSec: TimeInterval, dt: TimeInterval) -> Bool {
        if runtime.enemy.slashUntilSec > 0, nowSec >= runtime.enemy.slashUntilSec {
            runtime.enemy.slashUntilSec = 0
            runtime.enemy.fadeAlpha = 0
            runtime.enemy.typeIndex = (runtime.enemy.typeIndex + 1) % TrainingConstants.enemyCount
            runtime.enemy.fadeAlpha = 1
            return true
        }
        if runtime.enemy.fadeAlpha > 0, runtime.enemy.fadeAlpha < 1 {
            runtime.enemy.fadeAlpha = max(0, runtime.enemy.fadeAlpha - CGFloat(dt * 2.5))
        }
        return false
    }

    static func tickTimer(runtime: inout TrainingRuntime, dt: TimeInterval) -> Bool {
        guard runtime.result == .playing else { return false }
        runtime.elapsedSec += dt
        if runtime.elapsedSec >= runtime.durationSec {
            runtime.result = .finished
            return true
        }
        return false
    }

    static func keyboardHintMidis(
        question: TrainingQuestion,
        correctIndices: [Int],
        showHints: Bool
    ) -> [Int] {
        guard showHints else { return [] }
        var out: [Int] = []
        for (index, note) in question.notes.enumerated() where note.isTarget && !correctIndices.contains(index) {
            out.append(note.midi)
        }
        return out
    }

    static func createInitialRuntime() -> TrainingRuntime {
        TrainingRuntime(
            durationSec: TrainingConstants.gameDurationSec,
            elapsedSec: 0,
            score: 0,
            result: .playing,
            enemy: TrainingRuntimeEnemy(typeIndex: 0, active: true, fadeAlpha: 1, slashUntilSec: 0),
            question: nil,
            correctTargetIndices: [],
            nextQuestionKey: nil,
            guardPoseUntilSec: 0
        )
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
