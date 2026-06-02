import AVFoundation
import Foundation

/// シーン切替でも破棄しない v3 用ドラムループ（各 `SurvivalGameSession` の BGM とは別）。
/// CDN 取得に失敗しやすいため、オンボーディングと同じバンドル `DrumLoop.mp3` を優先する。
@MainActor
final class SurvivalTutorialV3DrumLoopPlayer: ObservableObject {
    private var player: AVAudioPlayer?

    func start(urlString: String?, volume: Float = 0.35) {
        stop()
        configureAudioSession()

        if let bundled = Bundle.main.url(forResource: "DrumLoop", withExtension: "mp3"),
           play(url: bundled, volume: volume) {
            return
        }

        let trimmed = urlString?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !trimmed.isEmpty, let remote = URL(string: trimmed) else { return }
        _ = play(url: remote, volume: volume)
    }

    /// 既存プレイヤーを先頭から再生し直す（demo 拍同期用）。未開始なら `start` と同様。
    func restartFromStart(urlString: String?, volume: Float = 0.35) {
        if let player {
            player.currentTime = 0
            player.volume = volume
            player.play()
            return
        }
        start(urlString: urlString, volume: volume)
    }

    func stop() {
        player?.stop()
        player = nil
    }

    private func play(url: URL, volume: Float) -> Bool {
        do {
            let p = try AVAudioPlayer(contentsOf: url)
            p.numberOfLoops = -1
            p.volume = volume
            p.prepareToPlay()
            p.play()
            player = p
            return true
        } catch {
            player = nil
            return false
        }
    }

    private func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true, options: [])
    }
}
