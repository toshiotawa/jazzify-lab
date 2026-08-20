import XCTest
@testable import Jazzify

final class EarTrainingKeyboardScrollTests: XCTestCase {
    func testMaxPitchFromPhraseNotes() {
        let stageId = UUID()
        let phraseId = UUID()
        let noteId = UUID()
        let stage = EarTrainingStageDetail(
            id: stageId,
            slug: "test",
            title: "Test",
            titleEn: nil,
            description: nil,
            descriptionEn: nil,
            bpm: 120,
            beatsPerMeasure: 4,
            beatType: 4,
            loopMeasures: 4,
            maxLoopsPerPhrase: 4,
            countInBeats: 4,
            timeLimitSec: 120,
            playerHp: 100,
            enemyHp: 100,
            perCorrectNoteDamage: 10,
            goodCompletionDamage: 20,
            greatCompletionDamage: 30,
            perfectCompletionDamage: 40,
            missDamage: 5,
            failDamage: 10,
            perfectMaxMisses: 0,
            greatMaxMisses: 2,
            backgroundTheme: nil,
            isActive: true,
            mode: .phrase,
            keyFifths: 0,
            phrases: [
                EarTrainingPhraseDetail(
                    id: phraseId,
                    stageId: stageId,
                    orderIndex: 0,
                    keyFifths: nil,
                    title: nil,
                    titleEn: nil,
                    musicXmlUrl: nil,
                    midiUrl: nil,
                    audioUrl: "https://example.com/a.mp3",
                    loopDurationSec: 4,
                    audioDurationSec: 4,
                    noteCount: 2,
                    audioAnchorMs: nil,
                    notes: [
                        EarTrainingPhraseNoteDetail(
                            id: noteId,
                            phraseId: phraseId,
                            noteIndex: 0,
                            pitchMidi: 64,
                            pitchClass: 4,
                            noteName: "E4",
                            octave: 4,
                            measureNumber: 1,
                            beatOffset: 0,
                            tiedFromPrevious: false
                        ),
                        EarTrainingPhraseNoteDetail(
                            id: UUID(),
                            phraseId: phraseId,
                            noteIndex: 1,
                            pitchMidi: 67,
                            pitchClass: 7,
                            noteName: "G4",
                            octave: 4,
                            measureNumber: 1,
                            beatOffset: 1,
                            tiedFromPrevious: false
                        ),
                    ],
                    chords: nil,
                    demoLoops: nil
                ),
            ],
            chordVoicingSelfPaced: nil,
            quizDurationSeconds: nil,
            quizQuestionOrder: nil,
            quizShowNotationInBattle: nil,
            hideChordNamesInBattle: nil,
            quizRequiredCorrectCount: nil,
            showKeyboardHintsInBattle: nil,
            chordQuizItems: nil,
            chordVoicingCompositePhrase: nil,
            compositePhraseBootstrap: nil,
            phrasePairAdlibBootstrap: nil
        )

        XCTAssertEqual(EarTrainingKeyboardScroll.maxPitchMidi(in: stage), 67)
        XCTAssertEqual(
            EarTrainingKeyboardScroll.scrollAnchorMidi(for: stage),
            SurvivalPhraseKeyboardScroll.scrollAnchorWhiteMidi(maxPhraseMidi: 67)
        )
    }

    func testScrollAnchorNilWhenNoPitchData() {
        let stageId = UUID()
        let stage = EarTrainingStageDetail(
            id: stageId,
            slug: "empty",
            title: "Empty",
            titleEn: nil,
            description: nil,
            descriptionEn: nil,
            bpm: 120,
            beatsPerMeasure: 4,
            beatType: 4,
            loopMeasures: 4,
            maxLoopsPerPhrase: 4,
            countInBeats: 4,
            timeLimitSec: 120,
            playerHp: 100,
            enemyHp: 100,
            perCorrectNoteDamage: 10,
            goodCompletionDamage: 20,
            greatCompletionDamage: 30,
            perfectCompletionDamage: 40,
            missDamage: 5,
            failDamage: 10,
            perfectMaxMisses: 0,
            greatMaxMisses: 2,
            backgroundTheme: nil,
            isActive: true,
            mode: .chordOSMD,
            keyFifths: 0,
            phrases: nil,
            chordVoicingSelfPaced: nil,
            quizDurationSeconds: nil,
            quizQuestionOrder: nil,
            quizShowNotationInBattle: nil,
            hideChordNamesInBattle: nil,
            quizRequiredCorrectCount: nil,
            showKeyboardHintsInBattle: nil,
            chordQuizItems: nil,
            chordVoicingCompositePhrase: nil,
            compositePhraseBootstrap: nil,
            phrasePairAdlibBootstrap: nil
        )

        XCTAssertNil(EarTrainingKeyboardScroll.maxPitchMidi(in: stage))
        XCTAssertNil(EarTrainingKeyboardScroll.scrollAnchorMidi(for: stage))
    }

