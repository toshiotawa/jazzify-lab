import Foundation

enum DefensePhraseJudge {
    struct Evaluation: Equatable {
        let attack: Bool
        let phraseCompleted: Bool
        let pendingSwitch: Bool
        let completionCount: Int
        let nextState: DefensePhraseJudgeState
    }

    static func createInitialState(phrases: [DefensePhraseDefinition], phraseIndex: Int = 0) -> DefensePhraseJudgeState {
        DefensePhraseJudgeState(
            phraseIndex: phraseIndex,
            chordIndex: 0,
            targetStepIndex: 0,
            correctNoteIndices: [],
            revealedNoteIndices: [],
            completionCount: 0,
            pendingSwitch: false,
            phrases: phrases
        )
    }

    static func evaluateNoteOn(
        state: DefensePhraseJudgeState,
        stageRequiredCompletionCount: Int,
        pitchClass: Int
    ) -> Evaluation {
        guard let phrase = state.phrases[safe: state.phraseIndex],
              let chord = phrase.chords[safe: state.chordIndex],
              !chord.notes.isEmpty
        else {
            return Evaluation(
                attack: false,
                phraseCompleted: false,
                pendingSwitch: state.pendingSwitch,
                completionCount: state.completionCount,
                nextState: state
            )
        }

        let steps = SurvivalPhraseChordSteps.getSteps(notes: chord.notes)
        let stepState = SurvivalPhraseChordSteps.AdvanceState(
            targetStepIndex: state.targetStepIndex,
            correctNoteIndices: state.correctNoteIndices,
            revealedNoteIndices: state.revealedNoteIndices
        )
        let evaluation = SurvivalPhraseChordSteps.advance(
            notes: chord.notes,
            steps: steps,
            state: stepState,
            pitchClass: pitchClass
        )

        switch evaluation.result {
        case .miss, .chordHold:
            return Evaluation(
                attack: false,
                phraseCompleted: false,
                pendingSwitch: state.pendingSwitch,
                completionCount: state.completionCount,
                nextState: state
            )
        case .progress, .measureComplete:
            break
        }

        var next = state
        next.targetStepIndex = evaluation.nextState.targetStepIndex
        next.correctNoteIndices = evaluation.nextState.correctNoteIndices
        next.revealedNoteIndices = evaluation.nextState.revealedNoteIndices

        let stepCompleted = evaluation.nextState.targetStepIndex > state.targetStepIndex
            || evaluation.result == .measureComplete
        let attack = stepCompleted

        if evaluation.result == .measureComplete {
            next = advanceChord(next, phrase: phrase)
            if next.chordIndex == 0 {
                let required = phrase.requiredCompletionCount ?? stageRequiredCompletionCount
                let nextCount = state.pendingSwitch ? state.completionCount : state.completionCount + 1
                let pending = nextCount >= required || state.pendingSwitch
                next.completionCount = nextCount
                next.pendingSwitch = pending
                return Evaluation(
                    attack: true,
                    phraseCompleted: true,
                    pendingSwitch: pending,
                    completionCount: nextCount,
                    nextState: next
                )
            }
        }

        return Evaluation(
            attack: attack,
            phraseCompleted: false,
            pendingSwitch: state.pendingSwitch,
            completionCount: state.completionCount,
            nextState: next
        )
    }

    static func resetToPhraseIndex(_ index: Int, phrases: [DefensePhraseDefinition]) -> DefensePhraseJudgeState {
        createInitialState(phrases: phrases, phraseIndex: index)
    }

    static func targetMidis(state: DefensePhraseJudgeState) -> [Int] {
        guard let phrase = state.phrases[safe: state.phraseIndex],
              let chord = phrase.chords[safe: state.chordIndex]
        else { return [] }
        let steps = SurvivalPhraseChordSteps.getSteps(notes: chord.notes)
        guard let step = steps[safe: state.targetStepIndex] else { return [] }
        return step.noteIndices.compactMap { index in
            guard !state.correctNoteIndices.contains(index) else { return nil }
            return chord.notes[safe: index]?.pitchMidi
        }
    }

    static func nextPhraseIndex(phrases: [DefensePhraseDefinition], current: Int) -> Int {
        guard !phrases.isEmpty else { return 0 }
        return (current + 1) % phrases.count
    }

    private static func advanceChord(
        _ state: DefensePhraseJudgeState,
        phrase: DefensePhraseDefinition
    ) -> DefensePhraseJudgeState {
        var next = state
        guard !phrase.chords.isEmpty else { return next }
        next.chordIndex = (state.chordIndex + 1) % phrase.chords.count
        next.targetStepIndex = 0
        next.correctNoteIndices = []
        next.revealedNoteIndices = []
        return next
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
