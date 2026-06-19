import XCTest
@testable import Jazzify

final class SurvivalTutorialV3ScenarioTests: XCTestCase {
    func testDemoPlayRevealSuppressesBuiltInScenarioStaff() {
        let base = SurvivalScenarioOverrides()
        let reveal = SurvivalTutorialV3Scenario.demoPlayReveal(base: base)
        XCTAssertTrue(reveal.suppressScenarioStaff)
        XCTAssertFalse(reveal.hideStaff)
    }

    func testDemoPlayIntroInheritsSuppressScenarioStaff() {
        let base = SurvivalScenarioOverrides()
        let intro = SurvivalTutorialV3Scenario.demoPlayIntro(base: base)
        XCTAssertTrue(intro.suppressScenarioStaff)
        XCTAssertTrue(intro.hideStaff)
    }

    func testDemoPlayRevealPropagatesSuppressScenarioStaffToRuntime() {
        let reveal = SurvivalTutorialV3Scenario.demoPlayReveal(base: SurvivalScenarioOverrides())
        let runtime = reveal.toRuntimeState()
        XCTAssertTrue(runtime.isActive)
        XCTAssertTrue(runtime.suppressScenarioStaff)
    }

    func testChordRevealDoesNotSuppressScenarioStaff() {
        let reveal = SurvivalTutorialV3Scenario.chordReveal(base: SurvivalScenarioOverrides())
        XCTAssertFalse(reveal.suppressScenarioStaff)
    }

    func testIsNextSceneFinishTrueWhenNextSceneIsFinish() throws {
        let json = """
        {
          "version": 3,
          "ui": {
            "hidePlayerHpBar": true,
            "hideSettingsButton": true,
            "hideBackButton": true,
            "playerInvincible": true,
            "disableEnemyAttacks": true,
            "keyboardHintsDefault": true
          },
          "content": {},
          "scenes": [
            {
              "type": "dialogue_only",
              "lines": [{ "ja": "最終", "en": "Final" }]
            },
            { "type": "finish" }
          ],
          "finish": { "showCta": true }
        }
        """.data(using: .utf8)!
        let script = try JSONDecoder().decode(SurvivalTutorialScriptPayloadV3.self, from: json)
        XCTAssertTrue(SurvivalTutorialV3Scenario.isNextSceneFinish(script: script, sceneIndex: 0))
        XCTAssertFalse(SurvivalTutorialV3Scenario.isNextSceneFinish(script: script, sceneIndex: 1))
        XCTAssertFalse(SurvivalTutorialV3Scenario.isNextSceneFinish(script: script, sceneIndex: 99))
    }

    func testDemoPlayEmptyKeyboardHintsDoNotFallbackToOnboardingDm7() {
        let overrides = SurvivalTutorialV3Scenario.demoPlayReveal(base: SurvivalScenarioOverrides())
        let loop = SurvivalGameLoop(
            stage: OnboardingChords.stageDefinition,
            profile: .defaultFai,
            config: OnboardingChords.stageConfig,
            hintMode: true,
            scenarioOverrides: overrides
        )
        XCTAssertTrue(loop.currentHintHighlightMidis().isEmpty)
        XCTAssertTrue(loop.currentHintCompletedHighlightMidis().isEmpty)

        loop.applyScenarioMutation { $0.demoKeyboardMidis = [60, 64] }
        XCTAssertEqual(loop.currentHintHighlightMidis(), Set([60, 64]))
    }

    @MainActor
    func testSetDemoKeyboardHintsSyncsViewModelWithoutFrameAdvance() {
        let controller = SurvivalScenarioController()
        let session = SurvivalGameSession(
            stage: OnboardingChords.stageDefinition,
            hintMode: true,
            characterId: "fai",
            onExit: { _ in },
            usesEnglishToastCopy: false,
            scenarioOverrides: SurvivalTutorialV3Scenario.demoPlayReveal(base: SurvivalScenarioOverrides()),
            scenarioController: controller
        )

        XCTAssertTrue(session.viewModel.chordPadHintMidis.isEmpty)

        controller.setDemoKeyboardHints([60, 64])
        XCTAssertEqual(session.viewModel.chordPadHintMidis, Set([60, 64]))
        XCTAssertEqual(session.gameLoop.runtime.scenario.demoKeyboardMidis, [60, 64])

        controller.setDemoKeyboardHints([])
        XCTAssertTrue(session.viewModel.chordPadHintMidis.isEmpty)
        XCTAssertTrue(session.gameLoop.runtime.scenario.demoKeyboardMidis.isEmpty)
    }
}
