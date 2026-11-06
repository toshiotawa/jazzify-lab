import Foundation
import XCTest
@testable import Jazzify

final class PestoDecimatorTests: XCTestCase {
    func testCachedCoefficientsPreservePCMAndStableStorage() {
        for q in [1, 2, 4] {
            let decimator = PestoDecimatorState(q: q)
            let address = decimator.modelInputBase
            var x1 = 0.0, x2 = 0.0, y1 = 0.0, y2 = 0.0
            var reference = [Float]()
            for chunk in 0..<120 {
                let input = (0..<240).map { i in Float(sin(Double(chunk * 240 + i) * 0.017) * 0.2) }
                input.withUnsafeBufferPointer { buffer in
                    guard let base = buffer.baseAddress else { return XCTFail("Empty PCM") }
                    decimator.accumulate(source: base, count: input.count)
                }
                if q == 1 { reference = input } else {
                    // Reference is the former per-block coefficient calculation.
                    let fc = 0.45 / Double(q)
                    let w0 = 2 * Double.pi * fc
                    let c = cos(w0), alpha = sin(w0) / (2 * 0.707), a0 = 1 + alpha
                    let b0 = ((1 - c) / 2) / a0, b1 = (1 - c) / a0, b2 = ((1 - c) / 2) / a0
                    let a1 = (-2 * c) / a0, a2 = (1 - alpha) / a0
                    for (i, sample) in input.enumerated() {
                        let x0 = Double(sample)
                        let y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
                        x2 = x1; x1 = x0; y2 = y1; y1 = y0
                        if (chunk * 240 + i) % q == 0 { reference.append(Float(y0)) }
                    }
                }
                XCTAssertEqual(decimator.outputReady, (chunk + 1) % q == 0)
                XCTAssertEqual(decimator.modelInputBase, address)
                if decimator.outputReady {
                    XCTAssertEqual(reference.count, 240)
                    for i in 0..<240 { XCTAssertEqual(decimator.modelInputBase[i].bitPattern, reference[i].bitPattern) }
                    reference.removeAll(keepingCapacity: true)
                }
            }
        }
    }

    func testEverySourceChunkContributesToAttackAtAllInferenceRates() {
        for q in [1, 2, 4] {
            let decimator = PestoDecimatorState(q: q)
            let envelope = PitchAttackEnvelope()
            let reference = PitchAttackEnvelope()
            let targets = PitchAttackEnvelopeTargets(repeatPitchClassMask: 1, expectedPitchMidis: [36])
            for chunk in 0..<24 {
                // In low mode this burst falls entirely between ONNX calls.
                var samples = (0..<240).map { i -> Float in
                    guard chunk % q == 0 else { return 0 }
                    return Float(0.1 * sin(2 * Double.pi * 65.406 * Double(chunk * 240 + i) / 48000))
                }
                samples.withUnsafeMutableBufferPointer { pcm in
                    guard let base = pcm.baseAddress else { return XCTFail("Empty PCM") }
                    reference.pushSamples(base, count: pcm.count)
                    let model = PitchInputEngine.prepareModelInput(source: base, count: pcm.count,
                        decimator: decimator, envelope: envelope)
                    XCTAssertEqual(model != nil, (chunk + 1) % q == 0)
                    if model != nil {
                        let expected = reference.computeAttackDb(targets: targets)
                        XCTAssertGreaterThan(expected, -110)
                        XCTAssertEqual(envelope.computeAttackDb(targets: targets), expected, accuracy: 1e-8)
                    }
                }
            }
            envelope.reset()
            XCTAssertEqual(envelope.computeAttackDb(targets: targets), -120)
            let silence = [Float](repeating: 0, count: 240)
            silence.withUnsafeBufferPointer { pcm in
                if let base = pcm.baseAddress { envelope.pushSamples(base, count: pcm.count) }
            }
            XCTAssertEqual(envelope.computeAttackDb(targets: targets), -120)
        }
    }

