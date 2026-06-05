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
            stageType: .random
        )
        XCTAssertEqual(applied.allowedChordIds, ["F4"])
        XCTAssertEqual(applied.overrides["F4"]?.midiNotes, [65])
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
            stageType: .progression
        )
        XCTAssertEqual(applied.allowedChordIds, ["CM7"])
        XCTAssertTrue(applied.overrides.isEmpty)
    }
}
