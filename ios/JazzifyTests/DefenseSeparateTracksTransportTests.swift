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

    func testReservationNearBoundaryTargetsNextCycle() {
        let plan = DefenseSeparateTracksTransport.planPhraseReservation(
            absoluteCycle: 3,
            phaseFrame: 174000,
            cycleFrames: 176400,
            beatFrames: 22050,
            phraseIndex: 2,
            revision: 2,
            generation: 1
        )
        XCTAssertEqual(plan.targetCycle, 4)
        XCTAssertEqual(plan.phraseIndex, 2)
        XCTAssertFalse(plan.immediate)
    }

    func testReservationAtBoundaryIsImmediate() {
        let plan = DefenseSeparateTracksTransport.planPhraseReservation(
            absoluteCycle: 4,
            phaseFrame: 0,
            cycleFrames: 176400,
            beatFrames: 22050,
            phraseIndex: 0,
            revision: 3,
            generation: 1
        )
        XCTAssertEqual(plan.targetCycle, 4)
        XCTAssertTrue(plan.immediate)
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

    func testSourceFrameCountValidAllowsOneFrame() {
        XCTAssertTrue(
            DefenseSeparateTracksTransport.isSourceFrameCountValid(actualFrames: 793_801, expectedFrames: 793_800)
        )
        XCTAssertFalse(
            DefenseSeparateTracksTransport.isSourceFrameCountValid(actualFrames: 793_802, expectedFrames: 793_800)
        )
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

    func testSourceFormatUsesPreparedSampleRate() {
        let grid = DefenseSeparateTracksTransport.computeGrid(
            sampleRate: 44100,
            bpm: 120,
            beatsPerBar: 4,
            phraseBars: .two,
            progressionBars: 12,
            playbackRatio: 1
        )
        let format = DefenseSeparateTracksPlayback.sourceFormat(sampleRate: grid.sampleRate)
        XCTAssertEqual(format.sampleRate, 44100, accuracy: 0.001)
        XCTAssertEqual(format.channelCount, 2)
    }

    func testMelodyLoopCrossfadeDoesNotSilenceFirstSample() {
        var samples = [Float](repeating: 0, count: 4410)
        samples[0] = 0.8
        samples[samples.count - 1] = 0.2
        DefenseSeparateTracksBuffers.applyMelodyLoopCrossfade(&samples, sampleRate: 44100)
        XCTAssertGreaterThan(samples.first ?? 0, 0.1)
    }

    func testMelodyLoopCrossfadePreservesBoundaryTransient() {
        var samples = [Float](repeating: 0, count: 4410)
        let overlapFrames = max(1, Int((44100 * 0.015).rounded()))
        samples[0] = 0.9
        samples[1] = 0.7
        samples[samples.count - overlapFrames] = 0.3
        DefenseSeparateTracksBuffers.applyMelodyLoopCrossfade(&samples, sampleRate: 44100)
        XCTAssertGreaterThan(samples[0], 0.2)
        XCTAssertGreaterThan(samples[1], 0.05)
    }

    func testMelodyLoopCrossfadePreservesInteriorSamples() {
        var samples = [Float](repeating: 0.75, count: 4410)
        DefenseSeparateTracksBuffers.applyMelodyLoopCrossfade(&samples, sampleRate: 44100)
        XCTAssertEqual(samples[2205], 0.75, accuracy: 0.0001)
    }

    func testPhraseSwitchUsesAudiblePhaseFrameNotHostClock() {
        let grid = DefenseSeparateTracksTransport.computeGrid(
            sampleRate: 44100,
            bpm: 120,
            beatsPerBar: 4,
            phraseBars: .two,
            progressionBars: 12,
            playbackRatio: 1
        )
        let phraseZero = DefenseSeparateTracksPhrasePcm(
            left: [Float](repeating: 0.1, count: grid.cycleFrames),
            right: [Float](repeating: 0.1, count: grid.cycleFrames)
        )
        let phraseOne = DefenseSeparateTracksPhrasePcm(
            left: [Float](repeating: 0.9, count: grid.cycleFrames),
            right: [Float](repeating: 0.9, count: grid.cycleFrames)
        )
        let prepared = DefenseSeparateTracksPreparedSet(
            grid: grid,
            bgmLeft: [Float](repeating: 0.2, count: grid.bgmFrames),
            bgmRight: [Float](repeating: 0.2, count: grid.bgmFrames),
            phrasePcms: [phraseZero, phraseOne],
            speedPercent: 100,
            setId: 99
        )
        let state = DefenseSeparateTracksMixerState(
            preparedSet: prepared,
            sessionGeneration: 1,
            initialPhraseIndex: 0
        )
        state.absoluteCycle = 0
        state.phaseFrame = grid.beatFrames

        var left = [Float](repeating: 0, count: grid.cycleFrames)
        var right = [Float](repeating: 0, count: grid.cycleFrames)
        left.withUnsafeMutableBufferPointer { leftPointer in
            right.withUnsafeMutableBufferPointer { rightPointer in
                guard let leftBase = leftPointer.baseAddress,
                      let rightBase = rightPointer.baseAddress else {
                    XCTFail("scratch buffers unavailable")
                    return
                }
                _ = DefenseSeparateTracksMix.renderBlock(
                    state: state,
                    outputLeft: leftBase,
                    outputRight: rightBase,
                    blockFrames: grid.cycleFrames,
                    phraseRequest: DefenseSeparateTracksPhraseRequest(
                        phraseIndex: 1,
                        revision: 1,
                        generation: 1
                    ),
                    tempoRequest: nil,
                    phraseEvalAbsoluteCycle: state.absoluteCycle,
                    phraseEvalPhaseFrame: state.phaseFrame
                )
            }
        }

        XCTAssertEqual(state.audiblePhraseIndex, 1)
        XCTAssertGreaterThan(left[grid.beatFrames], 0.5)
    }

    func testMixPausedBlockIsSilent() {
        let grid = DefenseSeparateTracksTransport.computeGrid(
            sampleRate: 44100,
            bpm: 120,
            beatsPerBar: 4,
            phraseBars: .two,
            progressionBars: 12,
            playbackRatio: 1
        )
        let phrase = DefenseSeparateTracksPhrasePcm(
            left: [Float](repeating: 1, count: grid.cycleFrames),
            right: [Float](repeating: 1, count: grid.cycleFrames)
        )
        let prepared = DefenseSeparateTracksPreparedSet(
            grid: grid,
            bgmLeft: [Float](repeating: 1, count: grid.bgmFrames),
            bgmRight: [Float](repeating: 1, count: grid.bgmFrames),
            phrasePcms: [phrase],
            speedPercent: 100,
            setId: 1
        )
        let state = DefenseSeparateTracksMixerState(
            preparedSet: prepared,
            sessionGeneration: 1,
            initialPhraseIndex: 0
        )
        state.paused = true

        var left = [Float](repeating: 9, count: 64)
        var right = [Float](repeating: 9, count: 64)
        left.withUnsafeMutableBufferPointer { leftPointer in
            right.withUnsafeMutableBufferPointer { rightPointer in
                guard let leftBase = leftPointer.baseAddress,
                      let rightBase = rightPointer.baseAddress else {
                    XCTFail("scratch buffers unavailable")
                    return
                }
                _ = DefenseSeparateTracksMix.renderBlock(
                    state: state,
                    outputLeft: leftBase,
                    outputRight: rightBase,
                    blockFrames: 64,
                    phraseRequest: nil,
                    tempoRequest: nil,
                    phraseEvalAbsoluteCycle: state.absoluteCycle,
                    phraseEvalPhaseFrame: state.phaseFrame
                )
            }
        }

        XCTAssertTrue(left.allSatisfy { $0 == 0 })
        XCTAssertTrue(right.allSatisfy { $0 == 0 })
    }
}
