import Foundation

enum YinPitch {
    static let windowSize = 4096
    static let hopSize = 480
    static let sampleRate = 48_000.0
    static let frameSec = Double(hopSize) / sampleRate
    static let threshold = 0.15

    struct FrequencyRange {
        let minHz: Double
        let maxHz: Double
    }

    struct AnalysisResult {
        let frequencyHz: Double?
        let confidence: Double
        let volume: Double
    }

    static func frequencyRange(for shift: VoiceLowPitchShift) -> FrequencyRange {
        switch shift {
        case .off:
            return FrequencyRange(minHz: 80, maxHz: 700)
        case .plus12:
            return FrequencyRange(minHz: 55, maxHz: 700)
        case .plus24:
            return FrequencyRange(minHz: 30, maxHz: 400)
        }
    }

    static func usesPitchDetection(for shift: VoiceLowPitchShift) -> Bool {
        shift != .off
    }

    static func hzToMidi(_ frequencyHz: Double) -> Double {
        69 + 12 * log2(frequencyHz / 440)
    }

    static func scaleOnsetConfig(_ config: PitchOnsetTrackerConfig) -> PitchOnsetTrackerConfig {
        func halve(_ value: Int) -> Int { max(1, Int((Double(value) / 2).rounded())) }
        var scaled = config
        scaled.pitchStableFrames = halve(config.pitchStableFrames)
        scaled.releaseFrames = halve(config.releaseFrames)
        scaled.minNoteFrames = halve(config.minNoteFrames)
        scaled.retriggerGuardFrames = halve(config.retriggerGuardFrames)
        scaled.retriggerLookbackFrames = halve(config.retriggerLookbackFrames)
        return scaled
    }

    static func analyzeWindow(
        _ window: UnsafePointer<Float>,
        count: Int,
        sampleRate: Double,
        range: FrequencyRange,
        threshold: Double = YinPitch.threshold
    ) -> AnalysisResult {
        guard count > 0 else {
            return AnalysisResult(frequencyHz: nil, confidence: 0, volume: 0)
        }

        var sumSquares = 0.0
        for index in 0..<count {
            let sample = Double(window[index])
            sumSquares += sample * sample
        }
        let volume = sqrt(sumSquares / Double(count))
        guard volume >= 1e-6 else {
            return AnalysisResult(frequencyHz: nil, confidence: 0, volume: volume)
        }

        let minPeriod = max(2, Int(floor(sampleRate / range.maxHz)))
        let maxPeriod = min(count - 1, Int(ceil(sampleRate / range.minHz)))
        guard minPeriod < maxPeriod else {
            return AnalysisResult(frequencyHz: nil, confidence: 0, volume: volume)
        }

        var difference = [Double](repeating: 0, count: maxPeriod + 1)
        for tau in 1...maxPeriod {
            var sum = 0.0
            let limit = count - tau
            for index in 0..<limit {
                let delta = Double(window[index]) - Double(window[index + tau])
                sum += delta * delta
            }
            difference[tau] = sum
        }

        var cmndf = [Double](repeating: 1, count: maxPeriod + 1)
        cmndf[0] = 1
        var runningSum = 0.0
        for tau in 1...maxPeriod {
            runningSum += difference[tau]
            cmndf[tau] = runningSum > 0 ? (difference[tau] * Double(tau)) / runningSum : 1
        }

        var bestTau = -1
        var bestValue = 1.0
        var tau = minPeriod
        while tau <= maxPeriod {
            let value = cmndf[tau]
            if value < threshold {
                var localTau = tau
                while localTau + 1 <= maxPeriod, cmndf[localTau + 1] < value {
                    localTau += 1
                }
                bestTau = localTau
                bestValue = cmndf[localTau]
                break
            }
            tau += 1
        }

        if bestTau < 0 {
            for candidate in minPeriod...maxPeriod {
                let value = cmndf[candidate]
                if value < bestValue {
                    bestValue = value
                    bestTau = candidate
                }
            }
        }

        guard bestTau > 0, bestValue < 0.4 else {
            return AnalysisResult(frequencyHz: nil, confidence: 0, volume: volume)
        }

        let refinedTau = parabolicInterpolation(cmndf: cmndf, tau: bestTau)
        let frequencyHz = sampleRate / refinedTau
        guard frequencyHz.isFinite, frequencyHz >= range.minHz, frequencyHz <= range.maxHz else {
            return AnalysisResult(frequencyHz: nil, confidence: 0, volume: volume)
        }

        let confidence = max(0, min(1, 1 - bestValue))
        return AnalysisResult(frequencyHz: frequencyHz, confidence: confidence, volume: volume)
    }

    private static func parabolicInterpolation(cmndf: [Double], tau: Int) -> Double {
        guard tau > 0, tau < cmndf.count - 1 else { return Double(tau) }
        let s0 = cmndf[tau - 1]
        let s1 = cmndf[tau]
        let s2 = cmndf[tau + 1]
        let denominator = 2 * s1 - s2 - s0
        guard denominator != 0 else { return Double(tau) }
        return Double(tau) + (s2 - s0) / (2 * denominator)
    }
}

/// 推論スレッド専用。4096 サンプル窓を 10 ms ごとに YIN 解析する。
final class YinPitchProcessor {
    private var shift = VoiceLowPitchShift.off
    private var ring = [Float](repeating: 0, count: YinPitch.windowSize)
    private var ringWriteIndex = 0
    private var filledSamples = 0
    private var samplesSinceHop = 0
    private var orderedWindow = [Float](repeating: 0, count: YinPitch.windowSize)

    func reset() {
        for index in ring.indices {
            ring[index] = 0
        }
        ringWriteIndex = 0
        filledSamples = 0
        samplesSinceHop = 0
    }

    func setShift(_ shift: VoiceLowPitchShift) {
        guard shift != self.shift else { return }
        self.shift = shift
        reset()
    }

    func push(
        samples: UnsafePointer<Float>,
        count: Int,
        emit: (_ result: YinPitch.AnalysisResult) -> Void
    ) {
        let range = YinPitch.frequencyRange(for: shift)
        for index in 0..<count {
            ring[ringWriteIndex] = samples[index]
            ringWriteIndex = (ringWriteIndex + 1) % YinPitch.windowSize
            if filledSamples < YinPitch.windowSize {
                filledSamples += 1
            }

            samplesSinceHop += 1
            guard samplesSinceHop >= YinPitch.hopSize, filledSamples >= YinPitch.windowSize else { continue }
            samplesSinceHop = 0

            var readIndex = ringWriteIndex
            for offset in 0..<YinPitch.windowSize {
                orderedWindow[offset] = ring[readIndex]
                readIndex = (readIndex + 1) % YinPitch.windowSize
            }

            orderedWindow.withUnsafeBufferPointer { buffer in
                guard let base = buffer.baseAddress else { return }
                let result = YinPitch.analyzeWindow(
                    base,
                    count: YinPitch.windowSize,
                    sampleRate: YinPitch.sampleRate,
                    range: range
                )
                emit(result)
            }
        }
    }
}
