import XCTest
@testable import Jazzify

final class BuildDefenseTutorialPhraseTests: XCTestCase {
    func testBbTrumpetConcertMidis() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "trumpet_bb")
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.concertMidis, [58, 60, 62])
        XCTAssertEqual(result.chord.notes.map(\.noteName), ["Bb3", "C4", "D4"])
        XCTAssertEqual(result.staffGroups.map(\.voicing), [["C4"], ["D4"], ["E4"]])
        XCTAssertEqual(result.phrase.keyFifths, 0)
    }

    func testEbAltoSaxConcertMidis() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "alto_sax")
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.concertMidis, [63, 65, 67])
        XCTAssertEqual(result.chord.notes.map(\.noteName), ["Eb4", "F4", "G4"])
        XCTAssertEqual(result.staffGroups.map(\.voicing), [["C5"], ["D5"], ["E5"]])
        XCTAssertEqual(result.phrase.keyFifths, 0)
    }

    func testFHornConcertMidis() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "french_horn_f")
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.concertMidis, [65, 67, 69])
        XCTAssertEqual(result.staffGroups.map(\.voicing), [["C5"], ["D5"], ["E5"]])
        XCTAssertEqual(result.phrase.keyFifths, 0)
    }

    func testPianoConcertMidis() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "piano")
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.concertMidis, [60, 62, 64])
        XCTAssertEqual(result.staffGroups.map(\.voicing), [["C4"], ["D4"], ["E4"]])
        XCTAssertEqual(result.phrase.keyFifths, 0)
    }

    func testSeparateStepIndexes() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "piano")
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.chord.notes.map(\.stepIndex), [0, 1, 2])
    }

    func testWholeNoteSolfegeStaffGroups() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "piano")
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.staffGroups.count, 3)
        XCTAssertTrue(result.staffGroups.allSatisfy { $0.noteValue == .whole })
        XCTAssertEqual(result.staffGroups.map(\.chordName), ["ド", "レ", "ミ"])
    }

    func testPickWrittenOctaveForBbTrumpet() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "trumpet_bb")
        XCTAssertEqual(BuildDefenseTutorialPhrase.pickWrittenOctave(settings), .four)
    }
}
