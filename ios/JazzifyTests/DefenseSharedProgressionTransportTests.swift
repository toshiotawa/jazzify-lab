import XCTest
@testable import Jazzify

final class DefenseSharedProgressionTransportTests: XCTestCase {
    private let progressionBars = 12
    private let barSec = DefenseSharedProgressionTransport.barSeconds(bpm: 120, beatsPerBar: 4, playbackRatio: 1)

    func testOneBarBoundaries() {
        let planAtFive = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: 5,
            transportStart: 0,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: .one,
            schedulingLeadSec: 0
        )
        XCTAssertEqual(planAtFive.switchAt, 6)
        XCTAssertEqual(planAtFive.destinationBar0, 3)

        let planAtEleven = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: 11,
            transportStart: 0,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: .one,
            schedulingLeadSec: 0
        )
        XCTAssertEqual(planAtEleven.switchAt, 12)
        XCTAssertEqual(planAtEleven.destinationBar0, 6)

        let planAtTwentyThree = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: 23,
            transportStart: 0,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: .one,
            schedulingLeadSec: 0
        )
        XCTAssertEqual(planAtTwentyThree.switchAt, 24)
        XCTAssertEqual(planAtTwentyThree.destinationBar0, 0)
    }

    func testTwoBarBoundaries() {
        let plan = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: 5,
            transportStart: 0,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: .two,
            schedulingLeadSec: 0
        )
        XCTAssertEqual(plan.switchAt, 8)
        XCTAssertEqual(plan.destinationBar0, 4)
    }

    func testFourBarSchedulingLead() {
        let plan = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: 7.95,
            transportStart: 0,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: .four,
            schedulingLeadSec: 0.1
        )
        XCTAssertEqual(plan.switchAt, 16)
        XCTAssertEqual(plan.destinationBar0, 8)
    }
}
