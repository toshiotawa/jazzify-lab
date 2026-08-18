import CoreGraphics

struct EarTrainingOsmdFitWindowConfig: Equatable {
    var minVisibleMeasures: Int
    var stepMeasures: Int
}

struct EarTrainingOsmdScrollLayout: Equatable {
    var playheadPx: CGFloat = 0
    var anchorToMeasureLeft: Bool = true
    var fitWindow: EarTrainingOsmdFitWindowConfig?

    static let battleDefault = EarTrainingOsmdScrollLayout(
        playheadPx: 0,
        anchorToMeasureLeft: true,
        fitWindow: EarTrainingOsmdFitWindowConfig(
            minVisibleMeasures: EarTrainingOsmdScoreScroll.windowMinVisibleMeasuresIOS,
            stepMeasures: EarTrainingOsmdScoreScroll.windowStepMeasures
        )
    )
    /// 精密モードは 2 小節表示・1 小節ずつページ送り（右小節が次に左へ来る）。
    static let precision = EarTrainingOsmdScrollLayout(
        playheadPx: 0,
        anchorToMeasureLeft: true,
        fitWindow: EarTrainingOsmdFitWindowConfig(
            minVisibleMeasures: EarTrainingOsmdScoreScroll.precisionWindowMinVisibleMeasures,
            stepMeasures: EarTrainingOsmdScoreScroll.precisionWindowStepMeasures
        )
    )
}

/// OSMD 譜面の小節ジャンプスクロールと現在小節ハイライト位置（WebView JS / TS ユーティリティと同等）。
enum EarTrainingOsmdScoreScroll {
    static let battlePlayheadPx: CGFloat = 120
    static let precisionMinFitScale: CGFloat = 0.35
    static let windowMinVisibleMeasuresWeb = 4
    static let windowMinVisibleMeasuresIOS = 3
    static let windowStepMeasures = 2
    static let precisionWindowMinVisibleMeasures = 2
    static let precisionWindowStepMeasures = 1
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
        visibleMeasures: Int = windowMinVisibleMeasuresWeb,
        stepMeasures: Int = windowStepMeasures
    ) -> Int {
        let measureNumber = max(1, activeMeasureNumber)
        let safeStep = max(1, stepMeasures)
        return 1 + (measureNumber - 1) / safeStep * safeStep
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

    struct PlayheadAnchorOffsets: Equatable {
        /// 小節左端（左小節線）からの px。常に 0。
        let noteOffsetPx: CGFloat
        /// 小節左端から右小節線までの px（小節幅）。
        let nextNoteOffsetPx: CGFloat
    }

    struct PlayheadOffset: Equatable {
        let offsetPx: CGFloat
        let endOffsetPx: CGFloat
    }

    /// プレイヘッドの始点（左小節線）と終点（右小節線）を小節左端起点の px で返す。
    static func playheadAnchorOffsetsPx(
        activeMeasureNumber: Int,
        measureBoundsByNumber: [Int: MeasureBounds],
        effectiveScale: CGFloat
    ) -> PlayheadAnchorOffsets {
        let measureNumber = max(1, activeMeasureNumber)
        guard let bounds = measureBoundsByNumber[measureNumber] ?? measureBoundsByNumber[1] else {
            return PlayheadAnchorOffsets(noteOffsetPx: 0, nextNoteOffsetPx: 0)
        }
        let widthPx = (bounds.right - bounds.left) * effectiveScale
        guard widthPx.isFinite, widthPx > 0 else {
            return PlayheadAnchorOffsets(noteOffsetPx: 0, nextNoteOffsetPx: 0)
        }
        return PlayheadAnchorOffsets(noteOffsetPx: 0, nextNoteOffsetPx: widthPx)
    }

    /// 小節内プレイヘッド位置。演奏中は左小節線 → 右小節線、カウントイン中は左小節線に固定。
    static func playheadOffsetPx(
        progress: CGFloat,
        anchorOffsets: PlayheadAnchorOffsets,
        inCountIn: Bool
    ) -> PlayheadOffset {
        if inCountIn {
            return PlayheadOffset(offsetPx: 0, endOffsetPx: 0)
        }
        let clampedProgress = min(1, max(0, progress))
        let endPx = max(anchorOffsets.noteOffsetPx, anchorOffsets.nextNoteOffsetPx)
        return PlayheadOffset(
            offsetPx: clampedProgress * endPx,
            endOffsetPx: endPx
        )
    }

    /// 30Hz のタイムライン更新で CSS トランジションを張り直さない。
    /// 小節切替・一時停止・シーク・カウントイン境界だけ再同期する。
    static let playheadResyncSeekThresholdSec: Double = 0.12

    struct SingleScoreRenderDecisionInput: Equatable {
        let lastRenderedMusicXMLText: String?
        let nextMusicXMLText: String
        let lastRenderedZoom: Double?
        let nextZoom: Double
        let lastRenderedKey: Int?
        let nextRenderKey: Int
        let lastUsedScoreSlots: Bool
        let nextUsesScoreSlots: Bool
    }

    /// 同一 MusicXML のリトライや練習スロット→本番シングル遷移でも再レンダーが必要か。
    static func shouldRenderSingleScore(_ input: SingleScoreRenderDecisionInput) -> Bool {
        if input.lastRenderedMusicXMLText != input.nextMusicXMLText {
            return true
        }
        if input.lastRenderedZoom.map({ abs($0 - input.nextZoom) > 0.000_1 }) ?? true {
            return true
        }
        if input.lastRenderedKey != input.nextRenderKey {
            return true
        }
        if input.lastUsedScoreSlots, !input.nextUsesScoreSlots {
            return true
        }
        return false
    }

    static func shouldResetPlayheadCacheForRenderRun(
        previousRenderKey: Int?,
        nextRenderKey: Int
    ) -> Bool {
        previousRenderKey != nextRenderKey
    }

    /// OSMD からのメッセージが譜面 ready 待機解除に使えるか（`renderProgress` は進捗のみ）。
    static func osmdMessageCompletesScoreRender(_ messageType: String) -> Bool {
        switch messageType {
        case "ready", "setupComplete", "slotActivated":
            return true
        default:
            return false
        }
    }

    /// OSMD からの進捗通知のみ（ready 待機解除には使わない）。
    static func osmdMessageReportsRenderProgressOnly(_ messageType: String) -> Bool {
        switch messageType {
        case "loadStart", "xmlLoaded", "renderProgress":
            return true
        default:
            return false
        }
    }

    /// `slotReady` 受信後に JS へ `setActiveScoreSlot` を送るべきか（練習スロットモードのみ）。
    static func shouldSendActiveScoreSlotOnSlotReady(usesScoreSlots: Bool) -> Bool {
        usesScoreSlots
    }

    static func shouldResyncPlayheadTimeline(
        previousTimelineSec: Double?,
        nextTimelineSec: Double,
        previousAnimating: Bool?,
        nextAnimating: Bool,
        measureChanged: Bool
    ) -> Bool {
        guard let previousTimelineSec, let previousAnimating else {
            return true
        }
        if measureChanged {
            return true
        }
        if previousAnimating != nextAnimating {
            return true
        }
        if previousTimelineSec < 0 && nextTimelineSec >= 0 {
            return true
        }
        if previousTimelineSec >= 0 && nextTimelineSec < 0 {
            return true
        }
        return abs(nextTimelineSec - previousTimelineSec) > playheadResyncSeekThresholdSec
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
