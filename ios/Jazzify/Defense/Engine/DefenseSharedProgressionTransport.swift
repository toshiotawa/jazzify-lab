import Foundation

enum DefenseSharedProgressionSwitchEveryBars: Int {
    case one = 1
    case two = 2
    case four = 4
}

struct DefenseSharedProgressionSwitchPlan: Equatable {
    let switchAt: Double
    let destinationBar0: Int
    let absoluteSwitchBar0: Int
    let immediate: Bool
}

enum DefenseSharedProgressionTransport {
    static func barSeconds(bpm: Double, beatsPerBar: Int, playbackRatio: Double) -> Double {
        let safeBpm = max(1.0, bpm)
        let safeBeats = max(1, beatsPerBar)
        let safeRatio = max(0.0001, playbackRatio)
        return (60 / safeBpm) * Double(safeBeats) / safeRatio
    }

    static func absoluteBarPosition(audioTime: Double, transportStart: Double, barSec: Double) -> Double {
        guard barSec > 0 else { return 0 }
        return max(0, (audioTime - transportStart) / barSec)
    }

    static func planSwitch(
        nowAudioTime: Double,
        transportStart: Double,
        barSec: Double,
        progressionBars: Int,
        switchEveryBars: DefenseSharedProgressionSwitchEveryBars,
        beatSec: Double
    ) -> DefenseSharedProgressionSwitchPlan {
        let safeN = max(1, progressionBars)
        let cutIntervalSec = max(1e-9, barSec * Double(max(1, switchEveryBars.rawValue)))
        let plan = DefenseTransport.planSwitch(
            now: nowAudioTime,
            transportStart: transportStart,
            cutIntervalSec: cutIntervalSec,
            beatSec: beatSec
        )

        let absoluteBarPosition = absoluteBarPosition(
            audioTime: nowAudioTime,
            transportStart: transportStart,
            barSec: barSec
        )

        if plan.immediate {
            let currentBar0 = Int(floor(absoluteBarPosition + 1e-9))
            return DefenseSharedProgressionSwitchPlan(
                switchAt: plan.switchAt,
                destinationBar0: currentBar0 % safeN,
                absoluteSwitchBar0: currentBar0,
                immediate: true
            )
        }

        let absoluteSwitchBar0 = Int(round((plan.cutAt - transportStart) / barSec))
        return DefenseSharedProgressionSwitchPlan(
            switchAt: plan.switchAt,
            destinationBar0: absoluteSwitchBar0 % safeN,
            absoluteSwitchBar0: absoluteSwitchBar0,
            immediate: false
        )
    }

    static func barOffsetSec(destinationBar0: Int, barSec: Double) -> Double {
        Double(max(0, destinationBar0)) * barSec
    }

    static func expectedFrameCount(
        progressionBars: Int,
        bpm: Double,
        beatsPerBar: Int,
        sampleRate: Double
    ) -> Int {
        let totalSec = Double(max(1, progressionBars)) * barSeconds(
            bpm: bpm,
            beatsPerBar: beatsPerBar,
            playbackRatio: 1
        )
        return Int((totalSec * sampleRate).rounded())
    }

    static func frameCountTolerance(sampleRate: Double) -> Int {
        max(1, Int((max(1, sampleRate) * 0.25).rounded()))
    }

    static func isFrameCountValid(actualFrames: Int, expectedFrames: Int, sampleRate: Double) -> Bool {
        abs(actualFrames - expectedFrames) <= frameCountTolerance(sampleRate: sampleRate)
    }

    static func buildBarFrameTable(progressionBars: Int, barFrameCount: Int) -> [Int] {
        let safeN = max(1, progressionBars)
        var frames: [Int] = []
        for bar in 0...safeN {
            frames.append(Int(round((Double(bar) / Double(safeN)) * Double(barFrameCount))))
        }
        return frames
    }
}
