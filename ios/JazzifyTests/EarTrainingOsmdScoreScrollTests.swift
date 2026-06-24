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
}
