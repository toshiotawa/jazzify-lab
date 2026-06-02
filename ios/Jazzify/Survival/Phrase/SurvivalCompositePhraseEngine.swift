import Foundation

/// Web `compositePhraseEngine.ts` の Swift 移植。全候補 KMP 並列判定（コードループなし）。
enum SurvivalCompositePhraseNoteResult: Equatable {
    case progress
    case resync
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
    var primarySourceStageNumber: Int?
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
            primarySourceStageNumber: nil,
            lastCompletedSourceStageNumber: nil
        )
    }

    static func evaluateNoteOn(
        state: SurvivalCompositePhraseRuntimeState,
        pitchClass rawPc: Int
    ) -> (result: SurvivalCompositePhraseNoteResult, nextState: SurvivalCompositePhraseRuntimeState) {
        let pc = PhraseStreamMatching.normalizedPitchClass(rawPc)

        var candidateByStage: [Int: SurvivalCompositePhraseCandidateState] = [:]
        for c in state.candidates {
            candidateByStage[c.sourceStageNumber] = c
        }

        let steps = state.sourcePhrases.map { phrase in
            let current = candidateByStage[phrase.stageNumber] ?? candidateFromPhrase(phrase)
            return applyStreamingCandidateStep(candidate: current, pitchClass: pc)
        }

        let completed = steps.filter { $0.result == .phraseComplete }
        if !completed.isEmpty {
            let preferred = state.primarySourceStageNumber.flatMap { primary in
                completed.first(where: { $0.candidate.sourceStageNumber == primary })
            }
            let finished = preferred ?? completed[0]
            var st = state
            st.lastCompletedSourceStageNumber = finished.candidate.sourceStageNumber
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
        let nextPrimary = resolvePrimaryStageNumber(
            state: state,
            steps: steps,
            bestMatchedLength: bestMatchedLength
        )

        let selectedStep: CandidateStep? = {
            if let primary = nextPrimary {
                return steps.first(where: { $0.candidate.sourceStageNumber == primary })
            }
            return accepted.first(where: { $0.matchedLength == bestMatchedLength })
        }()

        let primaryResync =
            selectedStep.map { $0.matchedLength < $0.beforeMatchedLength } ?? false
        let result = resolveAggregateResult(selectedStep: selectedStep, primaryResync: primaryResync)

        var next = state
        next.candidates = steps.map(\.candidate)
        next.primarySourceStageNumber = nextPrimary
        return (result, next)
    }

    static func selectionGreenPrefixLength(state: SurvivalCompositePhraseRuntimeState) -> Int {
        if state.primarySourceStageNumber != nil { return 0 }

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

    static func staffChordView(state: SurvivalCompositePhraseRuntimeState) -> SurvivalCompositePhraseStaffChordView {
        guard !state.candidates.isEmpty else {
            return SurvivalCompositePhraseStaffChordView(chord: nil, correctNoteIndices: [])
        }

        if let primary = state.primarySourceStageNumber {
            guard let c = state.candidates.first(where: { $0.sourceStageNumber == primary }) else {
                return SurvivalCompositePhraseStaffChordView(chord: nil, correctNoteIndices: [])
            }
            return SurvivalCompositePhraseStaffChordView(
                chord: chord(at: c.chordIndex, phrase: c.phrase),
                correctNoteIndices: c.revealedNoteIndices
            )
        }

        guard let display = getDisplayCandidate(state: state) else {
            return SurvivalCompositePhraseStaffChordView(chord: nil, correctNoteIndices: [])
        }

        let len = selectionGreenPrefixLength(state: state)
        return SurvivalCompositePhraseStaffChordView(
            chord: chord(at: display.chordIndex, phrase: display.phrase),
            correctNoteIndices: PhraseStreamMatching.prefixIndexSet(len)
        )
    }

    // MARK: - Internal

    private struct CandidateStep {
        let candidate: SurvivalCompositePhraseCandidateState
        let result: SurvivalCompositePhraseNoteResult
        let accepted: Bool
        let matchedLength: Int
        let beforeMatchedLength: Int
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

    private static func candidateWithMatchedLength(
        _ c: SurvivalCompositePhraseCandidateState,
        matchedLength: Int
    ) -> SurvivalCompositePhraseCandidateState {
        let coord = PhraseStreamMatching.coordinateFromMatchedLength(
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
        candidate c: SurvivalCompositePhraseCandidateState,
        pitchClass pc: Int
    ) -> CandidateStep {
        let cache = PhraseStreamMatching.getCompositeKmpCache(chords: c.phrase.chords)
        let pattern = cache.pattern

        if pattern.isEmpty {
            return CandidateStep(
                candidate: candidateFromPhrase(c.phrase),
                result: .miss,
                accepted: false,
                matchedLength: 0,
                beforeMatchedLength: 0
            )
        }

        let beforeMatchedLength = PhraseStreamMatching.matchedLengthFromCoordinates(
            chords: c.phrase.chords,
            chordIndex: c.chordIndex,
            targetNoteIndex: c.targetNoteIndex
        )
        let nextMatchedLength = PhraseStreamMatching.advanceKmp(
            pattern: cache.pattern,
            table: cache.table,
            matchedLength: beforeMatchedLength,
            pitchClass: pc
        )

        if nextMatchedLength == 0 {
            return CandidateStep(
                candidate: candidateFromPhrase(c.phrase),
                result: .miss,
                accepted: false,
                matchedLength: 0,
                beforeMatchedLength: beforeMatchedLength
            )
        }

        let nextCandidate = candidateWithMatchedLength(c, matchedLength: nextMatchedLength)

        if nextMatchedLength >= pattern.count {
            return CandidateStep(
                candidate: nextCandidate,
                result: .phraseComplete,
                accepted: true,
                matchedLength: nextMatchedLength,
                beforeMatchedLength: beforeMatchedLength
            )
        }

        if PhraseStreamMatching.isNonFinalMeasureBoundary(
            chords: c.phrase.chords,
            matchedLength: nextMatchedLength
        ) {
            return CandidateStep(
                candidate: nextCandidate,
                result: .measureComplete,
                accepted: true,
                matchedLength: nextMatchedLength,
                beforeMatchedLength: beforeMatchedLength
            )
        }

        return CandidateStep(
            candidate: nextCandidate,
            result: .progress,
            accepted: true,
            matchedLength: nextMatchedLength,
            beforeMatchedLength: beforeMatchedLength
        )
    }

    private static func compositeSelectionCandidates(
        state: SurvivalCompositePhraseRuntimeState
    ) -> [SurvivalCompositePhraseCandidateState] {
        if let primary = state.primarySourceStageNumber {
            if let c = state.candidates.first(where: { $0.sourceStageNumber == primary }) {
                return [c]
            }
            return []
        }

        guard !state.candidates.isEmpty else { return [] }

        var best = 0
        for c in state.candidates {
            best = max(
                best,
                PhraseStreamMatching.matchedLengthFromCoordinates(
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
            PhraseStreamMatching.matchedLengthFromCoordinates(
                chords: c.phrase.chords,
                chordIndex: c.chordIndex,
                targetNoteIndex: c.targetNoteIndex
            ) == best
        }
    }

    private static func getDisplayCandidate(
        state: SurvivalCompositePhraseRuntimeState
    ) -> SurvivalCompositePhraseCandidateState? {
        compositeSelectionCandidates(state: state).first
    }

    private static func resolvePrimaryStageNumber(
        state: SurvivalCompositePhraseRuntimeState,
        steps: [CandidateStep],
        bestMatchedLength: Int
    ) -> Int? {
        let best = steps.filter { $0.accepted && $0.matchedLength == bestMatchedLength }

        if let previousPrimary = state.primarySourceStageNumber,
           let previousStep = steps.first(where: { $0.candidate.sourceStageNumber == previousPrimary }),
           previousStep.accepted,
           previousStep.matchedLength == bestMatchedLength {
            return previousPrimary
        }

        if best.count == 1 {
            return best[0].candidate.sourceStageNumber
        }

        return nil
    }

    private static func resolveAggregateResult(
        selectedStep: CandidateStep?,
        primaryResync: Bool
    ) -> SurvivalCompositePhraseNoteResult {
        if primaryResync {
            return .resync
        }
        if selectedStep?.result == .measureComplete {
            return .measureComplete
        }
        return .progress
    }

    private static func resetAllCandidates(
        _ state: SurvivalCompositePhraseRuntimeState,
        preserveLastCompleted: Bool
    ) -> SurvivalCompositePhraseRuntimeState {
        var next = state
        next.candidates = state.sourcePhrases.map(candidateFromPhrase)
        next.primarySourceStageNumber = nil
        if !preserveLastCompleted {
            next.lastCompletedSourceStageNumber = nil
        }
        return next
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
