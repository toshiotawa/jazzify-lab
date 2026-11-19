import CoreGraphics

enum DefenseSceneLayout {
    struct EnemyLayout {
        let size: CGSize
        let centerDx: CGFloat
        let footDy: CGFloat
        let centerDy: CGFloat
        let hpInset: CGFloat
    }

    static let enemyLayouts: [DefenseEnemyType: EnemyLayout] = Dictionary(uniqueKeysWithValues: DefenseEnemyType.allCases.map { type in
        let ratio: CGFloat
        let topInset: CGFloat
        let originalHeight = DefenseEnemyConfig.displaySpriteHeight(for: type)
        switch type {
        case .goblin: (ratio, topInset) = (1.03, 5)
        case .skeleton: (ratio, topInset) = (1.16, 8)
        case .wolf: (ratio, topInset) = (0.86, 1)
        case .golem: (ratio, topInset) = (1.17, 6)
        case .dragon: (ratio, topInset) = (1.19, 3)
        default: (ratio, topInset) = (0, 0)
        }
        let height = ratio == 0 ? originalHeight : EarTrainingBattleStageKit.characterDisplaySize * ratio
        let growth = height - originalHeight
        // SpriteKit is Y-up. Preserve the front contact point and the planted foot pixel.
        let footDy = -growth / 28
        return (type, EnemyLayout(size: CGSize(width: height * type.aspectRatio, height: height),
                                  centerDx: growth * type.aspectRatio * (0.5 - 0.06),
                                  footDy: footDy, centerDy: footDy + growth / 2, hpInset: height * topInset / 28))
    })

    static let playerXRatio: CGFloat = 0.23
    static let spawnXRatio: CGFloat = 0.97
    private static let playerLogicalX: CGFloat = 80
    private static let spawnLogicalX: CGFloat = 760

    static func logicalToScreenX(width: CGFloat, logicalX: CGFloat) -> CGFloat {
        let playerScreenX = width * playerXRatio
        let spawnScreenX = width * spawnXRatio
        let logicalSpan = spawnLogicalX - playerLogicalX
        guard logicalSpan > 0 else { return playerScreenX }
        let t = (logicalX - playerLogicalX) / logicalSpan
        return playerScreenX + t * (spawnScreenX - playerScreenX)
    }

    /// Canvas (Y-down) の床からのオフセットを SpriteKit (Y-up) の screen Y に変換する。
    static func screenY(floorY: CGFloat, canvasDeltaFromFloor: CGFloat) -> CGFloat {
        floorY - canvasDeltaFromFloor
    }
}
