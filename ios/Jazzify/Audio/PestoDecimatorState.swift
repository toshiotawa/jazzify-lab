import Foundation

/// 認識専用デシメータ（48kHz 軸維持、q 倍間引き）。
final class PestoDecimatorState {
    let q: Int
    private let coeffs: (b0: Double, b1: Double, b2: Double, a1: Double, a2: Double)
    private var x1 = Double.zero
    private var x2 = Double.zero
    private var y1 = Double.zero
    private var y2 = Double.zero
    private var decimPhase = 0
    private var chunksAccumulated = 0
    private let scratch: UnsafeMutablePointer<Float>
    private let modelInput: UnsafeMutablePointer<Float>
    private(set) var outputReady = false

    init(q: Int) {
        self.q = max(1, q)
        coeffs = Self.lowpassCoeffs(q: self.q)
        scratch = UnsafeMutablePointer<Float>.allocate(capacity: 240 * self.q)
        scratch.initialize(repeating: 0, count: 240 * self.q)
        modelInput = UnsafeMutablePointer<Float>.allocate(capacity: 240)
        modelInput.initialize(repeating: 0, count: 240)
    }

    var modelInputBase: UnsafeMutablePointer<Float> { modelInput }

    func accumulate(source: UnsafePointer<Float>, count: Int) {
        outputReady = false
        guard q > 1 else {
            modelInput.update(from: source, count: min(count, 240))
            outputReady = true
            return
        }
        let offset = chunksAccumulated * 240
        scratch.advanced(by: offset).update(from: source, count: min(count, 240))
        chunksAccumulated += 1
        guard chunksAccumulated >= q else { return }
        chunksAccumulated = 0
        let total = 240 * q
        var outLen = 0
        for index in 0..<total {
            let filtered = biquadStep(Double(scratch[index]), coeffs: coeffs)
            if decimPhase == 0, outLen < 240 {
                modelInput[outLen] = Float(filtered)
                outLen += 1
            }
            decimPhase = (decimPhase + 1) % q
        }
        outputReady = outLen == 240
    }

    private func biquadStep(_ x0: Double, coeffs: (b0: Double, b1: Double, b2: Double, a1: Double, a2: Double)) -> Double {
        let y0 = coeffs.b0 * x0 + coeffs.b1 * x1 + coeffs.b2 * x2 - coeffs.a1 * y1 - coeffs.a2 * y2
        x2 = x1
        x1 = x0
        y2 = y1
        y1 = y0
        return y0
    }

    private static func lowpassCoeffs(q: Int) -> (b0: Double, b1: Double, b2: Double, a1: Double, a2: Double) {
        let fc = 0.45 / Double(q)
        let w0 = 2 * Double.pi * fc
        let cosW0 = cos(w0)
        let sinW0 = sin(w0)
        let alpha = sinW0 / (2 * 0.707)
        let b0 = (1 - cosW0) / 2
        let b1 = 1 - cosW0
        let b2 = (1 - cosW0) / 2
        let a0 = 1 + alpha
        return (b0 / a0, b1 / a0, b2 / a0, (-2 * cosW0) / a0, (1 - alpha) / a0)
    }

    deinit {
        scratch.deallocate()
        modelInput.deallocate()
    }
}
