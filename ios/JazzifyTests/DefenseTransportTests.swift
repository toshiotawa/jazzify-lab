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
        XCTAssertEqual(plan.cutAt, 12, accuracy: 0.0001)
        XCTAssertEqual(plan.switchAt - plan.cutAt, 0.2, accuracy: 0.0001)
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

extension DefenseTransportTests {
    func testCallResponseFourPairsAndLoopWrap() {
        guard let config = DefenseCallResponse.Config(audioLoopBars: 8, callBars: 1, beatsPerBar: 4) else {
            XCTFail("Invalid config")
            return
        }
        for pair in 0..<4 {
            let call = DefenseCallResponse.atBeat(Double(pair * 8), bpm: 120, playbackRatio: 1, config: config)
            XCTAssertEqual(call.phase, .call)
            XCTAssertEqual(call.pairIndex, pair)
            XCTAssertFalse(call.judgmentOpen)
            let response = DefenseCallResponse.atBeat(Double(pair * 8 + 4), bpm: 120, playbackRatio: 1, config: config)
            XCTAssertEqual(response.phase, .response)
            XCTAssertEqual(response.pairIndex, pair)
            XCTAssertTrue(response.judgmentOpen)
        }
        XCTAssertEqual(DefenseCallResponse.atBeat(32, bpm: 120, playbackRatio: 1, config: config).phase, .call)
    }

    func testCallResponseThirtyMillisecondJudgingLead() {
        guard let config = DefenseCallResponse.Config(audioLoopBars: 8, callBars: 1, beatsPerBar: 4) else {
            XCTFail("Invalid config")
            return
        }
        let before = DefenseCallResponse.atBeat(4 - 0.031 * 2, bpm: 120, playbackRatio: 1, config: config)
        let lead = DefenseCallResponse.atBeat(4 - 0.029 * 2, bpm: 120, playbackRatio: 1, config: config)
        XCTAssertFalse(before.judgmentOpen)
        XCTAssertEqual(lead.phase, .call)
        XCTAssertTrue(lead.judgmentOpen)
        XCTAssertFalse(DefenseCallResponse.atBeat(8, bpm: 120, playbackRatio: 1, config: config).judgmentOpen)
        XCTAssertNil(DefenseCallResponse.Config(audioLoopBars: 8, callBars: 3, beatsPerBar: 4))
    }
}
