import Foundation
import AVFoundation

/// 耳コピバトル ゲーム画面のオーディオマネージャ。
/// - フレーズ MP3 (AVPlayer + AVPlayerItem) のストリーミング再生 + 周期的な currentTime 通知
/// - ピアノ発音と効果音は `SurvivalGameAudio.shared` を共有して再利用する
/// - フレーズ音量 = `musicVolume * masterVolume` を反映
/// - AVPlayer は UI / ゲーム状態と同様メインスレッドからのみ操作する（呼び出し元は `@MainActor` コントローラ）。
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
    /// `player` に現在載っているフレーズ URL（同一 URL では `AVPlayerItem` を作り直さず再利用する）。
    private var loadedPhraseURL: URL?
    /// `preparePhraseForImmediatePlayback` 完了済みで、頭出し済み pause 状態のフレーズ URL。
    private var preparedForImmediatePlaybackURL: URL?
    private var playbackToken: Int = 0

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

    /// カウントイン中にフレーズ用 `AVPlayerItem` を先読みしてバッファリングを進める。
    /// 無音 `play()` は行わない（先頭音欠落の原因になる副作用を避ける）。Web の `audio.src` 割当＋事前ロード相当。
    func prefetchPhraseItem(url: URL) {
        if loadedPhraseURL == url, currentItem != nil, player.currentItem === currentItem {
            return
        }
        preparedForImmediatePlaybackURL = nil
        playbackToken += 1
        let token = playbackToken
        prepareItem(url: url)
        player.pause()
        currentTimeSec = 0
        player.seek(to: .zero, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] finished in
            guard finished else { return }
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                guard self.playbackToken == token else { return }
                guard self.loadedPhraseURL == url else { return }
                self.currentTimeSec = 0
            }
        }
    }

    /// カウントイン前に呼ぶ。アイテム作成・ playable 読み込み・頭出し済みまで待機し、`playPreparedPhrase` で即再生できる状態にする。
    func preparePhraseForImmediatePlayback(url: URL) async -> Bool {
        playbackToken += 1
        let token = playbackToken
        preparedForImmediatePlaybackURL = nil

        prepareItem(url: url)
        guard let item = currentItem else { return false }

        do {
            _ = try await item.asset.load(.isPlayable)
        } catch {
            return false
        }
        guard playbackToken == token, loadedPhraseURL == url else { return false }

        let ready = await waitForItemReadyToPlay(item)
        guard ready, playbackToken == token, loadedPhraseURL == url else { return false }

        player.pause()
        player.volume = phraseVolume
        currentTimeSec = 0

        let seekFinished = await seekToZeroAsync()
        guard seekFinished, playbackToken == token, loadedPhraseURL == url else { return false }

        currentTimeSec = 0
        preparedForImmediatePlaybackURL = url
        return true
    }

    /// `preparePhraseForImmediatePlayback` 済みの同一 URL なら `seek` せず `play()` のみ。消費後は準備状態をクリアする。
    func playPreparedPhrase(url: URL, onStarted: (() -> Void)? = nil) -> Bool {
        guard preparedForImmediatePlaybackURL == url,
              loadedPhraseURL == url,
              let item = currentItem,
              player.currentItem === item
        else {
            return false
        }
        preparedForImmediatePlaybackURL = nil
        currentTimeSec = 0
        player.volume = phraseVolume
        player.play()
        onStarted?()
        return true
    }

    /// フレーズ MP3 を頭から再生する。
    func playPhrase(url: URL, onStarted: (() -> Void)? = nil) {
        preparedForImmediatePlaybackURL = nil
        playbackToken += 1
        let token = playbackToken

        prepareItem(url: url)

        player.pause()
        player.volume = phraseVolume
        currentTimeSec = 0

        player.seek(to: .zero, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] finished in
            guard finished else { return }
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                guard self.playbackToken == token else { return }
                guard self.loadedPhraseURL == url else { return }

                self.currentTimeSec = 0
                self.player.volume = self.phraseVolume
                self.player.play()
                onStarted?()
            }
        }
    }

    /// フレーズ MP3 を停止し、再生時刻を 0 に戻す。
    func stopPhrase() {
        preparedForImmediatePlaybackURL = nil
        playbackToken += 1
        player.pause()
        player.seek(to: .zero, toleranceBefore: .zero, toleranceAfter: .zero)
        currentTimeSec = 0
    }

    /// コードヴォイシングバトルのカウントイン（1拍メトロノーム相当の短いクリック）。
    func playCountInClick() {
        SurvivalGameAudio.shared.playNote(76, velocity: 88, duration: 0.065, asPiano: false)
    }

    // MARK: - Internals

    private func prepareItem(url: URL) {
        if loadedPhraseURL == url, currentItem != nil, player.currentItem === currentItem {
            return
        }
        preparedForImmediatePlaybackURL = nil
        removeObservers()
        currentTimeSec = 0
        loadedPhraseURL = url
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

    private func seekToZeroAsync() async -> Bool {
        await withCheckedContinuation { (continuation: CheckedContinuation<Bool, Never>) in
            player.seek(to: .zero, toleranceBefore: .zero, toleranceAfter: .zero) { finished in
                continuation.resume(returning: finished)
            }
        }
    }

    private func waitForItemReadyToPlay(_ item: AVPlayerItem) async -> Bool {
        if item.status == .readyToPlay { return true }
        if item.status == .failed { return false }
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            var resumed = false
            var observation: NSKeyValueObservation?
            observation = item.observe(\.status, options: [.initial, .new]) { observedItem, _ in
                guard !resumed else { return }
                switch observedItem.status {
                case .readyToPlay, .failed:
                    resumed = true
                    observation?.invalidate()
                    observation = nil
                    continuation.resume()
                default:
                    break
                }
            }
        }
        return item.status == .readyToPlay
    }

    private func addObservers(for item: AVPlayerItem) {
        endObservation = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            guard let self else { return }
            self.onEnded?()
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
