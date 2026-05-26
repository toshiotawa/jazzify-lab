import Foundation

/// Web `SurvivalCompositePhraseEngine.ts` の Swift 移植。並列候補フィルタ → 単一フレーズロック（コードループなし）。
enum SurvivalCompositePhraseNoteResult: Equatable {
    case progress
    case measureComplete
    case phraseComplete
    case miss
}

struct SurvivalCompositePhraseCandidateState: Equatable {
    let sourceStageNumber: Int
    let phrase: SurvivalPhraseDefinition
    var chordIndex: Int
    var targetNoteIndex: Int
    var correctNoteIndices: Set<Int>
    var revealedNoteIndices: Set<Int>
}

struct SurvivalCompositePhraseRuntimeState: Equatable {
    let sourcePhrases: [SurvivalPhraseDefinition]
    var candidates: [SurvivalCompositePhraseCandidateState]
    var lockedSourceStageNumber: Int?
    /// 直近でフレーズ完成したソースステージ番号（重複完成ダメージ用）。
    var lastCompletedSourceStageNumber: Int?
}

struct SurvivalCompositePhraseStaffChordView: Equatable {
    let chord: SurvivalPhraseChord?
    let correctNoteIndices: Set<Int>
}

enum SurvivalCompositePhraseEngine {
    static func createInitialState(sourcePhrases: [SurvivalPhraseDefinition]) -> SurvivalCompositePhraseRuntimeState {
        SurvivalCompositePhraseRuntimeState(
            sourcePhrases: sourcePhrases,
            candidates: sourcePhrases.map(candidateFromPhrase),
            lockedSourceStageNumber: nil,
            lastCompletedSourceStageNumber: nil
        )
    }

    static func evaluateNoteOn(
        state: SurvivalCompositePhraseRuntimeState,
        pitchClass rawPc: Int
    ) -> (result: SurvivalCompositePhraseNoteResult, nextState: SurvivalCompositePhraseRuntimeState) {
        let pc = normalizedPitchClass(rawPc)

        if let locked = state.lockedSourceStageNumber {
            guard let idx = state.candidates.firstIndex(where: { $0.sourceStageNumber == locked }) else {
                return (.miss, resetAllCandidates(state, preserveLastCompleted: true))
            }
            let cur = state.candidates[idx]
            let stepped = applyKnownGoodStep(candidate: cur, pitchClass: pc)
            switch stepped.result {
            case .miss:
                return (.miss, resetAllCandidates(state, preserveLastCompleted: true))
            case .phraseComplete:
                let finished = stepped.candidate.sourceStageNumber
                var st = state
                st.lastCompletedSourceStageNumber = finished
                return (.phraseComplete, resetAllCandidates(st, preserveLastCompleted: true))
            case .progress, .measureComplete:
                var next = state
                next.candidates[idx] = stepped.candidate
                next.lockedSourceStageNumber = stepped.candidate.sourceStageNumber
                return (stepped.result, next)
            }
        }

        let matchIdx = selectionMatchingIndices(state: state, pitchClass: pc)
        if matchIdx.isEmpty {
            return (.miss, resetAllCandidates(state, preserveLastCompleted: true))
        }

        var advanced: [SurvivalCompositePhraseCandidateState] = []
        var aggResult: SurvivalCompositePhraseNoteResult = .progress

        for i in matchIdx {
            let stepped = applyKnownGoodStep(candidate: state.candidates[i], pitchClass: pc)
            if stepped.result == .miss {
                return (.miss, resetAllCandidates(state, preserveLastCompleted: true))
            }
            if stepped.result == .phraseComplete {
                let finished = stepped.candidate.sourceStageNumber
                var st = state
                st.lastCompletedSourceStageNumber = finished
                return (.phraseComplete, resetAllCandidates(st, preserveLastCompleted: true))
            }
            advanced.append(stepped.candidate)
            aggResult = stepped.result
        }

        let lock: Int? = advanced.count == 1 ? advanced[0].sourceStageNumber : nil
        var next = state
        for u in advanced {
            if let j = next.candidates.firstIndex(where: { $0.sourceStageNumber == u.sourceStageNumber }) {
                next.candidates[j] = u
            }
        }
        next.lockedSourceStageNumber = lock
        return (aggResult, next)
    }

    /// 選択モード時: 全候補で revealed 済みかつ同一 pitch class の先頭共通長。
    static func selectionGreenPrefixLength(state: SurvivalCompositePhraseRuntimeState) -> Int {
        if state.lockedSourceStageNumber != nil { return 0 }
        guard !state.candidates.isEmpty else { return 0 }
        let chordLens = state.candidates.map { c in chord(at: c.chordIndex, phrase: c.phrase)?.notes.count ?? 0 }
        guard let maxSafe = chordLens.min(), maxSafe > 0 else { return 0 }

        var p = 0
        while p < maxSafe {
            var baseline: Int?
            for c in state.candidates {
                guard let ch = chord(at: c.chordIndex, phrase: c.phrase),
                      let noteAt = ch.notes[safe: p],
                      c.revealedNoteIndices.contains(p)
                else {
                    return p
                }
                if let b = baseline, b != noteAt.pitchClass {
                    return p
                }
                if baseline == nil {
                    baseline = noteAt.pitchClass
                }
            }
            p += 1
        }
        return p
    }

