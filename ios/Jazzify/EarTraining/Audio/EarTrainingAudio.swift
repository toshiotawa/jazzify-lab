import CryptoKit
import Foundation
import AVFoundation
import Darwin

/// コードヴォイシング同期用。`schedulePreparedPhraseWithCountIn` が採用したリードインと BPM を UI 側に渡す。
struct EarTrainingScheduledCountInPhrase: Sendable {
    let leadInSec: Double
    let beatDurationSec: Double
    let countInBeats: Int
    /// スケジュール呼び出し完了からフレーズ頭までの秒（リードイン＋拍×拍間）。
    let phraseStartDelaySec: Double
}

/// 耳コピバトル ゲーム画面のオーディオマネージャ。
/// - フレーズ MP3: ローカルキャッシュ後に `AVAudioEngine` + `AVAudioPlayerNode` で再生し、約30Hzで進捗通知
/// - ピアノ発音と効果音は `SurvivalGameAudio.shared` を共有して再利用する
/// - フレーズ音量 = `musicVolume * masterVolume` を `phraseMixer` に反映
/// - コードヴォイシングのカウントインクリックは同一エンジン上の短いPCMバッファで再生する
final class EarTrainingAudio: NSObject {
    /// 周期的に通知される再生時刻 (秒)。停止中は 0。
    private(set) var currentTimeSec: Double = 0

    /// フレーズが最後まで再生完了したときのコールバック（`scheduleFile` の completion）。
    var onEnded: (() -> Void)?
    /// 周期 (≒30Hz) で呼ばれる進捗コールバック。引数は秒。
    var onTimeUpdate: ((Double) -> Void)?

    private let engine = AVAudioEngine()
    private let phrasePlayer = AVAudioPlayerNode()
    private let clickPlayer = AVAudioPlayerNode()
    private let phraseMixer = AVAudioMixerNode()

    private let cache = EarTrainingPhraseFileCache()
    private var timeTicker: DispatchSourceTimer?

    private var isGraphInstalled = false
    private var lastPhraseFormat: AVAudioFormat?
    private var clickPCM: AVAudioPCMBuffer?

    /// リモート先読み重複排除用（ロビー `preloadPhrase`）。
    private var preloadDedupeURL: URL?

    /// 論理キー（API に渡る `URL`）。リモートまたは file URL。
    private var loadedPhraseURL: URL?
    /// `preparePhraseForImmediatePlayback` 済みの論理 URL。
    private var preparedForImmediatePlaybackURL: URL?
    /// キャッシュ上のローカルファイル（再生直前に `AVAudioFile` を開く）。
    private var preparedLocalFileURL: URL?

    private var playbackToken: Int = 0
    private var isPhraseEngineRunning = false

    /// `schedulePreparedPhraseWithCountIn` でフレーズ `scheduleFile` した頭のホスト時刻。
    /// 非ゼロの間は `playerTime.sampleTime` ではなくアンカー差分から `currentTimeSec` を出す。
    /// （`phrasePlayer.play()` 直後〜フレーズ実再生まで、`sampleTime` にカウントイン分が混ざるのを避けるため）
    private var phrasePlaybackAnchorHostTime: UInt64 = 0

    /// `musicVolume * masterVolume` を 0...1 に閉じた値。
    private var phraseVolume: Float = 1.0

    override init() {
        super.init()
    }

    deinit {
        stopTimeTicker()
        if engine.isRunning {
            engine.stop()
        }
    }

    // MARK: - Lifecycle

    /// 開始時に呼ぶ。Survival と同じ AVAudioSession 設定 + ピアノ準備を行うが、BGM は鳴らさない。
    func start() {
        SurvivalGameAudio.shared.start(playBackgroundMusic: false)
        installGraphIfNeeded()
        startPhraseEngineIfNeeded()
    }

    /// 終了時に呼ぶ。フレーズを完全停止し、ピアノ発音停止 + Survival のオーディオセッションを閉じる。
    func stop() {
        stopPhrase()
        if engine.isRunning {
            engine.stop()
        }
        isPhraseEngineRunning = false
        SurvivalGameAudio.shared.stop()
    }

    // MARK: - Volume

    func setVolumes(master: Double, music: Double, piano: Double, sfx: Double) {
        let m = clampedFloat(master)
        phraseVolume = clampedFloat(music) * m
        phraseMixer.outputVolume = phraseVolume
        SurvivalGameAudio.shared.setPianoVolume(clampedFloat(piano))
        SurvivalGameAudio.shared.setSfxVolume(clampedFloat(sfx))
    }

