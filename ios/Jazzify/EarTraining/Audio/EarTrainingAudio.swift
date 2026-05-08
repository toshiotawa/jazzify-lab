import Foundation
import AVFoundation
import Combine

/// 耳コピバトル ゲーム画面のオーディオマネージャ。
/// - フレーズ MP3 (AVPlayer + AVPlayerItem) のストリーミング再生 + 周期的な currentTime 通知
/// - ピアノ発音と効果音は `SurvivalGameAudio.shared` を共有して再利用する
/// - フレーズ音量 = `musicVolume * masterVolume` を反映
final class EarTrainingAudio: NSObject {
    /// 周期的に通知される再生時刻 (秒)。停止中は 0。
    private(set) var currentTimeSec: Double = 0

    /// MP3 終端到達 (`AVPlayerItem.didPlayToEndTime`) の発火コールバック。
    var onEnded: (() -> Void)?
    /// 周期 (≒30Hz) で呼ばれる進捗コールバック。引数は秒。
    var onTimeUpdate: ((Double) -> Void)?

    private let player = AVPlayer()
    private var currentItem: AVPlayerItem?
    private var timeObserverToken: Any?
    private var endObservation: NSObjectProtocol?
    private var statusObservation: NSKeyValueObservation?
    private var preloadedAssetURL: URL?
    private var preloadedAsset: AVURLAsset?

    /// `musicVolume * masterVolume` を 0...1 に閉じた値。
    private var phraseVolume: Float = 1.0

    override init() {
        super.init()
        player.actionAtItemEnd = .pause
    }

    deinit {
        removeObservers()
    }

    // MARK: - Lifecycle

    /// 開始時に呼ぶ。Survival と同じ AVAudioSession 設定 + ピアノ準備を行うが、BGM は鳴らさない。
    func start() {
        SurvivalGameAudio.shared.start(playBackgroundMusic: false)
    }

    /// 終了時に呼ぶ。フレーズ MP3 を完全停止し、ピアノ発音停止 + Survival のオーディオセッションを閉じる。
    func stop() {
        stopPhrase()
        SurvivalGameAudio.shared.stop()
    }

    // MARK: - Volume

    func setVolumes(master: Double, music: Double, piano: Double, sfx: Double) {
        let m = clampedFloat(master)
        phraseVolume = clampedFloat(music) * m
        player.volume = phraseVolume
        // ピアノ / 効果音は SurvivalGameAudio の永続音量に反映する。
        SurvivalGameAudio.shared.setPianoVolume(clampedFloat(piano))
        SurvivalGameAudio.shared.setSfxVolume(clampedFloat(sfx))
    }

    func setPhraseVolume(_ value: Float) {
        phraseVolume = max(0, min(1, value))
        player.volume = phraseVolume
    }

    private func clampedFloat(_ value: Double) -> Float {
        Float(max(0, min(1, value)))
    }

    // MARK: - Phrase playback

    /// ロビー表示中に先頭フレーズのアセット情報を読み始め、START 後の初回バッファ待ちを短縮する。
    func preloadPhrase(url: URL) {
        guard preloadedAssetURL != url else { return }

        let asset = AVURLAsset(url: url)
        preloadedAssetURL = url
        preloadedAsset = asset
        Task {
            _ = try? await asset.load(.isPlayable)
            _ = try? await asset.load(.duration)
        }
    }

    /// フレーズ MP3 をプリロードして無音状態でわずかに再生し、ユーザー操作直後の遅延を緩和する。
    /// Web 版 `primePhraseAudio` 相当。
    func primePhrase(url: URL) {
        prepareItem(url: url)
        player.volume = 0
        player.play()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) { [weak self] in
            guard let self else { return }
            self.player.pause()
            self.player.seek(to: .zero, toleranceBefore: .zero, toleranceAfter: .zero)
            self.player.volume = self.phraseVolume
        }
    }

    /// フレーズ MP3 を頭から再生する。
    func playPhrase(url: URL) {
        prepareItem(url: url)
        currentTimeSec = 0
        player.volume = phraseVolume
        player.seek(to: .zero, toleranceBefore: .zero, toleranceAfter: .zero)
        player.play()
    }

    /// フレーズ MP3 を停止し、再生時刻を 0 に戻す。
    func stopPhrase() {
        player.pause()
        player.seek(to: .zero, toleranceBefore: .zero, toleranceAfter: .zero)
        currentTimeSec = 0
    }

    // MARK: - Internals

    private func prepareItem(url: URL) {
        removeObservers()
        currentTimeSec = 0
        let item: AVPlayerItem
        if let preloadedAsset, preloadedAssetURL == url {
            item = AVPlayerItem(asset: preloadedAsset)
        } else {
            item = AVPlayerItem(url: url)
        }
        currentItem = item
        player.replaceCurrentItem(with: item)
        addObservers(for: item)
    }

    private func addObservers(for item: AVPlayerItem) {
        endObservation = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            self?.onEnded?()
        }

        // 30Hz で currentTime を通知する。
        let interval = CMTime(seconds: 1.0 / 30.0, preferredTimescale: 600)
        timeObserverToken = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            guard let self else { return }
            let seconds = CMTimeGetSeconds(time)
            self.currentTimeSec = seconds.isFinite ? max(0, seconds) : 0
            self.onTimeUpdate?(self.currentTimeSec)
        }
    }

    private func removeObservers() {
        if let token = timeObserverToken {
            player.removeTimeObserver(token)
            timeObserverToken = nil
        }
        if let obs = endObservation {
            NotificationCenter.default.removeObserver(obs)
            endObservation = nil
        }
        statusObservation?.invalidate()
        statusObservation = nil
    }

    // MARK: - Piano bridge (Survival サンプラー再利用)

    /// 鍵盤タップ / MIDI ノート ON。Web の `playNote` と同じ Salamander 音色になる。
    func pianoNoteOn(midi: Int, velocity: Int = 100) {
        SurvivalGameAudio.shared.pianoNoteOn(midi: midi, velocity: velocity)
    }

    func pianoNoteOff(midi: Int) {
        SurvivalGameAudio.shared.pianoNoteOff(midi: midi)
    }

    func pianoNoteOnRealtime(midi: Int, velocity: Int) {
        SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: midi, velocity: velocity)
    }

    func pianoNoteOffRealtime(midi: Int) {
        SurvivalGameAudio.shared.pianoNoteOffRealtime(midi: midi)
    }
}
