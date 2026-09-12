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
        let first = DefensePhraseJudge.evaluateNoteOn(state: state, stageRequiredCompletionCount: 1, pitchClass: 2)
        XCTAssertTrue(first.attack)
        state = first.nextState
        let second = DefensePhraseJudge.evaluateNoteOn(state: state, stageRequiredCompletionCount: 1, pitchClass: 4)
        XCTAssertTrue(second.attack)
        state = second.nextState
        let final = DefensePhraseJudge.evaluateNoteOn(state: state, stageRequiredCompletionCount: 1, pitchClass: 7)
        XCTAssertTrue(final.attack)
        XCTAssertTrue(final.phraseCompleted)
        XCTAssertTrue(final.pendingSwitch)
    }

    func testVoiceSequentialRequiresLowestMidiFirst() {
        let chordPhrase = DefensePhraseDefinition(
            id: "c",
            orderIndex: 0,
            title: "C",
            audioUrl: "https://example.com/c.mp3",
            keyFifths: nil,
            requiredCompletionCount: nil,
            chords: [
                SurvivalPhraseChord(
                    id: "c-sim",
                    orderIndex: 0,
                    chordName: "C",
                    measureNumber: 1,
                    notes: [
                        SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 67, pitchClass: 7, noteName: "G4", staff: 1, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 60, pitchClass: 0, noteName: "C4", staff: 1, stepIndex: 0),
                        SurvivalPhraseChordNote(orderIndex: 2, pitchMidi: 64, pitchClass: 4, noteName: "E4", staff: 1, stepIndex: 0),
                    ]
                ),
            ]
        )
        let initial = DefensePhraseJudge.createInitialState(phrases: [chordPhrase])
        let skipHigh = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 7,
            sequential: true
        )
        XCTAssertFalse(skipHigh.attack)
        XCTAssertEqual(skipHigh.nextState.correctNoteIndices.count, 0)

        let midiAnyOrder = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 7,
            sequential: false
        )
        XCTAssertEqual(midiAnyOrder.nextState.correctNoteIndices.count, 1)

        var state = DefensePhraseJudge.evaluateNoteOn(
            state: initial,
            stageRequiredCompletionCount: 1,
            pitchClass: 0,
            sequential: true
        ).nextState
        XCTAssertEqual(state.correctNoteIndices.count, 1)
        state = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 4,
            sequential: true
        ).nextState
        let top = DefensePhraseJudge.evaluateNoteOn(
            state: state,
            stageRequiredCompletionCount: 1,
            pitchClass: 7,
            sequential: true
        )
        XCTAssertTrue(top.attack)
        XCTAssertTrue(top.phraseCompleted)

        let hints = DefensePhraseJudge.keyboardHints(state: initial, sequential: true)
        XCTAssertEqual(hints.nextMidis, [60])
        XCTAssertTrue(hints.pendingMidis.contains(64))
        XCTAssertTrue(hints.pendingMidis.contains(67))
    }
}
