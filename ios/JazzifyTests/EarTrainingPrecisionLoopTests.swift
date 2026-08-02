import AVFoundation
import XCTest
@testable import Jazzify
final class EarTrainingPrecisionLoopTests: XCTestCase {
    private func note(id: String, startSec: Double, measureNumber: Int) -> EarTrainingPrecisionNote {
        EarTrainingPrecisionNote(
            id: id,
            midi: 60,
            startSec: startSec,
            durationSec: 0.5,
            isBlackKey: false,
            measureNumber: measureNumber,
            isShortNote: false
        )
    }

    func testLoopSemitoneForCycleWrapsOnSeventhCycleDown() {
        XCTAssertEqual(EarTrainingPrecisionLoop.loopSemitoneForCycle(7, direction: .down), 5)
        XCTAssertEqual(EarTrainingPrecisionLoop.loopSemitoneForCycle(6, direction: .down), -6)
    }

    func testLoopSemitoneForCycleUpDirection() {
        XCTAssertEqual(EarTrainingPrecisionLoop.loopSemitoneForCycle(1, direction: .up), 1)
        XCTAssertEqual(EarTrainingPrecisionLoop.loopSemitoneForCycle(7, direction: .up), -5)
    }

    func testLoopSemitoneForCycleNoneStaysOriginal() {
        XCTAssertEqual(EarTrainingPrecisionLoop.loopSemitoneForCycle(0, direction: .none), 0)
        XCTAssertEqual(EarTrainingPrecisionLoop.loopSemitoneForCycle(7, direction: .none), 0)
    }

    func testLoopSemitoneForCycleWithBaseSemitone() {
        XCTAssertEqual(EarTrainingPrecisionLoop.loopSemitoneForCycle(0, direction: .none, baseSemitone: 3), 3)
        XCTAssertEqual(EarTrainingPrecisionLoop.loopSemitoneForCycle(2, direction: .down, baseSemitone: 3), 1)
    }

    func testResolveLoopWindowConvertsMeasuresToSeconds() {
        let window = EarTrainingPrecisionLoop.resolveLoopWindow(
            startMeasure: 2,
            endMeasure: 4,
            measureDurationSec: 2
        )
        XCTAssertEqual(window.startMeasure, 2)
        XCTAssertEqual(window.endMeasure, 4)
        XCTAssertEqual(window.startSec, 2, accuracy: 1e-9)
        XCTAssertEqual(window.endSec, 8, accuracy: 1e-9)
        XCTAssertEqual(window.durationSec, 6, accuracy: 1e-9)
    }

    func testGlobalToLoopPositionReturnsCycleAndLocalSec() {
        XCTAssertEqual(
            EarTrainingPrecisionLoop.globalToLoopPosition(13, durationSec: 6).cycleIndex,
            2
        )
        XCTAssertEqual(
            EarTrainingPrecisionLoop.globalToLoopPosition(13, durationSec: 6).localSec,
            1,
            accuracy: 1e-9
        )
        XCTAssertEqual(
            EarTrainingPrecisionLoop.globalToLoopPosition(0, durationSec: 6).cycleIndex,
            0
        )
        XCTAssertEqual(
            EarTrainingPrecisionLoop.globalToLoopPosition(0, durationSec: 6).localSec,
            0,
            accuracy: 1e-9
        )
    }

    func testLoopCycleWindowSizeExpandsForShortLoops() {
        XCTAssertGreaterThanOrEqual(EarTrainingPrecisionLoop.loopCycleWindowSize(durationSec: 2.4), 3)
        XCTAssertEqual(EarTrainingPrecisionLoop.loopCycleWindowSize(durationSec: 8), 2)
    }

    func testBuildLoopWindowNotesOffsetsPerCycle() {
        let notesBySemitone: [Int: [EarTrainingPrecisionNote]] = [
            0: [note(id: "a", startSec: 2.5, measureNumber: 2)],
            -1: [note(id: "b", startSec: 2.5, measureNumber: 2)],
        ]
        let loopWindow = EarTrainingPrecisionLoop.resolveLoopWindow(
            startMeasure: 2,
            endMeasure: 3,
            measureDurationSec: 2
        )
        let built = EarTrainingPrecisionLoop.buildLoopWindowNotes(
            notesBySemitone: notesBySemitone,
            cycleIndex: 1,
            windowSize: 1,
            loopWindow: loopWindow,
            direction: .down
        )
        XCTAssertEqual(built.count, 1)
        XCTAssertEqual(built[0].id, "b#c1")
        XCTAssertEqual(built[0].startSec, 4.5, accuracy: 1e-5)
    }

