import Foundation

/// Web `compositePhraseEngine.ts` の Swift 移植（耳コピソースは UUID）。並列候補フィルタ → 単一フレーズロック（コードループなし）。
enum EarTrainingCompositePhraseNoteResult: Equatable {
    case progress
    case measureComplete
    case phraseComplete
    case miss
}

struct EarTrainingCompositePhraseChordNote: Equatable, Sendable {
    let pitchClass: Int
    let noteName: String
    let staff: Int
}

struct EarTrainingCompositePhraseChord: Equatable, Sendable {
    let id: UUID
    let orderIndex: Int
    let chordName: String
    let measureNumber: Int
    let notes: [EarTrainingCompositePhraseChordNote]
}

struct EarTrainingCompositePhraseDefinition: Equatable, Sendable {
    let id: UUID
    let sourcePhraseId: UUID
    let title: String
    let chords: [EarTrainingCompositePhraseChord]
}

struct EarTrainingCompositePhraseBootstrap: Equatable, Sendable {
    let bgmUrl: String
    let keyFifths: Int
    let sourcePhraseIds: [UUID]
    let definitions: [EarTrainingCompositePhraseDefinition]
}

struct EarTrainingCompositePhraseCandidateState: Equatable {
    let sourcePhraseId: UUID
    let phrase: EarTrainingCompositePhraseDefinition
    var chordIndex: Int
    var targetNoteIndex: Int
    var correctNoteIndices: Set<Int>
    var revealedNoteIndices: Set<Int>
}

struct EarTrainingCompositePhraseRuntimeState: Equatable {
    let sourcePhrases: [EarTrainingCompositePhraseDefinition]
    var candidates: [EarTrainingCompositePhraseCandidateState]
    var lockedSourcePhraseId: UUID?
    /// 直近フレーズ完成のソース phrase id（同一フレーズ再完成の弱化用）。
    var lastCompletedSourcePhraseId: UUID?
}

struct EarTrainingCompositePhraseStaffChordView: Equatable {
    let chord: EarTrainingCompositePhraseChord?
    let correctNoteIndices: Set<Int>
}

enum EarTrainingCompositePhraseEngine {
    static func createInitialState(sourcePhrases: [EarTrainingCompositePhraseDefinition]) -> EarTrainingCompositePhraseRuntimeState {
        EarTrainingCompositePhraseRuntimeState(
            sourcePhrases: sourcePhrases,
            candidates: sourcePhrases.map(candidateFromPhrase),
            lockedSourcePhraseId: nil,
            lastCompletedSourcePhraseId: nil
        )
    }

    static func evaluateNoteOn(
        state: EarTrainingCompositePhraseRuntimeState,
        pitchClass rawPc: Int
    ) -> (result: EarTrainingCompositePhraseNoteResult, nextState: EarTrainingCompositePhraseRuntimeState) {
        let pc = normalizedPitchClass(rawPc)

        if let locked = state.lockedSourcePhraseId {
            guard let idx = state.candidates.firstIndex(where: { $0.sourcePhraseId == locked }) else {
                return (.miss, resetAllCandidates(state, preserveLastCompleted: true))
            }
            let cur = state.candidates[idx]
            let stepped = applyKnownGoodStep(candidate: cur, pitchClass: pc)
            switch stepped.result {
            case .miss:
                return (.miss, resetAllCandidates(state, preserveLastCompleted: true))
            case .phraseComplete:
                let finished = stepped.candidate.sourcePhraseId
                var st = state
                st.lastCompletedSourcePhraseId = finished
                return (.phraseComplete, resetAllCandidates(st, preserveLastCompleted: true))
            case .progress, .measureComplete:
                var next = state
                next.candidates[idx] = stepped.candidate
                next.lockedSourcePhraseId = stepped.candidate.sourcePhraseId
                return (stepped.result, next)
            }
        }

        let matchIdx = selectionMatchingIndices(state: state, pitchClass: pc)
        if matchIdx.isEmpty {
            return (.miss, resetAllCandidates(state, preserveLastCompleted: true))
        }

        var advanced: [EarTrainingCompositePhraseCandidateState] = []
        var aggResult: EarTrainingCompositePhraseNoteResult = .progress

        for i in matchIdx {
            let stepped = applyKnownGoodStep(candidate: state.candidates[i], pitchClass: pc)
            if stepped.result == .miss {
                return (.miss, resetAllCandidates(state, preserveLastCompleted: true))
            }
            if stepped.result == .phraseComplete {
                let finished = stepped.candidate.sourcePhraseId
                var st = state
                st.lastCompletedSourcePhraseId = finished
                return (.phraseComplete, resetAllCandidates(st, preserveLastCompleted: true))
            }
            advanced.append(stepped.candidate)
            aggResult = stepped.result
        }

        let lock: UUID? = advanced.count == 1 ? advanced[0].sourcePhraseId : nil
        var next = state
        next.candidates = advanced
        next.lockedSourcePhraseId = lock
        return (aggResult, next)
    }

