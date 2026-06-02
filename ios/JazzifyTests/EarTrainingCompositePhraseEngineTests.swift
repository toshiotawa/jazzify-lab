import XCTest
@testable import Jazzify

final class EarTrainingCompositePhraseEngineTests: XCTestCase {
    private let idA = UUID(uuidString: "00000000-0000-4000-8000-0000000000A1")!
    private let idB = UUID(uuidString: "00000000-0000-4000-8000-0000000000B1")!

    private func chord(
        id: UUID,
        name: String,
        measure: Int,
        notes: [EarTrainingCompositePhraseChordNote]
    ) -> EarTrainingCompositePhraseChord {
        EarTrainingCompositePhraseChord(
            id: id,
            orderIndex: 0,
            chordName: name,
            measureNumber: measure,
            notes: notes
        )
    }

    private func note(_ pc: Int, _ name: String) -> EarTrainingCompositePhraseChordNote {
        EarTrainingCompositePhraseChordNote(pitchClass: pc, noteName: name, staff: 1)
    }

    private func definition(source: UUID, chords: [EarTrainingCompositePhraseChord]) -> EarTrainingCompositePhraseDefinition {
        EarTrainingCompositePhraseDefinition(
            id: source,
            sourcePhraseId: source,
            title: "t",
            chords: chords
        )
    }

    /// C,E / C,G — 共有 C のあと分岐。
    func testParallelFilterThenLock() {
        let cId = UUID(uuidString: "10000000-0000-4000-8000-000000000001")!
        let p1 = definition(
            source: idA,
            chords: [
                chord(id: cId, name: "X", measure: 1, notes: [note(0, "C4"), note(4, "E4")])
            ]
        )
        let dId = UUID(uuidString: "10000000-0000-4000-8000-000000000002")!
        let p2 = definition(
            source: idB,
            chords: [
                chord(id: dId, name: "Y", measure: 1, notes: [note(0, "C4"), note(7, "G4")])
            ]
        )

        var state = EarTrainingCompositePhraseEngine.createInitialState(sourcePhrases: [p1, p2])

        let r0 = EarTrainingCompositePhraseEngine.evaluateNoteOn(state: state, pitchClass: 0)
        XCTAssertEqual(r0.result, .progress)
        state = r0.nextState
        XCTAssertNil(state.primarySourcePhraseId)

        let r1 = EarTrainingCompositePhraseEngine.evaluateNoteOn(state: state, pitchClass: 4)
        XCTAssertEqual(r1.result, .progress)
        state = r1.nextState
        XCTAssertEqual(state.primarySourcePhraseId, idA)

        let view = EarTrainingCompositePhraseEngine.staffChordView(state: state)
        XCTAssertEqual(view.correctNoteIndices, Set([0, 1]))
    }
}