    func testBuildLoopWindowNotesCycleOneUpUsesTransposedKey() {
        let notesBySemitone: [Int: [EarTrainingPrecisionNote]] = [
            0: [note(id: "a", startSec: 2.5, measureNumber: 2)],
            1: [note(id: "c", startSec: 2.5, measureNumber: 2)],
        ]
        let loopWindow = EarTrainingPrecisionLoop.resolveLoopWindow(
            startMeasure: 2,
            endMeasure: 3,
            measureDurationSec: 2
        )
        let built = EarTrainingPrecisionLoop.buildLoopWindowNotes(
            notesBySemitone: notesBySemitone,
            cycleIndex: 1,
            windowSize: 1,
            loopWindow: loopWindow,
            direction: .up
        )
        XCTAssertEqual(built.count, 1)
        XCTAssertEqual(built[0].id, "c#c1")
        XCTAssertEqual(built[0].startSec, 4.5, accuracy: 1e-5)
    }

    func testBuildLoopWindowNotesMissingTransposedKeyReturnsEmptyForCycle() {
        let notesBySemitone: [Int: [EarTrainingPrecisionNote]] = [
            0: [note(id: "a", startSec: 2.5, measureNumber: 2)],
        ]
        let loopWindow = EarTrainingPrecisionLoop.resolveLoopWindow(
            startMeasure: 2,
            endMeasure: 3,
            measureDurationSec: 2
        )
        let built = EarTrainingPrecisionLoop.buildLoopWindowNotes(
            notesBySemitone: notesBySemitone,
            cycleIndex: 1,
            windowSize: 1,
            loopWindow: loopWindow,
            direction: .up
        )
        XCTAssertTrue(built.isEmpty)
    }

    func testLoopSemitoneForCycleSecondCycleUpAndDown() {
        XCTAssertEqual(EarTrainingPrecisionLoop.loopSemitoneForCycle(1, direction: .up), 1)
        XCTAssertEqual(EarTrainingPrecisionLoop.loopSemitoneForCycle(1, direction: .down), -1)
    }

    func testResolveDisplayKeyboardRangeEmptyFallsBackToFull88() {
        let range = EarTrainingPrecisionNotes.resolveDisplayKeyboardRange(noteMidis: [])
        XCTAssertEqual(range.minMidi, 21)
        XCTAssertEqual(range.maxMidi, 108)
    }

    func testLoopPracticeUniqueSemitonesNoneUsesBaseKeyOnly() {
        XCTAssertEqual(EarTrainingPrecisionLoop.loopPracticeUniqueSemitones(direction: .none), [0])
        XCTAssertEqual(EarTrainingPrecisionLoop.loopPracticeUniqueSemitones(direction: .none, baseSemitone: 3), [3])
    }

    func testLoopPracticeUniqueSemitonesDirectionHasTwelveKeys() {
        XCTAssertEqual(EarTrainingPrecisionLoop.loopPracticeUniqueSemitones(direction: .down).count, 12)
        XCTAssertEqual(EarTrainingPrecisionLoop.loopPracticeUniqueSemitones(direction: .down, baseSemitone: 3).count, 12)
    }

    func testLoopActiveMeasureNumberAddsLoopStartMeasure() {
        let loopWindow = EarTrainingPrecisionLoop.resolveLoopWindow(
            startMeasure: 3,
            endMeasure: 5,
            measureDurationSec: 2
        )
        XCTAssertEqual(
            EarTrainingPrecisionLoop.loopActiveMeasureNumber(
                localSec: 0,
                measureDurationSec: 2,
                loopWindow: loopWindow,
                maxMeasure: 8
            ),
            3
        )
        XCTAssertEqual(
            EarTrainingPrecisionLoop.loopActiveMeasureNumber(
                localSec: 2.1,
                measureDurationSec: 2,
                loopWindow: loopWindow,
                maxMeasure: 8
            ),
            4
        )
    }

    func testLoopOsmdTimelineSecWithinLoopWindow() {
        let loopWindow = EarTrainingPrecisionLoop.resolveLoopWindow(
            startMeasure: 2,
            endMeasure: 4,
            measureDurationSec: 2
        )
        let timeline = EarTrainingPrecisionLoop.loopOsmdTimelineSec(
            localSec: 2.5,
            measureDurationSec: 2,
            loopWindow: loopWindow
        )
        XCTAssertEqual(timeline.measureNumber, 3)
        XCTAssertEqual(timeline.phraseTimelineSec, 4.5, accuracy: 1e-9)
    }

    func testLoopTimelineSecBeforeAnchorReturnsNegative() {
        let base = mach_absolute_time()
        let anchor = base &+ AVAudioTime.hostTime(forSeconds: 3)
        let now = base &+ AVAudioTime.hostTime(forSeconds: 1)
        let result = EarTrainingAudio.loopTimelineSec(fromAnchor: anchor, nowHostTime: now)
        XCTAssertNotNil(result)
        XCTAssertLessThan(result ?? 0, -1.9)
        XCTAssertGreaterThan(result ?? 0, -2.1)
    }

    func testLoopTimelineSecAfterAnchorReturnsElapsed() {
        let base = mach_absolute_time()
        let anchor = base
        let now = base &+ AVAudioTime.hostTime(forSeconds: 2.5)
        let result = EarTrainingAudio.loopTimelineSec(fromAnchor: anchor, nowHostTime: now)
        XCTAssertNotNil(result)
        XCTAssertEqual(result ?? 0, 2.5, accuracy: 0.05)
    }
}