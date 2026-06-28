import Foundation

enum EarTrainingOsmdTimingAdjustment {
    static let timingAdjustmentMsMin = -300
    static let timingAdjustmentMsMax = 300
    static let timingAdjustmentMsStep = 10
    static let timingAdjustmentMsDefault = 40

    private static let storageKey = "earTraining.osmd.timingAdjustmentMs"

    static func clampTimingAdjustmentMs(_ ms: Int) -> Int {
        let clamped = max(timingAdjustmentMsMin, min(timingAdjustmentMsMax, ms))
        let rounded = Int((Double(clamped) / Double(timingAdjustmentMsStep)).rounded())
            * timingAdjustmentMsStep
        return max(timingAdjustmentMsMin, min(timingAdjustmentMsMax, rounded))
    }

    static func timingAdjustmentSec(fromMs ms: Int) -> Double {
        Double(clampTimingAdjustmentMs(ms)) / 1000.0
    }

    static func resolveCalibratedTargetTimeSec(
        speedScaledTargetTimeSec: Double,
        timingAdjustmentMs: Int
    ) -> Double {
        speedScaledTargetTimeSec + timingAdjustmentSec(fromMs: timingAdjustmentMs)
    }

    static func formatTimingAdjustmentLabel(_ ms: Int) -> String {
        let clamped = clampTimingAdjustmentMs(ms)
        if clamped > 0 {
            return "+\(clamped)ms"
        }
        return "\(clamped)ms"
    }

    static func loadTimingAdjustmentMs() -> Int {
        let defaults = UserDefaults.standard
        guard defaults.object(forKey: storageKey) != nil else {
            return timingAdjustmentMsDefault
        }
        return clampTimingAdjustmentMs(defaults.integer(forKey: storageKey))
    }

    static func saveTimingAdjustmentMs(_ ms: Int) {
        UserDefaults.standard.set(clampTimingAdjustmentMs(ms), forKey: storageKey)
    }
}
