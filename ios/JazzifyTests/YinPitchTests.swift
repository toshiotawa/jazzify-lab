import XCTest
@testable import Jazzify

final class YinPitchTests: XCTestCase {
    func testDetectsE1AsMidi28() {
        let window = Self.sineWindow(frequencyHz: 41.2)
        let result = YinPitch.analyzeWindow(
            window,
            count: window.count,
            sampleRate: YinPitch.sampleRate,
            range: YinPitch.frequencyRange(for: .plus24)
        )
        XCTAssertNotNil(result.frequencyHz)
        XCTAssertEqual(YinPitch.hzToMidi(result.frequencyHz ?? 0), 28, accuracy: 0.6)
    }

    func testDetectsG2AsMidi43() {
        let window = Self.sineWindow(frequencyHz: 98)
        let result = YinPitch.analyzeWindow(
            window,
            count: window.count,
            sampleRate: YinPitch.sampleRate,
            range: YinPitch.frequencyRange(for: .plus12)
        )
        XCTAssertNotNil(result.frequencyHz)
        XCTAssertEqual(YinPitch.hzToMidi(result.frequencyHz ?? 0), 43, accuracy: 0.6)
    }

    func testSilenceHasNoCandidate() {
        let window = [Float](repeating: 0, count: YinPitch.windowSize)
        let result = window.withUnsafeBufferPointer { buffer in
            guard let base = buffer.baseAddress else {
                return YinPitch.AnalysisResult(frequencyHz: nil, confidence: 0, volume: 0)
            }
            return YinPitch.analyzeWindow(
                base,
                count: YinPitch.windowSize,
                sampleRate: YinPitch.sampleRate,
                range: YinPitch.frequencyRange(for: .plus24)
            )
        }
        XCTAssertNil(result.frequencyHz)
        XCTAssertEqual(result.confidence, 0, accuracy: 0.0001)
    }

    private static func sineWindow(frequencyHz: Double) -> [Float] {
        (0..<YinPitch.windowSize).map { index in
            Float(sin(2 * Double.pi * frequencyHz * Double(index) / YinPitch.sampleRate))
        }
    }
}
