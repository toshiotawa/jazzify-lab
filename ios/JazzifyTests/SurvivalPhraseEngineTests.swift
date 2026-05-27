import XCTest
@testable import Jazzify

final class SurvivalPhraseEngineTests: XCTestCase {
    private let samplePhrase = SurvivalPhraseDefinition(
        id: "p1",
        mapCategory: "phrases",
        stageNumber: 1,
        title: "Test",
        bgmUrl: nil,
        keyFifths: 0,
        chords: [
            SurvivalPhraseChord(
                id: "c0",
                orderIndex: 0,
                chordName: "Dm7",
                measureNumber: 1,
                notes: [
                    SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 62, pitchClass: 2, noteName: "D4", staff: 1),
                    SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 64, pitchClass: 4, noteName: "E4", staff: 1),
                    SurvivalPhraseChordNote(orderIndex: 2, pitchMidi: 65, pitchClass: 5, noteName: "F4", staff: 1),
                    SurvivalPhraseChordNote(orderIndex: 3, pitchMidi: 67, pitchClass: 7, noteName: "G4", staff: 1),
                ]
            ),
            SurvivalPhraseChord(
                id: "c1",
                orderIndex: 1,
                chordName: "G7",
                measureNumber: 2,
                notes: [
                    SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 64, pitchClass: 4, noteName: "E4", staff: 1),
                    SurvivalPhraseChordNote(orderIndex: 1, pitchMidi: 62, pitchClass: 2, noteName: "D4", staff: 1),
                ]
            ),
            SurvivalPhraseChord(
                id: "c2",
                orderIndex: 2,
                chordName: "CM7",
                measureNumber: 3,
                notes: [
                    SurvivalPhraseChordNote(orderIndex: 0, pitchMidi: 67, pitchClass: 7, noteName: "G4", staff: 1),
                ]
            ),
        ]
    )

    func testProgressThroughDm7() {
        var state = SurvivalPhraseEngine.createInitialState(phrase: samplePhrase)
        let r1 = SurvivalPhraseEngine.evaluateNoteOn(state: state, pitchClass: 2)
        XCTAssertEqual(r1.result, .progress)
        state = r1.nextState
        XCTAssertEqual(state.targetNoteIndex, 1)

        let r4 = SurvivalPhraseEngine.evaluateNoteOn(state: state, pitchClass: 7)
        XCTAssertEqual(r4.result, .measureComplete)
        XCTAssertEqual(r4.nextState.chordIndex, 1)
    }

    func testMissResetsChord() {
        var state = SurvivalPhraseEngine.createInitialState(phrase: samplePhrase)
        let ok = SurvivalPhraseEngine.evaluateNoteOn(state: state, pitchClass: 2)
        state = ok.nextState
        let miss = SurvivalPhraseEngine.evaluateNoteOn(state: state, pitchClass: 0)
        XCTAssertEqual(miss.result, .miss)
        XCTAssertTrue(miss.nextState.correctNoteIndices.isEmpty)
        XCTAssertEqual(miss.nextState.chordIndex, 0)
    }

    func testLoopToFirstChord() {
        var state = SurvivalPhraseEngine.createInitialState(phrase: samplePhrase)
        state.chordIndex = 2
        let done = SurvivalPhraseEngine.evaluateNoteOn(state: state, pitchClass: 7)
        XCTAssertEqual(done.result, .measureComplete)
        XCTAssertEqual(done.nextState.chordIndex, 0)
    }

    func testMaxPitchMidiInResolvedChordsForTutorialV3() {
        let g7 = SurvivalResolvedChord(
            id: "tutorial:g7",
            root: "G7",
            quality: .progression,
            midiNotes: [53, 57, 59, 64],
            pitchClasses: [5, 9, 11, 4],
            displayName: "G7"
        )
        let cm79 = SurvivalResolvedChord(
            id: "tutorial:cm79",
            root: "CM7(9)",
            quality: .progression,
            midiNotes: [52, 57, 59, 62, 66],
            pitchClasses: [4, 9, 11, 2, 6],
            displayName: "CM7(9)"
        )
        XCTAssertEqual(SurvivalPhraseKeyboardScroll.maxPitchMidi(in: [g7]), 64)
        XCTAssertEqual(SurvivalPhraseKeyboardScroll.maxPitchMidi(in: [cm79]), 66)
        XCTAssertEqual(SurvivalPhraseKeyboardScroll.maxPitchMidi(in: [g7, cm79]), 66)
        XCTAssertEqual(SurvivalPhraseKeyboardScroll.scrollAnchorWhiteMidi(maxPhraseMidi: 64), 65)
        XCTAssertEqual(SurvivalPhraseKeyboardScroll.scrollAnchorWhiteMidi(maxPhraseMidi: 66), 67)
    }
}