    func setPhraseVolume(_ value: Float) {
        phraseVolume = max(0, min(1, value))
        phraseMixer.outputVolume = phraseVolume
    }

    private func clampedFloat(_ value: Double) -> Float {
        Float(max(0, min(1, value)))
    }

    // MARK: - Phrase playback

    /// ロビー表示中に先頭フレーズをキャッシュへ取り込み、START 後の待ちを短縮する。
    func preloadPhrase(url: URL) {
        guard preloadDedupeURL != url else { return }
        preloadDedupeURL = url
        Task { [weak self] in
            _ = try? await self?.cache.localFileURL(for: url)
        }
    }

    /// 互換のため残す。キャッシュの先読みのみ行う（無音 `play()` はしない）。
    func prefetchPhraseItem(url: URL) {
        Task { [weak self] in
            _ = try? await self?.cache.localFileURL(for: url)
        }
    }

    /// カウントイン前に呼ぶ。リモートならダウンロード・キャッシュし、`playPreparedPhrase` で即スケジュール再生可能にする。
    func preparePhraseForImmediatePlayback(url: URL) async -> Bool {
        playbackToken += 1
        let token = playbackToken
        preparedForImmediatePlaybackURL = nil
        preparedLocalFileURL = nil

        do {
            let local = try await cache.localFileURL(for: url)
            guard playbackToken == token else { return false }

            let file = try AVAudioFile(forReading: local)
            guard file.length > 0 else { return false }
            guard playbackToken == token else { return false }

            loadedPhraseURL = url
            preparedLocalFileURL = local
            preparedForImmediatePlaybackURL = url

            await MainActor.run {
                self.ensureGraph(for: file.processingFormat)
            }
            return true
        } catch {
            return false
        }
    }

    /// `preparePhraseForImmediatePlayback` 済みの同一 URL ならファイル頭からスケジュールして再生する。
    func playPreparedPhrase(url: URL, onStarted: (() -> Void)? = nil) -> Bool {
        guard preparedForImmediatePlaybackURL == url,
              loadedPhraseURL == url,
              let local = preparedLocalFileURL
        else {
            return false
        }

        preparedForImmediatePlaybackURL = nil
        preparedLocalFileURL = nil

        let scheduleToken = playbackToken

        do {
            let file = try AVAudioFile(forReading: local)
            stopPhrasePlaybackOnly()
            ensureGraph(for: file.processingFormat)
            schedulePhrase(file: file, scheduleToken: scheduleToken, onStarted: onStarted)
            return true
        } catch {
            return false
        }
    }

    /// カウントイン全拍とフレーズ頭を同一ホスト時間軸で予約する（コードヴォイシング用）。
    /// - Note: `preparePhraseForImmediatePlayback` 済みの `url` のみ受け付け。成功後は準備フラグを消費する。
    func schedulePreparedPhraseWithCountIn(
        url: URL,
        countInBeats: Int,
        bpm: Int,
        onPhraseStarted: (() -> Void)? = nil
    ) -> EarTrainingScheduledCountInPhrase? {
        guard preparedForImmediatePlaybackURL == url,
              loadedPhraseURL == url,
              let local = preparedLocalFileURL
        else {
            return nil
        }

        let scheduleToken = playbackToken
        let leadInSec = 0.02
        let safeBpm = max(1, bpm)
        let beatDurationSec = max(0.1, 60.0 / Double(safeBpm))
        let safeBeats = max(0, countInBeats)
        let phraseStartDelaySec = leadInSec + beatDurationSec * Double(safeBeats)

        do {
            let file = try AVAudioFile(forReading: local)
            stopPhrasePlaybackOnly()
            ensureGraph(for: file.processingFormat)
            startPhraseEngineIfNeeded()

            guard let pcm = clickPCM else { return nil }

            preparedForImmediatePlaybackURL = nil
            preparedLocalFileURL = nil

            clickPlayer.stop()
            phrasePlayer.stop()

            clickPlayer.play()
            phrasePlayer.play()

            let nowHost = mach_absolute_time()
            let leadHost = AVAudioTime.hostTime(forSeconds: leadInSec)
            let beatHost = AVAudioTime.hostTime(forSeconds: beatDurationSec)

            var clickIndex: UInt64 = 0
            while clickIndex < UInt64(safeBeats) {
                let hostTime = nowHost &+ leadHost &+ beatHost &* clickIndex
                let when = AVAudioTime(hostTime: hostTime)
                clickPlayer.scheduleBuffer(pcm, at: when, options: [], completionHandler: nil)
                clickIndex &+= 1
            }

            let phraseHost = nowHost &+ leadHost &+ beatHost &* UInt64(safeBeats)
            let phraseWhen = AVAudioTime(hostTime: phraseHost)
            phrasePlaybackAnchorHostTime = phraseHost

            phrasePlayer.scheduleFile(file, at: phraseWhen) { [weak self] in
                DispatchQueue.main.async {
                    guard let self else { return }
                    guard self.playbackToken == scheduleToken else { return }
                    self.currentTimeSec = 0
                    self.phrasePlaybackAnchorHostTime = 0
                    self.stopTimeTicker()
                    self.phrasePlayer.stop()
                    self.clickPlayer.stop()
                    self.onEnded?()
                }
            }

            startTimeTickerIfNeeded()

            DispatchQueue.main.asyncAfter(deadline: .now() + phraseStartDelaySec) { [weak self] in
                guard let self else { return }
                guard self.playbackToken == scheduleToken else { return }
                let cb = onPhraseStarted
                cb?()
            }

            return EarTrainingScheduledCountInPhrase(
                leadInSec: leadInSec,
                beatDurationSec: beatDurationSec,
                countInBeats: safeBeats,
                phraseStartDelaySec: phraseStartDelaySec
            )
        } catch {
            return nil
        }
    }

