import XCTest
@testable import Jazzify

final class EarTrainingChordQuizTests: XCTestCase {
    func testBuildQuestionsPropagatesItemKeyFifths() {
        let stageId = UUID()
        let itemA = EarTrainingChordQuizItem(
            id: UUID(),
            stageId: stageId,
            orderIndex: 0,
            measureNumber: 1,
            beatOffset: 1,
            durationBeats: 4,
            chordName: "Dm7",
            voicing: ["D3", "A3", "C4", "F4"],
            voicingStaves: [2, 1, 1, 1],
            keyFifths: 2
        )
        let itemB = EarTrainingChordQuizItem(
            id: UUID(),
            stageId: stageId,
            orderIndex: 1,
            measureNumber: 1,
            beatOffset: 1,
            durationBeats: 4,
            chordName: "G7",
            voicing: ["G3", "B3", "D4", "F4"],
            voicingStaves: [2, 1, 1, 1],
            keyFifths: 2
        )
        let stage = EarTrainingStageDetail(
            id: stageId,
            slug: "test-quiz",
            title: "Test",
            titleEn: nil,
            description: nil,
            descriptionEn: nil,
            bpm: 100,
            beatsPerMeasure: 4,
            beatType: 4,
            loopMeasures: 3,
            maxLoopsPerPhrase: 3,
            countInBeats: 0,
            timeLimitSec: 60,
            playerHp: 100,
            enemyHp: 10_000,
            perCorrectNoteDamage: 0,
            goodCompletionDamage: 0,
            greatCompletionDamage: 0,
            perfectCompletionDamage: 0,
            missDamage: 0,
            failDamage: 0,
            perfectMaxMisses: 0,
            greatMaxMisses: 0,
            backgroundTheme: "blue_club",
            isActive: true,
            mode: .chordQuiz,
            keyFifths: 0,
            phrases: nil,
            chordVoicingSelfPaced: nil,
            quizDurationSeconds: 60,
            quizQuestionOrder: "sequential",
            quizShowNotationInBattle: true,
            hideChordNamesInBattle: false,
            quizRequiredCorrectCount: 20,
            showKeyboardHintsInBattle: true,
            osmdTargetsFromScore: nil,
            chordQuizItems: [itemA, itemB],
            chordVoicingCompositePhrase: nil,
            compositePhraseBootstrap: nil,
            phrasePairAdlibBootstrap: nil
        )

        let questions = EarTrainingChordQuiz.buildQuestions(stage: stage)
        XCTAssertEqual(questions.count, 1)
        XCTAssertEqual(questions[0].keyFifths, 2)
        XCTAssertEqual(questions[0].chords.count, 2)
    }

    func testBuildQuestionsGroupsByMeasureNumber() {
        let stageId = UUID()
        let items = (0..<6).map { index in
            EarTrainingChordQuizItem(
                id: UUID(),
                stageId: stageId,
                orderIndex: index,
                measureNumber: (index % 3) + 1,
                beatOffset: 1,
                durationBeats: 4,
                chordName: "CM7",
                voicing: ["C4", "E4", "G4", "B4"],
                voicingStaves: [1, 1, 1, 1],
                keyFifths: index < 3 ? 0 : -1
            )
        }
        let stage = EarTrainingStageDetail(
            id: stageId,
            slug: "test-quiz-group",
            title: "Test",
            titleEn: nil,
            description: nil,
            descriptionEn: nil,
            bpm: 100,
            beatsPerMeasure: 4,
            beatType: 4,
            loopMeasures: 3,
            maxLoopsPerPhrase: 3,
            countInBeats: 0,
            timeLimitSec: 60,
            playerHp: 100,
            enemyHp: 10_000,
            perCorrectNoteDamage: 0,
            goodCompletionDamage: 0,
            greatCompletionDamage: 0,
            perfectCompletionDamage: 0,
            missDamage: 0,
            failDamage: 0,
            perfectMaxMisses: 0,
            greatMaxMisses: 0,
            backgroundTheme: "blue_club",
            isActive: true,
            mode: .chordQuiz,
            keyFifths: 0,
            phrases: nil,
            chordVoicingSelfPaced: nil,
            quizDurationSeconds: 60,
            quizQuestionOrder: "sequential",
            quizShowNotationInBattle: true,
            hideChordNamesInBattle: false,
            quizRequiredCorrectCount: 20,
            showKeyboardHintsInBattle: true,
            osmdTargetsFromScore: nil,
            chordQuizItems: items,
            chordVoicingCompositePhrase: nil,
            compositePhraseBootstrap: nil,
            phrasePairAdlibBootstrap: nil
        )

        let questions = EarTrainingChordQuiz.buildQuestions(stage: stage)
        XCTAssertEqual(questions.count, 3)
        XCTAssertEqual(questions.map(\.measureNumber), [1, 2, 3])
        XCTAssertEqual(questions[0].chords.count, 2)
        XCTAssertEqual(questions[1].chords.count, 2)
        XCTAssertEqual(questions[2].chords.count, 2)
    }
}
