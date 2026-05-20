import AVFoundation
import Foundation

/// サバイバル降下マップ専用の BGM マネージャ (AVQueuePlayer + AVPlayerLooper)。
/// WEB 版 (`src/utils/SurvivalMapAudio.ts`) と同一の CDN URL を使用する。
/// - 画面表示中は BGM をループ再生
/// - ステージ遷移 (ゲーム起動) / 画面離脱時に `stop()` を呼ぶ
/// - ミュート状態と音量は `UserDefaults` に保存する
final class SurvivalMapAudio {
    static let shared = SurvivalMapAudio()

    static let bgmURL = URL(string: "https://jazzify-cdn.com/fantasy-bgm/116797c5-c714-4a4d-85c6-5212af860d0b.mp3")!

    private let queuePlayer = AVQueuePlayer()
    private var looper: AVPlayerLooper?
    private var currentURL: URL?
    private var isRequestedPlaying = false
    private let userDefaults = UserDefaults.standard
    private let volumeKey = "survival_map_bgm_volume_v1"
    private let mutedKey = "survival_map_bgm_mute_v1"
    private let defaultVolume: Float = 0.35

    private init() {
        queuePlayer.actionAtItemEnd = .advance
        queuePlayer.volume = effectiveVolume()
    }

    var isMuted: Bool {
        get { userDefaults.bool(forKey: mutedKey) }
        set {
            userDefaults.set(newValue, forKey: mutedKey)
            queuePlayer.volume = effectiveVolume()
        }
    }

    var volume: Float {
        get {
            if userDefaults.object(forKey: volumeKey) == nil { return defaultVolume }
            let raw = userDefaults.float(forKey: volumeKey)
            return max(0, min(1, raw))
        }
        set {
            let clamped = max(0, min(1, newValue))
            userDefaults.set(clamped, forKey: volumeKey)
            queuePlayer.volume = effectiveVolume()
        }
    }

    @discardableResult
    func toggleMuted() -> Bool {
        isMuted.toggle()
        return isMuted
    }

    /// CDN の BGM をループ再生開始。同一URLで既に再生中なら何もしない。
    func play(url: URL = SurvivalMapAudio.bgmURL) {
        isRequestedPlaying = true
        if currentURL == url, queuePlayer.timeControlStatus == .playing {
            queuePlayer.volume = effectiveVolume()
            return
        }

        configureAudioSession()

        queuePlayer.removeAllItems()
        looper = nil

        let asset = AVAsset(url: url)
        let item = AVPlayerItem(asset: asset)
        looper = AVPlayerLooper(player: queuePlayer, templateItem: item)
        currentURL = url
        queuePlayer.volume = 0
        queuePlayer.play()
        fade(to: effectiveVolume(), duration: 0.6)
    }

    /// フェードアウトして停止。
    func stop() {
        isRequestedPlaying = false
        fade(to: 0, duration: 0.28) { [weak self] in
            guard let self else { return }
            self.queuePlayer.pause()
            self.queuePlayer.removeAllItems()
            self.looper = nil
            self.currentURL = nil
        }
    }

    // MARK: - Private

    private func effectiveVolume() -> Float {
        isMuted ? 0 : volume
    }

    private func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true, options: [])
    }

    private var fadeTimer: Timer?

    /// Phrases マップ試聴中にマップ BGM を下げる（ミュート時は何もしない）。
    func duckForPhrasePreview() {
        fadeTimer?.invalidate()
        fadeTimer = nil
        let eff = effectiveVolume()
        guard eff > 0 else { return }
        queuePlayer.volume = eff * 0.15
    }

    /// Phrases 試聴終了後にマップ BGM 音量を戻す。
    func restoreAfterPhrasePreview() {
        fadeTimer?.invalidate()
        fadeTimer = nil
        queuePlayer.volume = effectiveVolume()
    }

    private func fade(to target: Float, duration: TimeInterval, completion: (() -> Void)? = nil) {
        fadeTimer?.invalidate()
        let fromValue = queuePlayer.volume
        let start = Date()
        let totalSteps = max(1, Int(duration * 60))
        fadeTimer = Timer.scheduledTimer(withTimeInterval: duration / Double(totalSteps), repeats: true) { [weak self] timer in
            guard let self else { timer.invalidate(); return }
            let elapsed = min(duration, Date().timeIntervalSince(start))
            let t = Float(elapsed / duration)
            self.queuePlayer.volume = fromValue + (target - fromValue) * t
            if t >= 1 {
                self.queuePlayer.volume = target
                timer.invalidate()
                completion?()
            }
        }
    }
}