    /// フレーズ MP3 を頭から再生する（準備に失敗した場合のフォールバック）。
    func playPhrase(url: URL, onStarted: (() -> Void)? = nil) {
        preparedForImmediatePlaybackURL = nil
        preparedLocalFileURL = nil
        playbackToken += 1
        let token = playbackToken

        Task { [weak self] in
            guard let self else { return }
            do {
                let local = try await self.cache.localFileURL(for: url)
                let file = try AVAudioFile(forReading: local)
                await MainActor.run {
                    guard self.playbackToken == token else { return }
                    self.loadedPhraseURL = url
                    self.stopPhrasePlaybackOnly()
                    self.ensureGraph(for: file.processingFormat)
                    self.schedulePhrase(file: file, scheduleToken: token, onStarted: onStarted)
                }
            } catch {
                await MainActor.run {
                    guard self.playbackToken == token else { return }
                    self.loadedPhraseURL = nil
                }
            }
        }
    }

    /// フレーズ MP3 を停止し、再生時刻を 0 に戻す。
    func stopPhrase() {
        preparedForImmediatePlaybackURL = nil
        preparedLocalFileURL = nil
        playbackToken += 1
        phrasePlayer.stop()
        clickPlayer.stop()
        stopTimeTicker()
        currentTimeSec = 0
        phrasePlaybackAnchorHostTime = 0
    }

    /// コードヴォイシングバトルのカウントイン（同一 `AVAudioEngine` 上の短いクリック）。
    func playCountInClick() {
        installGraphIfNeeded()
        startPhraseEngineIfNeeded()

        if lastPhraseFormat == nil {
            let fmt = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 2)!
            ensureGraph(for: fmt)
        }

        guard let pcm = clickPCM else { return }

