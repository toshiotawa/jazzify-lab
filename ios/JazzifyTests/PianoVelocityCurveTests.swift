import XCTest
@testable import Jazzify

final class PianoVelocityCurveTests: XCTestCase {
    func testClampsOutOfRangeInput() {
        XCTAssertEqual(PianoVelocityCurve.map(-50), PianoVelocityCurve.map(0))
        XCTAssertEqual(PianoVelocityCurve.map(999), PianoVelocityCurve.map(127))
    }

    func testNeverReturnsSilentVelocity() {
        for raw in -10...200 {
            XCTAssertGreaterThanOrEqual(PianoVelocityCurve.map(raw), 1)
        }
    }

    func testKeepsFullScaleEndpoints() {
        XCTAssertEqual(PianoVelocityCurve.map(127), 127)
    }

    func testIsMonotonicallyIncreasing() {
        var previous = PianoVelocityCurve.map(0)
        for raw in 1...127 {
            let current = PianoVelocityCurve.map(raw)
            XCTAssertGreaterThanOrEqual(current, previous, "velocity \(raw) decreased")
            previous = current
        }
    }

    /// カーブは弱打側へ寄せる方向なので、中間域は生の値を超えない。
    func testShapesTowardsSofterTouch() {
        for raw in 1...126 {
            XCTAssertLessThanOrEqual(Int(PianoVelocityCurve.map(raw)), raw)
        }
        XCTAssertLessThan(PianoVelocityCurve.map(PianoVelocityCurve.screenTapVelocity), PianoVelocityCurve.screenTapVelocity)
    }
}
