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
