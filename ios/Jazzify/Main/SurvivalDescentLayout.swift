import CoreGraphics
import Foundation

/// 魔王城降下マップ用のレイアウト計算
/// Web 版 `src/components/survival/descent/descentLayout.ts` と同一仕様のポート。
/// - 3 レーン固定: 左 / 中央 / 右
/// - ブロック末尾は必ず中央レーン＆大踊り場
/// - 論理ピクセル座標系。描画側で viewport 幅にフィットするよう scale する
enum SurvivalDescentLayoutConstants {
    /// ロジカル座標系の幅 (デザイン基準・横長レイアウト寄り)
    static let logicalWidth: CGFloat = 560

    /// 3 レーンの X 座標 (論理座標)
    static let laneLeftX: CGFloat = 120
    static var laneCenterX: CGFloat { logicalWidth / 2 }
    static let laneRightX: CGFloat = 440

    /// ブロックヘッダー上の余白 (タイトルプレート上端分)
    static let yTopPadding: CGFloat = 56
    /// ヘッダープレート → 1 つ目の踊り場
    static let yHeaderToFirst: CGFloat = 80
    /// 通常踊り場間 (小→小)
    static let yStageGap: CGFloat = 130
    /// 直前踊り場 → 大踊り場
    static let yBeforeBig: CGFloat = 170
    /// 扉 → 次ブロックヘッダー
    static let yDoorToNextHeader: CGFloat = 70
    /// 大踊り場に対する扉の相対 Y (上方・奥行き演出)
    static let yDoorOffsetFromBig: CGFloat = -10

    /// 大踊り場 (ブロック末尾ステージ) の縦サイズ目安
    static let bigLandingHeight: CGFloat = 180
    /// 小踊り場の縦サイズ目安
    static let smallLandingHeight: CGFloat = 90
}

enum SurvivalDescentLane: String, Hashable, Sendable {
    case left
    case center
    case right

    var x: CGFloat {
        switch self {
        case .left: return SurvivalDescentLayoutConstants.laneLeftX
        case .center: return SurvivalDescentLayoutConstants.laneCenterX
        case .right: return SurvivalDescentLayoutConstants.laneRightX
        }
    }
}

enum SurvivalDescentLandingType: String, Hashable, Sendable {
    case small
    case big
}

struct SurvivalDescentStagePosition: Identifiable, Hashable, Sendable {
    let stageNumber: Int
    let x: CGFloat
    let y: CGFloat
    let lane: SurvivalDescentLane
    let landingType: SurvivalDescentLandingType
    let blockKey: SurvivalBlockKey

    var id: Int { stageNumber }
}

struct SurvivalDescentBlockLayout: Identifiable, Hashable, Sendable {
    let blockKey: SurvivalBlockKey
    let blockIndex: Int
    let headerY: CGFloat
    let doorY: CGFloat
    let bigLandingY: CGFloat
    let startY: CGFloat
    let endY: CGFloat
    let stages: [SurvivalDescentStagePosition]

    var id: String { blockKey.rawValue }
}

struct SurvivalDescentLayout: Sendable {
    let logicalWidth: CGFloat
    let totalHeight: CGFloat
    let blocks: [SurvivalDescentBlockLayout]
    /// stageNumber → StagePosition への即時参照
    let stagePositions: [Int: SurvivalDescentStagePosition]

    func position(for stageNumber: Int) -> SurvivalDescentStagePosition? {
        stagePositions[stageNumber]
    }

    func blockLayout(for stageNumber: Int) -> SurvivalDescentBlockLayout? {
        blocks.first { $0.stages.contains(where: { $0.stageNumber == stageNumber }) }
    }
}

enum SurvivalDescentLayoutBuilder {
    /// ブロック内ステージに左右交互のレーンを割り当てる。末尾のみ中央。
    private static func assignLane(indexInBlock: Int, isLastInBlock: Bool) -> SurvivalDescentLane {
        if isLastInBlock { return .center }
        return indexInBlock % 2 == 0 ? .left : .right
    }

    private static func buildLayout(
        for block: SurvivalBlockMeta,
        startY: CGFloat
    ) -> SurvivalDescentBlockLayout {
        let c = SurvivalDescentLayoutConstants.self
        let headerY = startY + c.yTopPadding
        let firstStageY = headerY + c.yHeaderToFirst

        var stages: [SurvivalDescentStagePosition] = []
        var y = firstStageY
        let count = block.stageNumbers.count

        for i in 0..<count {
            let isLast = (i == count - 1)
            let lane = assignLane(indexInBlock: i, isLastInBlock: isLast)
            let stageNumber = block.stageNumbers[i]
            stages.append(
                SurvivalDescentStagePosition(
                    stageNumber: stageNumber,
                    x: lane.x,
                    y: y,
                    lane: lane,
                    landingType: isLast ? .big : .small,
                    blockKey: block.blockKey
                )
            )
            if !isLast {
                y += (i == count - 2) ? c.yBeforeBig : c.yStageGap
            }
        }

        let bigLandingY = stages.last?.y ?? firstStageY
        let doorY = bigLandingY + c.yDoorOffsetFromBig
        let endY = bigLandingY + c.bigLandingHeight / 2 + c.yDoorToNextHeader

        return SurvivalDescentBlockLayout(
            blockKey: block.blockKey,
            blockIndex: block.blockIndex,
            headerY: headerY,
            doorY: doorY,
            bigLandingY: bigLandingY,
            startY: startY,
            endY: endY,
            stages: stages
        )
    }

    static func build(blocks: [SurvivalBlockMeta] = SurvivalStageCatalog.blocks) -> SurvivalDescentLayout {
        var layouts: [SurvivalDescentBlockLayout] = []
        var cursorY: CGFloat = 0
        for block in blocks {
            let layout = buildLayout(for: block, startY: cursorY)
            layouts.append(layout)
            cursorY = layout.endY
        }

        var positions: [Int: SurvivalDescentStagePosition] = [:]
        for layout in layouts {
            for stage in layout.stages {
                positions[stage.stageNumber] = stage
            }
        }

        let totalHeight = layouts.last?.endY ?? 0

        return SurvivalDescentLayout(
            logicalWidth: SurvivalDescentLayoutConstants.logicalWidth,
            totalHeight: totalHeight,
            blocks: layouts,
            stagePositions: positions
        )
    }
}

/// 進捗から「アクセス可能な最深ブロックの index」を算出する
enum SurvivalDescentAccess {
    /// 次のステージが属するブロックまでをアクセス可能とする (Web の getAccessibleBlockIndex と同等)
    static func accessibleBlockIndex(
        blocks: [SurvivalBlockMeta],
        currentStageNumber: Int,
        clearedStages: Set<Int>
    ) -> Int {
        guard !blocks.isEmpty else { return 0 }
        var accessible = 0
        for (index, block) in blocks.enumerated() {
            if block.stageNumbers.contains(currentStageNumber) {
                accessible = max(accessible, index)
            }
            let allCleared = !block.stageNumbers.isEmpty
                && block.stageNumbers.allSatisfy { clearedStages.contains($0) }
            if allCleared, index + 1 < blocks.count {
                accessible = max(accessible, index + 1)
            }
        }
        return accessible
    }
}
