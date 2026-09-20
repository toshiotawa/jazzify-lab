import XCTest
@testable import Jazzify

final class DefenseProgressionTimelineTests: XCTestCase {
    private let twoBeatProgression: [DefenseStageProgressionChord] = [
        DefenseStageProgressionChord(orderIndex: 0, chordName: "Dm7", measureNumber: 1, beatOffset: 1, durationBeats: 2),
        DefenseStageProgressionChord(orderIndex: 1, chordName: "G7", measureNumber: 1, beatOffset: 3, durationBeats: 2),
    ]

    func testResolveActiveIndexSelectsG7OnBeatTwo() {
        XCTAssertEqual(
            DefenseProgressionTimeline.resolveActiveIndex(
                chords: twoBeatProgression,
                beatInForm: 2,
                formBarCount: 1,
                beatsPerBar: 4
            ),
            1
        )
    }

    func testResolveActiveIndexKeepsDm7OnBeatZero() {
        XCTAssertEqual(
            DefenseProgressionTimeline.resolveActiveIndex(
                chords: twoBeatProgression,
                beatInForm: 0,
                formBarCount: 1,
                beatsPerBar: 4
            ),
            0
        )
    }
}
