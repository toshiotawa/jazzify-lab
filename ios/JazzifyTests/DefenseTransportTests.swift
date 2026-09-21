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

    func testBeatSeconds160Bpm() {
        XCTAssertEqual(DefenseTransport.beatSeconds(bpm: 160, playbackRatio: 1), 0.375, accuracy: 0.0001)
    }

    func testNextSwitchTimeTargetsNextBarHead() {
        XCTAssertEqual(
            DefenseTransport.nextSwitchTime(now: 11.2, transportStart: 10, barSec: 2, deadlineSec: 0.1, beatSec: 0.5),
            12,
            accuracy: 0.0001
        )
    }

    func testNextSwitchTimeKeepsUpcomingBarInsideOldLeadWindow() {
        XCTAssertEqual(
            DefenseTransport.nextSwitchTime(now: 11.95, transportStart: 10, barSec: 2, deadlineSec: 0.1, beatSec: 0.5),
            12,
            accuracy: 0.0001
        )
    }

    func testPlanSwitchImmediateWithinOneBeatAfterCut() {
        let plan = DefenseTransport.planSwitch(
            now: 12.2,
            transportStart: 10,
            cutIntervalSec: 2,
            beatSec: 0.5
        )
        XCTAssertTrue(plan.immediate)
        XCTAssertEqual(plan.switchAt, 12.2, accuracy: 0.0001)
    }

    func testPlanSwitchTargetsSixteenthLeadAt160Bpm() {
        let barSec = 1.5
        let sixteenthBeforeCut = barSec - 0.09375
        let plan = DefenseTransport.planSwitch(
            now: sixteenthBeforeCut,
            transportStart: 0,
            cutIntervalSec: barSec,
            beatSec: 0.375
        )
        XCTAssertFalse(plan.immediate)
        XCTAssertEqual(plan.switchAt, barSec, accuracy: 0.0001)
    }

    func testBarSecondsFromLoopUsesActualLoopLength() {
        XCTAssertEqual(DefenseTransport.barSecondsFromLoop(loopStartSec: 0, loopEndSec: 8, barCount: 4), 2, accuracy: 0.0001)
    }

    func testRebaseTransportStartKeepsBarFraction() {
        XCTAssertEqual(
            DefenseTransport.rebaseTransportStart(now: 11.5, transportStart: 10, oldBarSec: 2, newBarSec: 4),
            8.5,
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
