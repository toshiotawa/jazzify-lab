import XCTest
@testable import Jazzify

final class DefenseSeparateTracksTransportTests: XCTestCase {
    func testGridMatchesWebFixtureDefault() {
        let grid = DefenseSeparateTracksTransport.computeGrid(
            sampleRate: 44100,
            bpm: 120,
            beatsPerBar: 4,
            phraseBars: .two,
            progressionBars: 12,
            playbackRatio: 1
        )
        XCTAssertEqual(grid.cycleFrames, 176400)
        XCTAssertEqual(grid.cyclesPerForm, 6)
        XCTAssertEqual(grid.bgmFrames, 1058400)
    }

    func testPhraseWindowRankOne() {
        let window = DefenseSeparateTracksTransport.phraseLoopWindow(
            rank: 1,
            phraseBars: .two,
            bpm: 120,
            beatsPerBar: 4,
            sampleRate: 44100
        )
        XCTAssertEqual(window.startMeasure, 3)
        XCTAssertEqual(window.endMeasure, 4)
        XCTAssertEqual(window.sourceStartFrame, 176400)
        XCTAssertEqual(window.sourceEndFrame, 352800)
    }

    func testReservationNearBoundarySkipsCycle() {
        let plan = DefenseSeparateTracksTransport.planPhraseReservation(
            absoluteCycle: 3,
            phaseFrame: 174000,
            cycleFrames: 176400,
            leadFrames: 4410,
            phraseIndex: 2,
            revision: 2,
            generation: 1
        )
        XCTAssertEqual(plan.targetCycle, 5)
        XCTAssertEqual(plan.phraseIndex, 2)
    }

    func testBeatInFormCycleTwoHalf() {
        let beat = DefenseSeparateTracksTransport.beatInForm(
            absoluteCycle: 2,
            phaseFrame: 88200,
            cycleFrames: 176400,
            phraseBars: 2,
            beatsPerBar: 4,
            cyclesPerForm: 6
        )
        XCTAssertEqual(beat, 20, accuracy: 0.001)
    }

    func testBgmReadFrameWrapsWithinForm() {
        let frame = DefenseSeparateTracksTransport.bgmReadFrame(
            absoluteCycle: 7,
            phaseFrame: 100,
            cycleFrames: 176400,
            cyclesPerForm: 6
        )
        XCTAssertEqual(frame, 176400 + 100)
    }
}
