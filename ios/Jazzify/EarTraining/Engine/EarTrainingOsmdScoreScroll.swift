import CoreGraphics

struct EarTrainingOsmdFitWindowConfig: Equatable {
    var minVisibleMeasures: Int
}

struct EarTrainingOsmdScrollLayout: Equatable {
    var playheadPx: CGFloat = 0
    var anchorToMeasureLeft: Bool = true
    var fitActiveMeasureWidth: Bool = false
    var fitWindow: EarTrainingOsmdFitWindowConfig?

    static let battleDefault = EarTrainingOsmdScrollLayout(
        playheadPx: 0,
        anchorToMeasureLeft: true,
        fitActiveMeasureWidth: false,
        fitWindow: EarTrainingOsmdFitWindowConfig(
            minVisibleMeasures: EarTrainingOsmdScoreScroll.windowMinVisibleMeasuresIOS
        )
    )
    static let precision = EarTrainingOsmdScrollLayout(
        playheadPx: 0,
        anchorToMeasureLeft: true,
        fitActiveMeasureWidth: true
    )
}

/// OSMD 譜面の小節ジャンプスクロールと現在小節ハイライト位置（WebView JS / TS ユーティリティと同等）。
enum EarTrainingOsmdScoreScroll {
    static let battlePlayheadPx: CGFloat = 120
    static let precisionMinFitScale: CGFloat = 0.35
    static let windowMinVisibleMeasuresWeb = 4
    static let windowMinVisibleMeasuresIOS = 3
    static let windowDenseFallbackScale: CGFloat = 0.5
    static let windowDenseFallbackMeasures = 2

    struct MeasureBounds: Equatable {
        let left: CGFloat
        let right: CGFloat
        let noteLeft: CGFloat?
        let noteRight: CGFloat?

        init(left: CGFloat, right: CGFloat, noteLeft: CGFloat? = nil, noteRight: CGFloat? = nil) {
            self.left = left
            self.right = right
            self.noteLeft = noteLeft
            self.noteRight = noteRight
        }
    }

    struct MeasureJumpScrollInput: Equatable {
        let activeMeasureNumber: Int
        let measureBoundsByNumber: [Int: MeasureBounds]
        let measureCentersByNumber: [Int: CGFloat]
        let playheadPx: CGFloat
        let effectiveScale: CGFloat
        let scoreWidth: CGFloat
        let viewportWidth: CGFloat
        var anchorToMeasureLeft: Bool = false
    }

    struct MeasureJumpScrollResult: Equatable {
        let offsetPx: CGFloat
        let xPos: CGFloat
    }

    struct ReachEndJumpScrollInput: Equatable {
        let activeMeasureNumber: Int
        let previousWindowStart: Int
        let measureBoundsByNumber: [Int: MeasureBounds]
        let measureCentersByNumber: [Int: CGFloat]
        let cssScale: CGFloat
        let playheadPx: CGFloat
        let scoreWidth: CGFloat
        let viewportWidth: CGFloat
        let maxMeasureNumber: Int
    }

    struct ReachEndJumpScrollResult: Equatable {
        let offsetPx: CGFloat
        let xPos: CGFloat
        let windowStartMeasure: Int
    }

    struct ActiveMeasureHighlightInput: Equatable {
        let activeMeasureNumber: Int
        let measureBoundsByNumber: [Int: MeasureBounds]
        let playheadPx: CGFloat
        let effectiveScale: CGFloat
        let scrollOffsetPx: CGFloat
    }

    struct ActiveMeasureHighlightResult: Equatable {
        let leftPx: CGFloat
        let widthPx: CGFloat
        let visible: Bool
    }

    static func windowStartMeasureNumber(
        activeMeasureNumber: Int,
        visibleMeasures: Int = windowMinVisibleMeasuresWeb
    ) -> Int {
        let measureNumber = max(1, activeMeasureNumber)
        let safeVisible = max(2, visibleMeasures)
        let stride = safeVisible - 1
        return 1 + (measureNumber - 1) / stride * stride
    }

