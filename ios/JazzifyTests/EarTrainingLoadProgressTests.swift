import XCTest
@testable import Jazzify

final class EarTrainingLoadProgressTests: XCTestCase {
    func testClamped() {
        XCTAssertEqual(EarTrainingLoadProgress.clamped(-0.2), 0)
        XCTAssertEqual(EarTrainingLoadProgress.clamped(0.5), 0.5)
        XCTAssertEqual(EarTrainingLoadProgress.clamped(1.4), 1)
    }

    func testDisplayedProgressNeverGoesBackwards() {
        XCTAssertEqual(
            EarTrainingLoadProgress.displayedProgress(current: 0.7, target: 0.4, isComplete: false),
            0.7
        )
    }

    func testDisplayedProgressCompleteIsAlwaysOne() {
        XCTAssertEqual(
            EarTrainingLoadProgress.displayedProgress(current: 0.2, target: 0.85, isComplete: true),
            1
        )
    }

    func testCompletionHoldIsShortAndDoesNotStretchLoading() {
        XCTAssertGreaterThan(EarTrainingLoadProgress.completionHoldNanoseconds, 100_000_000)
        XCTAssertLessThan(EarTrainingLoadProgress.completionHoldNanoseconds, 400_000_000)
        XCTAssertLessThan(EarTrainingLoadProgress.scoreCompleteHoldNanoseconds, EarTrainingLoadProgress.completionHoldNanoseconds)
    }
}
