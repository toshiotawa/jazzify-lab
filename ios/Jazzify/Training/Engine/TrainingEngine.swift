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
        runtime.dyingEnemy.active = true
        runtime.dyingEnemy.typeIndex = runtime.enemy.typeIndex
        runtime.dyingEnemy.alpha = 1
        runtime.dyingEnemy.offsetX = 0
        runtime.dyingEnemy.slashUntilSec = nowSec + DefenseEnemyConfig.slashSec

        runtime.enemy.slashUntilSec = 0
        runtime.enemy.typeIndex = (runtime.enemy.typeIndex + 1) % TrainingConstants.enemyCount
        runtime.enemy.fadeAlpha = 1

        if guardPoseSec > 0 {
            runtime.guardPoseUntilSec = nowSec + guardPoseSec
        }
    }

    /// Slash / fade の視覚更新のみ。次問スポーンは正解時に同期で行う。
    static func tickEnemy(runtime: inout TrainingRuntime, nowSec: TimeInterval, dt: TimeInterval) {
        if runtime.dyingEnemy.active {
            runtime.dyingEnemy.alpha = max(0, runtime.dyingEnemy.alpha - CGFloat(dt) * TrainingConstants.dyingFadeSpeed)
            runtime.dyingEnemy.offsetX += CGFloat(dt) * TrainingConstants.dyingKnockbackPxPerSec
            if runtime.dyingEnemy.alpha <= 0 {
                runtime.dyingEnemy.active = false
                runtime.dyingEnemy.slashUntilSec = 0
            }
        }
        if runtime.dyingEnemy.slashUntilSec > 0, nowSec >= runtime.dyingEnemy.slashUntilSec {
            runtime.dyingEnemy.slashUntilSec = 0
        }
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

    /// 音程の基準音など、入力対象外の鍵盤ハイライト（練習・本番とも表示）
    static func keyboardReferenceMidis(question: TrainingQuestion) -> [Int] {
        question.notes.compactMap { note in
            note.isTarget ? nil : note.midi
        }
    }

    static func staffDisplayNotes(
        question: TrainingQuestion,
        practiceMode: Bool,
        kind: TrainingKind
    ) -> [TrainingQuestionNote] {
        if kind == .interval, !practiceMode {
            return question.notes.filter { !$0.isTarget }
        }
        return question.notes
    }

    static func staffHintedPitchClasses(
        question: TrainingQuestion,
        correctIndices: [Int],
        practiceMode: Bool,
        kind: TrainingKind
    ) -> [Int] {
        var out: [Int] = []
        var seen = Set<Int>()
        let push: (Int) -> Void = { pitchClass in
            if seen.insert(pitchClass).inserted {
                out.append(pitchClass)
            }
        }
        for index in correctIndices {
            if let pitchClass = question.notes[safe: index]?.pitchClass {
                push(pitchClass)
            }
        }
        if kind == .interval, practiceMode {
            for note in question.notes where note.isTarget {
                push(note.pitchClass)
            }
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
            dyingEnemy: TrainingRuntimeDyingEnemy(
                active: false,
                typeIndex: 0,
                alpha: 0,
                slashUntilSec: 0,
                offsetX: 0
            ),
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
