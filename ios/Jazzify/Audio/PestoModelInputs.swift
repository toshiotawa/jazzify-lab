import Foundation
import OnnxRuntimeBindings

enum PestoModelConfiguration {
    static let resourceName = "pesto-mir1k-g7-48000-240-refill-compact-v2"
    static let outputNames: Set<String> = ["prediction", "confidence", "volume", "cache_out"]

    // Keep native ORT's existing automatic policy in Release. Device comparisons are opt-in.
    static let intraOpThreadsOverride: Int32? = {
        #if DEBUG
        return threadOverride(arguments: ProcessInfo.processInfo.arguments)
        #else
        return nil
        #endif
    }()

    static func threadOverride(arguments: [String]) -> Int32? {
        guard let flag = arguments.firstIndex(of: "-pesto-intra-op-threads"),
              arguments.indices.contains(flag + 1),
              let count = Int32(arguments[flag + 1]),
              count == 1 || count == 2 else { return nil }
        return count
    }

    static func sessionOptions(intraOpThreads: Int32? = nil) throws -> ORTSessionOptions {
        let options = try ORTSessionOptions()
        if let intraOpThreads { try options.setIntraOpNumThreads(intraOpThreads) }
        return options
    }
}

/// Confined to inferenceQueue. The engine retains owned cacheStorage for the entire lifetime of these values.
/// Audio storage stays at a stable address even when the capture slot or low-register decimator changes.
final class PestoModelInputs {
    private let audioStorage: NSMutableData
    private let cacheStorage: NSMutableData
    private let audioByteCount: Int
    let values: [String: ORTValue]

    init(cacheStorage: NSMutableData, chunkSize: Int, cacheCount: Int) throws {
        guard cacheStorage.length == cacheCount * MemoryLayout<Float>.size else {
            throw PestoModelInputsError.invalidCacheSize
        }
        audioByteCount = chunkSize * MemoryLayout<Float>.size
        guard let audio = NSMutableData(length: audioByteCount) else {
            throw PestoModelInputsError.allocationFailed
        }
        audioStorage = audio
        // Borrowed NSData may move its buffer on mutableBytes access. Keep the same
        // owned NSMutableData that the engine updates; do not wrap its pointer again.
        self.cacheStorage = cacheStorage
        values = [
            "audio": try ORTValue(tensorData: audio, elementType: .float, shape: [1, NSNumber(value: chunkSize)]),
            "cache": try ORTValue(tensorData: cacheStorage, elementType: .float, shape: [1, NSNumber(value: cacheCount)])
        ]
    }

    func updateAudio(from source: UnsafePointer<Float>) {
        audioStorage.mutableBytes.copyMemory(from: source, byteCount: audioByteCount)
    }
}

private enum PestoModelInputsError: Error {
    case allocationFailed
    case invalidCacheSize
}
