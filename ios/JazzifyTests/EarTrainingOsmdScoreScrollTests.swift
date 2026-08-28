import XCTest
@testable import Jazzify

final class EarTrainingOsmdScoreScrollTests: XCTestCase {
    private let bounds: [Int: EarTrainingOsmdScoreScroll.MeasureBounds] = [
        1: .init(left: 10, right: 90),
        2: .init(left: 100, right: 220),
        3: .init(left: 220, right: 340),
        4: .init(left: 400, right: 520),
    ]

    private let centers: [Int: CGFloat] = [
        1: 50,
        2: 160,
        3: 280,
        4: 460,
    ]

    private func scrollInput(
        measure: Int,
        scoreWidth: CGFloat = 500,
        viewportWidth: CGFloat = 400,
        scale: CGFloat = 1
    ) -> EarTrainingOsmdScoreScroll.MeasureJumpScrollInput {
        EarTrainingOsmdScoreScroll.MeasureJumpScrollInput(
            activeMeasureNumber: measure,
            measureBoundsByNumber: bounds,
            measureCentersByNumber: centers,
            playheadPx: EarTrainingOsmdScoreScroll.battlePlayheadPx,
            effectiveScale: scale,
            scoreWidth: scoreWidth,
            viewportWidth: viewportWidth
        )
    }

    func testMeasureJumpScrollOffset_clampsAtStart() {
        let result = EarTrainingOsmdScoreScroll.measureJumpScrollOffset(scrollInput(measure: 1))
        XCTAssertEqual(result.xPos, 10)
        XCTAssertEqual(result.offsetPx, 0)
    }

    func testMeasureJumpScrollOffset_usesNoteLeftWhenAvailable() {
        let firstMeasureBounds: [Int: EarTrainingOsmdScoreScroll.MeasureBounds] = [
            1: .init(left: 10, right: 90, noteLeft: 70, noteRight: 85),
        ]
        let result = EarTrainingOsmdScoreScroll.measureJumpScrollOffset(
            EarTrainingOsmdScoreScroll.MeasureJumpScrollInput(
                activeMeasureNumber: 1,
                measureBoundsByNumber: firstMeasureBounds,
                measureCentersByNumber: [1: 50],
                playheadPx: EarTrainingOsmdScoreScroll.battlePlayheadPx,
                effectiveScale: 1,
                scoreWidth: 500,
                viewportWidth: 400
            )
        )
        XCTAssertEqual(result.xPos, 70)
        XCTAssertEqual(result.offsetPx, 0)
    }

    func testMeasureJumpScrollOffset_alignsPlayheadInMiddle() {
        let result = EarTrainingOsmdScoreScroll.measureJumpScrollOffset(scrollInput(measure: 3))
        XCTAssertEqual(result.xPos, 220)
        XCTAssertEqual(result.offsetPx, 100)
    }

    func testActiveMeasureHighlight_followsMeasureAtStartWhenScrollClamped() {
        let scroll = EarTrainingOsmdScoreScroll.measureJumpScrollOffset(scrollInput(measure: 1))
        let highlight = EarTrainingOsmdScoreScroll.activeMeasureHighlight(
            EarTrainingOsmdScoreScroll.ActiveMeasureHighlightInput(
                activeMeasureNumber: 1,
                measureBoundsByNumber: bounds,
                playheadPx: EarTrainingOsmdScoreScroll.battlePlayheadPx,
                effectiveScale: 1,
                scrollOffsetPx: scroll.offsetPx
            )
        )
        XCTAssertTrue(highlight.visible)
        XCTAssertEqual(highlight.leftPx, 10)
        XCTAssertEqual(highlight.widthPx, 80)
    }

    func testActiveMeasureHighlight_matchesPlayheadInMiddleZone() {
        let scroll = EarTrainingOsmdScoreScroll.measureJumpScrollOffset(scrollInput(measure: 3))
        let highlight = EarTrainingOsmdScoreScroll.activeMeasureHighlight(
            EarTrainingOsmdScoreScroll.ActiveMeasureHighlightInput(
                activeMeasureNumber: 3,
                measureBoundsByNumber: bounds,
                playheadPx: EarTrainingOsmdScoreScroll.battlePlayheadPx,
                effectiveScale: 1,
                scrollOffsetPx: scroll.offsetPx
            )
        )
        XCTAssertTrue(highlight.visible)
        XCTAssertEqual(highlight.leftPx, EarTrainingOsmdScoreScroll.battlePlayheadPx)
        XCTAssertEqual(highlight.widthPx, 120)
    }