    /// 選択モード時: 先頭共通の revealed で同一 pitch class 連続長。
    static func selectionGreenPrefixLength(state: EarTrainingCompositePhraseRuntimeState) -> Int {
        if state.lockedSourcePhraseId != nil { return 0 }
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

    static func staffChordView(state: EarTrainingCompositePhraseRuntimeState) -> EarTrainingCompositePhraseStaffChordView {
        guard !state.candidates.isEmpty else {
            return EarTrainingCompositePhraseStaffChordView(chord: nil, correctNoteIndices: [])
        }
        if let locked = state.lockedSourcePhraseId {
            guard let c = state.candidates.first(where: { $0.sourcePhraseId == locked }) else {
                return EarTrainingCompositePhraseStaffChordView(chord: nil, correctNoteIndices: [])
            }
            return EarTrainingCompositePhraseStaffChordView(
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
        return EarTrainingCompositePhraseStaffChordView(chord: chord0, correctNoteIndices: correct)
    }

    // MARK: - Internal

    private static func normalizedPitchClass(_ pc: Int) -> Int {
        ((pc % 12) + 12) % 12
    }

    private static func candidateFromPhrase(_ phrase: EarTrainingCompositePhraseDefinition) -> EarTrainingCompositePhraseCandidateState {
        EarTrainingCompositePhraseCandidateState(
            sourcePhraseId: phrase.sourcePhraseId,
            phrase: phrase,
            chordIndex: 0,
            targetNoteIndex: 0,
            correctNoteIndices: [],
            revealedNoteIndices: []
        )
    }

    private static func chord(at index: Int, phrase: EarTrainingCompositePhraseDefinition) -> EarTrainingCompositePhraseChord? {
        phrase.chords[safe: index]
    }

    private static func getTargetNote(_ c: EarTrainingCompositePhraseCandidateState) -> EarTrainingCompositePhraseChordNote? {
        guard let ch = chord(at: c.chordIndex, phrase: c.phrase) else { return nil }
        return ch.notes[safe: c.targetNoteIndex]
    }

    private static func isChordComplete(_ chord: EarTrainingCompositePhraseChord, correct: Set<Int>) -> Bool {
        !chord.notes.isEmpty && correct.count >= chord.notes.count
    }

    private static func isLastChord(_ c: EarTrainingCompositePhraseCandidateState) -> Bool {
        c.chordIndex >= c.phrase.chords.count - 1
    }

    private static func resetChordFields(_ c: EarTrainingCompositePhraseCandidateState) -> EarTrainingCompositePhraseCandidateState {
        var n = c
        n.targetNoteIndex = 0
        n.correctNoteIndices = []
        n.revealedNoteIndices = []
        return n
    }

    private static func advanceToNextChord(_ c: EarTrainingCompositePhraseCandidateState) -> EarTrainingCompositePhraseCandidateState {
        var n = c
        n.chordIndex += 1
        n.targetNoteIndex = 0
        n.correctNoteIndices = []
        n.revealedNoteIndices = []
        return n
    }

    private struct Stepped {
        let candidate: EarTrainingCompositePhraseCandidateState
        let result: EarTrainingCompositePhraseNoteResult
    }

    private static func applyKnownGoodStep(
        candidate c: EarTrainingCompositePhraseCandidateState,
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
        _ state: EarTrainingCompositePhraseRuntimeState,
        preserveLastCompleted: Bool
    ) -> EarTrainingCompositePhraseRuntimeState {
        var next = state
        next.candidates = state.sourcePhrases.map(candidateFromPhrase)
        next.lockedSourcePhraseId = nil
        if !preserveLastCompleted {
            next.lastCompletedSourcePhraseId = nil
        }
        return next
    }

    private static func selectionMatchingIndices(state: EarTrainingCompositePhraseRuntimeState, pitchClass pc: Int) -> [Int] {
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
