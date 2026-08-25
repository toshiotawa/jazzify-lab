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
                case let .noteOn(note, frameIndex):
                    allEvents.append(GoldenEvent(type: "noteOn", note: note, frameIndex: frameIndex))
                case let .noteOff(note, frameIndex):
                    allEvents.append(GoldenEvent(type: "noteOff", note: note, frameIndex: frameIndex))
                }
            }
        }

        XCTAssertEqual(allEvents, fixture.expectedEvents)
    }
}