    func testActiveMeasureHighlight_advancesAtEndWhenScrollCannotMove() {
        let scroll = EarTrainingOsmdScoreScroll.measureJumpScrollOffset(
            scrollInput(measure: 4, scoreWidth: 300, viewportWidth: 400)
        )
        XCTAssertEqual(scroll.offsetPx, 0)

        let highlight = EarTrainingOsmdScoreScroll.activeMeasureHighlight(
            EarTrainingOsmdScoreScroll.ActiveMeasureHighlightInput(
                activeMeasureNumber: 4,
                measureBoundsByNumber: bounds,
                playheadPx: EarTrainingOsmdScoreScroll.battlePlayheadPx,
                effectiveScale: 1,
                scrollOffsetPx: scroll.offsetPx
            )
        )
        XCTAssertTrue(highlight.visible)
        XCTAssertEqual(highlight.leftPx, 400)
        XCTAssertEqual(highlight.widthPx, 120)
    }

    func testActiveMeasureHighlight_hiddenWithoutBounds() {
        let highlight = EarTrainingOsmdScoreScroll.activeMeasureHighlight(
            EarTrainingOsmdScoreScroll.ActiveMeasureHighlightInput(
                activeMeasureNumber: 2,
                measureBoundsByNumber: [:],
                playheadPx: EarTrainingOsmdScoreScroll.battlePlayheadPx,
                effectiveScale: 1,
                scrollOffsetPx: 0
            )
        )
        XCTAssertFalse(highlight.visible)
    }

    func testActiveMeasureHighlight_appliesEffectiveScale() {
        let scroll = EarTrainingOsmdScoreScroll.measureJumpScrollOffset(scrollInput(measure: 1, scale: 1.5))
        let highlight = EarTrainingOsmdScoreScroll.activeMeasureHighlight(
            EarTrainingOsmdScoreScroll.ActiveMeasureHighlightInput(
                activeMeasureNumber: 1,
                measureBoundsByNumber: bounds,
                playheadPx: EarTrainingOsmdScoreScroll.battlePlayheadPx,
                effectiveScale: 1.5,
                scrollOffsetPx: scroll.offsetPx
            )
        )
        XCTAssertTrue(highlight.visible)
        XCTAssertEqual(highlight.leftPx, 15)
        XCTAssertEqual(highlight.widthPx, 120)
    }

    func testWindowStartMeasureNumber_usesTwoMeasureStep() {
        XCTAssertEqual(EarTrainingOsmdScoreScroll.windowStartMeasureNumber(activeMeasureNumber: 2, visibleMeasures: 4), 1)
        XCTAssertEqual(EarTrainingOsmdScoreScroll.windowStartMeasureNumber(activeMeasureNumber: 3, visibleMeasures: 4), 3)
        XCTAssertEqual(EarTrainingOsmdScoreScroll.windowStartMeasureNumber(activeMeasureNumber: 4, visibleMeasures: 4), 3)
        XCTAssertEqual(EarTrainingOsmdScoreScroll.windowStartMeasureNumber(activeMeasureNumber: 2, visibleMeasures: 3), 1)
        XCTAssertEqual(EarTrainingOsmdScoreScroll.windowStartMeasureNumber(activeMeasureNumber: 3, visibleMeasures: 3), 3)
    }

    /// 精密モードは 1 小節ステップなので、窓開始小節はアクティブ小節と常に一致する。
    func testPrecisionWindowStart_advancesOneMeasureAtATime() {
        for measureNumber in 1...4 {
            XCTAssertEqual(
                EarTrainingOsmdScoreScroll.windowStartMeasureNumber(
                    activeMeasureNumber: measureNumber,
                    visibleMeasures: EarTrainingOsmdScoreScroll.precisionWindowMinVisibleMeasures,
                    stepMeasures: EarTrainingOsmdScoreScroll.precisionWindowStepMeasures
                ),
                measureNumber
            )
        }
    }

