import XCTest
@testable import Jazzify

final class TrainingProgressionTests: XCTestCase {
    private func progressionTraining(
        referenceKey: String,
        referenceChords: [TrainingReferenceChord],
        voicingForm: String,
        clefMode: TrainingClefMode = .grandConcert
    ) -> TrainingRow {
        TrainingRow(
            id: UUID(),
            categoryId: UUID(),
            slug: "test-progression",
            titleJa: "Test",
            titleEn: "Test",
            sortOrder: 0,
            kind: .progression,
            clefMode: clefMode,
            useKeySignature: true,
            playRootOnCorrect: true,
            bgmUrl: "",
            config: TrainingConfig(
                roots: nil,
                quality: nil,
                scale: nil,
                interval: nil,
                direction: nil,
                clef: nil,
                includeAccidentals: nil,
                intervals: nil,
                staves: [2, 1, 1, 1],
                voicingNotes: nil,
                referenceRoot: nil,
                minLowestNote: nil,
                inversion: nil,
                ordered: nil,
                progression: nil,
                unitSize: nil,
                shuffleUnits: true,
                referenceKey: referenceKey,
                referenceChords: referenceChords,
                voicingForm: voicingForm
            ),
            isActive: true
        )
    }

    func testABAFormMatchesFReference() {
        let training = progressionTraining(
            referenceKey: "F",
            referenceChords: [
                TrainingReferenceChord(name: "Gm7(9)", notes: ["F3", "Bb3", "D4", "A4"]),
                TrainingReferenceChord(name: "C7(9.13)", notes: ["E3", "Bb3", "D4", "A4"]),
                TrainingReferenceChord(name: "FM7(9)", notes: ["E3", "A3", "C4", "G4"]),
            ],
            voicingForm: "aba"
        )
        let units = TrainingProgression.buildUnits(training: training)
        XCTAssertEqual(units.count, 12)
        let fUnit = units.first { $0.keyFifths == -1 }
        XCTAssertNotNil(fUnit)
        XCTAssertEqual(fUnit?.questions[0].promptLabel, "Gm7(9)")
        XCTAssertEqual(fUnit?.questions[0].notes.map(\.noteName), ["F3", "Bb3", "D4", "A4"])
        XCTAssertEqual(fUnit?.questions[1].notes.map(\.noteName), ["E3", "Bb3", "D4", "A4"])
        XCTAssertEqual(fUnit?.questions[2].notes.map(\.noteName), ["E3", "A3", "C4", "G4"])
    }

    func testBABFormMatchesBbReference() {
        let training = TrainingRow(
            id: UUID(),
            categoryId: UUID(),
            slug: "test-bab",
            titleJa: "Test",
            titleEn: "Test",
            sortOrder: 0,
            kind: .progression,
            clefMode: .grandConcert,
            useKeySignature: true,
            playRootOnCorrect: true,
            bgmUrl: "",
            config: TrainingConfig(
                roots: nil, quality: nil, scale: nil, interval: nil, direction: nil, clef: nil,
                includeAccidentals: nil, intervals: nil, staves: [2, 1, 1, 1], voicingNotes: nil,
                referenceRoot: nil, minLowestNote: nil, inversion: nil, ordered: nil,
                progression: nil, unitSize: nil, shuffleUnits: true,
                referenceKey: "Bb",
                referenceChords: [
                    TrainingReferenceChord(name: "Cm7(9)", notes: ["Eb3", "Bb3", "D4", "G4"]),
                    TrainingReferenceChord(name: "F7(9.13)", notes: ["Eb3", "A3", "D4", "G4"]),
                    TrainingReferenceChord(name: "BbM7(9)", notes: ["D3", "A3", "C4", "F4"]),
                ],
                voicingForm: "bab"
            ),
            isActive: true
        )
        let units = TrainingProgression.buildUnits(training: training)
        let bbUnit = units.first { $0.keyFifths == -2 }
        XCTAssertNotNil(bbUnit)
        XCTAssertEqual(bbUnit?.questions[0].notes.map(\.noteName), ["Eb3", "Bb3", "D4", "G4"])
    }

    func testPrecomputedProgressionUnits() {
        let training = TrainingRow(
            id: UUID(),
            categoryId: UUID(),
            slug: "lh-ii-v-i",
            titleJa: "II-V-I",
            titleEn: "II-V-I",
            sortOrder: 0,
            kind: .progression,
            clefMode: .bassConcert,
            useKeySignature: true,
            playRootOnCorrect: true,
            bgmUrl: "",
            config: TrainingConfig(
                roots: nil, quality: nil, scale: nil, interval: nil, direction: nil, clef: nil,
                includeAccidentals: nil, intervals: nil, staves: nil, voicingNotes: nil,
                referenceRoot: nil, minLowestNote: nil, inversion: nil, ordered: nil,
                progression: [
                    TrainingProgressionEntry(
                        name: "Dm7(9)", voicing: [53, 57, 60, 64],
                        voicingNames: ["F3", "A3", "C4", "E4"], keyFifths: 0, voicingStaves: nil
                    ),
                    TrainingProgressionEntry(
                        name: "G7(9.13)", voicing: [51, 55, 57, 62],
                        voicingNames: ["Eb3", "G3", "A3", "D4"], keyFifths: 0, voicingStaves: nil
                    ),
                    TrainingProgressionEntry(
                        name: "CM7(9)", voicing: [52, 55, 59, 62],
                        voicingNames: ["E3", "G3", "B3", "D4"], keyFifths: 0, voicingStaves: nil
                    ),
                ],
                unitSize: 3,
                shuffleUnits: true,
                referenceKey: nil,
                referenceChords: nil,
                voicingForm: nil
            ),
            isActive: true
        )
        let units = TrainingProgression.buildUnits(training: training)
        XCTAssertEqual(units.count, 1)
        XCTAssertEqual(units[0].questions.count, 3)
        XCTAssertEqual(units[0].questions[0].promptLabel, "Dm7(9)")
    }

    func testCursorAdvanceWithinUnitAndWrap() {
        let training = progressionTraining(
            referenceKey: "F",
            referenceChords: [
                TrainingReferenceChord(name: "Gm7(9)", notes: ["F3", "Bb3", "D4", "A4"]),
                TrainingReferenceChord(name: "C7(9.13)", notes: ["E3", "Bb3", "D4", "A4"]),
                TrainingReferenceChord(name: "FM7(9)", notes: ["E3", "A3", "C4", "G4"]),
            ],
            voicingForm: "aba"
        )
        let units = TrainingProgression.buildUnits(training: training)
        var cursor = TrainingProgression.pickInitialCursor(units: units, shuffleUnits: false)
        XCTAssertEqual(cursor.unitIndex, 0)
        XCTAssertEqual(cursor.chordIndex, 0)
        cursor = TrainingProgression.advanceCursor(units: units, cursor: cursor, shuffleUnits: false)
        XCTAssertEqual(cursor.chordIndex, 1)
        cursor = TrainingProgression.advanceCursor(units: units, cursor: cursor, shuffleUnits: false)
        XCTAssertEqual(cursor.chordIndex, 2)
        cursor = TrainingProgression.advanceCursor(units: units, cursor: cursor, shuffleUnits: false)
        XCTAssertEqual(cursor.unitIndex, 1)
        XCTAssertEqual(cursor.chordIndex, 0)
    }
}
