import Foundation

struct SurvivalPhraseStaffSnapshot: Equatable {
    let currentChord: SurvivalPhraseChord?
    let nextChord: SurvivalPhraseChord?
    let keyFifths: Int
    let correctNoteIndices: Set<Int>
    let revealedNoteIndices: Set<Int>
    let targetNoteIndex: Int
    let hintMode: Bool
    let hideUnpressedAfter30s: Bool
}
