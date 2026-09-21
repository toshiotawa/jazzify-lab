import Foundation

enum DefensePhraseJudge {
    struct Evaluation: Equatable {
        let attack: Bool
        let phraseCompleted: Bool
        let measureCompleted: Bool
        let pendingSwitch: Bool
        let completionCount: Int
        let playRootMidi: Int?
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

    struct KeyboardHints: Equatable {
        var nextMidis: Set<Int>
        var pendingMidis: Set<Int>
        var completedMidis: Set<Int>

        var allMidis: Set<Int> {
            nextMidis.union(pendingMidis).union(completedMidis)
        }
    }

    static func evaluateNoteOn(
        state: DefensePhraseJudgeState,
        stageRequiredCompletionCount: Int,
        pitchClass: Int,
        sequential: Bool = false,
        attackTrigger: DefenseAttackTrigger = .note,
        autoAdvance: Bool = true,
        playStyle: DefensePlayStyle = .phrase,
        playRootOnChordChange: Bool = false
    ) -> Evaluation {
        guard let phrase = state.phrases[safe: state.phraseIndex],
              let chord = phrase.chords[safe: state.chordIndex],
              !chord.notes.isEmpty
        else {
            return Evaluation(
                attack: false,
                phraseCompleted: false,
                measureCompleted: false,
                pendingSwitch: state.pendingSwitch,
                completionCount: state.completionCount,
                playRootMidi: nil,
                nextState: state
            )
        }

        let steps = SurvivalPhraseChordSteps.getSteps(notes: chord.notes)
        if sequential,
           let currentStep = steps[safe: state.targetStepIndex] {
            let midis = stepMidis(chord: chord, step: currentStep)
            let completed = sequentialCompletedPitchClasses(
                chord: chord,
                step: currentStep,
                correctNoteIndices: state.correctNoteIndices
            )
            let nextPc = SurvivalChordResolver.nextExpectedPitchClass(
                fromMidis: midis,
                inputPitchClasses: completed
            )
            let pc = ((pitchClass % 12) + 12) % 12
            if nextPc != pc {
                return Evaluation(
                    attack: false,
                    phraseCompleted: false,
                    measureCompleted: false,
                    pendingSwitch: state.pendingSwitch,
                    completionCount: state.completionCount,
                    playRootMidi: nil,
                    nextState: state
                )
            }
        }

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
                measureCompleted: false,
                pendingSwitch: state.pendingSwitch,
                completionCount: state.completionCount,
                playRootMidi: nil,
                nextState: state
            )
        case .progress, .measureComplete:
            break
        }

        var next = state
        next.targetStepIndex = evaluation.nextState.targetStepIndex
        next.correctNoteIndices = evaluation.nextState.correctNoteIndices
        next.revealedNoteIndices = evaluation.nextState.revealedNoteIndices

        let isVoicingMode = playStyle == .chordVoicing
        let completedStepIndex = evaluation.result == .measureComplete
            ? max(0, steps.count - 1)
            : state.targetStepIndex
        let stepAdvanced = evaluation.result == .measureComplete
            || evaluation.nextState.targetStepIndex > state.targetStepIndex
        let playRootMidi = stepAdvanced
            ? resolvePlayRootMidi(
                chord: chord,
                stepIndex: completedStepIndex,
                playRootOnChordChange: playRootOnChordChange
            )
            : nil
        let attackOnStep = isVoicingMode
            ? stepAdvanced
            : (evaluation.result == .measureComplete || attackTrigger == .note)

        if evaluation.result == .measureComplete {
            next = advanceChord(next, phrase: phrase)
            if next.chordIndex == 0 {
                let required = phrase.requiredCompletionCount ?? stageRequiredCompletionCount
                let nextCount = state.pendingSwitch ? state.completionCount : state.completionCount + 1
                let pending = autoAdvance && (nextCount >= required || state.pendingSwitch)
                next.completionCount = nextCount
                next.pendingSwitch = pending
                return Evaluation(
                    attack: attackOnStep,
                    phraseCompleted: true,
                    measureCompleted: true,
                    pendingSwitch: pending,
                    completionCount: nextCount,
                    playRootMidi: playRootMidi,
                    nextState: next
                )
            }
            return Evaluation(
                attack: attackOnStep,
                phraseCompleted: false,
                measureCompleted: true,
                pendingSwitch: state.pendingSwitch,
                completionCount: state.completionCount,
                playRootMidi: playRootMidi,
                nextState: next
            )
        }

