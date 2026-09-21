import XCTest
@testable import Jazzify

final class DefenseSharedProgressionTransportTests: XCTestCase {
    private let progressionBars = 12
    private let barSec = DefenseSharedProgressionTransport.barSeconds(bpm: 120, beatsPerBar: 4, playbackRatio: 1)
    private let beatSec = DefenseTransport.beatSeconds(bpm: 120, playbackRatio: 1)

    func testOneBarBoundaries() {
        let planAtFive = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: 5,
            transportStart: 0,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: .one,
            beatSec: beatSec
        )
        XCTAssertEqual(planAtFive.switchAt, 6)
        XCTAssertEqual(planAtFive.destinationBar0, 3)
        XCTAssertFalse(planAtFive.immediate)

        let planAtEleven = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: 11,
            transportStart: 0,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: .one,
            beatSec: beatSec
        )
        XCTAssertEqual(planAtEleven.switchAt, 12)
        XCTAssertEqual(planAtEleven.destinationBar0, 6)
        XCTAssertFalse(planAtEleven.immediate)

        let planAtTwentyThree = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: 23,
            transportStart: 0,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: .one,
            beatSec: beatSec
        )
        XCTAssertEqual(planAtTwentyThree.switchAt, 24)
        XCTAssertEqual(planAtTwentyThree.destinationBar0, 0)
        XCTAssertFalse(planAtTwentyThree.immediate)
    }

    func testTwoBarBoundaries() {
        let plan = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: 5,
            transportStart: 0,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: .two,
            beatSec: beatSec
        )
        XCTAssertEqual(plan.switchAt, 8)
        XCTAssertEqual(plan.destinationBar0, 4)
        XCTAssertFalse(plan.immediate)
    }

    func testFourBarTargetsUpcomingBoundaryInsideOldLeadWindow() {
        let plan = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: 7.95,
            transportStart: 0,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: .four,
            beatSec: beatSec
        )
        XCTAssertEqual(plan.switchAt, 8)
        XCTAssertEqual(plan.destinationBar0, 4)
        XCTAssertFalse(plan.immediate)
    }

    func testImmediateWithinOneBeatAfterBoundary() {
        let plan = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: 8.2,
            transportStart: 0,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: .two,
            beatSec: beatSec
        )
        XCTAssertTrue(plan.immediate)
        XCTAssertEqual(plan.switchAt, 8.2, accuracy: 0.0001)
        XCTAssertEqual(plan.destinationBar0, 4)
    }

    func testFrameCountValidationAllowsAacPadding() {
        let sampleRate = 44100.0
        let expected = DefenseSharedProgressionTransport.expectedFrameCount(
            progressionBars: 12,
            bpm: 160,
            beatsPerBar: 4,
            sampleRate: sampleRate
        )
        XCTAssertEqual(expected, 793_800)
        XCTAssertTrue(
            DefenseSharedProgressionTransport.isFrameCountValid(
                actualFrames: expected + 324,
                expectedFrames: expected,
                sampleRate: sampleRate
            )
        )
        let extraBar = Int((1.5 * sampleRate).rounded())
        XCTAssertFalse(
            DefenseSharedProgressionTransport.isFrameCountValid(
                actualFrames: expected + extraBar,
                expectedFrames: expected,
                sampleRate: sampleRate
            )
        )
    }
}
