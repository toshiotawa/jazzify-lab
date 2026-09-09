import XCTest
@testable import Jazzify

final class DefensePhraseJudgeTests: XCTestCase {
    private let phrase = DefensePhraseDefinition(
        id: "a",
        orderIndex: 0,
        title: "A",
        audioUrl: "https://example.com/a.mp3",
        keyFifths: nil,
        requiredCompletionCount: nil,
        chords: [
            SurvivalPhraseChord(
                id: "c0",
                orderIndex: 0,
                chordName: "Dm7",
                measureNumber: 1,
                notes: [
                    SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 62, pitchClass: 2, noteName: "D4", staff: 1, stepIndex: 0),
                    SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 64, pitchClass: 4, noteName: "E4", staff: 1, stepIndex: 1),
                ]
            ),
            SurvivalPhraseChord(
                id: "c1",
                orderIndex: 1,
                chordName: "G7",
                measureNumber: 2,
                notes: [
                    SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 67, pitchClass: 7, noteName: "G4", staff: 1, stepIndex: 0),
                ]
            ),
        ]
    )

    func testPhraseCompletionSetsPendingSwitch() {
        var state = DefensePhraseJudge.createInitialState(phrases: [phrase])
        state = DefensePhraseJudge.evaluateNoteOn(state: state, stageRequiredCompletionCount: 1, pitchClass: 2).nextState
        state = DefensePhraseJudge.evaluateNoteOn(state: state, stageRequiredCompletionCount: 1, pitchClass: 4).nextState
        let final = DefensePhraseJudge.evaluateNoteOn(state: state, stageRequiredCompletionCount: 1, pitchClass: 7)
        XCTAssertTrue(final.attack)
        XCTAssertTrue(final.phraseCompleted)
        XCTAssertTrue(final.pendingSwitch)
    }
}
