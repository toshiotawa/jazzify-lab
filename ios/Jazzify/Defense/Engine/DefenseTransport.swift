import Foundation

struct DefenseSwitchPlan: Equatable {
    let switchAt: Double
    let immediate: Bool
    let cutAt: Double
}

enum DefenseTransport {
    static func barSeconds(bpm: Double, beatsPerBar: Int) -> Double {
        let safeBpm = max(1.0, bpm)
        let safeBeats = max(1, beatsPerBar)
        return (60.0 / safeBpm) * Double(safeBeats)
    }

    static func beatSeconds(bpm: Double, playbackRatio: Double = 1) -> Double {
        let safeBpm = max(1.0, bpm)
        let safeRatio = max(0.0001, playbackRatio)
        return 60.0 / safeBpm / safeRatio
    }

    static func barSecondsFromLoop(loopStartSec: Double, loopEndSec: Double, barCount: Int) -> Double {
        let duration = max(1e-6, loopEndSec - loopStartSec)
        return duration / Double(max(1, barCount))
    }

    /// Keep the current bar-phase when tempo changes, so the next bar head
    /// stays musically aligned instead of being recomputed from t=0.
    static func rebaseTransportStart(
        now: Double,
        transportStart: Double,
        oldBarSec: Double,
        newBarSec: Double
    ) -> Double {
        guard oldBarSec > 0, newBarSec > 0 else { return now }
        let elapsed = max(0, now - transportStart)
        let barIndex = floor(elapsed / oldBarSec)
        let phase = elapsed - barIndex * oldBarSec
        let fraction = phase / oldBarSec
        return now - fraction * newBarSec
    }

    private static let scheduleMinQuantumSec = 0.001

    static func planSwitch(
        now: Double,
        transportStart: Double,
        cutIntervalSec: Double,
        beatSec: Double
    ) -> DefenseSwitchPlan {
        guard cutIntervalSec > 0 else {
            return DefenseSwitchPlan(switchAt: now, immediate: true, cutAt: now)
        }

        let safeBeat = max(1e-9, beatSec)
        let epsilon = 1e-9
        let elapsed = max(0, now - transportStart)
        let cutIndex = Int(floor(elapsed / cutIntervalSec + epsilon))
        let recentCutAt = transportStart + Double(cutIndex) * cutIntervalSec
        let upcomingCutAt = recentCutAt + cutIntervalSec

        if now >= recentCutAt - epsilon {
            let overshoot = now - recentCutAt
            if overshoot <= safeBeat + epsilon {
                return DefenseSwitchPlan(switchAt: now, immediate: true, cutAt: recentCutAt)
            }
        }

        if now < upcomingCutAt - epsilon {
            let remaining = upcomingCutAt - now
            if remaining < scheduleMinQuantumSec {
                return DefenseSwitchPlan(switchAt: now, immediate: true, cutAt: upcomingCutAt)
            }
            return DefenseSwitchPlan(switchAt: upcomingCutAt, immediate: false, cutAt: upcomingCutAt)
        }

        return DefenseSwitchPlan(switchAt: now, immediate: true, cutAt: upcomingCutAt)
    }

    static func nextSwitchTime(
        now: Double,
        transportStart: Double,
        barSec: Double,
        deadlineSec: Double,
        beatSec: Double? = nil
    ) -> Double {
        _ = deadlineSec
        let resolvedBeatSec = beatSec ?? (barSec / 4.0)
        return planSwitch(
            now: now,
            transportStart: transportStart,
            cutIntervalSec: barSec,
            beatSec: resolvedBeatSec
        ).switchAt
    }

    static func barSamples(sampleRate: Double, bpm: Double, beatsPerBar: Int) -> Int64 {
        let safeBpm = max(1.0, bpm)
        let safeBeats = max(1, beatsPerBar)
        let barSeconds = (60.0 / safeBpm) * Double(safeBeats)
        return Int64((barSeconds * sampleRate).rounded())
    }

    static func nextSwitchSample(
        transportSample: Int64,
        barSamples: Int64,
        deadlineSamples: Int64
    ) -> Int64 {
        guard barSamples > 0 else { return transportSample }
        let barIndex = transportSample / barSamples
        var switchAt = (barIndex + 1) * barSamples
        if switchAt - transportSample < deadlineSamples {
            switchAt += barSamples
        }
        return switchAt
    }

    static func deadlineSamples(sampleRate: Double, renderQuantum: Int = 512) -> Int64 {
        Int64((0.05 * sampleRate).rounded()) + Int64(renderQuantum * 2)
    }
}
