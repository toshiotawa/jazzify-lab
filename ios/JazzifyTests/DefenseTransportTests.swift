import XCTest
@testable import Jazzify

final class DefenseTransportTests: XCTestCase {
    func testBarSamples120Bpm44() {
        let samples = DefenseTransport.barSamples(sampleRate: 44100, bpm: 120, beatsPerBar: 4)
        XCTAssertEqual(samples, 88200)
    }

    func testBarSeconds120Bpm44() {
        XCTAssertEqual(DefenseTransport.barSeconds(bpm: 120, beatsPerBar: 4), 2, accuracy: 0.0001)
    }

    func testNextSwitchTimeTargetsNextBarHead() {
        XCTAssertEqual(
            DefenseTransport.nextSwitchTime(now: 11.2, transportStart: 10, barSec: 2, deadlineSec: 0.1),
            12,
            accuracy: 0.0001
        )
    }

    func testNextSwitchTimeSkipsBarWhenDeadlineWouldBeMissed() {
        XCTAssertEqual(
            DefenseTransport.nextSwitchTime(now: 11.95, transportStart: 10, barSec: 2, deadlineSec: 0.1),
            14,
            accuracy: 0.0001
        )
    }

    func testNextSwitchSample() {
        let bar: Int64 = 88200
        let switchAt = DefenseTransport.nextSwitchSample(
            transportSample: 90000,
            barSamples: bar,
            deadlineSamples: 2205
        )
        XCTAssertEqual(switchAt, 176400)
    }
}
