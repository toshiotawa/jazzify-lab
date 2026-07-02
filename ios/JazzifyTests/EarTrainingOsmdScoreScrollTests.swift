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

    func testPrecisionMeasureJumpScrollOffset_alignsMeasureLeftToContainerEdge() {
        let scroll = EarTrainingOsmdScoreScroll.precisionMeasureJumpScrollOffset(
            activeMeasureNumber: 1,
            measureBoundsByNumber: bounds,
            measureCentersByNumber: centers,
            cssScale: 1,
            scoreWidth: 500,
            viewportWidth: 400
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

    func testPrecisionMeasureJumpScrollOffset_fitsWideMeasureIntoViewport() {
        let wideBounds: [Int: EarTrainingOsmdScoreScroll.MeasureBounds] = [
            1: .init(left: 0, right: 500),
        ]
        let scroll = EarTrainingOsmdScoreScroll.precisionMeasureJumpScrollOffset(
            activeMeasureNumber: 1,
            measureBoundsByNumber: wideBounds,
            measureCentersByNumber: [1: 250],
            cssScale: 1,
            scoreWidth: 800,
            viewportWidth: 400
        )
        let expectedScale = EarTrainingOsmdScoreScroll.effectiveScaleForMeasure(
            cssScale: 1,
            bounds: wideBounds[1],
            viewportWidth: 400,
            fitActiveMeasureWidth: true
        )
        XCTAssertEqual(expectedScale, 0.8)
        XCTAssertEqual(scroll.offsetPx, 0)

        let highlight = EarTrainingOsmdScoreScroll.activeMeasureHighlight(
            EarTrainingOsmdScoreScroll.ActiveMeasureHighlightInput(
                activeMeasureNumber: 1,
                measureBoundsByNumber: wideBounds,
                playheadPx: 0,
                effectiveScale: expectedScale,
                scrollOffsetPx: scroll.offsetPx
            )
        )
        XCTAssertEqual(highlight.leftPx, 0, accuracy: 0.001)
        XCTAssertEqual(highlight.widthPx, 400, accuracy: 0.001)
    }

    func testEffectiveScaleForMeasure_respectsMinFitScale() {
        let veryWideBounds = EarTrainingOsmdScoreScroll.MeasureBounds(left: 0, right: 2000)
        let scale = EarTrainingOsmdScoreScroll.effectiveScaleForMeasure(
            cssScale: 1,
            bounds: veryWideBounds,
            viewportWidth: 400,
            fitActiveMeasureWidth: true
        )
        XCTAssertEqual(scale, EarTrainingOsmdScoreScroll.precisionMinFitScale)
    }

    private func followInput(
        timeline: Double,
        measureDuration: Double = 2,
        countInDuration: Double = 4,
        maxMeasure: Int = 4,
        scoreWidth: CGFloat = 500,
        viewportWidth: CGFloat = 400,
        scale: CGFloat = 1
    ) -> EarTrainingOsmdScoreScroll.ContinuousFollowScrollInput {
        EarTrainingOsmdScoreScroll.ContinuousFollowScrollInput(
            phraseTimelineSec: timeline,
            measureDurationSec: measureDuration,
            countInDurationSec: countInDuration,
            maxMeasureNumber: maxMeasure,
            measureBoundsByNumber: bounds,
            playheadPx: EarTrainingOsmdScoreScroll.precisionFollowPlayheadPx,
            effectiveScale: scale,
            scoreWidth: scoreWidth,
            viewportWidth: viewportWidth
        )
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

    func testContinuousFollowScrollState_countInKeepsScrollAtZero() {
        let state = EarTrainingOsmdScoreScroll.continuousFollowScrollState(
            followInput(timeline: -2, countInDuration: 4)
        )
        XCTAssertEqual(state.phase, .countIn)
        XCTAssertEqual(state.scrollOffsetPx, 0)
        XCTAssertEqual(state.activeMeasureNumber, 1)
        XCTAssertEqual(state.measureProgress, 0.5, accuracy: 0.001)
        XCTAssertFalse(state.playheadFixed)
    }

    func testContinuousFollowScrollState_scrollingPhaseFixesPlayhead() {
        let state = EarTrainingOsmdScoreScroll.continuousFollowScrollState(
            followInput(timeline: 3, measureDuration: 2)
        )
        XCTAssertEqual(state.phase, .scrolling)
        XCTAssertTrue(state.playheadFixed)
        XCTAssertEqual(state.activeMeasureNumber, 2)
        XCTAssertEqual(state.measureProgress, 0.5, accuracy: 0.001)
        XCTAssertGreaterThan(state.scrollOffsetPx, 0)
    }

    func testContinuousFollowScrollState_isContinuousAcrossMeasureBoundary() {
        let endMeasure1 = EarTrainingOsmdScoreScroll.continuousFollowScrollState(
            followInput(timeline: 1.99, measureDuration: 2)
        )
        let startMeasure2 = EarTrainingOsmdScoreScroll.continuousFollowScrollState(
            followInput(timeline: 2.01, measureDuration: 2)
        )
        XCTAssertEqual(endMeasure1.phase, .scrolling)
        XCTAssertEqual(startMeasure2.phase, .scrolling)
        XCTAssertLessThan(endMeasure1.scrollOffsetPx, startMeasure2.scrollOffsetPx)
    }

    func testContinuousFollowScrollState_tailPhaseWhenScrollClamped() {
        let state = EarTrainingOsmdScoreScroll.continuousFollowScrollState(
            followInput(
                timeline: 7.5,
                measureDuration: 2,
                maxMeasure: 4,
                scoreWidth: 300,
                viewportWidth: 400
            )
        )
        XCTAssertEqual(state.phase, .tail)
        XCTAssertFalse(state.playheadFixed)
        XCTAssertEqual(state.scrollOffsetPx, 0)
        XCTAssertEqual(state.activeMeasureNumber, 4)
        XCTAssertEqual(state.measureProgress, 0.75, accuracy: 0.001)
    }

    func testPrecisionFollowLayout_doesNotFitMeasureWidth() {
        XCTAssertFalse(EarTrainingOsmdScrollLayout.precisionFollow.fitActiveMeasureWidth)
        XCTAssertEqual(
            EarTrainingOsmdScrollLayout.precisionFollow.playheadPx,
            EarTrainingOsmdScoreScroll.precisionFollowPlayheadPx
        )
        XCTAssertEqual(EarTrainingOsmdScrollLayout.precisionFollow.scrollMode, .continuousFollow)
    }
}
