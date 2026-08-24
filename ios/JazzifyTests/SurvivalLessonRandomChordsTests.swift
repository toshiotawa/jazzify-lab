import XCTest
@testable import Jazzify

final class SurvivalLessonRandomChordsTests: XCTestCase {
    func testBuildLessonRandomChordUsesExplicitVoicing() {
        let entry = SurvivalLessonRandomChordEntry(
            name: "E4",
            voicing: [64],
            voicingNames: ["E4"],
            voicingStaves: [1],
            keyFifths: 0
        )
        let chord = SurvivalLessonRandomChords.buildLessonRandomChord(from: entry)
        XCTAssertEqual(chord?.id, "E4")
        XCTAssertEqual(chord?.midiNotes, [64])
        XCTAssertEqual(chord?.progressionStaffVoicingNames, ["E4"])
        XCTAssertEqual(chord?.progressionStaffVoicingStaves, [1])
    }

    func testApplyLessonRandomChordsReplacesRandomPool() {
        let entries = [
            SurvivalLessonRandomChordEntry(
                name: "F4",
                voicing: [65],
                voicingNames: ["F4"],
                voicingStaves: [1],
                keyFifths: 0
            ),
        ]
        let applied = SurvivalLessonRandomChords.applyLessonRandomChords(
            stageAllowedChordIds: ["CM7", "Dm7"],
            entries: entries,
            stageType: SurvivalStageType.random
        )
        XCTAssertEqual(applied.allowedChordIds, ["F4"])
        XCTAssertEqual(applied.overrides["F4"]?.midiNotes, [65])
    }

    func testDecodeCamelCaseLessonRandomChordJSON() throws {
        let json = Data("""
        [{"name":"F7","voicing":[51,57],"keyFifths":-1,"voicingNames":["Eb3","A3"],"voicingStaves":[2,2]}]
        """.utf8)
        let entries = try JSONDecoder().decode([SurvivalLessonRandomChordEntry].self, from: json)
        XCTAssertEqual(entries.count, 1)
        XCTAssertEqual(entries.first?.name, "F7")
        XCTAssertEqual(entries.first?.voicing, [51, 57])
        XCTAssertEqual(entries.first?.voicingNames, ["Eb3", "A3"])
        XCTAssertEqual(entries.first?.voicingStaves, [2, 2])
        XCTAssertEqual(entries.first?.keyFifths, -1)
    }

    func testDecodeSnakeCaseLessonRandomChordJSON() throws {
        let json = Data("""
        [{"name":"Bb7","voicing":[50,56],"key_fifths":-1,"voicing_names":["D3","Ab3"],"voicing_staves":[2,2]}]
        """.utf8)
        let entries = try JSONDecoder().decode([SurvivalLessonRandomChordEntry].self, from: json)
        XCTAssertEqual(entries.first?.voicingNames, ["D3", "Ab3"])
        XCTAssertEqual(entries.first?.keyFifths, -1)
    }

    func testApplyLessonRandomChordsKeepsProgressionStage() {
        let entries = [
            SurvivalLessonRandomChordEntry(
                name: "G4",
                voicing: [67],
                voicingNames: ["G4"],
                voicingStaves: [1],
                keyFifths: 0
            ),
        ]
        let applied = SurvivalLessonRandomChords.applyLessonRandomChords(
            stageAllowedChordIds: ["CM7"],
            entries: entries,
            stageType: SurvivalStageType.progression
        )
        XCTAssertEqual(applied.allowedChordIds, ["CM7"])
        XCTAssertTrue(applied.overrides.isEmpty)
    }
}
