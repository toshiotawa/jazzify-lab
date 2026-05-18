import Foundation

enum SurvivalPhraseNoteResult: Equatable {
    case progress
    case measureComplete
    case miss
}

struct SurvivalPhraseRuntimeState: Equatable {
    let phrase: SurvivalPhraseDefinition
    var chordIndex: Int
    var targetNoteIndex: Int
    var correctNoteIndices: Set<Int>
    var revealedNoteIndices: Set<Int>
}

enum SurvivalPhraseEngine {
    static func createInitialState(phrase: SurvivalPhraseDefinition) -> SurvivalPhraseRuntimeState {
        SurvivalPhraseRuntimeState(
            phrase: phrase,
            chordIndex: 0,
            targetNoteIndex: 0,
            correctNoteIndices: [],
            revealedNoteIndices: []
        )
    }

    static func evaluateNoteOn(
        state: SurvivalPhraseRuntimeState,
        pitchClass: Int
    ) -> (result: SurvivalPhraseNoteResult, nextState: SurvivalPhraseRuntimeState) {
        guard let chord = state.phrase.chords[safe: state.chordIndex],
              let target = chord.notes[safe: state.targetNoteIndex] else {
            return (.miss, state)
        }

        let allowed = Set(chord.notes.map(\.pitchClass))
        if !allowed.contains(pitchClass) || pitchClass != target.pitchClass {
            return (.miss, resetChord(state))
        }

        var nextCorrect = state.correctNoteIndices
        nextCorrect.insert(state.targetNoteIndex)
        var nextRevealed = state.revealedNoteIndices
        nextRevealed.insert(state.targetNoteIndex)

        if nextCorrect.count >= chord.notes.count {
            return (.measureComplete, advanceChord(state, correct: nextCorrect, revealed: nextRevealed))
        }

        var next = state
        next.targetNoteIndex += 1
        next.correctNoteIndices = nextCorrect
        next.revealedNoteIndices = nextRevealed
        return (.progress, next)
    }

    static func targetMidi(state: SurvivalPhraseRuntimeState) -> Int? {
        guard let chord = state.phrase.chords[safe: state.chordIndex],
              let note = chord.notes[safe: state.targetNoteIndex] else { return nil }
        return note.pitchMidi
    }

    static func displayChords(state: SurvivalPhraseRuntimeState) -> (current: SurvivalPhraseChord?, next: SurvivalPhraseChord?) {
        let chords = state.phrase.chords
        guard !chords.isEmpty else { return (nil, nil) }
        let current = chords[state.chordIndex]
        let nextIndex = (state.chordIndex + 1) % chords.count
        return (current, chords[nextIndex])
    }

    private static func resetChord(_ state: SurvivalPhraseRuntimeState) -> SurvivalPhraseRuntimeState {
        var next = state
        next.targetNoteIndex = 0
        next.correctNoteIndices = []
        next.revealedNoteIndices = []
        return next
    }

    private static func advanceChord(
        _ state: SurvivalPhraseRuntimeState,
        correct: Set<Int>,
        revealed: Set<Int>
    ) -> SurvivalPhraseRuntimeState {
        let count = state.phrase.chords.count
        guard count > 0 else { return state }
        var next = state
        next.chordIndex = (state.chordIndex + 1) % count
        next.targetNoteIndex = 0
        next.correctNoteIndices = []
        next.revealedNoteIndices = []
        return next
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
