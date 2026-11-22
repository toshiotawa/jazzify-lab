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

    func testTrombonePlacesNotesOnBassStaff() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "trombone")
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(BuildDefenseTutorialPhrase.pickWrittenOctave(settings), .three)
        XCTAssertEqual(result.writtenOctave, .three)
        XCTAssertEqual(result.concertMidis, [48, 50, 52])
        XCTAssertEqual(result.staffGroups.map(\.voicing), [["C3"], ["D3"], ["E3"]])
        XCTAssertEqual(result.staffGroups.map(\.voicingStaves), [[2], [2], [2]])
        XCTAssertEqual(result.chord.notes.map(\.staff), [2, 2, 2])
    }

    func testBassClefOverridePlacesNotesOnBassStaff() {
        var settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "flute")
        settings.clefOverride = .bass
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.staffGroups.map(\.voicing), [["C3"], ["D3"], ["E3"]])
        XCTAssertEqual(result.staffGroups.map(\.voicingStaves), [[2], [2], [2]])
        XCTAssertEqual(result.chord.notes.map(\.staff), [2, 2, 2])
    }

    func testTromboneKeepsC3RegisterWhenWrittenOctaveIsMinusOne() {
        var settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "trombone")
        settings.notationOctaveShift = -1
        let result = BuildDefenseTutorialPhrase.build(settings: settings, audioUrl: "https://example.com/a.mp3")
        XCTAssertEqual(result.writtenOctave, .three)
        XCTAssertEqual(result.concertMidis, [48, 50, 52])
        XCTAssertEqual(result.staffGroups.map(\.voicing), [["C3"], ["D3"], ["E3"]])
    }

    func testDefaultOctaveShiftIsMinusOneForBass() {
        XCTAssertEqual(DefenseTutorialNotation.resolveDefaultOctaveShift(.bass), -1)
        XCTAssertEqual(DefenseTutorialNotation.resolveDefaultOctaveShift(.treble), 0)
        XCTAssertEqual(DefenseTutorialNotation.resolveDefaultOctaveShift(.grand), 0)
        XCTAssertEqual(DefenseTutorialNotation.formatOctaveShiftLabel(-1, isEnglishCopy: false), "記譜オクターブ -1")
        XCTAssertEqual(DefenseTutorialNotation.formatOctaveShiftLabel(-1, isEnglishCopy: true), "Written octave -1")
    }

    func testClefMapsToVoicingAndDisplayStaves() {
        XCTAssertEqual(DefenseTutorialNotation.resolveVoicingStaff(.treble), 1)
        XCTAssertEqual(DefenseTutorialNotation.resolveVoicingStaff(.grand), 1)
        XCTAssertEqual(DefenseTutorialNotation.resolveVoicingStaff(.bass), 2)
        XCTAssertEqual(DefenseTutorialNotation.resolveDisplayStaves(.treble), [1])
        XCTAssertEqual(DefenseTutorialNotation.resolveDisplayStaves(.grand), [1, 2])
        XCTAssertEqual(DefenseTutorialNotation.resolveDisplayStaves(.bass), [2])
    }

    func testLegacyDefaultAudioUrlRemains() {
        XCTAssertEqual(
            DefenseTutorialConstants.audioUrl,
            "https://jazzify-cdn.com/sozai/defense-call-response/defense-tutorial-call-response-cde-bpm60.mp3"
        )
    }

    func testAllNotationCombinationsResolveDoReMiAndPregeneratedAudioUrls() {
        let clefOverrides: [NotationInstrumentClef?] = [nil, .treble, .bass, .grand]
        let transpositionOverrides: [Int?] = [nil, 0, -2, -7, -9]
        var roots = Set<Int>()

        for preset in NotationInstrumentCatalog.presets {
            for octaveShift in NotationInstrumentCatalog.octaveShiftMin...NotationInstrumentCatalog.octaveShiftMax {
                for clefOverride in clefOverrides {
                    for transpositionOverride in transpositionOverrides {
                        var settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: preset.id)
                        settings.notationOctaveShift = octaveShift
                        settings.clefOverride = clefOverride
                        settings.transpositionOverride = transpositionOverride

                        let result = BuildDefenseTutorialPhrase.build(settings: settings)
                        let root = result.concertMidis[0]
                        XCTAssertEqual(result.concertMidis, [root, root + 2, root + 4])

                        let expectedUrl =
                            "\(DefenseTutorialConstants.audioBaseUrl)defense-tutorial-call-response-root-\(root)-bpm60.mp3"
                        XCTAssertEqual(DefenseTutorialConstants.audioUrl(forRootConcertMidi: root), expectedUrl)
                        XCTAssertEqual(DefenseTutorialConstants.audioUrl(forConcertMidis: result.concertMidis), expectedUrl)
                        XCTAssertEqual(result.phrase.audioUrl, expectedUrl)
                        roots.insert(root)
                    }
                }
            }
        }

        XCTAssertEqual(roots.sorted(), DefenseTutorialConstants.pregeneratedRootMidis)
    }

    func testRepresentativeInstrumentsResolveExpectedRootUrls() {
        let cases: [(String, Int)] = [
            ("piano", 60),
            ("trumpet_bb", 58),
            ("alto_sax", 63),
            ("french_horn_f", 65),
            ("trombone", 48),
            ("electric_bass", 36),
        ]

        for (instrumentId, root) in cases {
            let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: instrumentId)
            let result = BuildDefenseTutorialPhrase.build(settings: settings)
            let expectedUrl =
                "\(DefenseTutorialConstants.audioBaseUrl)defense-tutorial-call-response-root-\(root)-bpm60.mp3"
            XCTAssertEqual(result.concertMidis[0], root)
            XCTAssertEqual(DefenseTutorialConstants.audioUrl(forRootConcertMidi: root), expectedUrl)
            XCTAssertEqual(DefenseTutorialConstants.audioUrl(forConcertMidis: result.concertMidis), expectedUrl)
            XCTAssertEqual(result.phrase.audioUrl, expectedUrl)
        }
    }

    func testUnregisteredRootsAndInvalidTriplesReturnNil() {
        XCTAssertNil(DefenseTutorialConstants.audioUrl(forRootConcertMidi: 0))
        XCTAssertNil(DefenseTutorialConstants.audioUrl(forRootConcertMidi: 61))
        XCTAssertNil(DefenseTutorialConstants.audioUrl(forRootConcertMidi: 99))
        XCTAssertNil(DefenseTutorialConstants.audioUrl(forConcertMidis: [60, 62, 65]))
        XCTAssertNil(DefenseTutorialConstants.audioUrl(forConcertMidis: [60, 62]))
    }

    func testDefenseTutorialStateSaveRequiresPhraseSuccess() {
        let notation = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "piano")
        let initial = DefenseTutorialState.createSession(notation: notation)
        XCTAssertFalse(DefenseTutorialState.shouldSaveCompletionOnExit(initial))
        XCTAssertFalse(DefenseTutorialState.hasCleared(initial))

        var play = DefenseTutorialState.advanceScreen(initial, to: .play)
        play = DefenseTutorialState.markPhraseSucceeded(play)
        XCTAssertTrue(play.clearModalVisible)
        XCTAssertTrue(DefenseTutorialState.shouldSaveCompletionOnExit(play))
        XCTAssertTrue(DefenseTutorialState.hasCleared(play))

        let dismissed = DefenseTutorialState.dismissClearModal(play)
        let again = DefenseTutorialState.markPhraseSucceeded(dismissed)
        XCTAssertFalse(again.clearModalVisible)

        let saved = DefenseTutorialState.markCompletionSaved(play)
        XCTAssertFalse(DefenseTutorialState.shouldSaveCompletionOnExit(saved))
        XCTAssertTrue(DefenseTutorialState.hasCleared(saved))
    }

    func testTutorialThreeNotesIncrementCompletionCountWhileResettingCorrectIndices() {
        let settings = DefenseTutorialNotation.defaultSettings(notationInstrumentId: "piano")
        let built = BuildDefenseTutorialPhrase.build(settings: settings)
        var state = DefensePhraseJudge.createInitialState(phrases: built.stage.phrases)
        let pitchClasses = built.concertMidis.map { (($0 % 12) + 12) % 12 }

        for (index, pc) in pitchClasses.enumerated() {
            let eval = DefensePhraseJudge.evaluateNoteOn(
                state: state,
                stageRequiredCompletionCount: built.stage.requiredCompletionCount,
                pitchClass: pc,
                sequential: false,
                attackTrigger: built.stage.attackTrigger,
                autoAdvance: false,
                playStyle: built.stage.playStyle,
                playRootOnChordChange: built.stage.playRootOnChordChange
            )
            state = eval.nextState
            if index < pitchClasses.count - 1 {
                XCTAssertEqual(state.completionCount, 0)
                XCTAssertFalse(eval.phraseCompleted)
            } else {
                XCTAssertEqual(state.completionCount, 1)
                XCTAssertTrue(eval.phraseCompleted)
                XCTAssertTrue(state.correctNoteIndices.isEmpty)
            }
        }
    }
}
