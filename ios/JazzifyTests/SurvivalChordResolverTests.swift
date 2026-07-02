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

    func testRootPitchClassUsesSlashBassForOnChord() {
        let slash = SurvivalResolvedChord.fromProgressionEntry(
            SurvivalChordProgressionEntry(
                name: "C / F",
                voicing: [53, 57, 60, 64]
            ),
            index: 0
        )
        XCTAssertEqual(slash.root, "C")
        XCTAssertEqual(slash.rootPitchClass, 5)

        let compact = SurvivalResolvedChord.fromProgressionEntry(
            SurvivalChordProgressionEntry(
                name: "C/E",
                voicing: [52, 60, 64, 67]
            ),
            index: 1
        )
        XCTAssertEqual(compact.root, "C")
        XCTAssertEqual(compact.rootPitchClass, 4)
    }

    func testRootPitchClassForSavoyProgressionSuffixes() {
        let ab713 = SurvivalResolvedChord.fromProgressionEntry(
            SurvivalChordProgressionEntry(
                name: "Ab7(9.13)",
                voicing: [54, 58, 60, 65]
            ),
            index: 0
        )
        XCTAssertEqual(ab713.root, "Ab")
        XCTAssertEqual(ab713.rootPitchClass, 8)

        let bb7b9 = SurvivalResolvedChord.fromProgressionEntry(
            SurvivalChordProgressionEntry(
                name: "Bb7(b9)",
                voicing: [56, 59, 62, 65]
            ),
            index: 1
        )
        XCTAssertEqual(bb7b9.root, "Bb")
        XCTAssertEqual(bb7b9.rootPitchClass, 10)

        let ab79 = SurvivalResolvedChord.fromProgressionEntry(
            SurvivalChordProgressionEntry(
                name: "Ab7(9)",
                voicing: [54, 58, 60, 65]
            ),
            index: 2
        )
        XCTAssertEqual(ab79.root, "Ab")
        XCTAssertEqual(ab79.rootPitchClass, 8)
    }

    func testFingerBassRootMidiLowersBbAndBOneOctave() {
        XCTAssertEqual(SurvivalFingerBassRootMidi.fromPitchClass(9), 45)
        XCTAssertEqual(SurvivalFingerBassRootMidi.fromPitchClass(10), 34)
        XCTAssertEqual(SurvivalFingerBassRootMidi.fromPitchClass(11), 35)
        XCTAssertEqual(SurvivalFingerBassRootMidi.fromOctave2StyleMidi(47), 35)
        XCTAssertEqual(SurvivalFingerBassRootMidi.fromOctave2StyleMidi(46), 34)
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