    static func resolveScrollAnchorX(
        bounds: MeasureBounds?,
        measureCentersByNumber: [Int: CGFloat],
        measureNumber: Int,
        viewportWidth: CGFloat,
        anchorToMeasureLeft: Bool
    ) -> CGFloat {
        if let bounds {
            if anchorToMeasureLeft {
                return bounds.left
            }
            if let noteLeft = bounds.noteLeft {
                return noteLeft
            }
            return bounds.left
        }
        if let center = measureCentersByNumber[measureNumber] {
            return center
        }
        if let fallbackCenter = measureCentersByNumber[1] {
            return fallbackCenter
        }
        return viewportWidth / 2
    }

    static func effectiveScaleForMeasure(
        cssScale: CGFloat,
        bounds: MeasureBounds?,
        viewportWidth: CGFloat,
        fitActiveMeasureWidth: Bool,
        minFitScale: CGFloat = precisionMinFitScale
    ) -> CGFloat {
        guard fitActiveMeasureWidth, let bounds else {
            return cssScale
        }
        let measureWidth = bounds.right - bounds.left
        guard measureWidth.isFinite, measureWidth > 0, cssScale > 0, viewportWidth > 0 else {
            return cssScale
        }
        let fitScale = viewportWidth / (measureWidth * cssScale)
        let clampedFit = min(1, max(minFitScale, fitScale))
        return cssScale * clampedFit
    }

    static func visibleMeasureCountFromWindowStart(
        windowStartMeasure: Int,
        measureBoundsByNumber: [Int: MeasureBounds],
        effectiveScale: CGFloat,
        viewportWidth: CGFloat,
        maxMeasureNumber: Int
    ) -> Int {
        let windowStart = max(1, windowStartMeasure)
        guard let startBounds = measureBoundsByNumber[windowStart],
              viewportWidth > 0,
              effectiveScale > 0 else {
            return 1
        }
        let originX = startBounds.left * effectiveScale
        var count = 0
        for measureNumber in windowStart...maxMeasureNumber {
            guard let bounds = measureBoundsByNumber[measureNumber] else {
                break
            }
            let rightPx = bounds.right * effectiveScale - originX
            if count > 0, rightPx > viewportWidth {
                break
            }
            count += 1
        }
        return max(1, count)
    }

    static func reachEndJumpScrollOffset(_ input: ReachEndJumpScrollInput) -> ReachEndJumpScrollResult {
        let activeMeasure = max(1, input.activeMeasureNumber)
        let activeBounds = input.measureBoundsByNumber[activeMeasure] ?? input.measureBoundsByNumber[1]
        let effectiveScale = effectiveScaleForMeasure(
            cssScale: input.cssScale,
            bounds: activeBounds,
            viewportWidth: input.viewportWidth,
            fitActiveMeasureWidth: true
        )

        var windowStart = max(1, input.previousWindowStart)
        if activeMeasure < windowStart {
            windowStart = activeMeasure
        }

        let visibleCount = visibleMeasureCountFromWindowStart(
            windowStartMeasure: windowStart,
            measureBoundsByNumber: input.measureBoundsByNumber,
            effectiveScale: effectiveScale,
            viewportWidth: input.viewportWidth,
            maxMeasureNumber: input.maxMeasureNumber
        )
        let lastVisible = windowStart + visibleCount - 1

        if activeMeasure >= lastVisible, activeMeasure > windowStart {
            windowStart = activeMeasure
        }

        let anchorBounds = input.measureBoundsByNumber[windowStart] ?? input.measureBoundsByNumber[1]
        let xPos = anchorBounds?.left
            ?? input.measureCentersByNumber[windowStart]
            ?? input.measureCentersByNumber[1]
            ?? input.viewportWidth / 2

        if windowStart == 1 {
            return ReachEndJumpScrollResult(offsetPx: 0, xPos: xPos, windowStartMeasure: windowStart)
        }

        let maxOffset = max(0, input.scoreWidth * effectiveScale - input.viewportWidth)
        let rawOffset = xPos * effectiveScale - input.playheadPx
        let offsetPx = min(max(rawOffset, 0), maxOffset)
        return ReachEndJumpScrollResult(offsetPx: offsetPx, xPos: xPos, windowStartMeasure: windowStart)
    }