        if !clickPlayer.isPlaying {
            clickPlayer.play()
        }
        clickPlayer.scheduleBuffer(pcm, at: nil, options: [.interrupts], completionHandler: nil)
    }

    // MARK: - Internals

    private func installGraphIfNeeded() {
        guard !isGraphInstalled else { return }

        let defaultFormat = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 2)!
        engine.attach(phrasePlayer)
        engine.attach(clickPlayer)
        engine.attach(phraseMixer)
        engine.connect(phrasePlayer, to: phraseMixer, format: defaultFormat)
        engine.connect(clickPlayer, to: phraseMixer, format: defaultFormat)
        engine.connect(phraseMixer, to: engine.mainMixerNode, format: nil)

        lastPhraseFormat = defaultFormat
        rebuildClickBuffer(for: defaultFormat)
        phraseMixer.outputVolume = phraseVolume

        isGraphInstalled = true
    }

    private func ensureGraph(for format: AVAudioFormat) {
        installGraphIfNeeded()

        if lastPhraseFormat?.isEqual(format) == true {
            phraseMixer.outputVolume = phraseVolume
            return
        }

        let wasRunning = engine.isRunning
        if wasRunning {
            engine.stop()
        }

        engine.disconnectNodeInput(phraseMixer)
        engine.connect(phrasePlayer, to: phraseMixer, format: format)
        engine.connect(clickPlayer, to: phraseMixer, format: format)

        lastPhraseFormat = format
        rebuildClickBuffer(for: format)
        phraseMixer.outputVolume = phraseVolume

        if wasRunning || isPhraseEngineRunning {
            try? engine.start()
        }
    }

    private func startPhraseEngineIfNeeded() {
        guard !engine.isRunning else { return }
        do {
            try engine.start()
            isPhraseEngineRunning = true
            phraseMixer.outputVolume = phraseVolume
            engine.mainMixerNode.outputVolume = 1.0
        } catch {
            isPhraseEngineRunning = false
        }
    }

    private func stopPhrasePlaybackOnly() {
        phrasePlayer.stop()
        clickPlayer.stop()
        stopTimeTicker()
        currentTimeSec = 0
        phrasePlaybackAnchorHostTime = 0
    }

    private func schedulePhrase(file: AVAudioFile, scheduleToken: Int, onStarted: (() -> Void)?) {
        startPhraseEngineIfNeeded()

        phrasePlayer.stop()
        currentTimeSec = 0
        phrasePlaybackAnchorHostTime = 0

        phrasePlayer.scheduleFile(file, at: nil, completionHandler: { [weak self] in
            DispatchQueue.main.async {
                guard let self else { return }
                guard self.playbackToken == scheduleToken else { return }
                self.currentTimeSec = 0
                self.stopTimeTicker()
                self.phrasePlayer.stop()
                self.clickPlayer.stop()
                self.onEnded?()
            }
        })

        phrasePlayer.play()
        startTimeTickerIfNeeded()

        let cb = onStarted
        if let cb {
            if Thread.isMainThread {
                cb()
            } else {
                DispatchQueue.main.async(execute: cb)
            }
        }
    }

    private func startTimeTickerIfNeeded() {
        guard timeTicker == nil else { return }
        let timer = DispatchSource.makeTimerSource(queue: .main)
        timer.schedule(deadline: .now(), repeating: 1.0 / 30.0)
        timer.setEventHandler { [weak self] in
            self?.emitPhraseTimeIfPlaying()
        }
        timer.resume()
        timeTicker = timer
    }

    private func stopTimeTicker() {
        timeTicker?.cancel()
        timeTicker = nil
    }

    private func emitPhraseTimeIfPlaying() {
        guard phrasePlayer.isPlaying else { return }
        let anchor = phrasePlaybackAnchorHostTime
        if anchor != 0 {
            let now = mach_absolute_time()
            if now < anchor {
                currentTimeSec = 0
                return
            }
            let sec = Self.secondsFromMachHostDifference(from: anchor, to: now)
            guard sec.isFinite else { return }
            currentTimeSec = max(0, sec)
            onTimeUpdate?(currentTimeSec)
            return
        }
        guard let nodeTime = phrasePlayer.lastRenderTime,
              let playerTime = phrasePlayer.playerTime(forNodeTime: nodeTime)
        else {
            return
        }
        let sec = Double(playerTime.sampleTime) / playerTime.sampleRate
        guard sec.isFinite else { return }
        currentTimeSec = max(0, sec)
        onTimeUpdate?(currentTimeSec)
    }

    private static func secondsFromMachHostDifference(from start: UInt64, to end: UInt64) -> Double {
        let delta = end &- start
        let info = machTimebaseInfo
        let nanos = Double(delta) * Double(info.numer) / Double(info.denom)
        return nanos / 1_000_000_000
    }

    private static let machTimebaseInfo: mach_timebase_info_data_t = {
        var info = mach_timebase_info_data_t()
        mach_timebase_info(&info)
        return info
    }()

    private func rebuildClickBuffer(for format: AVAudioFormat) {
        let sampleRate = format.sampleRate
        let channelCount = Int(format.channelCount)
        let durationSec = 0.045
        let frameCount = AVAudioFrameCount(max(1, min(Int(Double(sampleRate) * durationSec), 96_000)))
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            clickPCM = nil
            return
        }
        buffer.frameLength = frameCount

        guard let data = buffer.floatChannelData else {
            clickPCM = nil
            return
        }

        let n = Int(frameCount)
        let freq = 2_200.0
        for ch in 0..<channelCount {
            let channel = data[ch]
            for i in 0..<n {
                let t = Double(i) / sampleRate
                let env = exp(-t * 100)
                let s = sin(2.0 * Double.pi * freq * t) * env * 0.28
                channel[i] = Float(s)
            }
        }
        clickPCM = buffer
    }

    // MARK: - Piano bridge (Survival サンプラー再利用)

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

// MARK: - File cache

private final class EarTrainingPhraseFileCache {
    private var inflight: [URL: Task<URL, Error>] = [:]
    private let lock = NSLock()

    func localFileURL(for remote: URL) async throws -> URL {
        if remote.isFileURL {
            guard FileManager.default.fileExists(atPath: remote.path) else {
                throw URLError(.fileDoesNotExist)
            }
            return remote
        }

        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("EarTrainingPhraseAudio", isDirectory: true)
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
