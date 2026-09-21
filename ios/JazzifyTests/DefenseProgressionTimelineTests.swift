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

    func testLoopPositionToBeatInLoopMapsFourthBarToBeatsTwelveThroughSixteen() {
        let barSec = 2.0
        let beatsPerBar = 4
        XCTAssertEqual(
            DefenseProgressionTimeline.loopPositionToBeatInLoop(
                positionInLoopSec: 0,
                barSec: barSec,
                beatsPerBar: beatsPerBar
            ),
            0,
            accuracy: 1e-9
        )
        XCTAssertEqual(
            DefenseProgressionTimeline.loopPositionToBeatInLoop(
                positionInLoopSec: barSec * 3,
                barSec: barSec,
                beatsPerBar: beatsPerBar
            ),
            12,
            accuracy: 1e-9
        )
        XCTAssertEqual(
            DefenseProgressionTimeline.loopPositionToBeatInLoop(
                positionInLoopSec: barSec * 4,
                barSec: barSec,
                beatsPerBar: beatsPerBar
            ),
            16,
            accuracy: 1e-9
        )
    }

    func testElapsedSecToBeatInLoopStartsAtZeroAfterTransportReset() {
        let barSec = 2.0
        let beatsPerBar = 4
        XCTAssertEqual(
            DefenseProgressionTimeline.elapsedSecToBeatInLoop(
                elapsedSec: 0,
                loopStartSec: 0,
                loopEndSec: 8,
                startOffsetSec: 0,
                barSec: barSec,
                beatsPerBar: beatsPerBar
            ),
            0,
            accuracy: 1e-9
        )
        XCTAssertEqual(
            DefenseProgressionTimeline.elapsedSecToBeatInLoop(
                elapsedSec: 0,
                loopStartSec: 8,
                loopEndSec: 16,
                startOffsetSec: 8,
                barSec: barSec,
                beatsPerBar: beatsPerBar
            ),
            0,
            accuracy: 1e-9
        )
        XCTAssertEqual(
            DefenseProgressionTimeline.elapsedSecToBeatInLoop(
                elapsedSec: barSec,
                loopStartSec: 0,
                loopEndSec: 8,
                startOffsetSec: 0,
                barSec: barSec,
                beatsPerBar: beatsPerBar
            ),
            Double(beatsPerBar),
            accuracy: 1e-9
        )
    }

    func testResolveActiveIndexSelectsFirstChordAfterTransportReset() {
        let stageOneProgression: [DefenseStageProgressionChord] = [
            DefenseStageProgressionChord(orderIndex: 0, chordName: "Dm7", measureNumber: 1, beatOffset: 1, durationBeats: 4),
            DefenseStageProgressionChord(orderIndex: 1, chordName: "G7", measureNumber: 2, beatOffset: 1, durationBeats: 4),
            DefenseStageProgressionChord(orderIndex: 2, chordName: "Dm7", measureNumber: 3, beatOffset: 1, durationBeats: 4),
            DefenseStageProgressionChord(orderIndex: 3, chordName: "G7", measureNumber: 4, beatOffset: 1, durationBeats: 4),
        ]
        let beatInForm = DefenseProgressionTimeline.elapsedSecToBeatInLoop(
            elapsedSec: 0,
            loopStartSec: 0,
            loopEndSec: 8,
            startOffsetSec: 0,
            barSec: 2,
            beatsPerBar: 4
        )
        XCTAssertEqual(
            DefenseProgressionTimeline.resolveActiveIndex(
                chords: stageOneProgression,
                beatInForm: beatInForm,
                formBarCount: 4,
                beatsPerBar: 4
            ),
            0
        )
    }

    func testShouldSyncProgressionHudSyncsPhraseStageWithChords() {
        XCTAssertTrue(
            DefenseProgressionTimeline.shouldSyncProgressionHud(
                isChordVoicingStage: false,
                progressionChordCount: 4
            )
        )
    }

    func testShouldSyncProgressionHudSkipsChordVoicingStage() {
        XCTAssertFalse(
            DefenseProgressionTimeline.shouldSyncProgressionHud(
                isChordVoicingStage: true,
                progressionChordCount: 4
            )
        )
    }

    func testShouldSyncProgressionHudSkipsEmptyProgression() {
        XCTAssertFalse(
            DefenseProgressionTimeline.shouldSyncProgressionHud(
                isChordVoicingStage: false,
                progressionChordCount: 0
            )
        )
    }

    func testResolveHudWindowPagesByFour() {
        XCTAssertEqual(
            DefenseProgressionTimeline.resolveHudWindow(chipCount: 4, activeIndex: 3),
            DefenseProgressionTimeline.HudWindow(firstVisibleIndex: 0, visibleCount: 4)
        )
        XCTAssertEqual(
            DefenseProgressionTimeline.resolveHudWindow(chipCount: 8, activeIndex: 4),
            DefenseProgressionTimeline.HudWindow(firstVisibleIndex: 4, visibleCount: 4)
        )
        XCTAssertEqual(
            DefenseProgressionTimeline.resolveHudWindow(chipCount: 14, activeIndex: 13),
            DefenseProgressionTimeline.HudWindow(firstVisibleIndex: 10, visibleCount: 4)
        )
    }
}
