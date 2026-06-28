import XCTest
@testable import Jazzify

final class EarTrainingOsmdTimingAdjustmentTests: XCTestCase {
    func testClampTimingAdjustmentMs() {
        XCTAssertEqual(EarTrainingOsmdTimingAdjustment.clampTimingAdjustmentMs(40), 40)
        XCTAssertEqual(EarTrainingOsmdTimingAdjustment.clampTimingAdjustmentMs(43), 40)
        XCTAssertEqual(EarTrainingOsmdTimingAdjustment.clampTimingAdjustmentMs(45), 50)
        XCTAssertEqual(EarTrainingOsmdTimingAdjustment.clampTimingAdjustmentMs(-310), -300)
        XCTAssertEqual(EarTrainingOsmdTimingAdjustment.clampTimingAdjustmentMs(305), 300)
    }

    func testTimingAdjustmentSec() {
        XCTAssertEqual(
            EarTrainingOsmdTimingAdjustment.timingAdjustmentSec(fromMs: 40),
            0.04,
            accuracy: 0.0001
        )
    }

    func testResolveCalibratedTargetTimeSec() {
        let calibrated = EarTrainingOsmdTimingAdjustment.resolveCalibratedTargetTimeSec(
            speedScaledTargetTimeSec: 2,
            timingAdjustmentMs: 40
        )
        XCTAssertEqual(calibrated, 2.04, accuracy: 0.0001)
    }

    func testFormatTimingAdjustmentLabel() {
        XCTAssertEqual(EarTrainingOsmdTimingAdjustment.formatTimingAdjustmentLabel(40), "+40ms")
        XCTAssertEqual(EarTrainingOsmdTimingAdjustment.formatTimingAdjustmentLabel(-20), "-20ms")
        XCTAssertEqual(EarTrainingOsmdTimingAdjustment.formatTimingAdjustmentLabel(0), "0ms")
    }
}