    func testPrecisionMeasureJumpScrollOffset_alignsMeasureLeftToContainerEdge() {
        let scroll = EarTrainingOsmdScoreScroll.measureJumpScrollOffset(
            EarTrainingOsmdScoreScroll.MeasureJumpScrollInput(
                activeMeasureNumber: 1,
                measureBoundsByNumber: bounds,
                measureCentersByNumber: centers,
                playheadPx: EarTrainingOsmdScrollLayout.precision.playheadPx,
                effectiveScale: 1,
                scoreWidth: 500,
                viewportWidth: 400,
                anchorToMeasureLeft: EarTrainingOsmdScrollLayout.precision.anchorToMeasureLeft
            )
        )
        XCTAssertEqual(scroll.xPos, 10)
        XCTAssertEqual(scroll.offsetPx, 10)

        let highlight = EarTrainingOsmdScoreScroll.activeMeasureHighlight(
            EarTrainingOsmdScoreScroll.ActiveMeasureHighlightInput(
                activeMeasureNumber: 1,
                measureBoundsByNumber: bounds,
                playheadPx: EarTrainingOsmdScrollLayout.precision.playheadPx,
                effectiveScale: 1,
                scrollOffsetPx: scroll.offsetPx
            )
        )
        XCTAssertEqual(highlight.leftPx, 0)
    }

    func testCountInPlayheadProgress_mapsNegativeTimelineToZeroOne() {
        XCTAssertEqual(
            EarTrainingOsmdScoreScroll.countInPlayheadProgress(phraseTimelineSec: -4, countInDurationSec: 4),
            0,
            accuracy: 0.001
        )
        XCTAssertEqual(
            EarTrainingOsmdScoreScroll.countInPlayheadProgress(phraseTimelineSec: -2, countInDurationSec: 4),
            0.5,
            accuracy: 0.001
        )
        XCTAssertEqual(
            EarTrainingOsmdScoreScroll.countInPlayheadProgress(phraseTimelineSec: 0, countInDurationSec: 4),
            0,
            accuracy: 0.001
        )
    }

    /// プレイヘッドは左小節線 → 右小節線（小節幅）で線形補間する。
    func testPlayheadAnchorOffsets_usesMeasureBarlines() {
        let anchorBounds: [Int: EarTrainingOsmdScoreScroll.MeasureBounds] = [
            1: .init(left: 0, right: 200),
            2: .init(left: 200, right: 300, noteLeft: 215),
            3: .init(left: 300, right: 400, noteLeft: 312),
        ]
        let first = EarTrainingOsmdScoreScroll.playheadAnchorOffsetsPx(
            activeMeasureNumber: 1,
            measureBoundsByNumber: anchorBounds,
            effectiveScale: 1
        )
        XCTAssertEqual(first.noteOffsetPx, 0)
        XCTAssertEqual(first.nextNoteOffsetPx, 200)

        let second = EarTrainingOsmdScoreScroll.playheadAnchorOffsetsPx(
            activeMeasureNumber: 2,
            measureBoundsByNumber: anchorBounds,
            effectiveScale: 0.5
        )
        XCTAssertEqual(second.noteOffsetPx, 0)
        XCTAssertEqual(second.nextNoteOffsetPx, 50, accuracy: 0.0001)

        let last = EarTrainingOsmdScoreScroll.playheadAnchorOffsetsPx(
            activeMeasureNumber: 3,
            measureBoundsByNumber: anchorBounds,
            effectiveScale: 1
        )
        XCTAssertEqual(last.noteOffsetPx, 0)
        XCTAssertEqual(last.nextNoteOffsetPx, 100)
    }

    /// カウントイン中は左小節線に固定、演奏中は小節幅まで線形移動。
    func testPlayheadOffset_countInFixedAtBarline() {
        let offsets = EarTrainingOsmdScoreScroll.PlayheadAnchorOffsets(
            noteOffsetPx: 0,
            nextNoteOffsetPx: 100
        )
        let countInEnd = EarTrainingOsmdScoreScroll.playheadOffsetPx(
            progress: 1,
            anchorOffsets: offsets,
            inCountIn: true
        )
        let playStart = EarTrainingOsmdScoreScroll.playheadOffsetPx(
            progress: 0,
            anchorOffsets: offsets,
            inCountIn: false
        )
        XCTAssertEqual(countInEnd.offsetPx, 0)
        XCTAssertEqual(playStart.offsetPx, 0)

        let measureEnd = EarTrainingOsmdScoreScroll.playheadOffsetPx(
            progress: 1,
            anchorOffsets: offsets,
            inCountIn: false
        )
        XCTAssertEqual(measureEnd.offsetPx, 100)
        XCTAssertEqual(measureEnd.endOffsetPx, 100)
    }

