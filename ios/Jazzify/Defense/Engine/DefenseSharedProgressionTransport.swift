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
        schedulingLeadSec: Double
    ) -> DefenseSharedProgressionSwitchPlan {
        let safeN = max(1, progressionBars)
        let switchEvery = max(1, switchEveryBars.rawValue)
        let epsilon = 1e-9
        let absoluteBarPosition = absoluteBarPosition(
            audioTime: nowAudioTime,
            transportStart: transportStart,
            barSec: barSec
        )

        var absoluteSwitchBar0 = (Int(floor((absoluteBarPosition + epsilon) / Double(switchEvery))) + 1) * switchEvery
        var switchAt = transportStart + Double(absoluteSwitchBar0) * barSec
        let safeLead = max(0, schedulingLeadSec)

        while switchAt - nowAudioTime < safeLead {
            absoluteSwitchBar0 += switchEvery
            switchAt = transportStart + Double(absoluteSwitchBar0) * barSec
        }

        let destinationBar0 = absoluteSwitchBar0 % safeN
        return DefenseSharedProgressionSwitchPlan(
            switchAt: switchAt,
            destinationBar0: destinationBar0,
            absoluteSwitchBar0: absoluteSwitchBar0
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
