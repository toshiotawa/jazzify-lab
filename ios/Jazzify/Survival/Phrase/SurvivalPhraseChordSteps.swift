import Foundation

struct PhraseChordStep: Equatable {
    let stepIndex: Int
    let noteIndices: [Int]
    let pitchClasses: [Int]
}

enum SurvivalPhraseChordSteps {
    enum AdvanceResult: Equatable {
        case progress
        case resync
        case chordHold
        case measureComplete
        case miss
    }

    struct AdvanceState: Equatable {
        var targetStepIndex: Int
        var correctNoteIndices: Set<Int>
        var revealedNoteIndices: Set<Int>
    }

    private static var cache = NSMapTable<NSArray, NSArray>(
        keyOptions: .weakMemory,
        valueOptions: .strongMemory
    )

    static func getSteps(notes: [SurvivalPhraseChordNote]) -> [PhraseChordStep] {
        let key = notes as NSArray
        if let cached = cache.object(forKey: key) as? [PhraseChordStep] {
            return cached
        }

        var steps: [PhraseChordStep] = []
        var lastResolvedStepIndex: Int?

        for (noteIndex, note) in notes.enumerated() {
            let resolvedStepIndex = note.stepIndex ?? noteIndex
            if lastResolvedStepIndex == nil || resolvedStepIndex != lastResolvedStepIndex {
                steps.append(
                    PhraseChordStep(
                        stepIndex: steps.count,
                        noteIndices: [noteIndex],
                        pitchClasses: [normalizedPitchClass(note.pitchClass)]
                    )
                )
                lastResolvedStepIndex = resolvedStepIndex
            } else {
                var current = steps[steps.count - 1]
                current.noteIndices.append(noteIndex)
                current.pitchClasses.append(normalizedPitchClass(note.pitchClass))
                steps[steps.count - 1] = current
            }
        }

        cache.setObject(steps as NSArray, forKey: key)
        return steps
    }

    static func firstUnmatchedNoteIndex(
        notes: [SurvivalPhraseChordNote],
        step: PhraseChordStep,
        correctNoteIndices: Set<Int>
    ) -> Int {
        for index in step.noteIndices where !correctNoteIndices.contains(index) {
            return index
        }
        return step.noteIndices.last ?? 0
    }

    static func targetNoteIndex(
        notes: [SurvivalPhraseChordNote],
        steps: [PhraseChordStep],
        state: AdvanceState
    ) -> Int {
        guard let step = steps[safe: state.targetStepIndex] else {
            return notes.count
        }
        return firstUnmatchedNoteIndex(notes: notes, step: step, correctNoteIndices: state.correctNoteIndices)
    }

    static func advance(
        notes: [SurvivalPhraseChordNote],
        steps: [PhraseChordStep],
        state: AdvanceState,
        pitchClass: Int
    ) -> (result: AdvanceResult, nextState: AdvanceState) {
        guard !steps.isEmpty else {
            return (.miss, state)
        }

        let pc = normalizedPitchClass(pitchClass)
        guard let step = steps[safe: state.targetStepIndex] else {
            return (.miss, resetState())
        }

        let playedInStep = playedPitchClasses(notes: notes, step: step, correctNoteIndices: state.correctNoteIndices)
        let requiredInStep = Set(pitchClasses(notes: notes, noteIndices: step.noteIndices))

        if requiredInStep.contains(pc), !playedInStep.contains(pc) {
            let nextState = applyMatch(
                notes: notes,
                steps: steps,
                stepIndex: state.targetStepIndex,
                correctNoteIndices: state.correctNoteIndices,
                revealedNoteIndices: state.revealedNoteIndices,
                pitchClass: pc
            )
            if nextState.targetStepIndex >= steps.count {
                return (.measureComplete, nextState)
            }
            return (.progress, nextState)
        }

        if requiredInStep.contains(pc), playedInStep.contains(pc) {
            return (.chordHold, state)
        }

        if state.targetStepIndex > 0, let firstStep = steps.first {
            let firstRequired = Set(pitchClasses(notes: notes, noteIndices: firstStep.noteIndices))
            if firstRequired.contains(pc) {
                let nextState = applyMatch(
                    notes: notes,
                    steps: steps,
                    stepIndex: 0,
                    correctNoteIndices: [],
                    revealedNoteIndices: [],
                    pitchClass: pc
                )
                return (.resync, nextState)
            }
        }

        return (.miss, resetState())
    }

    private static func resetState() -> AdvanceState {
        AdvanceState(targetStepIndex: 0, correctNoteIndices: [], revealedNoteIndices: [])
    }

    private static func normalizedPitchClass(_ pitchClass: Int) -> Int {
        ((pitchClass % 12) + 12) % 12
    }

    private static func pitchClasses(notes: [SurvivalPhraseChordNote], noteIndices: [Int]) -> [Int] {
        noteIndices.map { normalizedPitchClass(notes[$0].pitchClass) }
    }

    private static func noteIndicesMatchingPitchClass(
        notes: [SurvivalPhraseChordNote],
        noteIndices: [Int],
        pitchClass: Int
    ) -> [Int] {
        let pc = normalizedPitchClass(pitchClass)
        return noteIndices.filter { normalizedPitchClass(notes[$0].pitchClass) == pc }
    }

    private static func playedPitchClasses(
        notes: [SurvivalPhraseChordNote],
        step: PhraseChordStep,
        correctNoteIndices: Set<Int>
    ) -> Set<Int> {
        var played = Set<Int>()
        for index in step.noteIndices where correctNoteIndices.contains(index) {
            played.insert(normalizedPitchClass(notes[index].pitchClass))
        }
        return played
    }

    private static func isStepComplete(
        notes: [SurvivalPhraseChordNote],
        step: PhraseChordStep,
        correctNoteIndices: Set<Int>
    ) -> Bool {
        let required = Set(pitchClasses(notes: notes, noteIndices: step.noteIndices))
        let played = playedPitchClasses(notes: notes, step: step, correctNoteIndices: correctNoteIndices)
        return required.isSubset(of: played)
    }

    private static func applyMatch(
        notes: [SurvivalPhraseChordNote],
        steps: [PhraseChordStep],
        stepIndex: Int,
        correctNoteIndices: Set<Int>,
        revealedNoteIndices: Set<Int>,
        pitchClass: Int
    ) -> AdvanceState {
        guard let step = steps[safe: stepIndex] else {
            return resetState()
        }

        let matched = noteIndicesMatchingPitchClass(notes: notes, noteIndices: step.noteIndices, pitchClass: pitchClass)
        var nextCorrect = correctNoteIndices
        var nextRevealed = revealedNoteIndices
        for index in matched {
            nextCorrect.insert(index)
            nextRevealed.insert(index)
        }

        let stepComplete = isStepComplete(notes: notes, step: step, correctNoteIndices: nextCorrect)
        let nextStepIndex = stepComplete ? stepIndex + 1 : stepIndex
        return AdvanceState(
            targetStepIndex: nextStepIndex,
            correctNoteIndices: nextCorrect,
            revealedNoteIndices: nextRevealed
        )
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