    func testShouldResyncPlayheadTimeline_skipsIntraMeasureTicks() {
        XCTAssertFalse(
            EarTrainingOsmdScoreScroll.shouldResyncPlayheadTimeline(
                previousTimelineSec: 1.00,
                nextTimelineSec: 1.03,
                previousAnimating: true,
                nextAnimating: true,
                measureChanged: false
            )
        )
        XCTAssertTrue(
            EarTrainingOsmdScoreScroll.shouldResyncPlayheadTimeline(
                previousTimelineSec: 1.90,
                nextTimelineSec: 2.00,
                previousAnimating: true,
                nextAnimating: true,
                measureChanged: true
            )
        )
        XCTAssertTrue(
            EarTrainingOsmdScoreScroll.shouldResyncPlayheadTimeline(
                previousTimelineSec: -0.02,
                nextTimelineSec: 0,
                previousAnimating: true,
                nextAnimating: true,
                measureChanged: false
            )
        )
        XCTAssertTrue(
            EarTrainingOsmdScoreScroll.shouldResyncPlayheadTimeline(
                previousTimelineSec: 1.00,
                nextTimelineSec: 1.00,
                previousAnimating: true,
                nextAnimating: false,
                measureChanged: false
            )
        )
        XCTAssertTrue(
            EarTrainingOsmdScoreScroll.shouldResyncPlayheadTimeline(
                previousTimelineSec: 1.00,
                nextTimelineSec: 1.50,
                previousAnimating: true,
                nextAnimating: true,
                measureChanged: false
            )
        )
    }

    func testPrecisionLayout_usesTwoMeasureWindowWithSingleMeasureStep() {
        XCTAssertTrue(EarTrainingOsmdScrollLayout.precision.anchorToMeasureLeft)
        XCTAssertEqual(EarTrainingOsmdScrollLayout.precision.playheadPx, 0)
        XCTAssertEqual(
            EarTrainingOsmdScrollLayout.precision.fitWindow,
            EarTrainingOsmdFitWindowConfig(minVisibleMeasures: 2, stepMeasures: 1)
        )
    }

    func testClampedManualScrollOffset_returnsUnchangedWhenWithinRange() {
        let result = EarTrainingOsmdScoreScroll.clampedManualScrollOffset(
            baseOffsetPx: 50,
            manualOffsetPx: 30,
            scoreWidth: 500,
            effectiveScale: 1,
            viewportWidth: 400
        )
        XCTAssertEqual(result, 30)
    }

    func testClampedManualScrollOffset_clampsLeftPastStart() {
        let result = EarTrainingOsmdScoreScroll.clampedManualScrollOffset(
            baseOffsetPx: 50,
            manualOffsetPx: -80,
            scoreWidth: 500,
            effectiveScale: 1,
            viewportWidth: 400
        )
        XCTAssertEqual(result, -50)
        XCTAssertEqual(50 + result, 0)
    }

    func testClampedManualScrollOffset_clampsRightPastEnd() {
        let result = EarTrainingOsmdScoreScroll.clampedManualScrollOffset(
            baseOffsetPx: 80,
            manualOffsetPx: 50,
            scoreWidth: 500,
            effectiveScale: 1,
            viewportWidth: 400
        )
        XCTAssertEqual(result, 20)
        XCTAssertEqual(80 + result, 100)
    }

    func testClampedManualScrollOffset_clampsToZeroWhenScoreFitsViewport() {
        let result = EarTrainingOsmdScoreScroll.clampedManualScrollOffset(
            baseOffsetPx: 0,
            manualOffsetPx: 40,
            scoreWidth: 300,
            effectiveScale: 1,
            viewportWidth: 400
        )
        XCTAssertEqual(result, 0)
    }

