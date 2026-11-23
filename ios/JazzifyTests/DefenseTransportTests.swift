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

    func testElapsedFromTransportMatchesListenPlayClock() {
        let transportStart = 100.0
        let latency = 0.02
        let hostNow = 105.5
        XCTAssertEqual(
            DefenseTransport.elapsedFromTransport(
                hostNow: hostNow,
                presentationLatency: latency,
                transportStart: transportStart
            ),
            5.48,
            accuracy: 0.0001
        )
    }

    func testTransportStartForResumePreservesElapsed() {
        let pausedElapsed = 5.48
        let resumeAt = 200.0
        let transportStart = DefenseTransport.transportStartForResume(
            resumeAt: resumeAt,
            pausedElapsedSec: pausedElapsed
        )
        XCTAssertEqual(transportStart, 194.52, accuracy: 0.0001)
        XCTAssertEqual(
            DefenseTransport.elapsedFromTransport(
                hostNow: resumeAt,
                presentationLatency: 0,
                transportStart: transportStart
            ),
            pausedElapsed,
            accuracy: 0.0001
        )
    }

    func testBarIndexStableAcrossPauseResume() {
        let barSec = 2.0
        let elapsed = 5.1
        let barBefore = DefenseTransport.barIndex(elapsedFromTransportSec: elapsed, barSec: barSec)
        let resumeAt = 300.0
        let transport = DefenseTransport.transportStartForResume(resumeAt: resumeAt, pausedElapsedSec: elapsed)
        let barAfter = DefenseTransport.barIndex(
            elapsedFromTransportSec: DefenseTransport.elapsedFromTransport(
                hostNow: resumeAt,
                presentationLatency: 0,
                transportStart: transport
            ),
            barSec: barSec
        )
        XCTAssertEqual(barBefore, barAfter)
        XCTAssertEqual(barBefore, 2)
    }

    func testShiftHostDeadlineTracksPauseDelta() {
        let deadline = 150.0
        let pauseDelta = 8.25
        XCTAssertEqual(
            DefenseTransport.shiftHostDeadline(deadline: deadline, pauseDeltaHostSec: pauseDelta),
            158.25,
            accuracy: 0.0001
        )
    }

    func testElapsedFromPlayerSampleClampsBeforeOnset() {
        XCTAssertEqual(
            DefenseTransport.elapsedFromPlayerSample(
                sampleTime: -100,
                sampleRate: 44100,
                playbackRate: 1,
                startOffsetSec: 0,
                hostDeltaSec: 0,
                presentationLatency: 0.02
            ),
            0,
            accuracy: 0.0001
        )
    }

    func testElapsedFromPlayerSampleMatchesRateAndOffset() {
        let sampleTime: Int64 = 44100
        XCTAssertEqual(
            DefenseTransport.elapsedFromPlayerSample(
                sampleTime: sampleTime,
                sampleRate: 44100,
                playbackRate: 0.8,
                startOffsetSec: 1.25,
                hostDeltaSec: 0.01,
                presentationLatency: 0
            ),
            1.25 + 1.25 + 0.01,
            accuracy: 0.001
        )
    }

    func testTransportStartFromAudibleElapsed() {
        XCTAssertEqual(
            DefenseTransport.transportStartFromAudibleElapsed(hostNow: 12.5, audibleElapsedSec: 2.5),
            10.0,
            accuracy: 0.0001
        )
    }

    func testNextBarTargetPlayerSampleMidBar() {
        let barFrames: Int64 = 44_100
        let target = DefenseTransport.nextBarTargetPlayerSample(
            currentPlayerSample: 30_000,
            startOffsetFrames: 0,
            barFrames: barFrames,
            minLeadFrames: 0
        )
        XCTAssertEqual(target, barFrames)
    }

    func testNextBarTargetPlayerSampleNearBarEndUsesNextBar() {
        let barFrames: Int64 = 44_100
        let lead: Int64 = 661
        let target = DefenseTransport.nextBarTargetPlayerSample(
            currentPlayerSample: barFrames - 400,
            startOffsetFrames: 0,
            barFrames: barFrames,
            minLeadFrames: lead
        )
        XCTAssertEqual(target, barFrames * 2)
    }

    func testNextBarTargetPlayerSampleWithOffset() {
        let barFrames: Int64 = 22_050
        let offset: Int64 = 5_000
        let target = DefenseTransport.nextBarTargetPlayerSample(
            currentPlayerSample: 10_000,
            startOffsetFrames: offset,
            barFrames: barFrames,
            minLeadFrames: 0
        )
        XCTAssertEqual(target, barFrames - offset)
    }

    func testElapsedFromPlayerSampleNegativeHostDelta() {
        XCTAssertEqual(
            DefenseTransport.elapsedFromPlayerSample(
                sampleTime: 44_100,
                sampleRate: 44_100,
                playbackRate: 1,
                startOffsetSec: 0,
                hostDeltaSec: -0.02,
                presentationLatency: 0
            ),
            1.0 - 0.02,
            accuracy: 0.001
        )
    }
}
