import AVFoundation
import Foundation

/// シーン切替でも破棄しない v3 用ドラムループ（各 `SurvivalGameSession` の BGM とは別）。
/// DB `audioTracks.drum_loop.url` を第一選択し、空または取得失敗時のみバンドル `DrumLoop.mp3` にフォールバックする。
@MainActor
final class SurvivalTutorialV3DrumLoopPlayer: ObservableObject {
    private var player: AVAudioPlayer?
    private var loadedPlayURL: URL?
    private let cache = RemoteAudioFileCache(subdirectory: "SurvivalTutorialDrumLoop")

    /// デモ開始前の先読み（再生はしない）。
    func prepare(urlString: String?) async {
        guard case let .remote(url) = SurvivalTutorialV3DrumLoopSourceResolver.resolve(urlString: urlString) else {
            return
        }
        _ = try? await cache.localFileURL(for: url)
    }

    func start(urlString: String?, volume: Float = 0.35) async {
        stop()
        configureAudioSession()
        await beginPlayback(urlString: urlString, volume: volume)
    }

    /// 既存プレイヤーを先頭から再生し直す（demo 拍同期用）。未開始または URL 変更時は再ロードする。
    func restartFromStart(urlString: String?, volume: Float = 0.35) async {
        configureAudioSession()
        let targetURL = await resolvePlayURL(urlString: urlString)
        if let player, let loadedPlayURL, loadedPlayURL == targetURL {
            player.currentTime = 0
            player.volume = volume
            player.play()
            await waitForPlaying()
            return
        }
        stop()
        await beginPlayback(urlString: urlString, volume: volume)
    }

    func stop() {
        player?.stop()
        player = nil
        loadedPlayURL = nil
    }

    private func beginPlayback(urlString: String?, volume: Float) async {
        guard let playURL = await resolvePlayURL(urlString: urlString) else { return }
        guard play(from: playURL, volume: volume) else { return }
        await waitForPlaying()
    }

    private func resolvePlayURL(urlString: String?) async -> URL? {
        switch SurvivalTutorialV3DrumLoopSourceResolver.resolve(urlString: urlString) {
        case let .remote(url):
            if let local = try? await cache.localFileURL(for: url) {
                return local
            }
            return SurvivalTutorialV3DrumLoopSourceResolver.bundledDrumLoopURL()
        case .bundled:
            return SurvivalTutorialV3DrumLoopSourceResolver.bundledDrumLoopURL()
        case .none:
            return nil
        }
    }

    @discardableResult
    private func play(from url: URL, volume: Float) -> Bool {
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.numberOfLoops = -1
            p.volume = volume
            p.prepareToPlay()
            p.play()
            player = p
            loadedPlayURL = url
            return true
        } catch {
            player = nil
            loadedPlayURL = nil
            return false
        }
    }

    private func waitForPlaying() async {
        let deadline = ContinuousClock.now + .milliseconds(500)
        while ContinuousClock.now < deadline {
            if player?.isPlaying == true { return }
            try? await Task.sleep(nanoseconds: 10_000_000)
        }
    }

    private func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true, options: [])
    }
}
