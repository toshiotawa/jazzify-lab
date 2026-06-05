import XCTest
@testable import Jazzify

final class SurvivalCodeRunRandomChordsTests: XCTestCase {
    func testPickRandomResolvedChordReturnsMajorTriadForC() {
        let chord = SurvivalGameEngine.pickRandomResolvedChord(
            allowedChordIds: ["C"],
            excludingId: nil
        )
        XCTAssertNotNil(chord)
        XCTAssertEqual(chord?.displayName, "C")
        XCTAssertEqual(Set(chord?.pitchClasses ?? []), Set([0, 4, 7]))
    }

    func testPickRandomResolvedChordExcludesPreviousIdWhenAlternativesExist() {
        let first = SurvivalGameEngine.pickRandomResolvedChord(
            allowedChordIds: ["C", "D", "E"],
            excludingId: nil
        )
        XCTAssertNotNil(first)
        guard let first else { return }

        let second = SurvivalGameEngine.pickRandomResolvedChord(
            allowedChordIds: ["C", "D", "E"],
            excludingId: first.id
        )
        XCTAssertNotNil(second)
        XCTAssertNotEqual(second?.id, first.id)
    }

    func testRandomCodeRunStageUsesAllowedChordsFromRootPattern() {
        let stage = SurvivalStageDefinition(
            mapCategory: .basic,
            stageNumber: 122,
            stageType: .random,
            nameJa: "コードラン: メジャー CDE",
            nameEn: "Chord Run: Major CDE",
            difficulty: .easy,
            chordSuffix: "",
            chordDisplayJa: "メジャー",
            chordDisplayEn: "Major",
            rootPattern: .cde,
            rootPatternJa: "CDE",
            rootPatternEn: "CDE",
            allowedChords: ["C", "D", "E"],
            blockKey: .major,
            isMixedStage: false,
            chordProgression: nil,
            lessonOnly: false,
            compositePhraseSources: nil,
            compositePhraseBossType: nil,
            compositePhraseKeyFifths: nil,
            compositePhraseBgmUrl: nil,
            playMode: .codeRun,
            runMapId: "snow_run_01"
        )
        XCTAssertEqual(stage.stageType, .random)
        XCTAssertFalse(stage.allowedChords.isEmpty)
        XCTAssertTrue(stage.chordProgression == nil || stage.chordProgression?.isEmpty == true)
    }
}
