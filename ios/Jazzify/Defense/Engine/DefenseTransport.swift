import Foundation

enum DefenseTransport {
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
