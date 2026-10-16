import Foundation
import OnnxRuntimeBindings
import XCTest
@testable import Jazzify

final class PestoNativeModelTests: XCTestCase {
    func testCompactModelAndReusedInputsMatchOriginalAtAutomaticOneAndTwoThreads() throws {
        let compact = try XCTUnwrap(Bundle.main.url(forResource: PestoModelConfiguration.resourceName, withExtension: "onnx"))
        let original = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "pesto-mir1k-g7-48000-240-refill", withExtension: "onnx"))
        XCTAssertEqual(try Data(contentsOf: compact).count, 11_150_637)
        XCTAssertNil(Bundle.main.url(forResource: "pesto-mir1k-g7-48000-240-refill", withExtension: "onnx"))
        let env = try ORTEnv(loggingLevel: .warning)
        let reference = try ORTSession(env: env, modelPath: original.path, sessionOptions: PestoModelConfiguration.sessionOptions(intraOpThreads: 1))
        var measurements = [[String: Any]]()
        for threads in [Int32(0), 1, 2] {
            let session = try ORTSession(env: env, modelPath: compact.path, sessionOptions: PestoModelConfiguration.sessionOptions(intraOpThreads: threads == 0 ? nil : threads))
            let cache = UnsafeMutablePointer<Float>.allocate(capacity: 3976)
            let referenceCache = UnsafeMutablePointer<Float>.allocate(capacity: 3976)
            cache.initialize(repeating: 0, count: 3976)
            referenceCache.initialize(repeating: 0, count: 3976)
            var inputs: PestoModelInputs? = try PestoModelInputs(cacheBuffer: cache, chunkSize: 240, cacheCount: 3976)
            defer { inputs = nil; cache.deallocate(); referenceCache.deallocate() }
            var times = [Double]()
            var referenceTimes = [Double]()
            for frame in 0..<480 {
                if frame % 120 == 0 { cache.update(repeating: 0, count: 3976); referenceCache.update(repeating: 0, count: 3976) }
                let midi = [45.0, 57.0, 69.0, 81.0][(frame / 80) % 4]
                let hz = 440 * pow(2, (midi - 69) / 12)
                let audio = (0..<240).map { i -> Float in
                    if frame % 120 < 12 { return 0 }
                    let phase = 2 * Double.pi * hz * Double(frame * 240 + i) / 48000
                    let envelope = exp(-Double(frame % 80) / 18)
                    return Float((sin(phase) + 0.35 * sin(2 * phase) + 0.12 * sin(3 * phase)) * envelope * 0.005)
                }
                let referenceStart = ProcessInfo.processInfo.systemUptime
                let expected = try originalRun(session: reference, audio: audio, cache: referenceCache)
                if frame >= 20 { referenceTimes.append((ProcessInfo.processInfo.systemUptime - referenceStart) * 1000) }
                let reused = try XCTUnwrap(inputs)
                let start = ProcessInfo.processInfo.systemUptime
                audio.withUnsafeBufferPointer { buffer in
                    guard let base = buffer.baseAddress else { return XCTFail("Empty PCM") }
                    reused.updateAudio(from: base)
                }
                let result = try session.run(withInputs: reused.values, outputNames: PestoModelConfiguration.outputNames, runOptions: nil)
                if frame >= 20 { times.append((ProcessInfo.processInfo.systemUptime - start) * 1000) }
                for name in ["prediction", "confidence", "volume", "cache_out"] {
                    let a = try XCTUnwrap(expected[name]).tensorData()
                    let b = try XCTUnwrap(result[name]).tensorData()
                    XCTAssertEqual(a.length, b.length)
                    if name == "cache_out" {
                        XCTAssertTrue((a as Data) == (b as Data), "cache, frame \(frame), threads \(threads)")
                        continue
                    }
                    let lhs = a.bytes.assumingMemoryBound(to: Float.self), rhs = b.bytes.assumingMemoryBound(to: Float.self)
                    let tolerance: Float = name == "cache_out" ? 0 : (name == "prediction" ? 0.001 : 0.0001)
                    for i in 0..<(a.length / MemoryLayout<Float>.size) {
                        XCTAssertTrue(lhs[i].isFinite && rhs[i].isFinite)
                        XCTAssertEqual(lhs[i], rhs[i], accuracy: tolerance, "\(name), frame \(frame), threads \(threads)")
                    }
                }
                let cacheOut = try XCTUnwrap(result["cache_out"]).tensorData()
                cache.update(from: cacheOut.bytes.assumingMemoryBound(to: Float.self), count: 3976)
                let oldCacheOut = try XCTUnwrap(expected["cache_out"]).tensorData()
                referenceCache.update(from: oldCacheOut.bytes.assumingMemoryBound(to: Float.self), count: 3976)
            }
            times.sort()
            referenceTimes.sort()
            measurements.append(["configuredThreads": threads, "frames": 480, "originalOneThreadP50Ms": referenceTimes[referenceTimes.count / 2], "originalOneThreadP95Ms": referenceTimes[Int(Double(referenceTimes.count) * 0.95)], "p50Ms": times[times.count / 2], "p95Ms": times[Int(Double(times.count) * 0.95)]])
        }
        let json = try JSONSerialization.data(withJSONObject: measurements, options: [.prettyPrinted, .sortedKeys])
        let attachment = XCTAttachment(data: json, uniformTypeIdentifier: "public.json")
        attachment.name = "PESTO-native-thread-comparison"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    private func originalRun(session: ORTSession, audio: [Float], cache: UnsafeMutablePointer<Float>) throws -> [String: ORTValue] {
        // Baseline intentionally creates fresh wrappers, matching the previous engine.
        let storage = audio.withUnsafeBytes { NSMutableData(bytes: $0.baseAddress, length: $0.count) }
        let audioValue = try ORTValue(tensorData: storage, elementType: .float, shape: [1, 240])
        let cacheValue = try ORTValue(tensorData: NSMutableData(bytesNoCopy: cache, length: 3976 * MemoryLayout<Float>.size, freeWhenDone: false), elementType: .float, shape: [1, 3976])
        return try session.run(withInputs: ["audio": audioValue, "cache": cacheValue], outputNames: PestoModelConfiguration.outputNames, runOptions: nil)
    }
}
