import Foundation

/// Web `compositePhraseEngine.ts` の Swift 移植（耳コピソースは UUID）。全候補 KMP 並列判定。
enum EarTrainingCompositePhraseNoteResult: Equatable {
    case progress
    case resync
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
    let quoteText: String?
    let measureNumber: Int
    let notes: [EarTrainingCompositePhraseChordNote]

    init(
        id: UUID,
        orderIndex: Int,
        chordName: String,
        quoteText: String? = nil,
        measureNumber: Int,
        notes: [EarTrainingCompositePhraseChordNote]
    ) {
        self.id = id
        self.orderIndex = orderIndex
        self.chordName = chordName
        self.quoteText = quoteText
        self.measureNumber = measureNumber
        self.notes = notes
    }
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
    var primarySourcePhraseId: UUID?
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
            primarySourcePhraseId: nil,
            lastCompletedSourcePhraseId: nil
        )
    }

    static func evaluateNoteOn(
        state: EarTrainingCompositePhraseRuntimeState,
        pitchClass rawPc: Int
    ) -> (result: EarTrainingCompositePhraseNoteResult, nextState: EarTrainingCompositePhraseRuntimeState) {
        let pc = PhraseStreamMatching.normalizedPitchClass(rawPc)

        var candidateById: [UUID: EarTrainingCompositePhraseCandidateState] = [:]
        for c in state.candidates {
            candidateById[c.sourcePhraseId] = c
        }

        let steps = state.sourcePhrases.map { phrase in
            let current = candidateById[phrase.sourcePhraseId] ?? candidateFromPhrase(phrase)
            return applyStreamingCandidateStep(candidate: current, pitchClass: pc)
        }

        let completed = steps.filter { $0.result == .phraseComplete }
        if !completed.isEmpty {
            let preferred = state.primarySourcePhraseId.flatMap { primary in
                completed.first(where: { $0.candidate.sourcePhraseId == primary })
            }
            let finished = preferred ?? completed[0]
            var st = state
            st.lastCompletedSourcePhraseId = finished.candidate.sourcePhraseId
            st.candidates = steps.map(\.candidate)
            return (.phraseComplete, resetAllCandidates(st, preserveLastCompleted: true))
        }

        let accepted = steps.filter { $0.accepted && $0.matchedLength > 0 }
        if accepted.isEmpty {
            var st = state
            st.candidates = steps.map(\.candidate)
            return (.miss, resetAllCandidates(st, preserveLastCompleted: true))
        }

        let bestMatchedLength = accepted.map(\.matchedLength).max() ?? 0
        let nextPrimary = resolvePrimarySourcePhraseId(
            state: state,
            steps: steps,
            bestMatchedLength: bestMatchedLength
        )

        let selectedStep: CandidateStep? = {
            if let primary = nextPrimary {
                return steps.first(where: { $0.candidate.sourcePhraseId == primary })
            }
            return accepted.first(where: { $0.matchedLength == bestMatchedLength })
        }()

        let primaryResync = selectedStep?.resync == true
        let result = resolveAggregateResult(selectedStep: selectedStep, primaryResync: primaryResync)

        var next = state
        next.candidates = steps.map(\.candidate)
        next.primarySourcePhraseId = nextPrimary
        return (result, next)
    }

    static func selectionGreenPrefixLength(state: EarTrainingCompositePhraseRuntimeState) -> Int {
        if state.primarySourcePhraseId != nil { return 0 }

        let candidates = compositeSelectionCandidates(state: state)
        guard !candidates.isEmpty else { return 0 }

        let chordLens = candidates.map { c in
            chord(at: c.chordIndex, phrase: c.phrase)?.notes.count ?? 0
        }
        guard let maxSafe = chordLens.min(), maxSafe > 0 else { return 0 }

        var p = 0
        while p < maxSafe {
            var baseline: Int?
            for c in candidates {
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

        if let primary = state.primarySourcePhraseId {
            guard let c = state.candidates.first(where: { $0.sourcePhraseId == primary }) else {
                return EarTrainingCompositePhraseStaffChordView(chord: nil, correctNoteIndices: [])
            }
            return EarTrainingCompositePhraseStaffChordView(
                chord: chord(at: c.chordIndex, phrase: c.phrase),
                correctNoteIndices: c.revealedNoteIndices
            )
        }

        guard let display = getDisplayCandidate(state: state) else {
            return EarTrainingCompositePhraseStaffChordView(chord: nil, correctNoteIndices: [])
        }

        let len = selectionGreenPrefixLength(state: state)
        return EarTrainingCompositePhraseStaffChordView(
            chord: chord(at: display.chordIndex, phrase: display.phrase),
            correctNoteIndices: PhraseStreamMatching.prefixIndexSet(len)
        )
    }

    // MARK: - Internal

    private struct CandidateStep {
        let candidate: EarTrainingCompositePhraseCandidateState
        let result: EarTrainingCompositePhraseNoteResult
        let accepted: Bool
        let matchedLength: Int
        let beforeMatchedLength: Int
        let resync: Bool
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

    private static func candidateWithMatchedLength(
        _ c: EarTrainingCompositePhraseCandidateState,
        matchedLength: Int
    ) -> EarTrainingCompositePhraseCandidateState {
        let coord = PhraseStreamMatching.coordinateFromEarTrainingMatchedLength(
            chords: c.phrase.chords,
            matchedLength: matchedLength
        )
        let correct = PhraseStreamMatching.prefixIndexSet(coord.targetNoteIndex)
        var next = c
        next.chordIndex = coord.chordIndex
        next.targetNoteIndex = coord.targetNoteIndex
        next.correctNoteIndices = correct
        next.revealedNoteIndices = correct
        return next
    }

    private static func applyStreamingCandidateStep(
        candidate c: EarTrainingCompositePhraseCandidateState,
        pitchClass pc: Int
    ) -> CandidateStep {
        let cache = PhraseStreamMatching.getEarTrainingCompositePatternCache(chords: c.phrase.chords)
        let pattern = cache.pattern

        if pattern.isEmpty {
            return CandidateStep(
                candidate: candidateFromPhrase(c.phrase),
                result: .miss,
                accepted: false,
                matchedLength: 0,
                beforeMatchedLength: 0,
                resync: false
            )
        }

        let beforeMatchedLength = PhraseStreamMatching.matchedLengthFromEarTrainingCoordinates(
            chords: c.phrase.chords,
            chordIndex: c.chordIndex,
            targetNoteIndex: c.targetNoteIndex
        )
        let advance = PhraseStreamMatching.advanceSequential(
            pattern: cache.pattern,
            matchedLength: beforeMatchedLength,
            pitchClass: pc
        )
        let nextMatchedLength = advance.matchedLength

        if nextMatchedLength == 0 {
            return CandidateStep(
                candidate: candidateFromPhrase(c.phrase),
                result: .miss,
                accepted: false,
                matchedLength: 0,
                beforeMatchedLength: beforeMatchedLength,
                resync: false
            )
        }

        let nextCandidate = candidateWithMatchedLength(c, matchedLength: nextMatchedLength)

        if nextMatchedLength >= pattern.count {
            return CandidateStep(
                candidate: nextCandidate,
                result: .phraseComplete,
                accepted: true,
                matchedLength: nextMatchedLength,
                beforeMatchedLength: beforeMatchedLength,
                resync: false
            )
        }

        if PhraseStreamMatching.isEarTrainingNonFinalMeasureBoundary(
            chords: c.phrase.chords,
            matchedLength: nextMatchedLength
        ) {
            return CandidateStep(
                candidate: nextCandidate,
                result: .measureComplete,
                accepted: true,
                matchedLength: nextMatchedLength,
                beforeMatchedLength: beforeMatchedLength,
                resync: false
            )
        }

        return CandidateStep(
            candidate: nextCandidate,
            result: .progress,
            accepted: true,
            matchedLength: nextMatchedLength,
            beforeMatchedLength: beforeMatchedLength,
            resync: advance.resync
        )
    }

    private static func compositeSelectionCandidates(
        state: EarTrainingCompositePhraseRuntimeState
    ) -> [EarTrainingCompositePhraseCandidateState] {
        if let primary = state.primarySourcePhraseId {
            if let c = state.candidates.first(where: { $0.sourcePhraseId == primary }) {
                return [c]
            }
            return []
        }

        guard !state.candidates.isEmpty else { return [] }

        var best = 0
        for c in state.candidates {
            best = max(
                best,
                PhraseStreamMatching.matchedLengthFromEarTrainingCoordinates(
                    chords: c.phrase.chords,
                    chordIndex: c.chordIndex,
                    targetNoteIndex: c.targetNoteIndex
                )
            )
        }

        if best <= 0 {
            return state.candidates
        }

        return state.candidates.filter { c in
            PhraseStreamMatching.matchedLengthFromEarTrainingCoordinates(
                chords: c.phrase.chords,
                chordIndex: c.chordIndex,
                targetNoteIndex: c.targetNoteIndex
            ) == best
        }
    }

    private static func getDisplayCandidate(
        state: EarTrainingCompositePhraseRuntimeState
    ) -> EarTrainingCompositePhraseCandidateState? {
        compositeSelectionCandidates(state: state).first
    }

    private static func resolvePrimarySourcePhraseId(
        state: EarTrainingCompositePhraseRuntimeState,
        steps: [CandidateStep],
        bestMatchedLength: Int
    ) -> UUID? {
        let best = steps.filter { $0.accepted && $0.matchedLength == bestMatchedLength }

        if let previousPrimary = state.primarySourcePhraseId,
           let previousStep = steps.first(where: { $0.candidate.sourcePhraseId == previousPrimary }),
           previousStep.accepted,
           previousStep.matchedLength == bestMatchedLength {
            return previousPrimary
        }

        if best.count == 1 {
            return best[0].candidate.sourcePhraseId
        }

        return nil
    }

    private static func resolveAggregateResult(
        selectedStep: CandidateStep?,
        primaryResync: Bool
    ) -> EarTrainingCompositePhraseNoteResult {
        if primaryResync {
            return .resync
        }
        if selectedStep?.result == .measureComplete {
            return .measureComplete
        }
        return .progress
    }

    private static func resetAllCandidates(
        _ state: EarTrainingCompositePhraseRuntimeState,
        preserveLastCompleted: Bool
    ) -> EarTrainingCompositePhraseRuntimeState {
        var next = state
        next.candidates = state.sourcePhrases.map(candidateFromPhrase)
        next.primarySourcePhraseId = nil
        if !preserveLastCompleted {
            next.lastCompletedSourcePhraseId = nil
        }
        return next
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
