import XCTest
@testable import Jazzify

final class DefensePracticeSpeedTests: XCTestCase {
    func testClamp() {
        XCTAssertEqual(DefensePracticeSpeed.clamp(40), 50)
        XCTAssertEqual(DefensePracticeSpeed.clamp(160), 150)
        XCTAssertEqual(DefensePracticeSpeed.clamp(100), 100)
    }

    func testRatio() {
        XCTAssertEqual(DefensePracticeSpeed.ratio(100), 1.0, accuracy: 0.0001)
        XCTAssertEqual(DefensePracticeSpeed.ratio(50), 0.5, accuracy: 0.0001)
        XCTAssertEqual(DefensePracticeSpeed.ratio(150), 1.5, accuracy: 0.0001)
    }

    func testStepped() {
        XCTAssertEqual(DefensePracticeSpeed.stepped(100, delta: 1), 110)
        XCTAssertEqual(DefensePracticeSpeed.stepped(100, delta: -1), 90)
        XCTAssertEqual(DefensePracticeSpeed.stepped(150, delta: 1), 150)
        XCTAssertEqual(DefensePracticeSpeed.stepped(50, delta: -1), 50)
    }
}