    func testPhrasePairAdlibPitchRangeCentersThreeOctavesOnQuestionMidpoint() {
        let stage = makePhrasePairAdlibStage(voicingNotes: ["C4", "G5"])
        let range = EarTrainingKeyboardScroll.phrasePairAdlibPitchRange(in: stage)

        XCTAssertEqual(range?.minMidi, 51)
        XCTAssertEqual(range?.maxMidi, 87)
        XCTAssertEqual((range?.maxMidi ?? 0) - (range?.minMidi ?? 0), 36)
    }

    func testPhrasePairAdlibResolvedDisplayRangeUsesThreeOctavesInQuestionRangeFit() {
        let stage = makePhrasePairAdlibStage(voicingNotes: ["C4", "G5"])
        let range = EarTrainingKeyboardScroll.resolvedDisplayRange(
            for: stage,
            displayMode: .questionRangeFit
        )

        XCTAssertEqual(range.minMidi, 51)
        XCTAssertEqual(range.maxMidi, 87)
    }

    func testPhrasePairAdlibPitchRangeShiftsAtLowEndWhileKeepingSpan() {
        let stage = makePhrasePairAdlibStage(voicingNotes: ["A0", "C2"])
        let range = EarTrainingKeyboardScroll.phrasePairAdlibPitchRange(in: stage)

        XCTAssertEqual(range?.minMidi, PianoKeyboardScrollGeometry.firstMidi)
        XCTAssertEqual(range?.maxMidi, PianoKeyboardScrollGeometry.firstMidi + 36)
    }

    func testPhrasePairAdlibPitchRangeShiftsAtHighEndWhileKeepingSpan() {
        let stage = makePhrasePairAdlibStage(voicingNotes: ["A6", "C8"])
        let range = EarTrainingKeyboardScroll.phrasePairAdlibPitchRange(in: stage)

        XCTAssertEqual(range?.maxMidi, PianoKeyboardScrollGeometry.lastMidi)
        XCTAssertEqual(range?.minMidi, PianoKeyboardScrollGeometry.lastMidi - 36)
    }

    func testPhrasePairAdlibFull88KeysOverridesCenteredRange() {
        let stage = makePhrasePairAdlibStage(voicingNotes: ["C4", "G5"])
        let range = EarTrainingKeyboardScroll.resolvedDisplayRange(
            for: stage,
            displayMode: .full88Keys
        )

        XCTAssertEqual(range, .full88)
    }

    private func makePhrasePairAdlibStage(voicingNotes: [String]) -> EarTrainingStageDetail {
        let stageId = UUID()
        let groupId = UUID()
        let stepId = UUID()
        let pattern = EarTrainingPhrasePairEngine.Pattern(
            id: "A",
            label: "A",
            pcs: [0, 2],
            familyId: "TEST-A",
            carryTailLength: 0,
            voicing: voicingNotes,
            voicingStaves: Array(repeating: 1, count: voicingNotes.count)
        )
        let bootstrap = EarTrainingPhrasePairAdlibBootstrap(
            bgmUrl: "https://example.com/bgm.mp3",
            keyFifths: 0,
            loopDurationSec: 8,
            steps: [
                EarTrainingPhrasePairAdlibStep(
                    id: stepId,
                    orderIndex: 0,
                    chordName: "CM7",
                    patternGroupId: groupId,
                    measureNumber: 1,
                    startTimeSec: 0,
                    endTimeSec: 8,
                    quote: nil,
                    inputDisabled: false
                ),
            ],
            patternsByGroupId: [groupId: [pattern]]
        )

        return EarTrainingStageDetail(
            id: stageId,
            slug: "pair-adlib-test",
            title: "Pair Adlib Test",
            titleEn: nil,
            description: nil,
            descriptionEn: nil,
            bpm: 120,
            beatsPerMeasure: 4,
            beatType: 4,
            loopMeasures: 4,
            maxLoopsPerPhrase: 4,
            countInBeats: 4,
            timeLimitSec: 120,
            playerHp: 100,
            enemyHp: 100,
            perCorrectNoteDamage: 10,
            goodCompletionDamage: 20,
            greatCompletionDamage: 30,
            perfectCompletionDamage: 40,
            missDamage: 5,
            failDamage: 10,
            perfectMaxMisses: 0,
            greatMaxMisses: 2,
            backgroundTheme: nil,
            isActive: true,
            mode: .phrasePairAdlib,
            keyFifths: 0,
            phrases: nil,
            chordVoicingSelfPaced: nil,
            quizDurationSeconds: nil,
            quizQuestionOrder: nil,
            quizShowNotationInBattle: nil,
            hideChordNamesInBattle: nil,
            quizRequiredCorrectCount: nil,
            showKeyboardHintsInBattle: nil,
            chordQuizItems: nil,
            chordVoicingCompositePhrase: nil,
            compositePhraseBootstrap: nil,
            phrasePairAdlibBootstrap: bootstrap
        )
    }
}
