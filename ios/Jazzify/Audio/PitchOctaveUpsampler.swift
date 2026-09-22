import Foundation

enum VoiceLowPitchShift: Int, CaseIterable {
    case off = 0
    case plus12 = 12
    case plus24 = 24

    static func normalize(_ value: Int) -> VoiceLowPitchShift {
        VoiceLowPitchShift(rawValue: value) ?? .off
    }

    var decimationFactor: Int {
        switch self {
        case .off: return 1
        case .plus12: return 2
        case .plus24: return 4
        }
    }

    var pitchShiftSemitones: Int { rawValue }

    var frameSec: Double {
        Double(PitchOctaveUpsampler.chunkSize * decimationFactor) / PitchOctaveUpsampler.sampleRate
    }
}

enum PitchOctaveUpsampler {
    static let chunkSize = 240
    static let sampleRate = 48_000.0
    fileprivate static let firTaps = 31

    static func scaleOnsetConfig(
        _ config: PitchOnsetTrackerConfig,
        factor: Int
    ) -> PitchOnsetTrackerConfig {
        guard factor > 1 else { return config }
        func divide(_ value: Int) -> Int { max(1, Int((Double(value) / Double(factor)).rounded())) }
        var scaled = config
        scaled.pitchStableFrames = divide(config.pitchStableFrames)
        scaled.releaseFrames = divide(config.releaseFrames)
        scaled.minNoteFrames = divide(config.minNoteFrames)
        scaled.retriggerGuardFrames = divide(config.retriggerGuardFrames)
        scaled.retriggerLookbackFrames = divide(config.retriggerLookbackFrames)
        return scaled
    }

    fileprivate static let coeffsFactor2 = buildLowpassCoefficients(cutoffHz: 10_000)
    fileprivate static let coeffsFactor4 = buildLowpassCoefficients(cutoffHz: 5_000)

    fileprivate static func buildLowpassCoefficients(cutoffHz: Double) -> [Float] {
        let normalizedCutoff = cutoffHz / sampleRate
        let lastTap = Double(firTaps - 1)
        let center = lastTap / 2.0
        var coeffs = [Float](repeating: 0, count: firTaps)
        var sum = 0.0

        for tap in 0..<firTaps {
            let offset = Double(tap) - center
            let sinc: Double
            if abs(offset) < 1e-12 {
                sinc = 2 * normalizedCutoff
            } else {
                sinc = sin(2 * Double.pi * normalizedCutoff * offset) / (Double.pi * offset)
            }
            let window = 0.54 - 0.46 * cos((2 * Double.pi * Double(tap)) / lastTap)
            coeffs[tap] = Float(sinc * window)
            sum += Double(coeffs[tap])
        }

        if sum != 0 {
            for tap in 0..<firTaps {
                coeffs[tap] = Float(Double(coeffs[tap]) / sum)
            }
        }
        return coeffs
    }
}

/// オーディオレンダースレッド専用。ヒープ割当なし。
final class PitchOctaveUpsamplerState {
    private var factor = 1
    private var coeffs: [Float] = []
    private var delayLine = [Float](repeating: 0, count: PitchOctaveUpsampler.firTaps)
    private var delayWriteIndex = 0
    private var decimationCounter = 0
    private var outputBuffer = [Float](repeating: 0, count: PitchOctaveUpsampler.chunkSize)
    private var outputWriteIndex = 0

    func reset() {
        for index in delayLine.indices {
            delayLine[index] = 0
        }
        delayWriteIndex = 0
        decimationCounter = 0
        outputWriteIndex = 0
    }

    func setShift(_ shift: VoiceLowPitchShift) {
        let nextFactor = shift.decimationFactor
        guard nextFactor != factor else { return }
        factor = nextFactor
        switch nextFactor {
        case 1:
            coeffs = []
        case 2:
            coeffs = PitchOctaveUpsampler.coeffsFactor2
        default:
            coeffs = PitchOctaveUpsampler.coeffsFactor4
        }
        reset()
    }

    func factorValue() -> Int { factor }

    func push(
        samples: UnsafePointer<Float>,
        count: Int,
        emitChunk: (_ slotBase: UnsafeMutablePointer<Float>) -> Void
    ) {
        guard factor > 1, !coeffs.isEmpty else { return }

        for index in 0..<count {
            let filtered = filterSample(samples[index])
            decimationCounter += 1
            guard decimationCounter >= factor else { continue }
            decimationCounter = 0

            outputBuffer[outputWriteIndex] = filtered
            outputWriteIndex += 1
            guard outputWriteIndex >= PitchOctaveUpsampler.chunkSize else { continue }

            emitChunk(UnsafeMutablePointer(mutating: outputBuffer))
            outputWriteIndex = 0
        }
    }

    private func filterSample(_ sample: Float) -> Float {
        delayLine[delayWriteIndex] = sample
        var acc: Float = 0
        var tapIndex = delayWriteIndex

        for tap in 0..<PitchOctaveUpsampler.firTaps {
            acc += delayLine[tapIndex] * coeffs[tap]
            tapIndex = tapIndex == 0 ? PitchOctaveUpsampler.firTaps - 1 : tapIndex - 1
        }

        delayWriteIndex = (delayWriteIndex + 1) % PitchOctaveUpsampler.firTaps
        return acc
    }
}
