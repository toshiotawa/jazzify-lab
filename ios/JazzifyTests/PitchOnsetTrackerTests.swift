import XCTest
@testable import Jazzify

final class PitchOnsetTrackerTests: XCTestCase {
    private struct GoldenConfig: Decodable {
        let onsetLevelDb: Double
        let releaseLevelDb: Double
        let minConfidence: Double
        let pitchStableFrames: Int
        let releaseFrames: Int
        let minNoteFrames: Int
        let attackRiseDb: Double
        let retriggerGuardFrames: Int
        let centsTolerance: Double
        let onsetImmediateConfidence: Double?
    }

    private struct GoldenFrame: Decodable {
        let prediction: Double
        let confidence: Double
        let volume: Double
    }

    private struct GoldenEvent: Decodable, Equatable {
        let type: String
        let note: Int
        let frameIndex: Int
        let onsetFrameIndex: Int?
    }

    private struct GoldenFixture: Decodable {
        let config: GoldenConfig
        let frames: [GoldenFrame]
        let expectedEvents: [GoldenEvent]
    }

    func testMatchesGoldenFixture() throws {
        let bundle = Bundle(for: PitchOnsetTrackerTests.self)
        let url = bundle.url(forResource: "onsetGolden", withExtension: "json")
            ?? URL(fileURLWithPath: #filePath)
                .deletingLastPathComponent()
                .deletingLastPathComponent()
                .deletingLastPathComponent()
                .appendingPathComponent("src/utils/pitchInput/__fixtures__/onsetGolden.json")
        let data = try Data(contentsOf: url)
        let fixture = try JSONDecoder().decode(GoldenFixture.self, from: data)

        var config = PitchOnsetTrackerConfig()
        config.onsetLevelDb = fixture.config.onsetLevelDb
        config.releaseLevelDb = fixture.config.releaseLevelDb
        config.minConfidence = fixture.config.minConfidence
        config.pitchStableFrames = fixture.config.pitchStableFrames
        config.releaseFrames = fixture.config.releaseFrames
        config.minNoteFrames = fixture.config.minNoteFrames
        config.attackRiseDb = fixture.config.attackRiseDb
        config.retriggerGuardFrames = fixture.config.retriggerGuardFrames
        config.centsTolerance = fixture.config.centsTolerance
        if let immediate = fixture.config.onsetImmediateConfidence {
            config.onsetImmediateConfidence = immediate
        }

        let tracker = PitchOnsetTracker(config: config)
        var allEvents: [GoldenEvent] = []

        for (index, frame) in fixture.frames.enumerated() {
            let pitchFrame = PitchFrame(
                prediction: frame.prediction,
                confidence: frame.confidence,
                volume: frame.volume
            )
            let events = tracker.processFrame(pitchFrame, frameIndex: index)
            for event in events {
                switch event {
                case let .noteOn(note, frameIndex, onsetFrameIndex):
                    allEvents.append(
                        GoldenEvent(
                            type: "noteOn",
                            note: note,
                            frameIndex: frameIndex,
                            onsetFrameIndex: onsetFrameIndex
                        )
                    )
                case let .noteOff(note, frameIndex):
                    allEvents.append(
                        GoldenEvent(type: "noteOff", note: note, frameIndex: frameIndex, onsetFrameIndex: nil)
                    )
                }
            }
        }

        XCTAssertEqual(allEvents, fixture.expectedEvents)
    }

    func testIgnoresNonFinitePredictionWithoutCrashing() {
        let tracker = PitchOnsetTracker()
        let loud = PitchFrame(prediction: .infinity, confidence: 0.95, volume: 0.5)
        let nan = PitchFrame(prediction: .nan, confidence: 0.95, volume: 0.5)
        let huge = PitchFrame(prediction: 1_000_000, confidence: 0.95, volume: 0.5)

        XCTAssertTrue(tracker.processFrame(loud, frameIndex: 0).isEmpty)
        XCTAssertTrue(tracker.processFrame(nan, frameIndex: 1).isEmpty)
        XCTAssertTrue(tracker.processFrame(huge, frameIndex: 2).isEmpty)
        XCTAssertEqual(tracker.getCurrentNote(), -1)
    }

    func testIgnoresNonFiniteConfidenceOrVolume() {
        let tracker = PitchOnsetTracker()
        let badConfidence = PitchFrame(prediction: 60, confidence: .nan, volume: 0.5)
        let badVolume = PitchFrame(prediction: 60, confidence: 0.95, volume: -.infinity)

        XCTAssertTrue(tracker.processFrame(badConfidence, frameIndex: 0).isEmpty)
        XCTAssertTrue(tracker.processFrame(badVolume, frameIndex: 1).isEmpty)
        XCTAssertEqual(tracker.getCurrentNote(), -1)
    }

    func testIgnoresOctaveJumpWithoutAttackRiseWhileSustaining() {
        var config = PitchOnsetTrackerConfig()
        config.pitchStableFrames = 1
        config.onsetImmediateConfidence = 2
        let tracker = PitchOnsetTracker(config: config)
        let voiced60 = PitchFrame(prediction: 60, confidence: 0.9, volume: 0.01)
        let voiced72 = PitchFrame(prediction: 72, confidence: 0.9, volume: 0.0105)

        _ = tracker.processFrame(voiced60, frameIndex: 0)
        _ = tracker.processFrame(voiced60, frameIndex: 1)
        XCTAssertTrue(tracker.processFrame(voiced72, frameIndex: 2).isEmpty)
        XCTAssertEqual(tracker.getCurrentNote(), 60)
    }

    func testScalesMinConfidenceWithSensitivity() {
        let low = PitchOnsetSensitivity.scaleConfig(sensitivity: 1)
        let mid = PitchOnsetSensitivity.scaleConfig(sensitivity: 5)
        let nine = PitchOnsetSensitivity.scaleConfig(sensitivity: 9)
        let high = PitchOnsetSensitivity.scaleConfig(sensitivity: 10)
        XCTAssertEqual(low.minConfidence, 0.65, accuracy: 0.0001)
        XCTAssertEqual(mid.minConfidence, 0.5, accuracy: 0.0001)
        XCTAssertEqual(nine.minConfidence, 0.30, accuracy: 0.0001)
        XCTAssertEqual(high.minConfidence, 0.28, accuracy: 0.0001)
        XCTAssertGreaterThan(low.onsetLevelDb, high.onsetLevelDb)
    }

    func testSwitchesLegatoInOneFrameOnlyWhenFastResponseAndConfidenceIsAtLeast08() {
        var config = PitchOnsetTrackerConfig()
        config.pitchStableFrames = 2
        config.fastResponse = true
        config.fastLegatoConfidence = 0.8
        let tracker = PitchOnsetTracker(config: config)
        let voiced60 = PitchFrame(prediction: 60, confidence: 0.9, volume: 0.01)
        let voiced64 = PitchFrame(prediction: 64, confidence: 0.8, volume: 0.012)

        _ = tracker.processFrame(voiced60, frameIndex: 0)
        let events = tracker.processFrame(voiced64, frameIndex: 1)
        XCTAssertEqual(events.count, 2)
        if case let .noteOff(note, frameIndex) = events[0] {
            XCTAssertEqual(note, 60)
            XCTAssertEqual(frameIndex, 1)
        } else {
            XCTFail("Expected noteOff first")
        }
        if case let .noteOn(note, frameIndex, onsetFrameIndex) = events[1] {
            XCTAssertEqual(note, 64)
            XCTAssertEqual(frameIndex, 1)
            XCTAssertEqual(onsetFrameIndex, 1)
        } else {
            XCTFail("Expected noteOn second")
        }
    }

    func testUsesTwoHitsInThreeFramesWhenFastResponseIsOff() {
        var config = PitchOnsetTrackerConfig()
        config.pitchStableFrames = 4
        config.fastResponse = false
        let tracker = PitchOnsetTracker(config: config)
        let voiced60 = PitchFrame(prediction: 60, confidence: 0.95, volume: 0.01)
        let voiced64 = PitchFrame(prediction: 64, confidence: 0.95, volume: 0.012)

        _ = tracker.processFrame(voiced60, frameIndex: 0)
        XCTAssertTrue(tracker.processFrame(voiced64, frameIndex: 1).isEmpty)
        let events = tracker.processFrame(voiced64, frameIndex: 2)
        XCTAssertEqual(events.count, 2)
        if case let .noteOff(note, frameIndex) = events[0] {
            XCTAssertEqual(note, 60)
            XCTAssertEqual(frameIndex, 2)
        } else {
            XCTFail("Expected noteOff first")
        }
        if case let .noteOn(note, frameIndex, onsetFrameIndex) = events[1] {
            XCTAssertEqual(note, 64)
            XCTAssertEqual(frameIndex, 2)
            XCTAssertEqual(onsetFrameIndex, 1)
        } else {
            XCTFail("Expected noteOn second")
        }
    }

    func testAdoptsExpectedPitchClassAfterTwoFramesBelowNormalConfidence() {
        var config = PitchOnsetTrackerConfig()
        config.pitchStableFrames = 4
        config.minConfidence = 0.5
        config.expectedAssistConfidence = 0.38
        let tracker = PitchOnsetTracker(config: config)
        tracker.setExpectedPitchMask(1 << 10)
        let bb = PitchFrame(prediction: 58, confidence: 0.38, volume: 0.01)
        XCTAssertTrue(tracker.processFrame(bb, frameIndex: 0).isEmpty)
        let events = tracker.processFrame(bb, frameIndex: 1)
        XCTAssertEqual(events.count, 1)
        if case let .noteOn(note, frameIndex, onsetFrameIndex) = events[0] {
            XCTAssertEqual(note, 58)
            XCTAssertEqual(frameIndex, 1)
            XCTAssertEqual(onsetFrameIndex, 0)
        } else {
            XCTFail("Expected noteOn")
        }
    }

    func testDoesNotAdoptNonExpectedPitchAtAssistConfidence() {
        var config = PitchOnsetTrackerConfig()
        config.pitchStableFrames = 4
        config.minConfidence = 0.5
        config.expectedAssistConfidence = 0.38
        let tracker = PitchOnsetTracker(config: config)
        tracker.setExpectedPitchMask(1 << 10)
        let other = PitchFrame(prediction: 60, confidence: 0.38, volume: 0.01)
        XCTAssertTrue(tracker.processFrame(other, frameIndex: 0).isEmpty)
        XCTAssertEqual(tracker.getCurrentNote(), -1)
    }

    func testDoesNotEmitNoteOffWhenOnlyConfidenceDips() {
        var config = PitchOnsetTrackerConfig()
        config.pitchStableFrames = 1
        config.releaseFrames = 2
        config.minNoteFrames = 1
        config.onsetImmediateConfidence = 2
        let tracker = PitchOnsetTracker(config: config)
        let voiced = PitchFrame(prediction: 60, confidence: 0.9, volume: 0.01)
        let lowConfidence = PitchFrame(prediction: 60, confidence: 0.1, volume: 0.01)

        _ = tracker.processFrame(voiced, frameIndex: 0)
        _ = tracker.processFrame(lowConfidence, frameIndex: 1)
        _ = tracker.processFrame(lowConfidence, frameIndex: 2)
        XCTAssertEqual(tracker.getCurrentNote(), 60)
        XCTAssertTrue(tracker.processFrame(lowConfidence, frameIndex: 3).isEmpty)
    }

    func testDoesNotImmediateNoteOnForMultiCandidateExpectedAssist() {
        var config = PitchOnsetTrackerConfig()
        config.pitchStableFrames = 4
        config.expectedAssistConfidence = 0.38
        let tracker = PitchOnsetTracker(config: config)
        tracker.setExpectedPitchCandidates(mask: (1 << 0) | (1 << 2) | (1 << 4), midis: [60, 62, 64])
        let d = PitchFrame(prediction: 62, confidence: 0.38, volume: 0.01)
        XCTAssertTrue(tracker.processFrame(d, frameIndex: 0).isEmpty)
        XCTAssertEqual(tracker.getCurrentNote(), -1)
    }

    func testAllowsExpectedOctaveJumpWithLegatoStability() {
        var config = PitchOnsetTrackerConfig()
        config.pitchStableFrames = 1
        config.fastResponse = false
        config.attackRiseDb = 6
        config.onsetImmediateConfidence = 2
        let tracker = PitchOnsetTracker(config: config)
        let c4 = PitchFrame(prediction: 60, confidence: 0.9, volume: 0.01)
        let c5a = PitchFrame(prediction: 72, confidence: 0.9, volume: 0.0105)
        let c5b = PitchFrame(prediction: 72, confidence: 0.9, volume: 0.0105)

        let startEvents = tracker.processFrame(c4, frameIndex: 0)
        XCTAssertEqual(startEvents.count, 1)
        tracker.setExpectedPitchCandidates(mask: 1 << 0, midis: [72])
        _ = tracker.processFrame(c5a, frameIndex: 1)
        let events = tracker.processFrame(c5b, frameIndex: 2)
        XCTAssertEqual(events.count, 2)
    }

    func testEmitsNoteOnAfterRetriggerGuardWithoutAttackRise() {
        var config = PitchOnsetTrackerConfig()
        config.pitchStableFrames = 1
        config.releaseFrames = 1
        config.minNoteFrames = 1
        config.attackRiseDb = 80
        config.retriggerLookbackFrames = 4
        config.retriggerGuardFrames = 6
        config.onsetImmediateConfidence = 2
        let tracker = PitchOnsetTracker(config: config)
        let voiced = PitchFrame(prediction: 60, confidence: 0.9, volume: 0.01)
        let quiet = PitchFrame(prediction: 60, confidence: 0.9, volume: 1e-8)

        _ = tracker.processFrame(voiced, frameIndex: 0)
        _ = tracker.processFrame(quiet, frameIndex: 1)
        for frameIndex in 2..<7 {
            _ = tracker.processFrame(quiet, frameIndex: frameIndex)
        }
        let events = tracker.processFrame(voiced, frameIndex: 7)
        XCTAssertEqual(events.count, 1)
        if case let .noteOn(note, frameIndex, _) = events[0] {
            XCTAssertEqual(note, 60)
            XCTAssertEqual(frameIndex, 7)
        } else {
            XCTFail("Expected noteOn")
        }
    }
}
