import Foundation
import SpriteKit

import XCTest
@testable import Jazzify

final class EarTrainingChordOsmdTimingTests: XCTestCase {
    func testHammerLeadSecUsesMeasuresAndBeats() {
        let sec = EarTrainingChordOsmdTiming.hammerLeadSec(bpm: 120, beatsPerMeasure: 4, leadMeasures: 2)
        XCTAssertEqual(sec, 4.0, accuracy: 1e-9)
    }

    func testApproachLeadSecIsOneBeat() {
        let sec = EarTrainingChordOsmdTiming.approachLeadSec(bpm: 120)
        XCTAssertEqual(sec, 0.5, accuracy: 1e-9)
    }
}

final class EarTrainingBattleBeatSyncTimingTests: XCTestCase {
    func testOnBeatHitAt160Bpm() {
        let schedule = EarTrainingBattleBeatSyncTiming.resolveParryBeatSyncSchedule(
            hitPhraseSec: 0,
            bpm: 160
        )
        XCTAssertEqual(schedule.slowDurationMs, 375, accuracy: 1)
        XCTAssertEqual(schedule.ringExpandStartMs, 376, accuracy: 1)
    }

    func testFallbackWhenBpmMissing() {
        let schedule = EarTrainingBattleBeatSyncTiming.resolveParryBeatSyncScheduleOrFallback(
            hitPhraseSec: nil,
            bpm: nil
        )
        XCTAssertEqual(schedule.slowDurationMs, EarTrainingBattleParryConstants.slowPhaseMs)
    }

    func testParryZoomOutUsesNextTarget() {
        let out = EarTrainingBattleBeatSyncTiming.resolveParryZoomOutPhraseSec(
            hitPhraseSec: 1,
            nextTargetPhraseSec: 1.75,
            bpm: 160
        )
        XCTAssertEqual(out, 1.75, accuracy: 1e-6)
    }

    func testParryZoomScalePeaksAtRampEnd() {
        let mid = EarTrainingBattleBeatSyncTiming.resolveParryZoomScaleAtPhraseSec(
            currentPhraseSec: EarTrainingBattleParryConstants.zoomRampSec / 2,
            anchorPhraseSec: 0
        )
        let max = EarTrainingBattleBeatSyncTiming.resolveParryZoomScaleAtPhraseSec(
            currentPhraseSec: EarTrainingBattleParryConstants.zoomRampSec,
            anchorPhraseSec: 0
        )
        let held = EarTrainingBattleBeatSyncTiming.resolveParryZoomScaleAtPhraseSec(
            currentPhraseSec: EarTrainingBattleParryConstants.zoomRampSec + 2,
            anchorPhraseSec: 0
        )
        XCTAssertGreaterThan(mid, 1)
        XCTAssertEqual(max, EarTrainingBattleParryConstants.zoomTarget, accuracy: 1e-3)
        XCTAssertEqual(held, EarTrainingBattleParryConstants.zoomTarget, accuracy: 1e-3)
    }

    func testParryChainSlowDurationUsesPhraseInterval() {
        let duration = EarTrainingBattleBeatSyncTiming.resolveParryChainSlowDurationMs(
            hitPhraseSec: 0,
            zoomOutPhraseSec: 0.5,
            minDurationMs: 64
        )
        XCTAssertEqual(duration, 500, accuracy: 1)
    }
}

final class EarTrainingChordOsmdParrySpanTests: XCTestCase {
    private let id1 = UUID()
    private let id2 = UUID()
    private let id3 = UUID()