    static func countInPlayheadProgress(
        phraseTimelineSec: Double,
        countInDurationSec: Double
    ) -> CGFloat {
        guard phraseTimelineSec < 0, countInDurationSec > 0 else {
            return 0
        }
        let progress = (phraseTimelineSec + countInDurationSec) / countInDurationSec
        return CGFloat(min(1, max(0, progress)))
    }

    /// 現在小節の左端（小節線付近）を固定プレイヘッド位置へ合わせるオフセット（小節更新時のみジャンプ）。
    static func measureJumpScrollOffset(_ input: MeasureJumpScrollInput) -> MeasureJumpScrollResult {
        let measureNumber = max(1, input.activeMeasureNumber)
        let bounds = input.measureBoundsByNumber[measureNumber] ?? input.measureBoundsByNumber[1]
        let xPos = resolveScrollAnchorX(
            bounds: bounds,
            measureCentersByNumber: input.measureCentersByNumber,
            measureNumber: measureNumber,
            viewportWidth: input.viewportWidth,
            anchorToMeasureLeft: input.anchorToMeasureLeft
        )

        let maxOffset = max(0, input.scoreWidth * input.effectiveScale - input.viewportWidth)
        let rawOffset = xPos * input.effectiveScale - input.playheadPx
        let offsetPx = min(max(rawOffset, 0), maxOffset)
        return MeasureJumpScrollResult(offsetPx: offsetPx, xPos: xPos)
    }

    static func precisionMeasureJumpScrollOffset(
        activeMeasureNumber: Int,
        previousWindowStart: Int,
        measureBoundsByNumber: [Int: MeasureBounds],
        measureCentersByNumber: [Int: CGFloat],
        cssScale: CGFloat,
        scoreWidth: CGFloat,
        viewportWidth: CGFloat,
        maxMeasureNumber: Int
    ) -> ReachEndJumpScrollResult {
        reachEndJumpScrollOffset(
            ReachEndJumpScrollInput(
                activeMeasureNumber: activeMeasureNumber,
                previousWindowStart: previousWindowStart,
                measureBoundsByNumber: measureBoundsByNumber,
                measureCentersByNumber: measureCentersByNumber,
                cssScale: cssScale,
                playheadPx: EarTrainingOsmdScrollLayout.precision.playheadPx,
                scoreWidth: scoreWidth,
                viewportWidth: viewportWidth,
                maxMeasureNumber: maxMeasureNumber
            )
        )
    }

    /// スクロールオフセットを反映した画面上の小節ハイライト矩形（小節更新時のみ再計算）。
    static func activeMeasureHighlight(_ input: ActiveMeasureHighlightInput) -> ActiveMeasureHighlightResult {
        let measureNumber = max(1, input.activeMeasureNumber)
        guard let bounds = input.measureBoundsByNumber[measureNumber] ?? input.measureBoundsByNumber[1] else {
            return ActiveMeasureHighlightResult(leftPx: input.playheadPx, widthPx: 0, visible: false)
        }

        let measureWidth = bounds.right - bounds.left
        guard measureWidth.isFinite, measureWidth > 0 else {
            return ActiveMeasureHighlightResult(leftPx: input.playheadPx, widthPx: 0, visible: false)
        }

        let leftPx = bounds.left * input.effectiveScale - input.scrollOffsetPx
        return ActiveMeasureHighlightResult(
            leftPx: leftPx,
            widthPx: measureWidth * input.effectiveScale,
            visible: true
        )
    }

    /// 手動スクロールの相対オフセットを、合成後オフセットが [0, maxOffset] に収まるようクランプする（JS 側と同一式）。
    static func clampedManualScrollOffset(
        baseOffsetPx: CGFloat,
        manualOffsetPx: CGFloat,
        scoreWidth: CGFloat,
        effectiveScale: CGFloat,
        viewportWidth: CGFloat
    ) -> CGFloat {
        let maxOffset = max(0, scoreWidth * effectiveScale - viewportWidth)
        return min(max(manualOffsetPx, -baseOffsetPx), maxOffset - baseOffsetPx)
    }
}
