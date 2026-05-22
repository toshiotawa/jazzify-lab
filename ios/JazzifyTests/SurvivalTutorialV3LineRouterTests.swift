import XCTest
@testable import Jazzify

final class SurvivalTutorialV3LineRouterTests: XCTestCase {
    func testDialogueOnlyDefaultSpeakerIsFai() {
        let text = SurvivalTutorialV3LocalizedText(ja: "a", en: "b", speaker: nil)
        XCTAssertEqual(
            SurvivalTutorialV3LineRouter.resolvedSpeaker(text, context: .dialogueOnly),
            .fai
        )
    }

    func testBattleDefaultSpeakerIsJajii() {
        let text = SurvivalTutorialV3LocalizedText(ja: "a", en: "b", speaker: nil)
        XCTAssertEqual(
            SurvivalTutorialV3LineRouter.resolvedSpeaker(text, context: .battle),
            .jajii
        )
    }

    func testExplicitNarrationSpeaker() {
        let text = SurvivalTutorialV3LocalizedText(ja: "n", en: "n", speaker: "narration")
        XCTAssertEqual(
            SurvivalTutorialV3LineRouter.resolvedSpeaker(text, context: .battle),
            .narration
        )
    }

    func testPresentRoutesToJajiiCallback() {
        let text = SurvivalTutorialV3LocalizedText(ja: "爺", en: "J", speaker: "jajii")
        var fai = "x"
        var jajii = "x"
        var narration = "x"
        SurvivalTutorialV3LineRouter.present(
            text: text,
            locale: .ja,
            context: .dialogueOnly,
            onFai: { fai = $0 },
            onJajii: { jajii = $0 },
            onNarration: { narration = $0 }
        )
        XCTAssertEqual(fai, "")
        XCTAssertEqual(jajii, "爺")
        XCTAssertEqual(narration, "")
    }
}

final class SurvivalJajiiEngineTutorialTests: XCTestCase {
    func testTutorialDialogueJajiiEnablesInLessonScenario() {
        let stage = OnboardingChords.stageDefinition
        var scenario = SurvivalScenarioRuntimeState.inactive
        scenario.isActive = true
        scenario.tutorialDialogueJajii = true
        XCTAssertTrue(SurvivalJajiiEngine.shouldEnable(stage: stage, scenario: scenario))
    }

    func testWithoutTutorialFlagLessonScenarioDisables() {
        let stage = OnboardingChords.stageDefinition
        var scenario = SurvivalScenarioRuntimeState.inactive
        scenario.isActive = true
        XCTAssertFalse(SurvivalJajiiEngine.shouldEnable(stage: stage, scenario: scenario))
    }
}
