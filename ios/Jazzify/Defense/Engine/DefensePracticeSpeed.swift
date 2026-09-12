import Foundation

enum DefensePracticeSpeed {
    static let minPercent = 50
    static let maxPercent = 150
    static let step = 10

    static func clamp(_ percent: Int) -> Int {
        max(minPercent, min(maxPercent, percent))
    }

    static func ratio(_ percent: Int) -> Double {
        Double(clamp(percent)) / 100.0
    }

    static func stepped(_ percent: Int, delta: Int) -> Int {
        clamp(percent + delta * step)
    }
}
