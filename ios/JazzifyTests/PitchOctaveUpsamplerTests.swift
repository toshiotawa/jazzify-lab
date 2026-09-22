import XCTest
@testable import Jazzify

final class PitchOctaveUpsamplerTests: XCTestCase {
    private let sampleRate = PitchOctaveUpsampler.sampleRate

    private func generateSine(frequencyHz: Double, sampleCount: Int) -> [Float] {
        (0..<sampleCount).map { index in
            Float(sin((2 * Double.pi * frequencyHz * Double(index)) / sampleRate))
        }
    }

    private func estimateFrequencyHz(_ samples: [Float]) -> Double {
        var zeroCrossings = 0
        for index in 1..<samples.count {
            let previous = samples[index - 1]
            let current = samples[index]
            if (previous <= 0 && current > 0) || (previous >= 0 && current < 0) {
                zeroCrossings += 1
            }
        }
        return (Double(zeroCrossings) * sampleRate) / (2 * Double(samples.count))
    }

    private func collectUpsampled(
        upsampler: PitchOctaveUpsamplerState,
        samples: [Float]
    ) -> [Float] {
        var output: [Float] = []
        samples.withUnsafeBufferPointer { buffer in
            guard let base = buffer.baseAddress else { return }
            upsampler.push(samples: base, count: buffer.count) { chunkBase in
                for index in 0..<PitchOctaveUpsampler.chunkSize {
                    output.append(chunkBase[index])
                }
            }
        }
        return output
    }

    func testShiftNormalization() {
        XCTAssertEqual(VoiceLowPitchShift.normalize(12), .plus12)
        XCTAssertEqual(VoiceLowPitchShift.normalize(24), .plus24)
        XCTAssertEqual(VoiceLowPitchShift.normalize(6), .off)
    }

    func testUpsamples500HzByFactor2() {
        let upsampler = PitchOctaveUpsamplerState()
        upsampler.setShift(.plus12)
        let input = generateSine(frequencyHz: 500, sampleCount: PitchOctaveUpsampler.chunkSize * 8)
        let output = collectUpsampled(upsampler: upsampler, samples: input)
        XCTAssertGreaterThan(output.count, PitchOctaveUpsampler.chunkSize)
        let estimated = estimateFrequencyHz(Array(output.suffix(PitchOctaveUpsampler.chunkSize)))
        XCTAssertGreaterThan(estimated, 900)
        XCTAssertLessThan(estimated, 1100)
    }

    func testUpsamples500HzByFactor4() {
        let upsampler = PitchOctaveUpsamplerState()
        upsampler.setShift(.plus24)
        let input = generateSine(frequencyHz: 500, sampleCount: PitchOctaveUpsampler.chunkSize * 16)
        let output = collectUpsampled(upsampler: upsampler, samples: input)
        XCTAssertGreaterThan(output.count, PitchOctaveUpsampler.chunkSize)
        let estimated = estimateFrequencyHz(Array(output.suffix(PitchOctaveUpsampler.chunkSize)))
        XCTAssertGreaterThan(estimated, 1800)
        XCTAssertLessThan(estimated, 2200)
    }

    func testPreservesDCWhenDecimating() {
        let upsampler = PitchOctaveUpsamplerState()
        upsampler.setShift(.plus12)
        let input = [Float](repeating: 0.25, count: PitchOctaveUpsampler.chunkSize * 4)
        let output = collectUpsampled(upsampler: upsampler, samples: input)
        let tail = output.suffix(PitchOctaveUpsampler.chunkSize)
        let average = tail.reduce(0, +) / Float(tail.count)
        XCTAssertEqual(Double(average), 0.25, accuracy: 0.02)
    }
}