    func testFinishIsLastTargetInSpan() {
        let targets = [
            EarTrainingChordOsmdParryTarget(id: id1, measureNumber: 1, targetTimeSec: 0, orderIndex: 0),
            EarTrainingChordOsmdParryTarget(id: id2, measureNumber: 1, targetTimeSec: 0.5, orderIndex: 1),
            EarTrainingChordOsmdParryTarget(id: id3, measureNumber: 2, targetTimeSec: 2.0, orderIndex: 2),
        ]
        let finish = EarTrainingChordOsmdParrySpan.resolveSpanState(
            targets: targets,
            target: targets[1],
            chainAnchor: nil,
            spanMeasures: 1,
            bpm: 120,
            beatsPerMeasure: 4,
            isSwing: false
        )
        XCTAssertFalse(finish.isFinish)
        XCTAssertFalse(finish.extendVisualSlow)

        let finishLast = EarTrainingChordOsmdParrySpan.resolveSpanState(
            targets: targets,
            target: targets[1],
            chainAnchor: finish.anchor,
            spanMeasures: 1,
            bpm: 120,
            beatsPerMeasure: 4,
            isSwing: false
        )
        XCTAssertTrue(finishLast.isFinish)
    }
}

final class EarTrainingBattleOsuCircleTimingTests: XCTestCase {
    func testApproachPhaseShrinksOuterRadius() {
        let state = EarTrainingBattleOsuCircleTiming.compute(
            nowMs: 250,
            approachStartMs: 0,
            judgedMs: 500,
            centerX: 100,
            targetY: 200
        )
        XCTAssertTrue(state.visible)
        XCTAssertEqual(state.phase, .approach)
        XCTAssertLessThan(state.outerRadius, EarTrainingBattleOsuCircleTiming.outerStartRadiusPx)
    }

    func testDismissedIsHidden() {
        let state = EarTrainingBattleOsuCircleTiming.compute(
            nowMs: 300,
            approachStartMs: 0,
            judgedMs: 500,
            centerX: 100,
            targetY: 200,
            dismissed: true
        )
        XCTAssertFalse(state.visible)
        XCTAssertEqual(state.phase, .dismissed)
    }
}

final class EarTrainingBattleOsuCirclePoolTests: XCTestCase {
    func testDismissImmediatelyDeactivatesSlot() {
        let parent = SKNode()
        let pool = EarTrainingBattleOsuCirclePool(parent: parent)
        XCTAssertTrue(
            pool.spawn(
                commandId: 1,
                approachStartMs: 0,
                judgedMs: 500,
                centerX: 100,
                targetY: 200
            )
        )
        XCTAssertTrue(pool.hasActiveCircles)
        XCTAssertTrue(pool.dismiss(commandId: 1))
        XCTAssertFalse(pool.hasActiveCircles)
    }

    func testUpdateKeepsActiveCircleThroughApproachAndLockedPhases() {
        let parent = SKNode()
        let pool = EarTrainingBattleOsuCirclePool(parent: parent)
        XCTAssertTrue(
            pool.spawn(
                commandId: 2,
                approachStartMs: 0,
                judgedMs: 500,
                centerX: 120,
                targetY: 220
            )
        )
        pool.update(nowMs: 250)
        XCTAssertTrue(pool.hasActiveCircles)
        pool.update(nowMs: 600)
        XCTAssertTrue(pool.hasActiveCircles)
    }

    /// 外円の相対 scale でも画面上の線幅が Web 固定値になること。
    func testOuterStrokeWidthCompensatesForScale() {
        let parent = SKNode()
        let pool = EarTrainingBattleOsuCirclePool(parent: parent)
        XCTAssertTrue(
            pool.spawn(
                commandId: 3,
                approachStartMs: 0,
                judgedMs: 500,
                centerX: 100,
                targetY: 200
            )
        )
        pool.update(nowMs: 0)
        let shapes = parent.children.flatMap(\.children).compactMap { $0 as? SKShapeNode }
        let outer = shapes.first { $0.xScale > 1.01 }
        let inner = shapes.first { abs($0.xScale - 1) < 0.01 && $0.lineWidth > 0 }
        XCTAssertNotNil(outer)
        XCTAssertNotNil(inner)
        guard let outer, let inner else { return }
        let screenLineWidth = outer.lineWidth * outer.xScale
        XCTAssertEqual(
            screenLineWidth,
            EarTrainingBattleOsuCircleColors.outerLineWidth,
            accuracy: 0.05
        )
        XCTAssertEqual(
            inner.lineWidth,
            EarTrainingBattleOsuCircleTiming.lineWidth,
            accuracy: 0.05
        )
        XCTAssertEqual(outer.xScale, 2, accuracy: 0.05)
    }
}
