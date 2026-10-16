import Foundation
import OnnxRuntimeBindings
import XCTest
@testable import Jazzify

final class PestoModelInputsTests: XCTestCase {
    func testReusedValuesFollowAudioAndCacheWithoutMutatingCapturedPCM() throws {
        let storage = NSMutableData()
        storage.length = 3976 * MemoryLayout<Float>.size
        let cache = storage.mutableBytes.assumingMemoryBound(to: Float.self)
        var inputs: PestoModelInputs? = try PestoModelInputs(cacheStorage: storage, chunkSize: 240, cacheCount: 3976)
        defer { inputs = nil }
        let audio = try XCTUnwrap(inputs?.values["audio"])
        let cacheValue = try XCTUnwrap(inputs?.values["cache"])
        XCTAssertEqual(try cacheValue.tensorData().bytes, UnsafeRawPointer(cache))
        for value in [Float(0.1), -0.25, 0] {
            let captured = [Float](repeating: value, count: 240)
            captured.withUnsafeBufferPointer { buffer in
                guard let base = buffer.baseAddress else { return XCTFail("Empty PCM") }
                inputs?.updateAudio(from: base)
            }
            cache[3975] = value
            XCTAssertTrue(inputs?.values["audio"] === audio)
            XCTAssertTrue(inputs?.values["cache"] === cacheValue)
            let actualAudio = try audio.tensorData()
            let actualCache = try cacheValue.tensorData()
            XCTAssertEqual(actualAudio.bytes.load(as: Float.self), value)
            XCTAssertEqual(actualCache.bytes.assumingMemoryBound(to: Float.self)[3975], value)
            XCTAssertTrue(captured.allSatisfy { $0 == value })
        }
        cache.update(repeating: 0, count: 3976)
        XCTAssertEqual(try cacheValue.tensorData().bytes.assumingMemoryBound(to: Float.self)[3975], 0)
    }

    func testRejectsCacheWithWrongSize() {
        XCTAssertThrowsError(try PestoModelInputs(cacheStorage: NSMutableData(), chunkSize: 240, cacheCount: 3976))
    }

    func testThreadOverrideIsOptInAndBounded() {
        XCTAssertNil(PestoModelConfiguration.threadOverride(arguments: []))
        for bad in ["0", "3", "-1", "invalid"] {
            XCTAssertNil(PestoModelConfiguration.threadOverride(arguments: ["app", "-pesto-intra-op-threads", bad]))
        }
        XCTAssertNil(PestoModelConfiguration.threadOverride(arguments: ["-pesto-intra-op-threads"]))
        XCTAssertEqual(PestoModelConfiguration.threadOverride(arguments: ["-pesto-intra-op-threads", "1"]), 1)
        XCTAssertEqual(PestoModelConfiguration.threadOverride(arguments: ["-pesto-intra-op-threads", "2"]), 2)
    }
}