    static func staffChordView(state: SurvivalCompositePhraseRuntimeState) -> SurvivalCompositePhraseStaffChordView {
        guard !state.candidates.isEmpty else {
            return SurvivalCompositePhraseStaffChordView(chord: nil, correctNoteIndices: [])
        }
        if let locked = state.lockedSourceStageNumber {
            guard let c = state.candidates.first(where: { $0.sourceStageNumber == locked }) else {
                return SurvivalCompositePhraseStaffChordView(chord: nil, correctNoteIndices: [])
            }
            return SurvivalCompositePhraseStaffChordView(
                chord: chord(at: c.chordIndex, phrase: c.phrase),
                correctNoteIndices: c.revealedNoteIndices
            )
        }

        let template = state.candidates[0]
        let chord0 = chord(at: template.chordIndex, phrase: template.phrase)
        let len = selectionGreenPrefixLength(state: state)
        var correct = Set<Int>()
        for i in 0..<len {
            correct.insert(i)
        }
        return SurvivalCompositePhraseStaffChordView(chord: chord0, correctNoteIndices: correct)
    }

    // MARK: - Internal

    private static func normalizedPitchClass(_ pc: Int) -> Int {
        ((pc % 12) + 12) % 12
    }

    private static func candidateFromPhrase(_ phrase: SurvivalPhraseDefinition) -> SurvivalCompositePhraseCandidateState {
        SurvivalCompositePhraseCandidateState(
            sourceStageNumber: phrase.stageNumber,
            phrase: phrase,
            chordIndex: 0,
            targetNoteIndex: 0,
            correctNoteIndices: [],
            revealedNoteIndices: []
        )
    }

    private static func chord(at index: Int, phrase: SurvivalPhraseDefinition) -> SurvivalPhraseChord? {
        phrase.chords[safe: index]
    }

    private static func getTargetNote(_ c: SurvivalCompositePhraseCandidateState) -> SurvivalPhraseChordNote? {
        guard let ch = chord(at: c.chordIndex, phrase: c.phrase) else { return nil }
        return ch.notes[safe: c.targetNoteIndex]
    }

    private static func isChordComplete(_ chord: SurvivalPhraseChord, correct: Set<Int>) -> Bool {
        !chord.notes.isEmpty && correct.count >= chord.notes.count
    }

    private static func isLastChord(_ c: SurvivalCompositePhraseCandidateState) -> Bool {
        c.chordIndex >= c.phrase.chords.count - 1
    }

    private static func resetChordFields(_ c: SurvivalCompositePhraseCandidateState) -> SurvivalCompositePhraseCandidateState {
        var n = c
        n.targetNoteIndex = 0
        n.correctNoteIndices = []
        n.revealedNoteIndices = []
        return n
    }

    private static func advanceToNextChord(_ c: SurvivalCompositePhraseCandidateState) -> SurvivalCompositePhraseCandidateState {
        var n = c
        n.chordIndex += 1
        n.targetNoteIndex = 0
        n.correctNoteIndices = []
        n.revealedNoteIndices = []
        return n
    }

    private struct Stepped {
        let candidate: SurvivalCompositePhraseCandidateState
        let result: SurvivalCompositePhraseNoteResult
    }

    private static func applyKnownGoodStep(
        candidate c: SurvivalCompositePhraseCandidateState,
        pitchClass pc: Int
    ) -> Stepped {
        guard let chord = chord(at: c.chordIndex, phrase: c.phrase),
              let target = getTargetNote(c)
        else {
            return Stepped(candidate: c, result: .miss)
        }
        let allowed = Set(chord.notes.map(\.pitchClass))
        if !allowed.contains(pc) || pc != target.pitchClass {
            return Stepped(candidate: resetChordFields(c), result: .miss)
        }

        var nextCorrect = c.correctNoteIndices
        nextCorrect.insert(c.targetNoteIndex)
        var nextRevealed = c.revealedNoteIndices
        nextRevealed.insert(c.targetNoteIndex)

        if isChordComplete(chord, correct: nextCorrect) {
            if isLastChord(c) {
                var done = c
                done.correctNoteIndices = nextCorrect
                done.revealedNoteIndices = nextRevealed
                return Stepped(candidate: done, result: .phraseComplete)
            }
            var advanced = c
            advanced.correctNoteIndices = nextCorrect
            advanced.revealedNoteIndices = nextRevealed
            return Stepped(candidate: advanceToNextChord(advanced), result: .measureComplete)
        }

        var prog = c
        prog.targetNoteIndex += 1
        prog.correctNoteIndices = nextCorrect
        prog.revealedNoteIndices = nextRevealed
        return Stepped(candidate: prog, result: .progress)
    }

    private static func resetAllCandidates(
        _ state: SurvivalCompositePhraseRuntimeState,
        preserveLastCompleted: Bool
    ) -> SurvivalCompositePhraseRuntimeState {
        var next = state
        next.candidates = state.sourcePhrases.map(candidateFromPhrase)
        next.lockedSourceStageNumber = nil
        if !preserveLastCompleted {
            next.lastCompletedSourceStageNumber = nil
        }
        return next
    }

    private static func selectionMatchingIndices(state: SurvivalCompositePhraseRuntimeState, pitchClass pc: Int) -> [Int] {
        var out: [Int] = []
        for i in state.candidates.indices {
            if let n = getTargetNote(state.candidates[i]), n.pitchClass == pc {
                out.append(i)
            }
        }
        return out
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
