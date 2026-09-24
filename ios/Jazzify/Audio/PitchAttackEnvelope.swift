import Foundation

enum PitchAttackEnvelopeConstants {
    static let windowSamples = 1024
    static let sampleRate = 48_000
}

struct PitchAttackEnvelopeTargets {
    let repeatPitchClassMask: Int
    let expectedPitchMidis: [Int]
}

final class PitchAttackEnvelope {
    private let ring: [Float]
    private let hannWindow: [Float]
    private var writeIndex = 0
    private var filled = 0
    private var mutableRing: [Float]

    init(windowSamples: Int = PitchAttackEnvelopeConstants.windowSamples) {
        ring = Array(repeating: 0, count: windowSamples)
        mutableRing = ring
        hannWindow = Self.buildHannWindow(size: windowSamples)
    }

    func reset() {
        mutableRing = Array(repeating: 0, count: mutableRing.count)
        writeIndex = 0
        filled = 0
    }

    func pushSamples(_ samples: UnsafePointer<Float>, count: Int) {
        for index in 0..<count {
            mutableRing[writeIndex] = samples[index]
            writeIndex = (writeIndex + 1) % mutableRing.count
            filled = min(mutableRing.count, filled + 1)
        }
    }

    func computeAttackDb(targets: PitchAttackEnvelopeTargets) -> Double {
        guard filled > 0 else { return -120 }
        let sampleCount = filled
        let ordered = orderedWindow(sampleCount: sampleCount)
        let targetMidis = resolveTargetMidis(targets: targets)
        if targetMidis.isEmpty {
            return Self.energyToDb(Self.computeWindowRmsEnergy(
                samples: ordered,
                window: hannWindow,
                sampleCount: sampleCount
            ))
        }
        var combinedEnergy = 0.0
        for midi in targetMidis {
            let fundamentalHz = Self.midiToHz(midi)
            combinedEnergy += Self.goertzelEnergy(
                samples: ordered,
                window: hannWindow,
                sampleCount: sampleCount,
                targetHz: fundamentalHz
            )
            combinedEnergy += Self.goertzelEnergy(
                samples: ordered,
                window: hannWindow,
                sampleCount: sampleCount,
                targetHz: fundamentalHz * 2
            ) * 0.5
        }
        return Self.energyToDb(combinedEnergy / Double(targetMidis.count))
    }

    private func orderedWindow(sampleCount: Int) -> [Float] {
        var ordered = Array(repeating: Float(0), count: sampleCount)
        let start = filled < mutableRing.count ? 0 : writeIndex
        for index in 0..<sampleCount {
            ordered[index] = mutableRing[(start + index) % mutableRing.count]
        }
        return ordered
    }

    private func resolveTargetMidis(targets: PitchAttackEnvelopeTargets) -> [Int] {
        if targets.repeatPitchClassMask != 0 {
            let repeatMidis = targets.expectedPitchMidis.filter { midi in
                let pitchClass = ((midi % 12) + 12) % 12
                return (targets.repeatPitchClassMask & (1 << pitchClass)) != 0
            }
            if !repeatMidis.isEmpty {
                return repeatMidis
            }
        }
        if !targets.expectedPitchMidis.isEmpty {
            return targets.expectedPitchMidis
        }
        return []
    }

    private static func buildHannWindow(size: Int) -> [Float] {
        guard size > 1 else { return [1] }
        return (0..<size).map { index in
            Float(0.5 * (1 - cos((2 * Double.pi * Double(index)) / Double(size - 1))))
        }
    }

    private static func midiToHz(_ midi: Int) -> Double {
        440 * pow(2, Double(midi - 69) / 12)
    }

    private static func energyToDb(_ energy: Double) -> Double {
        10 * log10(max(energy, 1e-12))
    }

    private static func goertzelEnergy(
        samples: [Float],
        window: [Float],
        sampleCount: Int,
        targetHz: Double
    ) -> Double {
        let normalizedHz = targetHz * Double(sampleCount) / Double(PitchAttackEnvelopeConstants.sampleRate)
        let k = Int(round(normalizedHz))
        let w = (2 * Double.pi * Double(k)) / Double(sampleCount)
        let coeff = 2 * cos(w)
        var sPrev = 0.0
        var sPrev2 = 0.0
        for index in 0..<sampleCount {
            let sample = Double(samples[index] * window[index])
            let s = sample + coeff * sPrev - sPrev2
            sPrev2 = sPrev
            sPrev = s
        }
        let real = sPrev - sPrev2 * cos(w)
        let imag = sPrev2 * sin(w)
        return (real * real + imag * imag) / Double(sampleCount)
    }

    private static func computeWindowRmsEnergy(
        samples: [Float],
        window: [Float],
        sampleCount: Int
    ) -> Double {
        var sumSq = 0.0
        for index in 0..<sampleCount {
            let sample = Double(samples[index] * window[index])
            sumSq += sample * sample
        }
        return sumSq / Double(max(1, sampleCount))
    }
}
