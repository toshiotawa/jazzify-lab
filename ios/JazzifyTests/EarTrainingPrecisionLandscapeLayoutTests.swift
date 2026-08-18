import XCTest
@testable import Jazzify

final class EarTrainingPrecisionLandscapeLayoutTests: XCTestCase {
    func testDefaultScoreBandHeightClosedOnIPhone15() {
        let height = EarTrainingPrecisionLandscapeLayout.defaultScoreBandHeight(
            viewportHeight: 393,
            transportOpen: false
        )
        XCTAssertEqual(height, 221, accuracy: 0.001)
    }

    func testDefaultScoreBandHeightOpenOnIPhone15() {
        let height = EarTrainingPrecisionLandscapeLayout.defaultScoreBandHeight(
            viewportHeight: 393,
            transportOpen: true
        )
        XCTAssertEqual(height, 173, accuracy: 0.001)
    }

    func testClosedCapsScoreBandToMinimumLane() {
        let resolved = EarTrainingPrecisionLandscapeLayout.resolve(
            viewportHeight: 393,
            transportOpen: false,
            requestedScoreBandHeight: 400
        )
        XCTAssertEqual(resolved.scoreBandHeight, 309, accuracy: 0.001)
        XCTAssertEqual(resolved.noteLaneHeight, 12, accuracy: 0.001)
    }

    func testOpenTransportShrinksDefaultScoreBandBudget() {
        let closedDefault = EarTrainingPrecisionLandscapeLayout.defaultScoreBandHeight(
            viewportHeight: 393,
            transportOpen: false
        )
        let openDefault = EarTrainingPrecisionLandscapeLayout.defaultScoreBandHeight(
            viewportHeight: 393,
            transportOpen: true
        )
        XCTAssertEqual(closedDefault, 221, accuracy: 0.001)
        XCTAssertEqual(openDefault, 173, accuracy: 0.001)
    }

    func testSmallerRequestedHeightGivesLaneTheRemainder() {
        let resolved = EarTrainingPrecisionLandscapeLayout.resolve(
            viewportHeight: 393,
            transportOpen: false,
            requestedScoreBandHeight: 96
        )
        XCTAssertEqual(resolved.scoreBandHeight, 96, accuracy: 0.001)
        XCTAssertEqual(resolved.noteLaneHeight, 225, accuracy: 0.001)
    }

    func testIPhoneSEClosedAllowsTwoStaffRequest() {
        let resolved = EarTrainingPrecisionLandscapeLayout.resolve(
            viewportHeight: 320,
            transportOpen: false,
            requestedScoreBandHeight: 208
        )
        XCTAssertEqual(resolved.scoreBandHeight, 208, accuracy: 0.001)
        XCTAssertEqual(resolved.noteLaneHeight, 40, accuracy: 0.001)
    }

    func testTinyViewportPrioritizesMinimumScoreBand() {
        let resolved = EarTrainingPrecisionLandscapeLayout.resolve(
            viewportHeight: 170,
            transportOpen: false,
            requestedScoreBandHeight: 208
        )
        XCTAssertEqual(resolved.scoreBandHeight, 96, accuracy: 0.001)
        XCTAssertEqual(resolved.noteLaneHeight, 2, accuracy: 0.001)
    }

    func testConstantsMatchScoreFirstBudget() {
        XCTAssertEqual(EarTrainingPrecisionLandscapeLayout.pianoHeight, 72)
        XCTAssertEqual(EarTrainingPrecisionLandscapeLayout.defaultNoteLaneHeight, 100)
        XCTAssertEqual(EarTrainingPrecisionLandscapeLayout.minNoteLaneHeight, 12)
        XCTAssertEqual(EarTrainingPrecisionLandscapeLayout.transportHeight, 48)
        XCTAssertEqual(EarTrainingPrecisionLandscapeLayout.minScoreBandHeight, 96)
        XCTAssertEqual(EarTrainingPrecisionLandscapeLayout.controlRailWidth, 44)
        XCTAssertEqual(EarTrainingPrecisionLandscapeLayout.fallLeadSec, 2, accuracy: 0.001)
    }
}
