import CoreGraphics

/// OSMD 譜面の小節ジャンプスクロールと現在小節ハイライト位置（WebView JS / TS ユーティリティと同等）。
enum EarTrainingOsmdScoreScroll {
    static let battlePlayheadPx: CGFloat = 120

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

    /// 現在小節の左端（小節線付近）を固定プレイヘッド位置へ合わせるオフセット（小節更新時のみジャンプ）。
    static func measureJumpScrollOffset(_ input: MeasureJumpScrollInput) -> MeasureJumpScrollResult {
        let measureNumber = max(1, input.activeMeasureNumber)
        let bounds = input.measureBoundsByNumber[measureNumber] ?? input.measureBoundsByNumber[1]
        let xPos: CGFloat
        if let bounds {
            if let noteLeft = bounds.noteLeft {
                xPos = noteLeft
            } else {
                xPos = bounds.left
            }
        } else if let center = input.measureCentersByNumber[measureNumber] {
            xPos = center
        } else if let fallbackCenter = input.measureCentersByNumber[1] {
            xPos = fallbackCenter
        } else {
            xPos = input.viewportWidth / 2
        }

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
}
