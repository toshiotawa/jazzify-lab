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
}
