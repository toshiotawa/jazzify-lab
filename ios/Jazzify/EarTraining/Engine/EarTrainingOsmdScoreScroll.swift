import CoreGraphics

enum EarTrainingOsmdScrollMode: String, CaseIterable, Equatable {
    case measureJump
    case continuousFollow
}

struct EarTrainingOsmdScrollLayout: Equatable {
    var playheadPx: CGFloat = EarTrainingOsmdScoreScroll.battlePlayheadPx
    var anchorToMeasureLeft: Bool = false
    var fitActiveMeasureWidth: Bool = false
    var scrollMode: EarTrainingOsmdScrollMode = .measureJump

    static let battleDefault = EarTrainingOsmdScrollLayout()
    static let precision = EarTrainingOsmdScrollLayout(
        playheadPx: 0,
        anchorToMeasureLeft: true,
        fitActiveMeasureWidth: true,
        scrollMode: .measureJump
    )
    static let precisionFollow = EarTrainingOsmdScrollLayout(
        playheadPx: EarTrainingOsmdScoreScroll.precisionFollowPlayheadPx,
        anchorToMeasureLeft: false,
        fitActiveMeasureWidth: false,
        scrollMode: .continuousFollow
    )
}

/// OSMD 譜面の小節ジャンプスクロールと現在小節ハイライト位置（WebView JS / TS ユーティリティと同等）。
enum EarTrainingOsmdScoreScroll {
    static let battlePlayheadPx: CGFloat = 120
    static let precisionFollowPlayheadPx: CGFloat = 36
    static let precisionMinFitScale: CGFloat = 0.35

    enum ContinuousFollowPhase: Equatable {
        case countIn
        case scrolling
        case tail
    }

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

    struct ContinuousFollowScrollInput: Equatable {
        let phraseTimelineSec: Double
        let measureDurationSec: Double
        let countInDurationSec: Double
        let maxMeasureNumber: Int
        let measureBoundsByNumber: [Int: MeasureBounds]
        let playheadPx: CGFloat
        let effectiveScale: CGFloat
        let scoreWidth: CGFloat
        let viewportWidth: CGFloat
    }

    struct ContinuousFollowScrollResult: Equatable {
        let phase: ContinuousFollowPhase
        let scrollOffsetPx: CGFloat
        let activeMeasureNumber: Int
        let measureProgress: CGFloat
        let xPos: CGFloat
        let playheadFixed: Bool
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

    static func measureNumberAndProgress(
        phraseTimelineSec: Double,
        measureDurationSec: Double,
        maxMeasureNumber: Int
    ) -> (measureNumber: Int, progress: CGFloat) {
        let safeDuration = max(1e-6, measureDurationSec)
        let clampedTime = max(0, phraseTimelineSec)
        let cappedMax = max(1, maxMeasureNumber)
        let rawMeasure = Int(floor(clampedTime / safeDuration)) + 1
        let measureNumber = min(cappedMax, max(1, rawMeasure))
        let timeInMeasure = clampedTime - Double(measureNumber - 1) * safeDuration
        let progress = CGFloat(min(1, max(0, timeInMeasure / safeDuration)))
        return (measureNumber, progress)
    }

    static func continuousScoreX(
        measureNumber: Int,
        progress: CGFloat,
        measureBoundsByNumber: [Int: MeasureBounds]
    ) -> CGFloat {
        guard let bounds = measureBoundsByNumber[measureNumber] ?? measureBoundsByNumber[1] else {
            return 0
        }
        let measureWidth = bounds.right - bounds.left
        guard measureWidth.isFinite, measureWidth > 0 else {
            return bounds.left
        }
        let clampedProgress = min(1, max(0, progress))
        return bounds.left + clampedProgress * measureWidth
    }

    /// 追従スクロール: カウントイン・中間・末尾の3フェーズで scroll / playhead を決定する。
    static func continuousFollowScrollState(_ input: ContinuousFollowScrollInput) -> ContinuousFollowScrollResult {
        let maxOffset = max(0, input.scoreWidth * input.effectiveScale - input.viewportWidth)

        if input.phraseTimelineSec < 0, input.countInDurationSec > 0 {
            let progress = countInPlayheadProgress(
                phraseTimelineSec: input.phraseTimelineSec,
                countInDurationSec: input.countInDurationSec
            )
            let bounds = input.measureBoundsByNumber[1]
            let xPos = bounds?.left ?? 0
            return ContinuousFollowScrollResult(
                phase: .countIn,
                scrollOffsetPx: 0,
                activeMeasureNumber: 1,
                measureProgress: progress,
                xPos: xPos,
                playheadFixed: false
            )
        }

        let (measureNumber, progress) = measureNumberAndProgress(
            phraseTimelineSec: input.phraseTimelineSec,
            measureDurationSec: input.measureDurationSec,
            maxMeasureNumber: input.maxMeasureNumber
        )
        let xPos = continuousScoreX(
            measureNumber: measureNumber,
            progress: progress,
            measureBoundsByNumber: input.measureBoundsByNumber
        )
        let rawOffset = xPos * input.effectiveScale - input.playheadPx
        let clampedOffset = min(max(rawOffset, 0), maxOffset)

        if clampedOffset < maxOffset - 0.001 {
            return ContinuousFollowScrollResult(
                phase: .scrolling,
                scrollOffsetPx: clampedOffset,
                activeMeasureNumber: measureNumber,
                measureProgress: progress,
                xPos: xPos,
                playheadFixed: true
            )
        }

        return ContinuousFollowScrollResult(
            phase: .tail,
            scrollOffsetPx: maxOffset,
            activeMeasureNumber: measureNumber,
            measureProgress: progress,
            xPos: xPos,
            playheadFixed: false
        )
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
        measureBoundsByNumber: [Int: MeasureBounds],
        measureCentersByNumber: [Int: CGFloat],
        cssScale: CGFloat,
        scoreWidth: CGFloat,
        viewportWidth: CGFloat
    ) -> MeasureJumpScrollResult {
        let measureNumber = max(1, activeMeasureNumber)
        let bounds = measureBoundsByNumber[measureNumber] ?? measureBoundsByNumber[1]
        let effectiveScale = effectiveScaleForMeasure(
            cssScale: cssScale,
            bounds: bounds,
            viewportWidth: viewportWidth,
            fitActiveMeasureWidth: true
        )
        return measureJumpScrollOffset(
            MeasureJumpScrollInput(
                activeMeasureNumber: activeMeasureNumber,
                measureBoundsByNumber: measureBoundsByNumber,
                measureCentersByNumber: measureCentersByNumber,
                playheadPx: EarTrainingOsmdScrollLayout.precision.playheadPx,
                effectiveScale: effectiveScale,
                scoreWidth: scoreWidth,
                viewportWidth: viewportWidth,
                anchorToMeasureLeft: true
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