    func testShouldRenderSingleScore_rerendersWhenRenderKeyChanges() {
        let xml = "<score-partwise/>"
        let input = EarTrainingOsmdScoreScroll.SingleScoreRenderDecisionInput(
            lastRenderedMusicXMLText: xml,
            nextMusicXMLText: xml,
            lastRenderedZoom: 1,
            nextZoom: 1,
            lastRenderedKey: 3,
            nextRenderKey: 4,
            lastUsedScoreSlots: false,
            nextUsesScoreSlots: false
        )
        XCTAssertTrue(EarTrainingOsmdScoreScroll.shouldRenderSingleScore(input))
    }

    func testShouldRenderSingleScore_rerendersWhenLeavingPracticeSlots() {
        let xml = "<score-partwise/>"
        let input = EarTrainingOsmdScoreScroll.SingleScoreRenderDecisionInput(
            lastRenderedMusicXMLText: xml,
            nextMusicXMLText: xml,
            lastRenderedZoom: 1,
            nextZoom: 1,
            lastRenderedKey: 4,
            nextRenderKey: 4,
            lastUsedScoreSlots: true,
            nextUsesScoreSlots: false
        )
        XCTAssertTrue(EarTrainingOsmdScoreScroll.shouldRenderSingleScore(input))
    }

    func testShouldRenderSingleScore_skipsWhenSameRunAndMode() {
        let xml = "<score-partwise/>"
        let input = EarTrainingOsmdScoreScroll.SingleScoreRenderDecisionInput(
            lastRenderedMusicXMLText: xml,
            nextMusicXMLText: xml,
            lastRenderedZoom: 1,
            nextZoom: 1,
            lastRenderedKey: 4,
            nextRenderKey: 4,
            lastUsedScoreSlots: false,
            nextUsesScoreSlots: false
        )
        XCTAssertFalse(EarTrainingOsmdScoreScroll.shouldRenderSingleScore(input))
    }

    func testShouldResetPlayheadCacheForRenderRun() {
        XCTAssertTrue(
            EarTrainingOsmdScoreScroll.shouldResetPlayheadCacheForRenderRun(
                previousRenderKey: 2,
                nextRenderKey: 3
            )
        )
        XCTAssertFalse(
            EarTrainingOsmdScoreScroll.shouldResetPlayheadCacheForRenderRun(
                previousRenderKey: 3,
                nextRenderKey: 3
            )
        )
    }

    func testShouldResyncPlayheadTimeline_resyncsAfterRenderCacheInvalidation() {
        XCTAssertTrue(
            EarTrainingOsmdScoreScroll.shouldResyncPlayheadTimeline(
                previousTimelineSec: nil,
                nextTimelineSec: 0,
                previousAnimating: nil,
                nextAnimating: true,
                measureChanged: false
            )
        )
    }

    func testOsmdMessageCompletesScoreRender() {
        XCTAssertTrue(EarTrainingOsmdScoreScroll.osmdMessageCompletesScoreRender("ready"))
        XCTAssertTrue(EarTrainingOsmdScoreScroll.osmdMessageCompletesScoreRender("setupComplete"))
        XCTAssertTrue(EarTrainingOsmdScoreScroll.osmdMessageCompletesScoreRender("slotActivated"))
        XCTAssertFalse(EarTrainingOsmdScoreScroll.osmdMessageCompletesScoreRender("renderProgress"))
        XCTAssertFalse(EarTrainingOsmdScoreScroll.osmdMessageCompletesScoreRender("loadStart"))
    }

    func testOsmdMessageReportsRenderProgressOnly() {
        XCTAssertTrue(EarTrainingOsmdScoreScroll.osmdMessageReportsRenderProgressOnly("renderProgress"))
        XCTAssertTrue(EarTrainingOsmdScoreScroll.osmdMessageReportsRenderProgressOnly("xmlLoaded"))
        XCTAssertFalse(EarTrainingOsmdScoreScroll.osmdMessageReportsRenderProgressOnly("ready"))
    }

    func testShouldSendActiveScoreSlotOnSlotReady_whenSlotsPrepared() {
        XCTAssertTrue(
            EarTrainingOsmdScoreScroll.shouldSendActiveScoreSlotOnSlotReady(preparedSlotCount: 2)
        )
        XCTAssertTrue(
            EarTrainingOsmdScoreScroll.shouldSendActiveScoreSlotOnSlotReady(preparedSlotCount: 1)
        )
        XCTAssertFalse(
            EarTrainingOsmdScoreScroll.shouldSendActiveScoreSlotOnSlotReady(preparedSlotCount: 0)
        )
    }
}
