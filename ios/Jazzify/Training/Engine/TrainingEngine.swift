import Foundation

struct TrainingNoteEvaluationResult: Sendable {
    let accepted: Bool
    let completed: Bool
    let voicingCompleted: Bool
    let newCorrectIndices: [Int]
    let matchedGroupIndex: Int?
}

struct TrainingSequentialKeyboardHints: Sendable, Equatable {
    let nextMidis: [Int]
    let pendingMidis: [Int]
    let completedMidis: [Int]
}

enum TrainingEngine {
    /// 和音 / ヴォイシングの全構成音正解時のみルート音を鳴らす（入門・音程・スケールは対象外）。
    static func shouldPlayTrainingRootOnCorrect(
        kind: TrainingKind,
        playRootOnCorrect: Bool,
        completed: Bool,
        rootMidi: Int?,
        playRootOnFirstCorrect: Bool = false
    ) -> Bool {
        playRootOnCorrect
            && !playRootOnFirstCorrect
            && completed
            && rootMidi != nil
            && (kind == .chord || kind == .voicing || kind == .progression)
    }

    static func isGroupedQuestion(_ question: TrainingQuestion) -> Bool {
        question.layout == .grouped
    }

    private static func groupIndicesInOrder(_ question: TrainingQuestion) -> [Int] {
        var seen = Set<Int>()
        var out: [Int] = []
        for note in question.notes {
            let groupIndex = note.groupIndex ?? 0
            if seen.insert(groupIndex).inserted {
                out.append(groupIndex)
            }
        }
        return out
    }

    private static func indicesForGroup(_ question: TrainingQuestion, groupIndex: Int) -> [Int] {
        question.notes.enumerated().compactMap { index, note in
            note.isTarget && (note.groupIndex ?? 0) == groupIndex ? index : nil
        }
    }

    static func activeGroupIndex(_ question: TrainingQuestion, correctIndices: [Int]) -> Int? {
        guard isGroupedQuestion(question) else { return nil }
        for groupIndex in groupIndicesInOrder(question) {
            let groupTargets = indicesForGroup(question, groupIndex: groupIndex)
            if groupTargets.contains(where: { !correctIndices.contains($0) }) {
                return groupIndex
            }
        }
        return nil
    }

    static func isFirstAcceptedInGroup(
        _ question: TrainingQuestion,
        previousCorrectIndices: [Int],
        groupIndex: Int
    ) -> Bool {
        !indicesForGroup(question, groupIndex: groupIndex).contains { previousCorrectIndices.contains($0) }
    }

    static func rootMidiForGroup(_ question: TrainingQuestion, groupIndex: Int) -> Int? {
        let groupNotes = indicesForGroup(question, groupIndex: groupIndex).compactMap { question.notes[safe: $0] }
        guard let lowestMidi = groupNotes.map(\.midi).min() else { return question.rootMidi }
        guard let root = TrainingProgression.parseProgressionChordRoot(question.promptLabel) else {
            return question.rootMidi
        }
        return TrainingMusicTheory.rootMidiBelow(root: root, lowestMidi: lowestMidi)
    }

