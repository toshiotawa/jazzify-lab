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
}
