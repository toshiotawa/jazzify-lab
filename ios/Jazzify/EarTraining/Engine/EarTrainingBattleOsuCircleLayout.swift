import CoreGraphics
import UIKit

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

    /// SpriteKit Y 上向き。鍵盤上端より下へ落ちないよう targetY の下限を上げる（iPhone のみ）。
    static func clampTargetYAboveKeyboard(
        _ targetY: CGFloat,
        keyboardTopFromBottom: CGFloat,
        minClearanceAboveKeyboard: CGFloat
    ) -> CGFloat {
        guard UIDevice.current.userInterfaceIdiom == .phone else {
            return targetY
        }
        let minY = keyboardTopFromBottom + minClearanceAboveKeyboard
        return max(targetY, minY)
    }

    static func apply(centerX: CGFloat, targetY: CGFloat, layoutIndex: Int) -> CGPoint {
        let safeIndex = max(0, layoutIndex)
        let offset = pattern[safeIndex % pattern.count]
        // Web Canvas は Y 下向きで +offsetY が下。SpriteKit は Y 上向きなので符号を反転する。
        return CGPoint(x: centerX + offset.x, y: targetY - offset.y)
    }
}
