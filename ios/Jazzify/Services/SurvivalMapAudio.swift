import AVFoundation
import Foundation

/// サバイバル降下マップ専用の BGM マネージャ (AVQueuePlayer + AVPlayerLooper)。
/// WEB 版 (`src/utils/SurvivalMapAudio.ts`) と同一の CDN URL を使用する。
/// - 画面表示中は BGM をループ再生
/// - ステージ遷移 (ゲーム起動) / 画面離脱時に `stop()` を呼ぶ
/// - ミュート状態と音量は `UserDefaults` に保存する
@MainActor
final class SurvivalMapAudio {
    static let shared = SurvivalMapAudio()

    nonisolated static let bgmURL = URL(string: "https://jazzify-cdn.com/fantasy-bgm/116797c5-c714-4a4d-85c6-5212af860d0b.mp3")!

    private let queuePlayer = AVQueuePlayer()
    private var looper: AVPlayerLooper?
    private var currentURL: URL?
    private var isRequestedPlaying = false
    private var playbackGeneration: UInt = 0
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
    func play() {
        play(url: Self.bgmURL)
    }

    func play(url: URL) {
        isRequestedPlaying = true
        if currentURL == url, queuePlayer.timeControlStatus == .playing {
            queuePlayer.volume = effectiveVolume()
            return
        }

        playbackGeneration &+= 1
        let generation = playbackGeneration
        cancelFade()
        teardownPlayback()

        configureAudioSession()

        let asset = AVAsset(url: url)
        let item = AVPlayerItem(asset: asset)
        Task { @MainActor [weak self] in
            guard let self else { return }
            guard self.playbackGeneration == generation, self.isRequestedPlaying else { return }
            self.looper = AVPlayerLooper(player: self.queuePlayer, templateItem: item)
            self.currentURL = url
            self.queuePlayer.volume = 0
            self.queuePlayer.play()
            self.fade(to: self.effectiveVolume(), duration: 0.6, generation: generation)
        }
    }

    /// フェードアウトして停止（画面離脱など）。
    func stop() {
        isRequestedPlaying = false
        playbackGeneration &+= 1
        let generation = playbackGeneration
        fade(to: 0, duration: 0.28, generation: generation) { [weak self] in
            guard let self else { return }
            guard self.playbackGeneration == generation else { return }
            self.finalizeStop()
        }
    }

    /// ステージ開始など、フェードなしで即座に停止する。Web `stopBgmImmediately()` 相当。
    func stopImmediately() {
        isRequestedPlaying = false
        playbackGeneration &+= 1
        cancelFade()
        finalizeStop()
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
        guard isRequestedPlaying else { return }
        cancelFade()
        let eff = effectiveVolume()
        guard eff > 0 else { return }
        queuePlayer.volume = eff * 0.15
    }

    /// Phrases 試聴終了後にマップ BGM 音量を戻す。
    func restoreAfterPhrasePreview() {
        guard isRequestedPlaying else { return }
        cancelFade()
        queuePlayer.volume = effectiveVolume()
    }

    private func cancelFade() {
        fadeTimer?.invalidate()
        fadeTimer = nil
    }

    private func teardownPlayback() {
        queuePlayer.pause()
        looper = nil
        queuePlayer.removeAllItems()
        currentURL = nil
    }

    private func finalizeStop() {
        teardownPlayback()
    }

    private func fade(
        to target: Float,
        duration: TimeInterval,
        generation: UInt,
        completion: (() -> Void)? = nil
    ) {
        cancelFade()
        let fromValue = queuePlayer.volume
        let start = Date()
        let totalSteps = max(1, Int(duration * 60))
        fadeTimer = Timer.scheduledTimer(withTimeInterval: duration / Double(totalSteps), repeats: true) { [weak self] timer in
            MainActor.assumeIsolated {
                guard let self else { timer.invalidate(); return }
                guard self.playbackGeneration == generation else {
                    timer.invalidate()
                    return
                }
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
}
