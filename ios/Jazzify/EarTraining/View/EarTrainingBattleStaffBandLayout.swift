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
    static func osmdStaffBottomY(
        sceneSize: CGSize,
        scoreSizeStep: Int,
        containerScaleTable: [Double]
    ) -> CGFloat {
        let baseHeight = min(sceneSize.height * 0.48, 280)
        let tableIndex = min(max(scoreSizeStep + 2, 0), containerScaleTable.count - 1)
        let containerScale = containerScaleTable[tableIndex]
        let scaledHeight = baseHeight * containerScale
        let outerHeight = min(sceneSize.height * 0.68, max(sceneSize.height * 0.26, scaledHeight))
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

    /// SpriteKit 台詞吹き出し root の Y（足元コンテナ基準）。帯下端より下に収める。
    static func quoteBubbleRootY(
        sceneHeight: CGFloat,
        footY: CGFloat,
        defaultRootY: CGFloat,
        bubbleExtentAboveFoot: CGFloat,
        staffBottomY: CGFloat?,
        minRootY: CGFloat
    ) -> CGFloat {
        guard let staffBottomY else { return defaultRootY }
        let height = max(320, sceneHeight)
        let maxRootY = height - footY - bubbleExtentAboveFoot - staffBottomY - bandMargin
        return min(defaultRootY, max(maxRootY, minRootY))
    }
}
