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

    static func scalePracticeTimingWindowSec(_ windowSec: Double, speedPercent: Int) -> Double {
        let ratio = practiceSpeedRatio(speedPercent)
        guard ratio < 1 else { return windowSec }
        return windowSec / ratio
    }

    static func effectivePracticeBpm(_ bpm: Int, speedPercent: Int) -> Int {
        max(1, Int((Double(bpm) * practiceSpeedRatio(speedPercent)).rounded()))
    }

    static func scalePracticePhraseLoopEndSec(_ loopEndSec: Double, speedPercent: Int) -> Double {
        let ratio = practiceSpeedRatio(speedPercent)
        guard ratio < 1 else { return loopEndSec }
        return loopEndSec / ratio
    }

    /// 練習タイムライン秒を、未ストレッチ PCM / ファイル上の秒へ変換する（`AVAudioUnitTimePitch` 再生用）。
    static func practiceBufferOffsetSec(timelineOffsetSec: Double, speedPercent: Int) -> Double {
        max(0, timelineOffsetSec) * practiceSpeedRatio(speedPercent)
    }
}
