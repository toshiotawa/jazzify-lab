import XCTest
@testable import Jazzify

final class LessonLocalizationTests: XCTestCase {
    func testLessonSongLocalizedTitleEnglishUsesTitleEnOnly() {
        let song = makeLessonSong(title: "サバイバル: 全キーまとめ", titleEn: "Survival: All keys")
        XCTAssertEqual(song.localizedTitle(.en), "Survival: All keys")
    }

    func testLessonSongLocalizedTitleEnglishDoesNotFallbackToJapanese() {
        let song = makeLessonSong(title: "まとめ", titleEn: nil)
        XCTAssertNil(song.localizedTitle(.en))
    }

    func testLessonSongLocalizedTitleJapaneseUsesTitle() {
        let song = makeLessonSong(title: "クイズ: 全キーまとめ", titleEn: "Quiz: All keys")
        XCTAssertEqual(song.localizedTitle(.ja), "クイズ: 全キーまとめ")
    }

    func testEarTrainingStageLocalizedTitleEnglishUsesTitleEnOnly() {
        let stage = EarTrainingStage(
            id: UUID(),
            slug: "thva-quiz-b1-m7-summary",
            title: "クイズ: 全キーまとめ",
            titleEn: "Quiz: All keys",
            description: nil,
            descriptionEn: nil,
            bpm: nil,
            timeLimitSec: nil,
            mode: nil,
            quizDurationSeconds: nil,
            quizRequiredCorrectCount: nil,
            showKeyboardHintsInBattle: nil
        )
        XCTAssertEqual(stage.localizedTitle(.en), "Quiz: All keys")
    }

    func testSurvivalStageLocalizedNameEnglishUsesTrimmedNameEn() {
        let stage = SurvivalStageDefinition(
            mapCategory: .lesson,
            stageNumber: 1218,
            stageType: .progression,
            nameJa: "両手ヴォイシング: メジャーセブンス: まとめ",
            nameEn: "Two-hand voicing: Major sevenths: All keys",
            difficulty: .easy,
            chordSuffix: "",
            chordDisplayJa: "",
            chordDisplayEn: "",
            rootPattern: nil,
            rootPatternJa: "",
            rootPatternEn: "",
            allowedChords: [],
            blockKey: "M7",
            isMixedStage: false,
            chordProgression: nil,
            lessonOnly: true,
            grandStaffMode: true,
            compositePhraseSources: nil,
            compositePhraseBossType: nil,
            compositePhraseKeyFifths: nil,
            compositePhraseBgmUrl: nil,
            hideChordNamesInBattle: false,
            playMode: .survival,
            runMapId: nil,
            runTimeLimitSec: nil,
            runDialogueScript: nil
        )
        XCTAssertEqual(stage.localizedName(.en), "Two-hand voicing: Major sevenths: All keys")
    }

    private func makeLessonSong(title: String?, titleEn: String?) -> LessonSong {
        LessonSong(
            id: UUID(),
            lessonId: UUID(),
            songId: nil,
            fantasyStageId: nil,
            earTrainingStageId: nil,
            isBalloonRush: nil,
            balloonRushStageId: nil,
            isFantasy: false,
            isSurvival: true,
            isSurvivalTutorial: nil,
            survivalTutorialScriptId: nil,
            isEarTraining: nil,
            isEarTrainingTutorial: nil,
            earTrainingTutorialScriptId: nil,
            survivalStageNumber: 1218,
            survivalMapCategory: "lesson",
            survivalCompositeConfig: nil,
            survivalRandomChords: nil,
            survivalLessonOverrides: nil,
            overrideProductionStaffHintMode: nil,
            overrideProductionKeyboardHintMode: nil,
            clearConditions: nil,
            isClearRequired: true,
            orderIndex: 0,
            title: title,
            titleEn: titleEn,
            fantasyStage: nil,
            earTrainingStage: nil,
            balloonRushStage: nil
        )
    }
}
