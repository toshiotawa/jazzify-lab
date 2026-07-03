import CoreGraphics

/// 耳コピバトル中央の五線譜(OSMD/Canvas)が占有する縦帯と、吹き出し配置の共通計算。
/// SwiftUI 座標系（上端 Y=0、下向き正）で下端 Y を返す。
enum EarTrainingBattleStaffBandLayout {
    static let bandMargin: CGFloat = 10

    static func canvasStaffBottomY(
        sceneSize: CGSize,
        centerYRatio: CGFloat = 0.42,
        heightRatio: CGFloat = 0.5
    ) -> CGFloat {
        let centerY = sceneSize.height * centerYRatio
        let bandHeight = sceneSize.height * heightRatio
        return centerY + bandHeight / 2 + bandMargin
    }

    static func phrasePairStaffBottomY(sceneSize: CGSize) -> CGFloat {
        canvasStaffBottomY(sceneSize: sceneSize, centerYRatio: 0.44, heightRatio: 0.5)
    }

    /// `EarTrainingChordOSMDGameView.scoreOverlay` の outer 高さに合わせる。
    static func osmdStaffBottomY(sceneSize: CGSize) -> CGFloat {
        let baseHeight = min(sceneSize.height * 0.48, 280)
        let outerHeight = min(sceneSize.height * 0.68, max(sceneSize.height * 0.26, baseHeight))
        let centerY = sceneSize.height * 0.42
        return centerY + outerHeight / 2 + bandMargin
    }

    /// デモ吹き出し中心 Y。譜面帯があるときは帯下端より下へクランプする。
    static func demoBubbleCenterY(
        sceneHeight: CGFloat,
        staffBottomY: CGFloat?,
        bubbleHeight: CGFloat
    ) -> CGFloat {
        let fallbackY = max(82, sceneHeight * 0.38)
        guard let staffBottomY else { return fallbackY }
        let belowStaffY = staffBottomY + bubbleHeight / 2 + 4
        return max(belowStaffY, 82)
    }

    enum QuoteBubblePreferredSide {
        case left
        case right
    }

    enum QuoteBubbleTailSide {
        case left
        case right
    }

    struct QuoteBubbleSidePlacement {
        let bubbleCenterOffsetX: CGFloat
        let bubbleCenterOffsetY: CGFloat
        let tailSide: QuoteBubbleTailSide
    }

    /// 台詞吹き出しをキャラ横 × 足元高さへ置く（`footContainer` 原点基準の bubble 中心オフセット）。
    static func quoteBubbleSidePlacement(
        sceneSize: CGSize,
        charXInScene: CGFloat,
        footYFromBottom: CGFloat,
        bubbleWidth: CGFloat,
        bubbleHeight: CGFloat,
        tailLength: CGFloat,
        charHalfWidth: CGFloat,
        preferredSide: QuoteBubblePreferredSide,
        staffBottomY: CGFloat?,
        keyboardVisualTopFromBottom: CGFloat,
        sideSpacing: CGFloat = 4,
        sceneMargin: CGFloat = 12,
        keyboardClearance: CGFloat = 4
    ) -> QuoteBubbleSidePlacement {
        let gap = sideSpacing + tailLength
        let sceneWidth = sceneSize.width
        let sceneHeight = sceneSize.height

        func bubbleCenterX(for side: QuoteBubblePreferredSide) -> CGFloat {
            switch side {
            case .left:
                return -charHalfWidth - gap - bubbleWidth / 2
            case .right:
                return charHalfWidth + gap + bubbleWidth / 2
            }
        }

        func tailSide(for side: QuoteBubblePreferredSide) -> QuoteBubbleTailSide {
            switch side {
            case .left:
                return .right
            case .right:
                return .left
            }
        }

        func fitsHorizontally(_ centerX: CGFloat) -> Bool {
            let left = charXInScene + centerX - bubbleWidth / 2
            let right = charXInScene + centerX + bubbleWidth / 2
            return left >= sceneMargin && right <= sceneWidth - sceneMargin
        }

        func clampedCenterX(_ centerX: CGFloat) -> CGFloat {
            let minCenter = sceneMargin + bubbleWidth / 2 - charXInScene
            let maxCenter = sceneWidth - sceneMargin - bubbleWidth / 2 - charXInScene
            return min(max(centerX, minCenter), maxCenter)
        }

        var chosenSide = preferredSide
        var centerOffsetX = bubbleCenterX(for: chosenSide)
        if !fitsHorizontally(centerOffsetX) {
            let flipped: QuoteBubblePreferredSide = chosenSide == .left ? .right : .left
            let flippedX = bubbleCenterX(for: flipped)
            if fitsHorizontally(flippedX) {
                chosenSide = flipped
                centerOffsetX = flippedX
            } else {
                centerOffsetX = clampedCenterX(centerOffsetX)
            }
        }

        let minCenterY =
            keyboardVisualTopFromBottom + keyboardClearance + bubbleHeight / 2 - footYFromBottom
        var maxCenterY = CGFloat.greatestFiniteMagnitude
        if let staffBottomY {
            maxCenterY = sceneHeight - staffBottomY - footYFromBottom - bubbleHeight / 2
        }

        let centerOffsetY: CGFloat
        if minCenterY <= maxCenterY {
            centerOffsetY = min(max(0, minCenterY), maxCenterY)
        } else {
            centerOffsetY = minCenterY
        }

        return QuoteBubbleSidePlacement(
            bubbleCenterOffsetX: centerOffsetX,
            bubbleCenterOffsetY: centerOffsetY,
            tailSide: tailSide(for: chosenSide)
        )
    }
}
