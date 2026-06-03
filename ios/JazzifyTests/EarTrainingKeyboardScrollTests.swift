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
                    audioUrl: "https://example.com/a.mp3",
                    loopDurationSec: 4,
                    audioDurationSec: 4,
                    noteCount: 2,
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
}
