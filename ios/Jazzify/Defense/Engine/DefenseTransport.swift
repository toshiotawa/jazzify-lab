import Foundation

enum DefenseTransport {
    static func barSeconds(bpm: Double, beatsPerBar: Int) -> Double {
        let safeBpm = max(1.0, bpm)
        let safeBeats = max(1, beatsPerBar)
        return (60.0 / safeBpm) * Double(safeBeats)
    }

    static func nextSwitchTime(
        now: Double,
        transportStart: Double,
        barSec: Double,
        deadlineSec: Double
    ) -> Double {
        guard barSec > 0 else { return now }
        let barIndex = floor((now - transportStart) / barSec)
        var switchAt = transportStart + (barIndex + 1) * barSec
        if switchAt - now < max(0, deadlineSec) {
            switchAt += barSec
        }
        return switchAt
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
