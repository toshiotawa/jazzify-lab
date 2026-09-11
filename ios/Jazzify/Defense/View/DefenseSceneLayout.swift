import CoreGraphics

enum DefenseSceneLayout {
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
}
