import CryptoKit
import Foundation

/// リモート MP3 等をキャッシュディレクトリへダウンロードし、ローカル URL を返す。
final class RemoteAudioFileCache: @unchecked Sendable {
    private var inflight: [URL: Task<URL, Error>] = [:]
    private let lock = NSLock()
    private let subdirectory: String

    init(subdirectory: String) {
        self.subdirectory = subdirectory
    }

    func localFileURL(for remote: URL) async throws -> URL {
        if remote.isFileURL {
            guard FileManager.default.fileExists(atPath: remote.path) else {
                throw URLError(.fileDoesNotExist)
            }
            return remote
        }

        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent(subdirectory, isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        let destination = root.appendingPathComponent(Self.cacheFileName(for: remote))

        if FileManager.default.fileExists(atPath: destination.path) {
            return destination
        }

        lock.lock()
        if let existing = inflight[remote] {
            lock.unlock()
            return try await existing.value
        }

        let task = Task {
            let (data, response) = try await URLSession.shared.data(from: remote)
            if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                throw URLError(.badServerResponse)
            }
            try data.write(to: destination, options: .atomic)
            return destination
        }

        inflight[remote] = task
        lock.unlock()

        do {
            let url = try await task.value
            lock.lock()
            inflight[remote] = nil
            lock.unlock()
            return url
        } catch {
            lock.lock()
            inflight[remote] = nil
            lock.unlock()
            try? FileManager.default.removeItem(at: destination)
            throw error
        }
    }

    private static func cacheFileName(for url: URL) -> String {
        let digest = SHA256.hash(data: Data(url.absoluteString.utf8))
        let hex = digest.map { String(format: "%02x", $0) }.joined()
        let ext = url.pathExtension.lowercased()
        let suffix = ext.isEmpty ? "mp3" : ext
        return "\(hex).\(suffix)"
    }
}
