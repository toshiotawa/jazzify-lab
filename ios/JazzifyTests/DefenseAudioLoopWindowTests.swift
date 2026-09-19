import AVFoundation
import XCTest
@testable import Jazzify

final class DefenseAudioLoopWindowTests: XCTestCase {
    func testResolveMeasureRangeToSeconds() {
        let window = DefenseAudioLoopWindowResolver.resolve(
            startMeasure: 1,
            endMeasure: 4,
            bpm: 120,
            beatsPerBar: 4
        )
        XCTAssertEqual(window.startSec, 0, accuracy: 0.0001)
        XCTAssertEqual(window.endSec, 8, accuracy: 0.0001)
        XCTAssertEqual(window.durationSec, 8, accuracy: 0.0001)
    }

    func testResolveFrameRangeForLaterPhraseWindow() {
        let range = DefenseAudioLoopWindowResolver.resolveFrameRange(
            startMeasure: 5,
            endMeasure: 8,
            sampleRate: 44100,
            bpm: 120,
            beatsPerBar: 4,
            bufferFrameLength: 44100 * 20
        )
        XCTAssertEqual(range.startFrame, 44100 * 8)
        XCTAssertEqual(range.frameCount, AVAudioFrameCount(44100 * 8))
    }
}
