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

    func testRandomDisplayRangeUsesLessonVoicingOverrides() {
        let override = SurvivalResolvedChord.fromExplicitTutorialVoicing(
            id: "F7",
            name: "F7",
            voicing: [51, 57],
            voicingNames: ["Eb3", "A3"],
            keyFifths: -1,
            progressionStaffVoicingStaves: [2, 2]
        )
        let defaultRange = SurvivalPhraseKeyboardScroll.resolvedDisplayRange(
            fromChordIds: ["F7"],
            displayMode: .questionRangeFit
        )
        let overrideRange = SurvivalPhraseKeyboardScroll.resolvedDisplayRange(
            fromChordIds: ["F7"],
            overrides: ["F7": override],
            displayMode: .questionRangeFit
        )
        let expected = PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
            minNoteMidi: 51,
            maxNoteMidi: 57
        )

        XCTAssertEqual(overrideRange, expected)
        XCTAssertNotEqual(overrideRange, defaultRange)
        XCTAssertEqual(
            SurvivalPhraseKeyboardScroll.maxHintMidi(
                fromChordIds: ["F7"],
                overrides: ["F7": override]
            ),
            57
        )
    }

    func testMapMidiToVisibleKeyboardKeepsInRangeNotes() {
        let range = PianoStagePitchRange(minMidi: 59, maxMidi: 72)
        XCTAssertEqual(PianoKeyboardScrollGeometry.mapMidiToVisibleKeyboard(60, range: range), 60)
    }

    func testMapMidiToVisibleKeyboardFoldsOutOfRangeOctave() {
        let range = PianoStagePitchRange(minMidi: 59, maxMidi: 72)
        XCTAssertEqual(PianoKeyboardScrollGeometry.mapMidiToVisibleKeyboard(48, range: range), 60)
        XCTAssertEqual(PianoKeyboardScrollGeometry.mapMidiToVisibleKeyboard(84, range: range), 72)
        XCTAssertEqual(
            PianoKeyboardScrollGeometry.visibleHeldKeys(Set([48, 60]), range: range),
            Set([60])
        )
    }

    func testEnsureMinimumDisplaySpanExpandsNarrowPaddedRange() {
        let padded = PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
            minNoteMidi: 60,
            maxNoteMidi: 67
        )
        let expanded = PianoKeyboardScrollGeometry.ensureMinimumDisplaySpan(padded)
        XCTAssertGreaterThanOrEqual(
            expanded.maxMidi - expanded.minMidi,
            PianoKeyboardScrollGeometry.minDisplaySpanSemitones
        )
        XCTAssertLessThanOrEqual(expanded.minMidi, 60)
        XCTAssertGreaterThanOrEqual(expanded.maxMidi, 67)
    }

    func testEnsureMinimumDisplaySpanLeavesWideRangeUnchanged() {
        let range = PianoStagePitchRange(minMidi: 48, maxMidi: 84)
        XCTAssertEqual(PianoKeyboardScrollGeometry.ensureMinimumDisplaySpan(range), range)
    }

    func testEnsureMinimumDisplaySpanClampsAtA0() {
        let padded = PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
            minNoteMidi: 21,
            maxNoteMidi: 23
        )
        let expanded = PianoKeyboardScrollGeometry.ensureMinimumDisplaySpan(padded)
        XCTAssertEqual(expanded.minMidi, 21)
        XCTAssertGreaterThanOrEqual(
            expanded.maxMidi - expanded.minMidi,
            PianoKeyboardScrollGeometry.minDisplaySpanSemitones
        )
    }

    func testEnsureMinimumDisplaySpanClampsAtC8() {
        let padded = PianoKeyboardScrollGeometry.expandMidiRangeWithWhiteKeyPadding(
            minNoteMidi: 105,
            maxNoteMidi: 108
        )
        let expanded = PianoKeyboardScrollGeometry.ensureMinimumDisplaySpan(padded)
        XCTAssertEqual(expanded.maxMidi, 108)
        XCTAssertGreaterThanOrEqual(
            expanded.maxMidi - expanded.minMidi,
            PianoKeyboardScrollGeometry.minDisplaySpanSemitones
        )
    }

    func testDefenseKeyboardRangeEnsuresTwoOctavesForTutorialMidis() {
        let stage = Self.tutorialStage(concertMidis: [60, 62, 64])
        let range = DefenseKeyboardRange.resolvedDisplayRange(
            for: stage,
            displayMode: .questionRangeFit
        )
        XCTAssertGreaterThanOrEqual(
            range.maxMidi - range.minMidi,
            PianoKeyboardScrollGeometry.minDisplaySpanSemitones
        )
        XCTAssertLessThanOrEqual(range.minMidi, 60)
        XCTAssertGreaterThanOrEqual(range.maxMidi, 64)
    }

    func testDefenseKeyboardRangeUsesFull88InFull88Mode() {
        let stage = Self.tutorialStage(concertMidis: [60, 62, 64])
        let range = DefenseKeyboardRange.resolvedDisplayRange(
            for: stage,
            displayMode: .full88Keys
        )
        XCTAssertEqual(range, .full88)
    }

    private static func tutorialStage(concertMidis: [Int]) -> DefenseStageDefinition {
        let notes = concertMidis.enumerated().map { index, midi in
            SurvivalPhraseChordNote(
                orderIndex: index,
                pitchMidi: midi,
                pitchClass: ((midi % 12) + 12) % 12,
                noteName: "N\(index)",
                staff: 1,
                stepIndex: index
            )
        }
        let phrase = DefensePhraseDefinition(
            id: "tutorial",
            orderIndex: 0,
            title: "Tutorial",
            audioUrl: "https://example.com/a.mp3",
            loopStartMeasure: nil,
            loopEndMeasure: nil,
            keyFifths: nil,
            requiredCompletionCount: nil,
            chords: [
                SurvivalPhraseChord(
                    id: "c0",
                    orderIndex: 0,
                    chordName: "Tutorial",
                    measureNumber: 1,
                    notes: notes
                ),
            ]
        )
        return DefenseStageDefinition(
            id: "tutorial-stage",
            slug: "tutorial",
            stageNumber: 0,
            title: "Tutorial",
            titleEn: "Tutorial",
            bpm: 120,
            beatsPerBar: 4,
            audioRegistrationMode: .perPhrase,
            audioUrl: nil,
            phraseBars: 1,
            staffLayout: .treble,
            attackTrigger: .note,
            keyFifths: 0,
            requiredCompletionCount: 1,
            difficultyLevel: 1,
            surviveSeconds: 60,
            playerHp: 100,
            productionStaffHintMode: "none",
            productionKeyboardHintMode: "none",
            phrases: [phrase]
        )
    }
}
