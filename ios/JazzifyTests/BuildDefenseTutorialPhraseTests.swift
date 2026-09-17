import XCTest
@testable import Jazzify

final class BuildDefenseTutorialPhraseTests: XCTestCase {
    func testKeepsConcertPitchClassesForAllPresets() {
        let presets = [
            "piano",
            "trumpet_bb",
            "alto_sax",
            "french_horn_f",
            "guitar",
            "tenor_sax",
            "electric_bass",
        ]
        for id in presets {
            let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: id)
            let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
            let pitchClasses = result.chord.notes.map(\.pitchClass)
            XCTAssertEqual(pitchClasses, DefenseTutorialConstants.targetPitchClasses, "preset \(id)")
        }
    }

    func testTrumpetBbWrittenNames() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "trumpet_bb")
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.concertMidis, [60, 62, 64])
        XCTAssertEqual(result.chord.notes.map(\.noteName), ["D4", "E4", "F#4"])
    }

    func testAltoSaxWrittenNames() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "alto_sax")
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.concertMidis, [60, 62, 64])
        XCTAssertEqual(result.chord.notes.map(\.noteName), ["A4", "B4", "C#5"])
    }

    func testSeparateStepIndices() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "piano")
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.chord.notes.map(\.stepIndex), [0, 1, 2])
    }

    func testOctaveShiftDoesNotChangeConcertMidis() {
        let base = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "piano", notationOctaveShift: 0)
        let shifted = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "piano", notationOctaveShift: 2)
        let a = BuildDefenseTutorialPhrase.build(settings: base, audioUrl: "https://example.com/a.mp3")
        let b = BuildDefenseTutorialPhrase.build(settings: shifted, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(a.concertMidis, b.concertMidis)
        XCTAssertNotEqual(
            DefenseTutorialNotation.resolveWrittenOffset(shifted),
            DefenseTutorialNotation.resolveWrittenOffset(base)
        )
    }

    func testIncludesQuarterRestStaffGroup() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "piano")
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.staffGroups.count, 4)
        XCTAssertTrue(result.staffGroups[3].isRest)
        XCTAssertEqual(result.staffGroups[3].noteValue, .quarter)
    }

    func testPicksC3ForBassClefPreset() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "cello")
        XCTAssertEqual(BuildDefenseTutorialPhrase.pickConcertOctave(settings), .three)
    }
}
