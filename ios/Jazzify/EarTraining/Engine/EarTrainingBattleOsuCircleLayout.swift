import CoreGraphics

/// Web `earTrainingBattleOsuCircleLayout.ts` 相当。
enum EarTrainingBattleOsuCircleLayout {
    private struct Offset {
        let x: CGFloat
        let y: CGFloat
    }

    private static let pattern: [Offset] = [
        Offset(x: 0, y: 0),
        Offset(x: -22, y: -10),
        Offset(x: 22, y: -10),
        Offset(x: -14, y: 14),
        Offset(x: 14, y: 14),
        Offset(x: -28, y: 0),
        Offset(x: 28, y: 0),
        Offset(x: 0, y: -18),
    ]

    static func apply(centerX: CGFloat, targetY: CGFloat, layoutIndex: Int) -> CGPoint {
        let safeIndex = max(0, layoutIndex)
        let offset = pattern[safeIndex % pattern.count]
        return CGPoint(x: centerX + offset.x, y: targetY + offset.y)
    }
}
