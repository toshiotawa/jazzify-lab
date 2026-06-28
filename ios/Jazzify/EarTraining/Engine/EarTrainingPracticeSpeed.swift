import Foundation

enum EarTrainingPracticeSpeed {
    static let practiceSpeedMinPercent = 40
    static let practiceSpeedMaxPercent = 100

    static func clampPracticeSpeedPercent(_ percent: Int) -> Int {
        max(practiceSpeedMinPercent, min(practiceSpeedMaxPercent, percent))
    }

    static func practiceSpeedRatio(_ percent: Int) -> Double {
        Double(clampPracticeSpeedPercent(percent)) / 100.0
    }

    static func scalePracticeTargetTimeSec(_ targetTimeSec: Double, speedPercent: Int) -> Double {
        let ratio = practiceSpeedRatio(speedPercent)
        guard ratio < 1 else { return targetTimeSec }
        return targetTimeSec / ratio
    }

    static func effectivePracticeBpm(_ bpm: Int, speedPercent: Int) -> Int {
        max(1, Int((Double(bpm) * practiceSpeedRatio(speedPercent)).rounded()))
    }

    static func scalePracticePhraseLoopEndSec(_ loopEndSec: Double, speedPercent: Int) -> Double {
        let ratio = practiceSpeedRatio(speedPercent)
        guard ratio < 1 else { return loopEndSec }
        return loopEndSec / ratio
    }

    /// `AVAudioUnitTimePitch.rate` 変更によるピッチ変化を相殺する cent 値。
    static func ratePitchCompensationCents(forRate rate: Float) -> Float {
        guard rate > 0 else { return 0 }
        return Float(-1200.0 * log2(Double(rate)))
    }
}
