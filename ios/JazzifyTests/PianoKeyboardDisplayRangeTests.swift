import XCTest
@testable import Jazzify

final class PianoKeyboardDisplayRangeTests: XCTestCase {
    func testExpandMidiRangeWithWhiteKeyPaddingAddsAdjacentWhites() {
        let range = PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
            minNoteMidi: 60,
            maxNoteMidi: 67
        )
        XCTAssertEqual(range.minMidi, 59)
        XCTAssertEqual(range.maxMidi, 69)
    }

    func testExpandMidiRangeWithWhiteKeyPaddingHandlesBlackKeyOnlyNote() {
        let range = PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
            minNoteMidi: 61,
            maxNoteMidi: 61
        )
        XCTAssertEqual(range.minMidi, 60)
        XCTAssertEqual(range.maxMidi, 62)
    }

    func testExpandMidiRangeWithWhiteKeyPaddingClampsAtA0() {
        let range = PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
            minNoteMidi: 21,
            maxNoteMidi: 21
        )
        XCTAssertEqual(range.minMidi, 21)
        XCTAssertEqual(range.maxMidi, 23)
    }

    func testExpandMidiRangeWithWhiteKeyPaddingClampsAtC8() {
        let range = PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
            minNoteMidi: 108,
            maxNoteMidi: 108
        )
        XCTAssertEqual(range.minMidi, 107)
        XCTAssertEqual(range.maxMidi, 108)
    }

    func testResolveDisplayKeyboardRangeFallsBackToFull88WhenEmpty() {
        let range = PianoKeyboardScrollGeometry.resolveDisplayKeyboardRange(
            noteMidis: [],
            displayMode: .questionRangeFit
        )
        XCTAssertEqual(range, .full88)
    }

    func testResolveDisplayKeyboardRangeUsesFull88Mode() {
        let range = PianoKeyboardScrollGeometry.resolveDisplayKeyboardRange(
            noteMidis: [60, 72],
            displayMode: .full88Keys
        )
        XCTAssertEqual(range, .full88)
    }

    func testPianoKeyboardDisplayPreferencesDefaultsAndPersists() {
        let defaults = UserDefaults.standard
        let key = PianoKeyboardDisplayPreferences.storageKey
        let prior = defaults.string(forKey: key)
        defer {
            if let prior {
                defaults.set(prior, forKey: key)
            } else {
                defaults.removeObject(forKey: key)
            }
        }

        defaults.removeObject(forKey: key)
        XCTAssertEqual(PianoKeyboardDisplayPreferences.load(), .questionRangeFit)

        PianoKeyboardDisplayPreferences.save(.full88Keys)
        XCTAssertEqual(PianoKeyboardDisplayPreferences.load(), .full88Keys)
    }

    func testCodeRunProgressionDisplayRangeSwitchesBetweenFitAndFull88() {
        let chords = [
            SurvivalResolvedChord(
                id: "code-run:c",
                root: "C",
                quality: .progression,
                midiNotes: [60, 64, 67],
                pitchClasses: [0, 4, 7],
                displayName: "C"
            ),
            SurvivalResolvedChord(
                id: "code-run:e",
                root: "E",
                quality: .progression,
                midiNotes: [64, 68, 71],
                pitchClasses: [4, 8, 11],
                displayName: "E"
            ),
        ]

        let fitRange = SurvivalPhraseKeyboardScroll.resolvedDisplayRange(
            in: chords,
            displayMode: .questionRangeFit
        )
        let fullRange = SurvivalPhraseKeyboardScroll.resolvedDisplayRange(
            in: chords,
            displayMode: .full88Keys
        )

        XCTAssertEqual(fitRange.minMidi, 59)
        XCTAssertEqual(fitRange.maxMidi, 72)
        XCTAssertEqual(fullRange, .full88)
        XCTAssertNotEqual(fitRange, fullRange)
    }

    func testCodeRunRandomDisplayRangeSwitchesBetweenFitAndFull88() {
        let allowedChords = ["C", "D", "E"]

        let fitRange = SurvivalPhraseKeyboardScroll.resolvedDisplayRange(
            fromChordIds: allowedChords,
            displayMode: .questionRangeFit
        )
        let fullRange = SurvivalPhraseKeyboardScroll.resolvedDisplayRange(
            fromChordIds: allowedChords,
            displayMode: .full88Keys
        )

        XCTAssertEqual(fitRange.minMidi, 59)
        XCTAssertEqual(fitRange.maxMidi, 72)
        XCTAssertEqual(fullRange, .full88)
        XCTAssertNotEqual(fitRange, fullRange)
    }
}
