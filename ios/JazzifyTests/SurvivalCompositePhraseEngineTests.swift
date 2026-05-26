import XCTest
@testable import Jazzify

final class SurvivalCompositePhraseEngineTests: XCTestCase {
    private func note(_ i: Int, pc: Int, name: String) -> SurvivalPhraseChordNote {
        SurvivalPhraseChordNote(
            orderIndex: i,
            pitchMidi: 60 + pc,
            pitchClass: pc,
            noteName: name,
            staff: 1
        )
    }

    private func phrase(
        stageNumber: Int,
        chords: [SurvivalPhraseChord]
    ) -> SurvivalPhraseDefinition {
        SurvivalPhraseDefinition(
            id: "p\(stageNumber)",
            mapCategory: "phrases",
            stageNumber: stageNumber,
            title: "Test \(stageNumber)",
            bgmUrl: nil,
            keyFifths: 0,
            chords: chords
        )
    }

    /// Stage1: C,E / Stage2: C,G  — 共有 prefix C のあと分岐。
    func testParallelFilterThenLock() {
        let p1 = phrase(
            stageNumber: 1,
            chords: [
                SurvivalPhraseChord(
                    id: "a",
                    orderIndex: 0,
                    chordName: "X",
                    measureNumber: 1,
                    notes: [note(0, pc: 0, name: "C4"), note(1, pc: 4, name: "E4")]
                ),
            ]
        )
        let p2 = phrase(
            stageNumber: 2,
            chords: [
                SurvivalPhraseChord(
                    id: "b",
                    orderIndex: 0,
                    chordName: "Y",
                    measureNumber: 1,
                    notes: [note(0, pc: 0, name: "C4"), note(1, pc: 7, name: "G4")]
                ),
            ]
        )
        var state = SurvivalCompositePhraseEngine.createInitialState(sourcePhrases: [p1, p2])
        let r0 = SurvivalCompositePhraseEngine.evaluateNoteOn(state: state, pitchClass: 0)
        XCTAssertEqual(r0.result, .progress)
        state = r0.nextState
        XCTAssertNil(state.lockedSourceStageNumber)

        let r1 = SurvivalCompositePhraseEngine.evaluateNoteOn(state: state, pitchClass: 4)
        XCTAssertEqual(r1.result, .progress)
        state = r1.nextState
        XCTAssertEqual(state.lockedSourceStageNumber, 1)

        let view = SurvivalCompositePhraseEngine.staffChordView(state: state)
        XCTAssertEqual(view.correctNoteIndices, Set([0, 1]))
    }

    func testPhraseCompleteResetsAndSetsLastCompleted() {
        let p1 = phrase(
            stageNumber: 1,
            chords: [
                SurvivalPhraseChord(
                    id: "a",
                    orderIndex: 0,
                    chordName: "X",
                    measureNumber: 1,
                    notes: [note(0, pc: 0, name: "C4")]
                ),
            ]
        )
        var state = SurvivalCompositePhraseEngine.createInitialState(sourcePhrases: [p1])
        let r = SurvivalCompositePhraseEngine.evaluateNoteOn(state: state, pitchClass: 0)
        XCTAssertEqual(r.result, .phraseComplete)
        XCTAssertEqual(r.nextState.lastCompletedSourceStageNumber, 1)
        XCTAssertNil(r.nextState.lockedSourceStageNumber)
        XCTAssertEqual(r.nextState.candidates.count, 1)
        XCTAssertEqual(r.nextState.candidates[0].chordIndex, 0)
        XCTAssertEqual(r.nextState.candidates[0].targetNoteIndex, 0)
    }
}
