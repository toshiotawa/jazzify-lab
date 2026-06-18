import XCTest
@testable import Jazzify

final class SurvivalChordResolverTests: XCTestCase {
    func testRootPitchClassUsesChordSymbolRootForRootlessVoicing() {
        let cm79 = SurvivalChordResolver.resolve(id: "CM7(9)")
        XCTAssertNotNil(cm79)
        XCTAssertEqual(cm79?.rootPitchClass, 0)
        XCTAssertNotEqual(cm79?.midiNotes.first.map { (($0 % 12) + 12) % 12 }, 0)

        let dm79 = SurvivalChordResolver.resolve(id: "Dm7(9)")
        XCTAssertNotNil(dm79)
        XCTAssertEqual(dm79?.rootPitchClass, 2)
    }

    func testRootPitchClassRegressionForTriadVoicing() {
        let cm7 = SurvivalChordResolver.resolve(id: "CM7")
        XCTAssertNotNil(cm7)
        XCTAssertEqual(cm7?.rootPitchClass, 0)
    }

    func testRootPitchClassForProgressionEntry() {
        let entry = SurvivalChordProgressionEntry(
            name: "Dm7(9)",
            voicing: [50, 53, 57, 62]
        )
        let chord = SurvivalResolvedChord.fromProgressionEntry(entry, index: 0)
        XCTAssertEqual(chord.rootPitchClass, 2)
    }

    func testRootPitchClassForSingleNoteId() {
        let cNote = SurvivalChordResolver.resolve(id: "C_note")
        XCTAssertNotNil(cNote)
        XCTAssertEqual(cNote?.rootPitchClass, 0)
    }

    func testRootPitchClassIgnoresSlashBass() {
        let slash = SurvivalResolvedChord.fromProgressionEntry(
            SurvivalChordProgressionEntry(
                name: "C/E",
                voicing: [52, 60, 64, 67]
            ),
            index: 0
        )
        XCTAssertEqual(slash.rootPitchClass, 0)
    }

    func testGrandStaffModeUsesMidiStaffFallbackWhenVoicingStavesMissing() {
        let entry = SurvivalChordProgressionEntry(
            name: "Cmaj7",
            voicing: [48, 60, 64, 67]
        )
        let chord = SurvivalResolvedChord.fromProgressionEntry(entry, index: 0, grandStaffMode: true)
        XCTAssertEqual(chord.progressionStaffVoicingStaves, [2, 1, 1, 1])
    }

    func testGrandStaffModePrefersExplicitVoicingStaves() {
        let entry = SurvivalChordProgressionEntry(
            name: "Cmaj7",
            voicing: [48, 60, 64, 67],
            voicingStaves: [2, 2, 2, 2]
        )
        let chord = SurvivalResolvedChord.fromProgressionEntry(entry, index: 0, grandStaffMode: true)
        XCTAssertEqual(chord.progressionStaffVoicingStaves, [2, 2, 2, 2])
    }

    func testNonGrandStaffModeOmitsStavesWhenVoicingStavesMissing() {
        let entry = SurvivalChordProgressionEntry(
            name: "Cmaj7",
            voicing: [48, 60, 64, 67]
        )
        let chord = SurvivalResolvedChord.fromProgressionEntry(entry, index: 0, grandStaffMode: false)
        XCTAssertNil(chord.progressionStaffVoicingStaves)
    }

    func testDisplayVoicingStavesPerNoteFallsBackToMidiInGrandStaffMode() {
        let staves = SurvivalResolvedChord.displayVoicingStavesPerNote(
            voicingNames: ["C3", "E4", "G4", "B4"],
            storedStaves: nil,
            midiNotesAscending: [48, 64, 67, 71],
            grandStaffMode: true
        )
        XCTAssertEqual(staves, [2, 1, 1, 1])
    }
}
