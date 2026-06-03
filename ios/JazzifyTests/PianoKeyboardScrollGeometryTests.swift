import XCTest
@testable import Jazzify

final class PianoKeyboardScrollGeometryTests: XCTestCase {
    private let whiteKeyWidth: CGFloat = 28
    private let maxScroll: CGFloat = 500

    func testSteppedScrollOffsetXMovesRightByFiveWhiteKeys() {
        let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
            current: 100,
            direction: 1,
            whiteKeyWidth: whiteKeyWidth,
            maxScrollOffsetX: maxScroll
        )
        XCTAssertEqual(next, 100 + whiteKeyWidth * 5, accuracy: 0.001)
    }

    func testSteppedScrollOffsetXMovesLeftByFiveWhiteKeys() {
        let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
            current: 200,
            direction: -1,
            whiteKeyWidth: whiteKeyWidth,
            maxScrollOffsetX: maxScroll
        )
        XCTAssertEqual(next, 200 - whiteKeyWidth * 5, accuracy: 0.001)
    }

    func testSteppedScrollOffsetXClampsAtLeftEdge() {
        let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
            current: 50,
            direction: -1,
            whiteKeyWidth: whiteKeyWidth,
            maxScrollOffsetX: maxScroll
        )
        XCTAssertEqual(next, 0, accuracy: 0.001)
    }

    func testSteppedScrollOffsetXClampsAtRightEdge() {
        let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
            current: 480,
            direction: 1,
            whiteKeyWidth: whiteKeyWidth,
            maxScrollOffsetX: maxScroll
        )
        XCTAssertEqual(next, maxScroll, accuracy: 0.001)
    }

    func testSteppedScrollOffsetXUnchangedWhenMaxScrollIsZero() {
        let next = PianoKeyboardScrollGeometry.steppedScrollOffsetX(
            current: 0,
            direction: 1,
            whiteKeyWidth: whiteKeyWidth,
            maxScrollOffsetX: 0
        )
        XCTAssertEqual(next, 0, accuracy: 0.001)
    }

    func testEarTrainingScrollBarHeightIsTallerThanSurvivalBar() {
        XCTAssertGreaterThan(
            PianoKeyboardScrollGeometry.earTrainingScrollBarHeight,
            PianoKeyboardScrollGeometry.dragBarHeight
        )
        XCTAssertEqual(PianoKeyboardScrollGeometry.earTrainingScrollBarHeight, 30, accuracy: 0.001)
    }
}