    private static func isGroupComplete(
        _ question: TrainingQuestion,
        correctIndices: [Int],
        groupIndex: Int
    ) -> Bool {
        let groupTargets = indicesForGroup(question, groupIndex: groupIndex)
        return !groupTargets.isEmpty && groupTargets.allSatisfy { correctIndices.contains($0) }
    }

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
            return TrainingNoteEvaluationResult(
                accepted: false,
                completed: true,
                voicingCompleted: false,
                newCorrectIndices: correctIndices,
                matchedGroupIndex: nil
            )
        }

        let activeGroup = activeGroupIndex(question, correctIndices: correctIndices)
        let scopedRemaining = activeGroup.map { group in
            remaining.filter { (question.notes[safe: $0]?.groupIndex ?? 0) == group }
        } ?? remaining

        if scopedRemaining.isEmpty {
            return TrainingNoteEvaluationResult(
                accepted: false,
                completed: remaining.isEmpty,
                voicingCompleted: false,
                newCorrectIndices: correctIndices,
                matchedGroupIndex: nil
            )
        }

        if question.ordered {
            guard let nextIndex = scopedRemaining.first,
                  let expected = question.notes[safe: nextIndex],
                  expected.pitchClass == pitchClass
            else {
                return TrainingNoteEvaluationResult(
                    accepted: false,
                    completed: false,
                    voicingCompleted: false,
                    newCorrectIndices: correctIndices,
                    matchedGroupIndex: nil
                )
            }
            let newCorrect = correctIndices + [nextIndex]
            let matchedGroupIndex = expected.groupIndex ?? 0
            let voicingCompleted = activeGroup != nil
                && isGroupComplete(question, correctIndices: newCorrect, groupIndex: matchedGroupIndex)
            return TrainingNoteEvaluationResult(
                accepted: true,
                completed: newCorrect.count >= targets.count,
                voicingCompleted: voicingCompleted,
                newCorrectIndices: newCorrect,
                matchedGroupIndex: matchedGroupIndex
            )
        }

        let matchIndex: Int?
        if sequential {
            let groupCorrectIndices = activeGroup.map { group in
                correctIndices.filter { (question.notes[safe: $0]?.groupIndex ?? 0) == group }
            } ?? correctIndices
            let scopedTargets = targets.filter { index in
                activeGroup == nil || (question.notes[safe: index]?.groupIndex ?? 0) == activeGroup
            }
            let targetMidis = scopedTargets.compactMap { question.notes[safe: $0]?.midi }
            let completedPcs = groupCorrectIndices.compactMap { question.notes[safe: $0]?.pitchClass }
            let nextExpectedPc = SurvivalChordResolver.nextExpectedPitchClass(
                fromMidis: targetMidis,
                inputPitchClasses: completedPcs
            )
            if nextExpectedPc != pitchClass {
                return TrainingNoteEvaluationResult(
                    accepted: false,
                    completed: false,
                    voicingCompleted: false,
                    newCorrectIndices: correctIndices,
                    matchedGroupIndex: nil
                )
            }
            matchIndex = scopedRemaining.first { index in
                question.notes[safe: index]?.pitchClass == pitchClass && !correctIndices.contains(index)
            }
        } else {
            matchIndex = scopedRemaining.first { index in
                question.notes[safe: index]?.pitchClass == pitchClass && !correctIndices.contains(index)
            }
        }

        guard let matchIndex else {
            return TrainingNoteEvaluationResult(
                accepted: false,
                completed: false,
                voicingCompleted: false,
                newCorrectIndices: correctIndices,
                matchedGroupIndex: nil
            )
        }

        let newCorrect = correctIndices + [matchIndex]
        let matchedGroupIndex = question.notes[safe: matchIndex]?.groupIndex ?? 0
        let voicingCompleted = activeGroup != nil
            && isGroupComplete(question, correctIndices: newCorrect, groupIndex: matchedGroupIndex)
        return TrainingNoteEvaluationResult(
            accepted: true,
            completed: newCorrect.count >= targets.count,
            voicingCompleted: voicingCompleted,
            newCorrectIndices: newCorrect,
            matchedGroupIndex: matchedGroupIndex
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
        let activeGroup = activeGroupIndex(question, correctIndices: correctIndices)
        var out: [Int] = []
        for (index, note) in question.notes.enumerated() where note.isTarget && !correctIndices.contains(index) {
            if let activeGroup, (note.groupIndex ?? 0) != activeGroup { continue }
            out.append(note.midi)
        }
        return out
    }

    static func shouldUseSequentialKeyboardHints(
        question: TrainingQuestion,
        kind: TrainingKind,
        voiceSequential: Bool
    ) -> Bool {
        kind != .interval && (question.ordered || voiceSequential)
    }

    static func sequentialKeyboardHints(
        question: TrainingQuestion,
        correctIndices: [Int],
        voiceSequential: Bool
    ) -> TrainingSequentialKeyboardHints? {
        guard question.ordered || voiceSequential else { return nil }

        let activeGroup = activeGroupIndex(question, correctIndices: correctIndices)
        let targets = targetIndices(question: question).filter { index in
            activeGroup == nil || (question.notes[safe: index]?.groupIndex ?? 0) == activeGroup
        }
        let remaining = targets.filter { !correctIndices.contains($0) }
        let completedMidis = correctIndices.compactMap { question.notes[safe: $0]?.midi }

        if question.ordered {
            var nextMidis: [Int] = []
            var pendingMidis: [Int] = []
            for (offset, index) in remaining.enumerated() {
                guard let midi = question.notes[safe: index]?.midi else { continue }
                if offset == 0 {
                    nextMidis.append(midi)
                } else {
                    pendingMidis.append(midi)
                }
            }
            return TrainingSequentialKeyboardHints(
                nextMidis: nextMidis,
                pendingMidis: pendingMidis,
                completedMidis: completedMidis
            )
        }

        let targetMidis = targets.compactMap { question.notes[safe: $0]?.midi }
        let completedPcs = correctIndices
            .filter { activeGroup == nil || (question.notes[safe: $0]?.groupIndex ?? 0) == activeGroup }
            .compactMap { question.notes[safe: $0]?.pitchClass }
        let orderedPcs = SurvivalChordResolver.orderedPitchClasses(fromMidis: targetMidis)
        let nextPc = SurvivalChordResolver.nextExpectedPitchClass(
            fromMidis: targetMidis,
            inputPitchClasses: completedPcs
        )
        var nextMidis: [Int] = []
        var pendingMidis: [Int] = []
        var completed = Set(completedMidis)
        let completedPcSet = Set(completedPcs)
        for midi in targetMidis.sorted() {
            let pc = TrainingMusicTheory.normalizePitchClass(midi)
            if completedPcSet.contains(pc) {
                completed.insert(midi)
            } else if pc == nextPc {
                nextMidis.append(midi)
            } else if orderedPcs.contains(pc) {
                pendingMidis.append(midi)
            }
        }
        return TrainingSequentialKeyboardHints(
            nextMidis: nextMidis,
            pendingMidis: pendingMidis,
            completedMidis: Array(completed)
        )
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
