import XCTest
@testable import Jazzify

final class ScreenRotationApplierTests: XCTestCase {
    func testRotatedSwapsTopBottomAndLeftRight() {
        let base = UIEdgeInsets(top: 59, left: 0, bottom: 34, right: 0)
        let rotated = ScreenRotationApplier.rotated(base)
        XCTAssertEqual(rotated.top, 34)
        XCTAssertEqual(rotated.bottom, 59)
        XCTAssertEqual(rotated.left, 0)
        XCTAssertEqual(rotated.right, 0)
    }

    func testRotatedLandscapeInsets() {
        let base = UIEdgeInsets(top: 0, left: 59, bottom: 21, right: 59)
        let rotated = ScreenRotationApplier.rotated(base)
        XCTAssertEqual(rotated.top, 21)
        XCTAssertEqual(rotated.left, 59)
        XCTAssertEqual(rotated.bottom, 0)
        XCTAssertEqual(rotated.right, 59)
    }

    func testPortraitCompensationMovesBottomInsetToTop() {
        let base = UIEdgeInsets(top: 59, left: 0, bottom: 34, right: 0)
        let rotated = ScreenRotationApplier.rotated(base)
        let compensation = UIEdgeInsets(
            top: rotated.top - base.top,
            left: rotated.left - base.left,
            bottom: rotated.bottom - base.bottom,
            right: rotated.right - base.right
        )
        XCTAssertEqual(compensation.top, -25)
        XCTAssertEqual(compensation.bottom, 25)
        XCTAssertEqual(compensation.left, 0)
        XCTAssertEqual(compensation.right, 0)
    }
}