    func testLowRegisterAttackBetweenInferenceCallsCanRetriggerAHeldNote() {
        for q in [2, 4] {
            let decimator = PestoDecimatorState(q: q)
            let envelope = PitchAttackEnvelope()
            let previousEnvelope = PitchAttackEnvelope()
            let targets = PitchAttackEnvelopeTargets(repeatPitchClassMask: 1, expectedPitchMidis: [36])
            var config = PitchOnsetTrackerConfig()
            config.frameDurationMs = Double(q * 5)
            let trackers = [PitchOnsetTracker(config: config), PitchOnsetTracker(config: config)]
            for tracker in trackers {
                tracker.setExpectedPitchCandidates(mask: 1, midis: [36], repeatPitchClassMask: 1)
            }
            var onsets = [[Int](), [Int]()]
            for observation in 0..<14 {
                let amplitude = observation < 6 || observation >= 12 ? 0.1 : 0.0001
                for part in 0..<q {
                    // A 5ms attack in the first chunk. The final chunk of each group is silent.
                    var pcm = (0..<240).map { i -> Float in
                        part == 0 ? Float(amplitude * sin(2 * Double.pi * 65.406 * Double(i) / 48000)) : 0
                    }
                    pcm.withUnsafeMutableBufferPointer { buffer in
                        guard let base = buffer.baseAddress else { return XCTFail("Empty PCM") }
                        guard PitchInputEngine.prepareModelInput(source: base, count: buffer.count,
                            decimator: decimator, envelope: envelope) != nil else { return }
                        previousEnvelope.pushSamples(base, count: buffer.count)
                        for (i, source) in [previousEnvelope, envelope].enumerated() {
                            let frame = PitchFrame(prediction: 36, confidence: 0.99, volume: 0.01,
                                                   attackDb: source.computeAttackDb(targets: targets))
                            for event in trackers[i].processFrame(frame, frameIndex: observation) {
                                if case let .noteOn(_, index, _) = event { onsets[i].append(index) }
                            }
                        }
                    }
                }
            }
            XCTAssertEqual(onsets[0], [1])
            XCTAssertEqual(onsets[1], [1, 12])
        }
    }

    func testUnrestorableModelPredictionCannotEmitANote() {
        for (shift, invalid) in [(0, 127.5), (12, 10.0), (24, 24.0)] {
            let tracker = PitchOnsetTracker()
            var notes = [Int]()
            for index in 0..<12 {
                let raw = index < 6 ? invalid : Double(36 + shift)
                let pitch = PitchInputEngine.trackerPitch(modelMidi: raw, shift: shift)
                for event in tracker.processFrame(PitchFrame(prediction: pitch, confidence: 0.99, volume: 0.1), frameIndex: index) {
                    if case let .noteOn(note, _, _) = event { notes.append(note) }
                }
            }
            XCTAssertEqual(notes, [36])
        }
        XCTAssertEqual(PitchInputEngine.trackerPitch(modelMidi: 127.49, shift: 0), 127.49)
    }

    func testNewStateDiscardsPartialLowRegisterHistory() {
        let partial = PestoDecimatorState(q: 4)
        var input = [Float](repeating: 0.25, count: 240)
        input.withUnsafeMutableBufferPointer { buffer in
            guard let base = buffer.baseAddress else { return XCTFail("Empty PCM") }
            partial.accumulate(source: base, count: 240)
        }
        XCTAssertFalse(partial.outputReady)
        let reset = PestoDecimatorState(q: 4)
        for index in 0..<4 {
            let silence = [Float](repeating: 0, count: 240)
            silence.withUnsafeBufferPointer { buffer in
                guard let base = buffer.baseAddress else { return XCTFail("Empty PCM") }
                reset.accumulate(source: base, count: 240)
            }
            XCTAssertEqual(reset.outputReady, index == 3)
        }
        XCTAssertTrue((0..<240).allSatisfy { reset.modelInputBase[$0] == 0 })
    }
}
