import AVFoundation
import Foundation

/// レッスンマップ専用の BGM マネージャ (AVQueuePlayer + AVPlayerLooper)
/// WEB 版 (`src/utils/LessonMapAudio.ts`) と対応する iOS 実装。
/// - CDN の MP3 をループ再生する
/// - マップ離脱時・ゲーム起動時に `stop()` を呼ぶ
/// - ミュート状態と音量は UserDefaults に保存する
final class LessonMapAudio {
    static let shared = LessonMapAudio()

    static let bgmURL = URL(string: "https://jazzify-cdn.com/fantasy-bgm/ab2d7f15-c19f-4222-872c-415dbc3c5638.mp3")!

    private let queuePlayer = AVQueuePlayer()
    private var looper: AVPlayerLooper?
    private var currentURL: URL?
    private var isRequestedPlaying = false
    private let userDefaults = UserDefaults.standard
    private let volumeKey = "lesson_map_bgm_volume_v1"
    private let mutedKey = "lesson_map_bgm_mute_v1"
    private let defaultVolume: Float = 0.3

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
    func play(url: URL = LessonMapAudio.bgmURL) {
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
        // .ambient を使うことで他アプリの音声をミュートしない (ゲーム音声用途)
        try? session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true, options: [])
    }

    private var fadeTimer: Timer?

    private func fade(to target: Float, duration: TimeInterval, completion: (() -> Void)? = nil) {
        fadeTimer?.invalidate()
        let fromValue = queuePlayer.volume
        let start = Date()
        let totalSteps = max(1, Int(duration * 60))
        var stepIndex = 0
        fadeTimer = Timer.scheduledTimer(withTimeInterval: duration / Double(totalSteps), repeats: true) { [weak self] timer in
            guard let self else { timer.invalidate(); return }
            stepIndex += 1
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