        return Evaluation(
            attack: attackOnStep,
            phraseCompleted: false,
            measureCompleted: false,
            pendingSwitch: state.pendingSwitch,
            completionCount: state.completionCount,
            playRootMidi: playRootMidi,
            nextState: next
        )
    }

    static func resetToPhraseIndex(_ index: Int, phrases: [DefensePhraseDefinition]) -> DefensePhraseJudgeState {
        createInitialState(phrases: phrases, phraseIndex: index)
    }

    static func targetMidis(state: DefensePhraseJudgeState) -> [Int] {
        Array(keyboardHints(state: state, sequential: false).pendingMidis)
    }

    static func keyboardHints(state: DefensePhraseJudgeState, sequential: Bool) -> KeyboardHints {
        let empty = KeyboardHints(nextMidis: [], pendingMidis: [], completedMidis: [])
        guard let phrase = state.phrases[safe: state.phraseIndex],
              let chord = phrase.chords[safe: state.chordIndex]
        else { return empty }
        let steps = SurvivalPhraseChordSteps.getSteps(notes: chord.notes)
        guard let step = steps[safe: state.targetStepIndex] else { return empty }
        let midis = stepMidis(chord: chord, step: step)
        if sequential {
            let completedPcs = sequentialCompletedPitchClasses(
                chord: chord,
                step: step,
                correctNoteIndices: state.correctNoteIndices
            )
            let nextPc = SurvivalChordResolver.nextExpectedPitchClass(
                fromMidis: midis,
                inputPitchClasses: completedPcs
            )
            var nextMidis = Set<Int>()
            var pending = Set<Int>()
            var completed = Set<Int>()
            let ordered = SurvivalChordResolver.orderedPitchClasses(fromMidis: midis)
            let completedSet = Set(completedPcs)
            for midi in midis {
                let pc = ((midi % 12) + 12) % 12
                if completedSet.contains(pc) {
                    completed.insert(midi)
                } else if pc == nextPc {
                    nextMidis.insert(midi)
                } else if ordered.contains(pc) {
                    pending.insert(midi)
                }
            }
            return KeyboardHints(nextMidis: nextMidis, pendingMidis: pending, completedMidis: completed)
        }

        var pending = Set<Int>()
        var completed = Set<Int>()
        for index in step.noteIndices {
            guard let note = chord.notes[safe: index] else { continue }
            if state.correctNoteIndices.contains(index) {
                completed.insert(note.pitchMidi)
            } else {
                pending.insert(note.pitchMidi)
            }
        }
        return KeyboardHints(nextMidis: [], pendingMidis: pending, completedMidis: completed)
    }

    static func nextPhraseIndex(phrases: [DefensePhraseDefinition], current: Int) -> Int {
        guard !phrases.isEmpty else { return 0 }
        return (current + 1) % phrases.count
    }

    private static func resolvePlayRootMidi(
        chord: SurvivalPhraseChord,
        stepIndex: Int,
        playRootOnChordChange: Bool
    ) -> Int? {
        guard playRootOnChordChange else { return nil }
        let label = DefenseStaffChordLabel.label(for: chord, stepIndex: stepIndex)
        guard !label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
        let steps = SurvivalPhraseChordSteps.getSteps(notes: chord.notes)
        guard let step = steps[safe: stepIndex] else { return nil }
        var lowestMidi = Int.max
        for noteIndex in step.noteIndices {
            guard let note = chord.notes[safe: noteIndex] else { continue }
            lowestMidi = min(lowestMidi, note.pitchMidi)
        }
        guard lowestMidi != Int.max else { return nil }
        guard let root = TrainingProgression.parseProgressionChordRoot(label) else { return nil }
        return TrainingMusicTheory.rootMidiBelow(root: root, lowestMidi: lowestMidi)
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

    private static func stepMidis(chord: SurvivalPhraseChord, step: PhraseChordStep) -> [Int] {
        step.noteIndices.compactMap { chord.notes[safe: $0]?.pitchMidi }
    }

    private static func sequentialCompletedPitchClasses(
        chord: SurvivalPhraseChord,
        step: PhraseChordStep,
        correctNoteIndices: Set<Int>
    ) -> [Int] {
        let midis = stepMidis(chord: chord, step: step)
        let ordered = SurvivalChordResolver.orderedPitchClasses(fromMidis: midis)
        var completed: [Int] = []
        for pc in ordered {
            let matched = step.noteIndices.contains { index in
                guard let note = chord.notes[safe: index] else { return false }
                return correctNoteIndices.contains(index)
                    && ((note.pitchClass % 12) + 12) % 12 == pc
            }
            if !matched { break }
            completed.append(pc)
        }
        return completed
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
