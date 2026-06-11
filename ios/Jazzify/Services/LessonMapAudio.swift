import AVFoundation
import Foundation

/// レッスンマップ専用の BGM マネージャ (AVQueuePlayer + AVPlayerLooper)
/// WEB 版 (`src/utils/LessonMapAudio.ts`) と対応する iOS 実装。
/// - CDN の MP3 をループ再生する
/// - マップ離脱時・ゲーム起動時に `stop()` を呼ぶ
/// - ミュート状態と音量は UserDefaults に保存する
@MainActor
final class LessonMapAudio {
    static let shared = LessonMapAudio()

    static let bgmURL = URL(string: "https://jazzify-cdn.com/fantasy-bgm/ab2d7f15-c19f-4222-872c-415dbc3c5638.mp3")!

    private let queuePlayer = AVQueuePlayer()
    private var looper: AVPlayerLooper?
    private var currentURL: URL?
    private var isRequestedPlaying = false
    /// play/stop の競合で古いフェードや AVPlayerLooper 初期化が走らないよう世代管理する。
    private var playbackGeneration: UInt = 0
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

        playbackGeneration &+= 1
        let generation = playbackGeneration
        cancelFade()
        teardownPlayback()

        configureAudioSession()

        let asset = AVAsset(url: url)
        let item = AVPlayerItem(asset: asset)
        // AVPlayerLooper は init 後に main queue で item を insert する。
        // 直前の teardown と競合して SIGABRT にならないよう、次 run loop で作成する。
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard self.playbackGeneration == generation, self.isRequestedPlaying else { return }
            self.looper = AVPlayerLooper(player: self.queuePlayer, templateItem: item)
            self.currentURL = url
            self.queuePlayer.volume = 0
            self.queuePlayer.play()
            self.fade(to: self.effectiveVolume(), duration: 0.6, generation: generation)
        }
    }

    /// フェードアウトして停止。
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

    /// サバイバル起動など、フェードなしで即座に停止する。
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
        // .ambient を使うことで他アプリの音声をミュートしない (ゲーム音声用途)
        try? session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true, options: [])
    }

    private var fadeTimer: Timer?

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
