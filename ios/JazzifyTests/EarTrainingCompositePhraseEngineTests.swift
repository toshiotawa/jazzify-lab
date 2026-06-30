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

    private func phraseNote(
        phraseId: UUID,
        index: Int,
        midi: Int,
        pc: Int,
        name: String,
        measure: Int
    ) -> EarTrainingPhraseNoteDetail {
        EarTrainingPhraseNoteDetail(
            id: UUID(uuidString: "20000000-0000-4000-8000-\(String(format: "%012d", index))")!,
            phraseId: phraseId,
            noteIndex: index,
            pitchMidi: midi,
            pitchClass: pc,
            noteName: name,
            octave: 4,
            measureNumber: measure,
            beatOffset: nil,
            tiedFromPrevious: nil
        )
    }

    private func phraseChord(
        phraseId: UUID,
        id: UUID,
        index: Int,
        name: String,
        measure: Int,
        voicing: [String],
        quote: String? = nil
    ) -> EarTrainingPhraseChordDetail {
        let quoteDetail = quote.map {
            EarTrainingPhraseChordQuoteDetail(
                id: UUID(uuidString: "30000000-0000-4000-8000-\(String(format: "%012d", index))")!,
                phraseChordId: id,
                text: $0
            )
        }
        return EarTrainingPhraseChordDetail(
            id: id,
            phraseId: phraseId,
            orderIndex: index,
            chordName: name,
            measureNumber: measure,
            beatOffset: nil,
            durationBeats: 4,
            startTimeSec: nil,
            endTimeSec: nil,
            voicing: voicing,
            voicingStaves: Array(repeating: 1, count: voicing.count),
            quote: quoteDetail
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

    func testAdapterUsesPhraseNotesBeforeChordVoicings() {
        let phraseId = UUID(uuidString: "40000000-0000-4000-8000-000000000001")!
        let dChordId = UUID(uuidString: "40000000-0000-4000-8000-0000000000D1")!
        let gChordId = UUID(uuidString: "40000000-0000-4000-8000-0000000000D2")!
        let phrase = EarTrainingPhraseDetail(
            id: phraseId,
            stageId: UUID(uuidString: "40000000-0000-4000-8000-0000000000AA")!,
            orderIndex: 0,
            keyFifths: nil,
            title: "Phrase A",
            titleEn: nil,
            musicXmlUrl: nil,
            midiUrl: nil,
            audioUrl: "",
            loopDurationSec: 4,
            audioDurationSec: 4,
            noteCount: 3,
            notes: [
                phraseNote(phraseId: phraseId, index: 0, midi: 64, pc: 4, name: "E4", measure: 1),
                phraseNote(phraseId: phraseId, index: 1, midi: 62, pc: 2, name: "D4", measure: 1),
                phraseNote(phraseId: phraseId, index: 2, midi: 69, pc: 9, name: "A4", measure: 1),
            ],
            chords: [
                phraseChord(
                    phraseId: phraseId,
                    id: dChordId,
                    index: 0,
                    name: "Dm7",
                    measure: 1,
                    voicing: ["D3", "F3", "A3", "C4"],
                    quote: "Play this line."
                ),
                phraseChord(
                    phraseId: phraseId,
                    id: gChordId,
                    index: 1,
                    name: "G7",
                    measure: 2,
                    voicing: ["G3", "B3", "D4", "F4"]
                ),
            ],
            demoLoops: nil
        )

        let definition = EarTrainingCompositePhraseAdapter.phraseDetailToDefinition(phrase)

        XCTAssertEqual(definition?.chords.first?.notes.map(\.noteName), ["E4", "D4", "A4"])
        XCTAssertEqual(definition?.chords.first?.notes.map(\.pitchClass), [4, 2, 9])
        XCTAssertEqual(definition?.chords.first?.quoteText, "Play this line.")
    }
}
