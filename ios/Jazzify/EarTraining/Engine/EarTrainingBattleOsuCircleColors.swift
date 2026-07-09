import UIKit

/// Web `earTrainingBattleOsuCircleColors.ts` 相当。
enum EarTrainingBattleOsuCircleColors {
    static let patternCount = 4
    static let outerStrokeAlpha: CGFloat = 0.55
    static let outerLineWidth: CGFloat = 2

    private static let pastelColors: [UIColor] = [
        UIColor(red: 249 / 255, green: 168 / 255, blue: 212 / 255, alpha: 1),
        UIColor(red: 147 / 255, green: 197 / 255, blue: 253 / 255, alpha: 1),
        UIColor(red: 134 / 255, green: 239 / 255, blue: 172 / 255, alpha: 1),
        UIColor(red: 216 / 255, green: 180 / 255, blue: 254 / 255, alpha: 1),
    ]

    static func resolveColorIndex(
        measureNumber: Int,
        loopMeasures: Int,
        phraseSectionMeasures: Int = 1
    ) -> Int {
        let safeLoop = max(1, loopMeasures)
        let safeSection = max(1, phraseSectionMeasures)
        let measureInLoop = (max(1, measureNumber) - 1) % safeLoop
        let sectionIndex = measureInLoop / safeSection
        return sectionIndex % patternCount
    }

    static func innerStroke(colorIndex: Int) -> UIColor {
        let index = ((colorIndex % patternCount) + patternCount) % patternCount
        return pastelColors[index]
    }

    static func outerStroke(colorIndex: Int) -> UIColor {
        innerStroke(colorIndex: colorIndex).withAlphaComponent(outerStrokeAlpha)
    }
}
