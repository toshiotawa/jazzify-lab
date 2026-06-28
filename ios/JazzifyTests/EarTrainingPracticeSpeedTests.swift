import XCTest
@testable import Jazzify

final class EarTrainingPracticeSpeedTests: XCTestCase {
    func testClampPracticeSpeedPercent() {
        XCTAssertEqual(EarTrainingPracticeSpeed.clampPracticeSpeedPercent(100), 100)
        XCTAssertEqual(EarTrainingPracticeSpeed.clampPracticeSpeedPercent(40), 40)
        XCTAssertEqual(EarTrainingPracticeSpeed.clampPracticeSpeedPercent(39), 40)
        XCTAssertEqual(EarTrainingPracticeSpeed.clampPracticeSpeedPercent(101), 100)
    }

    func testScalePracticeTargetTimeSec() {
        XCTAssertEqual(EarTrainingPracticeSpeed.scalePracticeTargetTimeSec(2, speedPercent: 100), 2)
        XCTAssertEqual(EarTrainingPracticeSpeed.scalePracticeTargetTimeSec(2, speedPercent: 50), 4)
    }

    func testScalePracticeTimingWindowSec() {
        XCTAssertEqual(EarTrainingPracticeSpeed.scalePracticeTimingWindowSec(0.25, speedPercent: 100), 0.25)
        XCTAssertEqual(EarTrainingPracticeSpeed.scalePracticeTimingWindowSec(0.25, speedPercent: 50), 0.5)
        XCTAssertEqual(EarTrainingPracticeSpeed.scalePracticeTimingWindowSec(0.1, speedPercent: 50), 0.2)
        XCTAssertEqual(EarTrainingPracticeSpeed.scalePracticeTimingWindowSec(0.25, speedPercent: 40), 0.625, accuracy: 0.0001)
    }

    func testEffectivePracticeBpm() {
        XCTAssertEqual(EarTrainingPracticeSpeed.effectivePracticeBpm(120, speedPercent: 100), 120)
        XCTAssertEqual(EarTrainingPracticeSpeed.effectivePracticeBpm(120, speedPercent: 50), 60)
    }

    func testRatePitchCompensationCents() {
        XCTAssertEqual(EarTrainingPracticeSpeed.ratePitchCompensationCents(forRate: 1), 0, accuracy: 0.01)
        XCTAssertEqual(EarTrainingPracticeSpeed.ratePitchCompensationCents(forRate: 0.5), 1200, accuracy: 0.01)
    }
}
