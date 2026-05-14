import AVFoundation
import Foundation

/// 魔法エフェクト発火用 SE。バンドル `ear-training-battle/fire-magic-1.mp3` を優先し、無い場合のみ CDN から取得。
enum EarTrainingBattleMagicSfxKind: Sendable {
    case fireball
    case snowflake
    case lightning
    case meteor
    case quotaReached
}

@MainActor
final class EarTrainingBattleSfx {
    static let shared = EarTrainingBattleSfx()

    private static let remoteURL = URL(string: "https://jazzify-cdn.com/sfx/ear-training-battle/fire-magic-1.mp3")!

    private var player: AVAudioPlayer?
    private var cachedLocalURL: URL?
    private var prefetchTask: Task<Void, Never>?

    private init() {}

    /// コードクイズ起動時に呼び、初回再生を早める。
    func prefetch() {
        prefetchTask?.cancel()
        prefetchTask = Task { @MainActor in
            _ = await self.resolveLocalFileURL()
        }
    }

    /// 詠唱・敵攻撃以外の魔法演出で呼ぶ。
    func play(_ kind: EarTrainingBattleMagicSfxKind) {
        _ = kind
        Task { @MainActor in
            guard let url = await self.resolveLocalFileURL() else { return }
            do {
                if self.player == nil {
                    let p = try AVAudioPlayer(contentsOf: url)
                    p.prepareToPlay()
                    self.player = p
                }
                self.player?.currentTime = 0
                self.player?.play()
            } catch {
                // 失敗時は無音のまま
            }
        }
    }

    private func resolveLocalFileURL() async -> URL? {
        if let cachedLocalURL {
            return cachedLocalURL
        }
        if let bundled = Self.bundledMagicURL() {
            cachedLocalURL = bundled
            return bundled
        }
        let local: URL? = await Self.downloadIfNeeded()
        cachedLocalURL = local
        return local
    }

    private nonisolated static func bundledMagicURL() -> URL? {
        Bundle.main.url(forResource: "fire-magic-1", withExtension: "mp3", subdirectory: "ear-training-battle")
    }

    private nonisolated static func downloadIfNeeded() async -> URL? {
        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first
        guard let root = caches else {
            return nil
        }
        let dir = root.appendingPathComponent("EarTrainingBattleSfx", isDirectory: true)
        let destination = dir.appendingPathComponent("fire-magic-1.mp3", isDirectory: false)
        if FileManager.default.fileExists(atPath: destination.path) {
            return destination
        }
        do {
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            let (data, response) = try await URLSession.shared.data(from: remoteURL)
            guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
                return nil
            }
            try data.write(to: destination, options: .atomic)
            return destination
        } catch {
            return nil
        }
    }
}
