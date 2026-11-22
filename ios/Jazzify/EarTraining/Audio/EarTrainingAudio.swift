import Foundation
import AVFoundation
import AudioToolbox
import Darwin
import UIKit

/// コードヴォイシング同期用。`schedulePreparedPhraseWithCountIn` が採用したリードインと BPM を UI 側に渡す。
struct EarTrainingScheduledCountInPhrase: Sendable {
    let leadInSec: Double
    let beatDurationSec: Double
    let countInBeats: Int
    /// スケジュール呼び出し完了からフレーズ頭までの秒（リードイン＋拍×拍間）。
    let phraseStartDelaySec: Double
    /// スケジュール呼び出し完了から入力ウィンドウ開始までの秒（フレーズ頭の半拍前）。
    let inputWindowStartDelaySec: Double
}

/// 耳コピバトル ゲーム画面のオーディオマネージャ。
/// - フレーズ MP3: ローカルキャッシュ後に `AVAudioEngine` + `AVAudioPlayerNode` で再生し、約30Hzで進捗通知
/// - ピアノ発音と効果音は `SurvivalGameAudio.shared` を共有して再利用する
/// - フレーズ音量 = `musicVolume * masterVolume` を `phraseMixer` に反映
/// - コードヴォイシングのカウントインクリックは同一エンジン上の短いPCMバッファで再生する
final class EarTrainingAudio: NSObject {
    /// 画面録画再構成後にフレーズ再開に失敗したとき（コントローラが一時停止扱いにできる）。
    static let phrasePlaybackSuspendedAfterCaptureNotification = Notification.Name(
        "EarTrainingAudio.phrasePlaybackSuspendedAfterCapture"
    )

    /// 画面録画時はハードウェア優先レート（多くは 48 kHz）へ追従する。未確定時は 48 kHz。
    static func preferredHardwareSampleRate(fromSessionSampleRate rate: Double) -> Double {
        AudioOutputFormatResolver.resolveSampleRate(outputNodeSampleRate: 0, sessionSampleRate: rate)
    }

    static func preferredHardwareSampleRate(session: AVAudioSession = .sharedInstance()) -> Double {
        AudioOutputFormatResolver.resolveSampleRate(
            outputNodeSampleRate: 0,
            sessionSampleRate: session.sampleRate
        )
    }

    /// 共有 AVAudioSession の現行サンプルレートに合わせたステレオ PCM 形式。
    static func preferredOutputFormat(session: AVAudioSession = .sharedInstance()) -> AVAudioFormat {
        AudioOutputFormatResolver.stereoFormat(
            engine: nil,
            session: session
        )
    }

    static func preferredOutputFormat(sampleRate: Double) -> AVAudioFormat {
        AudioOutputFormatResolver.stereoFormat(sampleRate: sampleRate)
    }

    /// 周期的に通知される再生時刻 (秒)。停止中は 0。
    private(set) var currentTimeSec: Double = 0

    /// フレーズが最後まで再生完了したときのコールバック（`scheduleFile` の completion）。
    var onEnded: (() -> Void)?
    /// 周期 (≒30Hz) で呼ばれる進捗コールバック。引数は秒。
    var onTimeUpdate: ((Double) -> Void)?
    /// 精密モード練習シーク: タイムライン上の開始秒（`phraseWallClockTimelineSecNowOrNil` に加算）。
    var phraseTimelinePlaybackOffsetSec: Double = 0
    /// true のとき、フレーズアンカーより前に `onTimeUpdate` へ負のフレーズ秒を送る（OSMD カウントイン中の先行判定用）。
    var emitNegativePhraseTimelineBeforeAnchor: Bool = false

    private var engine = AVAudioEngine()
    private var phrasePlayer = AVAudioPlayerNode()
    private var phraseInputMixer = AVAudioMixerNode()
    private var phraseTimePitch = AVAudioUnitTimePitch()
    private var clickPlayer = AVAudioPlayerNode()
    private var phraseMixer = AVAudioMixerNode()
    private var drumPlayer = AVAudioPlayerNode()
    private var drumMixer = AVAudioMixerNode()
    /// 火炎魔法 SE（コードヴォイシング正解の火の玉 / Skill キャスト演出と同期）。
    /// SFX 音量スライダーに連動。
    private var fireSePlayer = AVAudioPlayerNode()
    private var fireSeMixer = AVAudioMixerNode()
    /// フレーズ / ドラム / SE を合算してからリミッターへ送るマスターミキサー。
    private var masterMixer = AVAudioMixerNode()
    /// 画面録画時のデジタルクリップ抑止用ピークリミッター（Apple AUPeakLimiter）。
    private var limiter: AVAudioUnitEffect = EarTrainingAudio.makePeakLimiter()

    private static func makePeakLimiter() -> AVAudioUnitEffect {
        let description = AudioComponentDescription(
            componentType: kAudioUnitType_Effect,
            componentSubType: kAudioUnitSubType_PeakLimiter,
            componentManufacturer: kAudioUnitManufacturer_Apple,
            componentFlags: 0,
            componentFlagsMask: 0
        )
        return AVAudioUnitEffect(audioComponentDescription: description)
    }

    /// フレーズ MP3 のピッチシフト（半音）。`AVAudioUnitTimePitch` に反映する。
    var phrasePitchSemitones: Float = 0 {
        didSet { applyPhraseTimeStretch() }
    }

    /// 練習モードの再生速度（40...100%）。`AVAudioUnitTimePitch.rate` に反映する。
    var phrasePlaybackSpeedPercent: Float = 100 {
        didSet {
            let clamped = Float(EarTrainingPracticeSpeed.clampPracticeSpeedPercent(Int(phrasePlaybackSpeedPercent)))
            if clamped != phrasePlaybackSpeedPercent {
                phrasePlaybackSpeedPercent = clamped
                return
            }
            applyPhraseTimeStretch()
        }
    }

    private let cache = RemoteAudioFileCache(subdirectory: "EarTrainingPhraseAudio")
    private var timeTicker: DispatchSourceTimer?

    private var isGraphInstalled = false
    private var isMutatingGraph = false
    private var pendingConfigurationChange = false
    private var pendingConfigurationWorkItem: DispatchWorkItem?
    private var activeOutputFormat: AVAudioFormat?
    private var lastPhraseFormat: AVAudioFormat?
    private var lastPhraseInputFormat: AVAudioFormat?
    private var lastDrumFormat: AVAudioFormat?
    private var lastFireSeFormat: AVAudioFormat?
    private var activePhraseSourcePCM: AVAudioPCMBuffer?
    private var drumSourcePCM: AVAudioPCMBuffer?
    private var fireSeSourcePCM: AVAudioPCMBuffer?
    private var clickPCM: AVAudioPCMBuffer?
    private var clickPCMFirstBeat: AVAudioPCMBuffer?
    private var drumPCM: AVAudioPCMBuffer?
    private var fireSePCM: AVAudioPCMBuffer?
    /// `playFireMagicSe` の連打抑止（mach 時間ベース秒）。
    private var lastFireSePlayMs: Double = 0
    private static let fireSeThrottleMs: Double = 60
    /// 魔法演出 SE はスライダーに加えて常にこの倍率で減衰させる（UX 要望: スライダー非依存で控えめ）。
    private static let fireSeBaseGain: Float = 0.45
    /// マスターバスへのヘッドルーム（≒ -3 dB）。画面録画時の複数バス合算クリップを抑える。
    private static let masterHeadroomGain: Float = 0.7
    private enum PeakLimiterParameter {
        static let attackTime: AudioUnitParameterID = 0
        static let decayTime: AudioUnitParameterID = 1
        static let preGain: AudioUnitParameterID = 2
    }
    /// `setVolumes(sfx:)` で更新される SFX 音量（0...1）。
    private var sfxVolume: Float = 1.0

    /// リモート先読み重複排除用（ロビー `preloadPhrase`）。
    private var preloadDedupeURL: URL?

    /// 論理キー（API に渡る `URL`）。リモートまたは file URL。
    private var loadedPhraseURL: URL?
    /// `preparePhraseForImmediatePlayback` 済みの論理 URL。
    private var preparedForImmediatePlaybackURL: URL?
    /// キャッシュ上のローカルファイル（PCM 事前デコードに失敗した場合の `scheduleFile` フォールバック用）。
    private var preparedLocalFileURL: URL?
    /// 再生中フレーズのローカルファイル（画面録画再構成後のオフセット再開用。`stopPhrase` まで保持）。
    private var activePhraseLocalFileURL: URL?
    /// `preparePhraseForImmediatePlayback` で事前デコードしたフレーズ PCM（短いループ前提）。
    /// 再生直前のディスク読込レイテンシを排除し、`scheduleBuffer(at:)` の予約ホスト時刻取りこぼし（フレーズ遅延スタート）を防ぐ。
    /// 長尺・デコード失敗時は nil で、`preparedLocalFileURL` からの `scheduleFile` にフォールバックする。
    private var preparedPhrasePCM: AVAudioPCMBuffer?
    /// PCM 事前デコードを許容する最大秒数（これを超える長尺は `scheduleFile` フォールバック）。
    private static let maxPreparedPhrasePcmSeconds: Double = 180
    /// 練習シーク再開時の予約リードイン（アンカーと実発音のずれを抑える）。
    private static let practiceSeekLeadInSec: Double = 0.08

    private var playbackToken: Int = 0
    private var isPhraseEngineRunning = false
    private var needsEngineResumeOnActive = false
    private var isDrumLoopActive = false
    /// `startDrumLoop` 開始時のホスト時刻（フレーズ未再生時の判定タイムライン用）。
    private var drumLoopAnchorHostTime: UInt64 = 0

    private var engineConfigObserver: NSObjectProtocol?
    private var foregroundObserver: NSObjectProtocol?
    private var survivalCaptureObserver: NSObjectProtocol?
    private var appAudioSessionObserver: NSObjectProtocol?

    /// `schedulePreparedPhraseWithCountIn` でフレーズ `scheduleFile` した頭のホスト時刻。
    /// 非ゼロの間は `playerTime.sampleTime` ではなくアンカー差分から `currentTimeSec` を出す。
    /// （`phrasePlayer.play()` 直後〜フレーズ実再生まで、`sampleTime` にカウントイン分が混ざるのを避けるため）
    private var phrasePlaybackAnchorHostTime: UInt64 = 0

    /// 精密モード練習ループセッション状態。
    private var loopSessionActive = false
    private var loopDurationSec: Double = 0
    private var loopStartSec: Double = 0
    private var loopAnchorHostTime: UInt64 = 0
    private var loopScheduleGen: Int = 0
    private var scheduledLoopCycles: Set<Int> = []
    private var loopSemitoneForCycle: ((Int) -> Int)?
    private var loopPreparedPCM: AVAudioPCMBuffer?
    private var loopPreparedLocalFileURL: URL?
    private var loopPreparedFormat: AVAudioFormat?

    /// フレーズ / ドラムの音源スライダー値（0...1）。マスターは `masterMixer` で別制御。
    private var phraseVolume: Float = Float(EarTrainingBattleVolumePreferences.defaultMusic)
    /// マスター音量（0...1）。`masterMixer` へヘッドルーム付きで適用。
    private var masterVolume: Float = Float(EarTrainingBattleVolumePreferences.defaultMaster)

    override init() {
        super.init()
        sfxVolume = max(0, min(1, SurvivalGameAudio.shared.sfxVolume))
        registerLifecycleObservers()
    }

    deinit {
        if let engineConfigObserver {
            NotificationCenter.default.removeObserver(engineConfigObserver)
        }
        if let foregroundObserver {
            NotificationCenter.default.removeObserver(foregroundObserver)
        }
        if let survivalCaptureObserver {
            NotificationCenter.default.removeObserver(survivalCaptureObserver)
        }
        if let appAudioSessionObserver {
            NotificationCenter.default.removeObserver(appAudioSessionObserver)
        }
        pendingConfigurationWorkItem?.cancel()
        pendingConfigurationWorkItem = nil
        stopTimeTicker()
        if engine.isRunning {
            engine.stop()
        }
    }

    // MARK: - Lifecycle

    /// 開始時に呼ぶ。Survival と同じ AVAudioSession 設定 + ピアノ準備を行うが、BGM は鳴らさない。
    func start() {
        applyPersistedVolumes()
        SurvivalGameAudio.shared.start(playBackgroundMusic: false)
        installGraphIfNeeded()
        startPhraseEngineIfNeeded()
        prepareFireMagicSeIfNeeded()
    }

    /// カウントイン / バトル開始直前に共有ピアノを再準備する（Web `ensureBattlePianoAudio` 相当）。
    func ensureBattlePianoReady() {
        SurvivalGameAudio.shared.start(playBackgroundMusic: false)
    }

    /// 終了時に呼ぶ。フレーズを完全停止し、ピアノ発音停止 + Survival のオーディオセッションを閉じる。
    func stop() {
        stopPhraseEngine()
        SurvivalGameAudio.shared.stop()
    }

    /// フレーズ／ドラム／SFX エンジンのみ停止。共有ピアノ（`SurvivalGameAudio`）は維持する。
    /// タイミング調整モードなど、親バトルの上に重ねた子セッションの tearDown 用。
    func stopPhraseEngine() {
        pendingConfigurationWorkItem?.cancel()
        pendingConfigurationWorkItem = nil
        pendingConfigurationChange = false
        stopDrumLoop()
        stopPhrase()
        fireSePlayer.stop()
        if engine.isRunning {
            engine.stop()
        }
        isPhraseEngineRunning = false
        needsEngineResumeOnActive = false
    }

    // MARK: - Volume

    func setVolumes(master: Double, music: Double, piano: Double, sfx: Double) {
        masterVolume = clampedFloat(master)
        phraseVolume = clampedFloat(music)
        applyPhraseMixerVolumes()
        sfxVolume = clampedFloat(sfx)
        fireSeMixer.outputVolume = sfxVolume * Self.fireSeBaseGain
        SurvivalGameAudio.shared.setMasterVolume(masterVolume)
        SurvivalGameAudio.shared.setPianoVolume(clampedFloat(piano))
        SurvivalGameAudio.shared.setSfxVolume(sfxVolume)
    }

    private func clampedFloat(_ value: Double) -> Float {
        Float(max(0, min(1, value)))
    }

    private func applyPhraseMixerVolumes() {
        phraseMixer.outputVolume = phraseVolume
        drumMixer.outputVolume = phraseVolume
        applyMasterMixerVolume()
    }

    private func applyMasterMixerVolume() {
        masterMixer.outputVolume = Self.masterHeadroomGain * masterVolume
    }

    private func applyPersistedVolumes() {
        let volumes = EarTrainingBattleVolumePreferences.loadPersisted()
        setVolumes(
            master: volumes.master,
            music: volumes.music,
            piano: volumes.piano,
            sfx: volumes.sfx
        )
    }

    /// フレーズエンジン `stop()` 前に共有ピアノのサステインを止める。
    private func stopSharedPianoBeforePhraseEngineRebuild() {
        SurvivalGameAudio.shared.stopAllPianoNotesForExternalGraphRebuild()
    }

    // MARK: - Self-paced drum loop

    /// セルフペース用ドラムループをダウンロード・デコードして保持する。
    func prepareDrumLoop(url: URL) async -> Bool {
        do {
            let local = try await cache.localFileURL(for: url)
            let file = try AVAudioFile(forReading: local)
            guard file.length > 0 else { return false }
            guard let pcm = Self.decodeEntireFile(file: file) else { return false }
            await MainActor.run {
                self.ensureDrumGraph(for: file.processingFormat)
                self.drumSourcePCM = pcm
                self.drumPCM = self.pcmBufferForOutput(pcm)
            }
            return true
        } catch {
            return false
        }
    }

    /// 事前に `prepareDrumLoop` で用意した PCM を `.loops` で再生する。
    func startDrumLoop() {
        guard let pcm = drumPCM else { return }
        let outputPCM = pcmBufferForOutput(pcm)
        startPhraseEngineIfNeeded()
        drumPlayer.stop()
        drumPlayer.scheduleBuffer(outputPCM, at: nil, options: [.loops], completionHandler: nil)
        drumPlayer.play()
        isDrumLoopActive = true
        drumLoopAnchorHostTime = mach_absolute_time()
        startTimeTickerIfNeeded()
    }

    func stopDrumLoop() {
        drumPlayer.stop()
        isDrumLoopActive = false
        drumLoopAnchorHostTime = 0
        if !phrasePlayer.isPlaying {
            stopTimeTicker()
        }
    }

    // MARK: - Phrase playback

    /// ロビー表示中に先頭フレーズをキャッシュへ取り込み、START 後の待ちを短縮する。
    func preloadPhrase(url: URL) {
        guard preloadDedupeURL != url else { return }
        preloadDedupeURL = url
        Task { [weak self] in
            _ = await self?.preparePhraseForImmediatePlayback(url: url)
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
        if preparedForImmediatePlaybackURL == url, preparedLocalFileURL != nil {
            return true
        }
        playbackToken += 1
        let token = playbackToken
        preparedForImmediatePlaybackURL = nil
        preparedLocalFileURL = nil
        preparedPhrasePCM = nil
        activePhraseLocalFileURL = nil
        activePhraseSourcePCM = nil

        do {
            let local = try await cache.localFileURL(for: url)
            guard playbackToken == token else { return false }

            let file = try AVAudioFile(forReading: local)
            guard file.length > 0 else { return false }
            guard playbackToken == token else { return false }

            // 短いループ前提で PCM へ全デコードし、再生直前のディスク読込を排除する（await 区間に重い処理を寄せる）。
            // 長尺・デコード失敗時は nil のままで、再生時に scheduleFile へフォールバックする。
            let pcm = Self.decodePhraseFileIfReasonable(file: file)
            guard playbackToken == token else { return false }

            loadedPhraseURL = url
            preparedLocalFileURL = local
            preparedForImmediatePlaybackURL = url
            preparedPhrasePCM = pcm

            await MainActor.run {
                self.ensureGraph(for: file.processingFormat)
            }
            return true
        } catch {
            return false
        }
    }

    /// フレーズを PCM へ全デコードする。長すぎる（メモリ過大）場合は nil を返し、呼び出し側は `scheduleFile` にフォールバックする。
    private static func decodePhraseFileIfReasonable(file: AVAudioFile) -> AVAudioPCMBuffer? {
        let sampleRate = file.processingFormat.sampleRate
        guard sampleRate > 0 else { return nil }
        let maxFrames = Int64(sampleRate * maxPreparedPhrasePcmSeconds)
        guard file.length > 0, file.length <= maxFrames else { return nil }
        return decodeEntireFile(file: file)
    }

    /// `preparePhraseForImmediatePlayback` 済みの同一 URL ならファイル頭からスケジュールして再生する。
    /// - Parameter phraseMuted: `true` のときフレーズ MP3 のみ無音（同一ミキサ経路のクリックは別経路で鳴らさない想定）。
    func playPreparedPhrase(url: URL, phraseMuted: Bool = false, onStarted: (() -> Void)? = nil) -> Bool {
        guard preparedForImmediatePlaybackURL == url,
              loadedPhraseURL == url,
              let local = preparedLocalFileURL
        else {
            return false
        }

        let preparedPCM = preparedPhrasePCM
        preparedForImmediatePlaybackURL = nil
        preparedLocalFileURL = nil
        preparedPhrasePCM = nil
        activePhraseLocalFileURL = local

        let scheduleToken = playbackToken

        if let preparedPCM {
            stopPhrasePlaybackOnly()
            activePhraseSourcePCM = preparedPCM
            schedulePhraseBuffer(
                preparedPCM,
                scheduleToken: scheduleToken,
                onStarted: onStarted,
                phraseMuted: phraseMuted
            )
            return true
        }

        do {
            let file = try AVAudioFile(forReading: local)
            stopPhrasePlaybackOnly()
            activePhraseSourcePCM = nil
            ensurePhraseGraphConnected(phraseInputFormat: file.processingFormat)
            schedulePhrase(file: file, scheduleToken: scheduleToken, onStarted: onStarted, phraseMuted: phraseMuted)
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
        onInputWindowStarted: (() -> Void)? = nil,
        onPhraseStarted: (() -> Void)? = nil
    ) -> EarTrainingScheduledCountInPhrase? {
        guard preparedForImmediatePlaybackURL == url,
              loadedPhraseURL == url,
              let local = preparedLocalFileURL
        else {
            return nil
        }

        let scheduleToken = playbackToken
        let leadInSec = 0.28
        let safeBpm = max(1, bpm)
        let beatDurationSec = max(0.1, 60.0 / Double(safeBpm))
        let safeBeats = max(0, countInBeats)
        let phraseStartDelaySec = leadInSec + beatDurationSec * Double(safeBeats)
        let halfBeatSec = 30.0 / Double(safeBpm)
        let inputWindowStartDelaySec = max(0, phraseStartDelaySec - halfBeatSec)

        // フレーズは事前デコード済み PCM を優先。無い場合のみファイルから（フォールバック）。
        let preparedPCM = preparedPhrasePCM
        let preparedOutputPCM = preparedPCM.map { pcmBufferForOutput($0) }
        let fallbackFile: AVAudioFile?
        if preparedPCM != nil {
            fallbackFile = nil
        } else if let file = try? AVAudioFile(forReading: local) {
            fallbackFile = file
        } else {
            return nil
        }

        resetLoopSessionState()
        stopPhrasePlaybackOnly()
        if let preparedPCM, let outputPCM = preparedOutputPCM {
            activePhraseSourcePCM = preparedPCM
            ensurePhraseGraphConnected(phraseInputFormat: outputPCM.format)
        } else if let fallbackFile {
            activePhraseSourcePCM = nil
            ensurePhraseGraphConnected(phraseInputFormat: fallbackFile.processingFormat)
        }
        startPhraseEngineIfNeeded()

        guard let pcm = clickPCM else { return nil }

        preparedForImmediatePlaybackURL = nil
        preparedLocalFileURL = nil
        preparedPhrasePCM = nil
        activePhraseLocalFileURL = local

        clickPlayer.stop()
        phrasePlayer.stop()

        // 予約ホスト時刻の取りこぼし（フレーズ遅延スタート＝判定ずれ）を防ぐためプリロールを促す。
        engine.prepare()

        clickPlayer.play()
        phrasePlayer.play()

        let nowHost = mach_absolute_time()
        let leadHost = AVAudioTime.hostTime(forSeconds: leadInSec)
        let beatHost = AVAudioTime.hostTime(forSeconds: beatDurationSec)

        var clickIndex: UInt64 = 0
        while clickIndex < UInt64(safeBeats) {
            let hostTime = nowHost &+ leadHost &+ beatHost &* clickIndex
            let when = AVAudioTime(hostTime: hostTime)
            let clickBuf: AVAudioPCMBuffer = {
                if clickIndex == 0, let loud = clickPCMFirstBeat { return loud }
                return pcm
            }()
            clickPlayer.scheduleBuffer(clickBuf, at: when, options: [], completionHandler: nil)
            clickIndex &+= 1
        }

        let phraseHost = nowHost &+ leadHost &+ beatHost &* UInt64(safeBeats)
        let phraseWhen = AVAudioTime(hostTime: phraseHost)
        phrasePlaybackAnchorHostTime = phraseHost

        let onPhraseCompleted: AVAudioPlayerNodeCompletionHandler = { [weak self] _ in
            self?.notifyScheduledPhraseBufferPlaybackEnded(
                scheduleToken: scheduleToken,
                restorePhraseMixerVolume: false
            )
        }

        if let outputPCM = preparedOutputPCM {
            phrasePlayer.scheduleBuffer(
                outputPCM,
                at: phraseWhen,
                options: [],
                completionCallbackType: .dataPlayedBack,
                completionHandler: onPhraseCompleted
            )
        } else if let fallbackFile {
            phrasePlayer.scheduleFile(fallbackFile, at: phraseWhen, completionCallbackType: .dataPlayedBack, completionHandler: onPhraseCompleted)
        } else {
            return nil
        }

        startTimeTickerIfNeeded()

        let inputWindowToken = scheduleToken
        DispatchQueue.main.asyncAfter(deadline: .now() + inputWindowStartDelaySec) { [weak self] in
            guard let self else { return }
            guard self.playbackToken == inputWindowToken else { return }
            onInputWindowStarted?()
        }

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
            phraseStartDelaySec: phraseStartDelaySec,
            inputWindowStartDelaySec: inputWindowStartDelaySec
        )
    }

    /// フレーズ MP3 を頭から再生する（準備に失敗した場合のフォールバック）。
    func playPhrase(url: URL, onStarted: (() -> Void)? = nil) {
        preparedForImmediatePlaybackURL = nil
        preparedLocalFileURL = nil
        preparedPhrasePCM = nil
        activePhraseLocalFileURL = nil
        activePhraseSourcePCM = nil
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
                    self.activePhraseLocalFileURL = local
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
        resetLoopSessionState()
        preparedForImmediatePlaybackURL = nil
        preparedLocalFileURL = nil
        preparedPhrasePCM = nil
        activePhraseLocalFileURL = nil
        activePhraseSourcePCM = nil
        playbackToken += 1
        phraseTimelinePlaybackOffsetSec = 0
        phraseMixer.outputVolume = phraseVolume
        phrasePlayer.stop()
        clickPlayer.stop()
        stopTimeTicker()
        currentTimeSec = 0
        phrasePlaybackAnchorHostTime = 0
    }

    func isLoopSessionActive() -> Bool {
        loopSessionActive
    }

    /// ループセッション中のグローバルタイムライン秒。未確立なら nil。カウントイン中は負の秒。
    func loopTimelineSecNowOrNil() -> Double? {
        guard loopSessionActive, loopAnchorHostTime != 0 else { return nil }
        return Self.loopTimelineSec(fromAnchor: loopAnchorHostTime, nowHostTime: mach_absolute_time())
    }

    /// ループアンカーからの経過秒。アンカーが未来のときは負の秒を返す（テスト可能な純粋計算）。
    static func loopTimelineSec(fromAnchor anchorHostTime: UInt64, nowHostTime: UInt64) -> Double? {
        guard anchorHostTime != 0 else { return nil }
        if nowHostTime < anchorHostTime {
            let sec = -secondsFromMachHostDifference(from: nowHostTime, to: anchorHostTime)
            return sec.isFinite ? sec : nil
        }
        let elapsed = secondsFromMachHostDifference(from: anchorHostTime, to: nowHostTime)
        return elapsed.isFinite ? elapsed : nil
    }

    /// 精密モード練習: A-B 区間を無限ループ再生する。
    func startPhraseLoopSession(
        url: URL,
        loopStartSec windowStartSec: Double,
        loopDurationSec windowDurationSec: Double,
        countInBeats: Int,
        bpm: Int,
        semitoneForCycle: @escaping (Int) -> Int,
        onPhraseStarted: (() -> Void)? = nil
    ) -> Bool {
        guard preparedForImmediatePlaybackURL == url,
              loadedPhraseURL == url,
              let local = preparedLocalFileURL
        else {
            return false
        }

        let preparedPCM = preparedPhrasePCM
        let phraseFormat: AVAudioFormat
        if let preparedPCM {
            phraseFormat = preparedPCM.format
        } else if let file = try? AVAudioFile(forReading: local) {
            phraseFormat = file.processingFormat
        } else {
            return false
        }

        resetLoopSessionState()
        let scheduleToken = playbackToken
        loopScheduleGen = scheduleToken
        loopSessionActive = true
        loopDurationSec = max(1e-6, windowDurationSec)
        loopStartSec = max(0, windowStartSec)
        loopSemitoneForCycle = semitoneForCycle
        loopPreparedPCM = preparedPCM
        loopPreparedLocalFileURL = local
        loopPreparedFormat = phraseFormat
        scheduledLoopCycles.removeAll()

        activePhraseLocalFileURL = local
        stopPhrasePlaybackOnly()
        if preparedPCM != nil {
            activePhraseSourcePCM = preparedPCM
            ensurePhraseGraphConnected(phraseInputFormat: nil)
        } else {
            activePhraseSourcePCM = nil
            ensurePhraseGraphConnected(phraseInputFormat: phraseFormat)
        }
        startPhraseEngineIfNeeded()

        guard let pcm = clickPCM else {
            resetLoopSessionState()
            return false
        }

        let leadInSec = 0.28
        let safeBpm = max(1, bpm)
        let beatDurationSec = max(0.1, 60.0 / Double(safeBpm))
        let safeBeats = max(0, countInBeats)
        let phraseStartDelaySec = leadInSec + beatDurationSec * Double(safeBeats)

        clickPlayer.stop()
        phrasePlayer.stop()
        engine.prepare()
        clickPlayer.play()
        phrasePlayer.play()

        let nowHost = mach_absolute_time()
        let leadHost = AVAudioTime.hostTime(forSeconds: leadInSec)
        let beatHost = AVAudioTime.hostTime(forSeconds: beatDurationSec)

        var clickIndex: UInt64 = 0
        while clickIndex < UInt64(safeBeats) {
            let hostTime = nowHost &+ leadHost &+ beatHost &* clickIndex
            let when = AVAudioTime(hostTime: hostTime)
            let clickBuf: AVAudioPCMBuffer = {
                if clickIndex == 0, let loud = clickPCMFirstBeat { return loud }
                return pcm
            }()
            clickPlayer.scheduleBuffer(clickBuf, at: when, options: [], completionHandler: nil)
            clickIndex &+= 1
        }

        let phraseHost = nowHost &+ leadHost &+ beatHost &* UInt64(safeBeats)
        loopAnchorHostTime = phraseHost
        phrasePlaybackAnchorHostTime = phraseHost
        phraseTimelinePlaybackOffsetSec = 0

        applyLoopCyclePitch(cycleIndex: 0, scheduleGen: scheduleToken)
        ensureLoopCyclesScheduled(fromCycle: 0, throughCycle: 2, scheduleGen: scheduleToken)

        startTimeTickerIfNeeded()

        DispatchQueue.main.asyncAfter(deadline: .now() + phraseStartDelaySec) { [weak self] in
            guard let self else { return }
            guard self.playbackToken == scheduleToken else { return }
            onPhraseStarted?()
        }
        return true
    }

    func resumeLoopSessionFromTimelineSec(_ timelineSec: Double) {
        guard loopSessionActive else { return }
        let safeTimeline = max(0, timelineSec)
        playbackToken += 1
        let scheduleToken = playbackToken
        loopScheduleGen = scheduleToken
        phrasePlayer.stop()
        clickPlayer.stop()
        scheduledLoopCycles.removeAll()

        let nowHost = mach_absolute_time()
        let timelineHost = AVAudioTime.hostTime(forSeconds: safeTimeline)
        loopAnchorHostTime = nowHost &- timelineHost
        phrasePlaybackAnchorHostTime = loopAnchorHostTime
        phraseTimelinePlaybackOffsetSec = 0

        if loopPreparedPCM != nil {
            ensurePhraseGraphConnected(phraseInputFormat: nil)
        } else if let format = loopPreparedFormat {
            ensurePhraseGraphConnected(phraseInputFormat: format)
        }
        if loopPreparedPCM != nil || loopPreparedFormat != nil {
            startPhraseEngineIfNeeded()
            engine.prepare()
            phrasePlayer.play()
        }

        let startCycle = Int(floor(safeTimeline / loopDurationSec))
        applyLoopCyclePitch(cycleIndex: startCycle, scheduleGen: scheduleToken)
        ensureLoopCyclesScheduled(fromCycle: startCycle, throughCycle: startCycle + 2, scheduleGen: scheduleToken)
        startTimeTickerIfNeeded()
    }

    private func resetLoopSessionState() {
        loopSessionActive = false
        loopDurationSec = 0
        loopStartSec = 0
        loopAnchorHostTime = 0
        loopScheduleGen += 1
        scheduledLoopCycles.removeAll()
        loopSemitoneForCycle = nil
        loopPreparedPCM = nil
        loopPreparedLocalFileURL = nil
        loopPreparedFormat = nil
    }

    private func applyLoopCyclePitch(cycleIndex: Int, scheduleGen: Int) {
        guard let semitoneForCycle = loopSemitoneForCycle else { return }
        let semitone = semitoneForCycle(cycleIndex)
        let cycleStartGlobalSec = Double(cycleIndex) * loopDurationSec
        let delaySec = max(0, cycleStartGlobalSec - (loopTimelineSecNowOrNil() ?? 0))
        if delaySec <= 0.001 {
            phrasePitchSemitones = Float(semitone)
            return
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + delaySec) { [weak self] in
            guard let self else { return }
            guard self.loopScheduleGen == scheduleGen else { return }
            self.phrasePitchSemitones = Float(semitone)
        }
    }

    private func ensureLoopCyclesScheduled(fromCycle: Int, throughCycle: Int, scheduleGen: Int) {
        guard loopSessionActive,
              loopScheduleGen == scheduleGen,
              let semitoneForCycle = loopSemitoneForCycle,
              loopAnchorHostTime != 0
        else {
            return
        }

        let ratio = Double(phrasePlaybackSpeedRatio)
        let speedPercent = Int(phrasePlaybackSpeedPercent)

        for cycleIndex in fromCycle...throughCycle {
            if scheduledLoopCycles.contains(cycleIndex) {
                continue
            }

            let cycleStartGlobalSec = Double(cycleIndex) * loopDurationSec
            let elapsedInCycleSec: Double
            if let globalSec = loopTimelineSecNowOrNil() {
                if globalSec < 0 {
                    elapsedInCycleSec = 0
                } else {
                    elapsedInCycleSec = max(0, globalSec - cycleStartGlobalSec)
                }
            } else {
                elapsedInCycleSec = 0
            }
            if elapsedInCycleSec >= loopDurationSec - 1e-6 {
                continue
            }

            let cycleHostOffset = AVAudioTime.hostTime(forSeconds: cycleStartGlobalSec)
            let cycleHost = loopAnchorHostTime &+ cycleHostOffset
            let nowHost = mach_absolute_time()
            let whenHost = nowHost > cycleHost ? nowHost : cycleHost
            let when = AVAudioTime(hostTime: whenHost)

            let bufferOffsetSec = EarTrainingPracticeSpeed.practiceBufferOffsetSec(
                timelineOffsetSec: loopStartSec + elapsedInCycleSec,
                speedPercent: speedPercent
            )
            let playDurationSec = EarTrainingPracticeSpeed.practiceBufferOffsetSec(
                timelineOffsetSec: loopDurationSec - elapsedInCycleSec,
                speedPercent: speedPercent
            )
            guard playDurationSec > 1e-6 else { continue }

            let scheduled = scheduleLoopCycleBuffer(
                bufferOffsetSec: bufferOffsetSec,
                playDurationSec: playDurationSec,
                at: when,
                cycleIndex: cycleIndex,
                scheduleGen: scheduleGen
            )
            if scheduled {
                scheduledLoopCycles.insert(cycleIndex)
                applyLoopCyclePitch(cycleIndex: cycleIndex, scheduleGen: scheduleGen)
            }
        }
    }

    private func scheduleLoopCycleBuffer(
        bufferOffsetSec: Double,
        playDurationSec: Double,
        at when: AVAudioTime,
        cycleIndex: Int,
        scheduleGen: Int
    ) -> Bool {
        if let preparedPCM = loopPreparedPCM, let format = loopPreparedFormat {
            let sampleRate = format.sampleRate
            guard sampleRate > 0 else { return false }
            let startFrame = AVAudioFramePosition(bufferOffsetSec * sampleRate)
            let totalFrames = AVAudioFramePosition(preparedPCM.frameLength)
            let clampedStart = min(max(0, startFrame), max(0, totalFrames - 1))
            let maxPlayFrames = AVAudioFramePosition(playDurationSec * sampleRate)
            let remainingFrames = min(totalFrames - clampedStart, maxPlayFrames)
            guard remainingFrames > 0,
                  let slice = Self.slicePCMBuffer(
                    preparedPCM,
                    startingFrame: clampedStart,
                    frameCount: AVAudioFrameCount(remainingFrames)
                  )
            else {
                return false
            }

            phrasePlayer.scheduleBuffer(
                pcmBufferForOutput(slice),
                at: when,
                options: [],
                completionCallbackType: .dataPlayedBack
            ) { [weak self] _ in
                DispatchQueue.main.async {
                    guard let self else { return }
                    guard self.loopScheduleGen == scheduleGen else { return }
                    self.scheduledLoopCycles.remove(cycleIndex)
                    self.ensureLoopCyclesScheduled(
                        fromCycle: cycleIndex + 1,
                        throughCycle: cycleIndex + 3,
                        scheduleGen: scheduleGen
                    )
                }
            }
            return true
        }

        if let local = loopPreparedLocalFileURL, let file = try? AVAudioFile(forReading: local) {
            let sampleRate = file.processingFormat.sampleRate
            guard sampleRate > 0 else { return false }
            let startFrame = AVAudioFramePosition(bufferOffsetSec * sampleRate)
            let totalFrames = file.length
            let clampedStart = min(max(0, startFrame), max(0, totalFrames - 1))
            let maxPlayFrames = AVAudioFramePosition(playDurationSec * sampleRate)
            let remainingFrames = min(totalFrames - clampedStart, maxPlayFrames)
            guard remainingFrames > 0 else { return false }

            phrasePlayer.scheduleSegment(
                file,
                startingFrame: clampedStart,
                frameCount: AVAudioFrameCount(remainingFrames),
                at: when,
                completionCallbackType: .dataPlayedBack
            ) { [weak self] _ in
                DispatchQueue.main.async {
                    guard let self else { return }
                    guard self.loopScheduleGen == scheduleGen else { return }
                    self.scheduledLoopCycles.remove(cycleIndex)
                    self.ensureLoopCyclesScheduled(
                        fromCycle: cycleIndex + 1,
                        throughCycle: cycleIndex + 3,
                        scheduleGen: scheduleGen
                    )
                }
            }
            return true
        }
        return false
    }

    /// コードヴォイシングバトルのカウントイン（同一 `AVAudioEngine` 上の短いクリック）。
    func playCountInClick() {
        installGraphIfNeeded()
        startPhraseEngineIfNeeded()

        if lastPhraseFormat == nil {
            ensurePhraseGraphConnected()
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
        rebuildEntireGraph(phraseInputFormat: nil, forcedSampleRate: nil, recreateEngine: false)
    }

    /// 現行レートで全ノードを明示フォーマット接続する。
    /// `recreateEngine == true` のときは `AVAudioEngine` と配下ノードをすべて新規生成して
    /// スピーカー＋ReplayKit 切替時の旧レート残留を遮断する。
    private func rebuildEntireGraph(
        phraseInputFormat: AVAudioFormat? = nil,
        forcedSampleRate: Double? = nil,
        recreateEngine: Bool = true
    ) {
        if recreateEngine {
            if engine.isRunning {
                stopSharedPianoBeforePhraseEngineRebuild()
                engine.stop()
            }
            phrasePlayer.stop()
            clickPlayer.stop()
            drumPlayer.stop()
            fireSePlayer.stop()
            engine.reset()

            engine = AVAudioEngine()
            phrasePlayer = AVAudioPlayerNode()
            phraseInputMixer = AVAudioMixerNode()
            phraseTimePitch = AVAudioUnitTimePitch()
            clickPlayer = AVAudioPlayerNode()
            phraseMixer = AVAudioMixerNode()
            drumPlayer = AVAudioPlayerNode()
            drumMixer = AVAudioMixerNode()
            fireSePlayer = AVAudioPlayerNode()
            fireSeMixer = AVAudioMixerNode()
            masterMixer = AVAudioMixerNode()
            limiter = Self.makePeakLimiter()
            rebindEngineConfigObserver()
        }

        let targetRate = forcedSampleRate ?? AudioOutputFormatResolver.resolveSampleRate(engine: engine)
        let outputFormat = AudioOutputFormatResolver.stereoFormat(sampleRate: targetRate)
        let inputFormat = phraseInputFormat ?? outputFormat

        engine.attach(phrasePlayer)
        engine.attach(phraseInputMixer)
        engine.attach(phraseTimePitch)
        engine.attach(clickPlayer)
        engine.attach(phraseMixer)
        engine.attach(drumPlayer)
        engine.attach(drumMixer)
        engine.attach(fireSePlayer)
        engine.attach(fireSeMixer)
        engine.attach(masterMixer)
        engine.attach(limiter)

        _ = engine.outputNode
        engine.connect(phrasePlayer, to: phraseInputMixer, format: inputFormat)
        engine.connect(phraseInputMixer, to: phraseTimePitch, format: outputFormat)
        engine.connect(phraseTimePitch, to: phraseMixer, format: outputFormat)
        engine.connect(clickPlayer, to: phraseMixer, format: outputFormat)
        engine.connect(phraseMixer, to: masterMixer, format: outputFormat)
        engine.connect(drumPlayer, to: drumMixer, format: outputFormat)
        engine.connect(drumMixer, to: masterMixer, format: outputFormat)
        engine.connect(fireSePlayer, to: fireSeMixer, format: outputFormat)
        engine.connect(fireSeMixer, to: masterMixer, format: outputFormat)
        engine.connect(masterMixer, to: limiter, format: outputFormat)
        engine.connect(limiter, to: engine.mainMixerNode, format: outputFormat)
        configurePeakLimiter(limiter)

        activeOutputFormat = outputFormat
        lastPhraseFormat = outputFormat
        lastPhraseInputFormat = inputFormat
        lastDrumFormat = outputFormat
        lastFireSeFormat = outputFormat
        rebuildClickBuffer(for: outputFormat)
        phraseMixer.outputVolume = phraseVolume
        drumMixer.outputVolume = phraseVolume
        fireSeMixer.outputVolume = sfxVolume * Self.fireSeBaseGain
        applyMasterMixerVolume()
        engine.mainMixerNode.outputVolume = 1.0

        isGraphInstalled = true
        applyPhraseTimeStretch()
        reconvertCachedPCMSamplesToOutputFormatIfNeeded()
    }

    private func currentOutputFormat() -> AVAudioFormat {
        if let activeOutputFormat, engine.isRunning {
            let actualRate = engine.outputNode.outputFormat(forBus: 0).sampleRate
            if AudioOutputFormatResolver.sampleRatesMatch(actualRate, activeOutputFormat.sampleRate) {
                return activeOutputFormat
            }
        }
        return AudioOutputFormatResolver.stereoFormat(engine: engine)
    }

    /// 共有 AVAudioSession の現行サンプルレートへフレーズ系ノードを再接続する。
    private func ensurePhraseGraphConnected(phraseInputFormat: AVAudioFormat? = nil) {
        installGraphIfNeeded()

        let outputFormat = currentOutputFormat()
        let inputFormat = phraseInputFormat ?? outputFormat
        if let active = activeOutputFormat,
           !AudioOutputFormatResolver.sampleRatesMatch(active.sampleRate, outputFormat.sampleRate) {
            let wasRunning = engine.isRunning
            let prevMutating = isMutatingGraph
            isMutatingGraph = true
            defer { isMutatingGraph = prevMutating }
            rebuildEntireGraph(phraseInputFormat: inputFormat, forcedSampleRate: outputFormat.sampleRate, recreateEngine: true)
            if wasRunning || isPhraseEngineRunning {
                startPhraseEngineIfNeeded(allowPostStartRetry: false)
            }
            return
        }
        if lastPhraseFormat?.isEqual(outputFormat) == true,
           lastPhraseInputFormat?.isEqual(inputFormat) == true {
            phraseMixer.outputVolume = phraseVolume
            return
        }

        let wasRunning = engine.isRunning
        if wasRunning {
            stopSharedPianoBeforePhraseEngineRebuild()
            engine.stop()
        }

        engine.disconnectNodeInput(phraseMixer)
        engine.disconnectNodeInput(phraseTimePitch)
        engine.disconnectNodeInput(phraseInputMixer)
        engine.connect(phrasePlayer, to: phraseInputMixer, format: inputFormat)
        engine.connect(phraseInputMixer, to: phraseTimePitch, format: outputFormat)
        engine.connect(phraseTimePitch, to: phraseMixer, format: outputFormat)
        engine.connect(clickPlayer, to: phraseMixer, format: outputFormat)

        lastPhraseFormat = outputFormat
        lastPhraseInputFormat = inputFormat
        rebuildClickBuffer(for: outputFormat)
        phraseMixer.outputVolume = phraseVolume
        applyPhraseTimeStretch()

        if wasRunning || isPhraseEngineRunning {
            if AppAudioSession.shared.canStartAudioEngine {
                try? engine.start()
            } else {
                needsEngineResumeOnActive = true
            }
        }
    }

    private var phrasePlaybackSpeedRatio: Float {
        Float(EarTrainingPracticeSpeed.practiceSpeedRatio(Int(phrasePlaybackSpeedPercent)))
    }

    /// OSMD アンカー wall-clock 秒を、速度変更後のフレーズ軸秒へ変換する。
    private func adjustWallClockPhraseTimelineSec(_ wallSec: Double) -> Double {
        max(0, wallSec * Double(phrasePlaybackSpeedRatio))
    }

    private func applyPhraseTimeStretch() {
        let rate = phrasePlaybackSpeedPercent / 100.0
        phraseTimePitch.rate = rate
        // AVAudioUnitTimePitch は rate でテンポ変更してもピッチを独立扱いできるため、
        // 速度補正用の cents は足さない（Varispeed 系の補正を入れると逆に音程がずれる）。
        phraseTimePitch.pitch = phrasePitchSemitones * 100
    }

    private func configurePeakLimiter(_ limiter: AVAudioUnitEffect) {
        let au = limiter.audioUnit
        AudioUnitSetParameter(au, PeakLimiterParameter.preGain, kAudioUnitScope_Global, 0, 0, 0)
        AudioUnitSetParameter(au, PeakLimiterParameter.attackTime, kAudioUnitScope_Global, 0, 0.001, 0)
        AudioUnitSetParameter(au, PeakLimiterParameter.decayTime, kAudioUnitScope_Global, 0, 0.05, 0)
    }

    private func ensureGraph(for format: AVAudioFormat) {
        ensurePhraseGraphConnected(phraseInputFormat: format)
    }

    /// 火炎 SE 用バッファをバンドルから読み込む。失敗してもサイレントで無視する。
    private func prepareFireMagicSeIfNeeded() {
        if fireSePCM != nil { return }
        guard let url = Bundle.main.url(forResource: "fire_magic_1", withExtension: "mp3") else {
            return
        }
        do {
            let file = try AVAudioFile(forReading: url)
            guard file.length > 0 else { return }
            guard let pcm = Self.decodeEntireFile(file: file) else { return }
            ensureFireSeGraph(for: file.processingFormat)
            fireSeSourcePCM = pcm
            fireSePCM = pcmBufferForOutput(pcm)
        } catch {
            // 失敗時は再生コール側で no-op。
        }
    }

    private func ensureFireSeGraph(for _: AVAudioFormat) {
        installGraphIfNeeded()

        let outputFormat = currentOutputFormat()
        if lastFireSeFormat?.isEqual(outputFormat) == true {
            fireSeMixer.outputVolume = sfxVolume * Self.fireSeBaseGain
            return
        }

        let wasRunning = engine.isRunning
        if wasRunning {
            stopSharedPianoBeforePhraseEngineRebuild()
            engine.stop()
        }

        engine.disconnectNodeInput(fireSeMixer)
        engine.connect(fireSePlayer, to: fireSeMixer, format: outputFormat)

        lastFireSeFormat = outputFormat
        fireSeMixer.outputVolume = sfxVolume * Self.fireSeBaseGain

        if wasRunning || isPhraseEngineRunning {
            if AppAudioSession.shared.canStartAudioEngine {
                try? engine.start()
            } else {
                needsEngineResumeOnActive = true
            }
        }
    }

    /// 火炎魔法 SE を発射する。連打抑止 60ms。SFX スライダーに連動した `fireSeMixer` で再生。
    func playFireMagicSe() {
        let now = Self.machSecondsSinceReference() * 1000
        if now - lastFireSePlayMs < Self.fireSeThrottleMs {
            return
        }
        lastFireSePlayMs = now

        prepareFireMagicSeIfNeeded()
        guard let pcm = fireSePCM else { return }
        startPhraseEngineIfNeeded()
        guard engine.isRunning else { return }

        if !fireSePlayer.isPlaying {
            fireSePlayer.play()
        }
        fireSePlayer.scheduleBuffer(pcmBufferForOutput(pcm), at: nil, options: [.interrupts], completionHandler: nil)
    }

    private static func machSecondsSinceReference() -> Double {
        let now = mach_absolute_time()
        let info = machTimebaseInfo
        let nanos = Double(now) * Double(info.numer) / Double(info.denom)
        return nanos / 1_000_000_000
    }

    private func ensureDrumGraph(for _: AVAudioFormat) {
        installGraphIfNeeded()

        let outputFormat = currentOutputFormat()
        if lastDrumFormat?.isEqual(outputFormat) == true {
            drumMixer.outputVolume = phraseVolume
            return
        }

        let wasRunning = engine.isRunning
        if wasRunning {
            stopSharedPianoBeforePhraseEngineRebuild()
            engine.stop()
        }

        engine.disconnectNodeInput(drumMixer)
        engine.connect(drumPlayer, to: drumMixer, format: outputFormat)

        lastDrumFormat = outputFormat
        drumMixer.outputVolume = phraseVolume

        if wasRunning || isPhraseEngineRunning {
            if AppAudioSession.shared.canStartAudioEngine {
                try? engine.start()
            } else {
                needsEngineResumeOnActive = true
            }
        }
    }

    /// フレーズファイル全体を PCM に読み込む（短いドラムループ前提）。
    private static func decodeEntireFile(file: AVAudioFile) -> AVAudioPCMBuffer? {
        let frames = file.length
        guard frames > 0, frames <= Int64(AVAudioFrameCount.max) else { return nil }
        let capacity = AVAudioFrameCount(truncatingIfNeeded: frames)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat, frameCapacity: capacity) else { return nil }
        file.framePosition = 0
        do {
            try file.read(into: buffer)
            return buffer.frameLength > 0 ? buffer : nil
        } catch {
            return nil
        }
    }

    private func startPhraseEngineIfNeeded(allowPostStartRetry: Bool = true) {
        guard !engine.isRunning else { return }
        guard AppAudioSession.shared.canStartAudioEngine else {
            needsEngineResumeOnActive = true
            return
        }
        installGraphIfNeeded()
        do {
            engine.prepare()
            try engine.start()
            isPhraseEngineRunning = true
            needsEngineResumeOnActive = false
            applyPhraseMixerVolumes()
            engine.mainMixerNode.outputVolume = 1.0

            let expectedRate = activeOutputFormat?.sampleRate ?? currentOutputFormat().sampleRate
            if allowPostStartRetry,
               let actualRate = AudioOutputFormatResolver.postStartMismatchedRate(
                   engine: engine,
                   expectedSampleRate: expectedRate
               ) {
                AudioRateDiagnostics.logEngineStart(
                    tag: "EarTraining.start.mismatch",
                    engine: engine,
                    deckSampleRate: expectedRate,
                    bufferSampleRate: lastPhraseInputFormat?.sampleRate,
                    didRetry: false
                )
                let savedInputFormat = lastPhraseInputFormat
                let prevMutating = isMutatingGraph
                isMutatingGraph = true
                rebuildEntireGraph(
                    phraseInputFormat: savedInputFormat,
                    forcedSampleRate: actualRate,
                    recreateEngine: true
                )
                isMutatingGraph = prevMutating
                startPhraseEngineIfNeeded(allowPostStartRetry: false)
                return
            }

            AudioRateDiagnostics.logEngineStart(
                tag: "EarTraining.start",
                engine: engine,
                deckSampleRate: expectedRate,
                bufferSampleRate: lastPhraseInputFormat?.sampleRate,
                didRetry: !allowPostStartRetry
            )
        } catch {
            isPhraseEngineRunning = false
            if AppAudioSession.isCannotStartPlayingError(error) {
                needsEngineResumeOnActive = true
            }
        }
    }

    private func registerLifecycleObservers() {
        let center = NotificationCenter.default
        rebindEngineConfigObserver()
        foregroundObserver = center.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.resumePhraseEngineAfterForeground()
        }
        survivalCaptureObserver = center.addObserver(
            forName: SurvivalGameAudio.didReconfigureAudioGraphNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleExternalReconfigureSignal()
        }
        appAudioSessionObserver = center.addObserver(
            forName: AppAudioSession.didReconfigureNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleExternalReconfigureSignal()
        }
    }

    private func rebindEngineConfigObserver() {
        let center = NotificationCenter.default
        if let existing = engineConfigObserver {
            center.removeObserver(existing)
        }
        engineConfigObserver = center.addObserver(
            forName: .AVAudioEngineConfigurationChange,
            object: engine,
            queue: .main
        ) { [weak self] _ in
            self?.handleEngineConfigurationChange()
        }
    }

    private func handleExternalReconfigureSignal() {
        if isMutatingGraph {
            pendingConfigurationChange = true
            return
        }
        reconfigureAfterScreenCaptureTransition()
    }

    private func schedulePendingConfigurationCheck() {
        pendingConfigurationWorkItem?.cancel()
        let item = DispatchWorkItem { [weak self] in
            guard let self, !self.isMutatingGraph else { return }
            let active = self.isPhraseEngineRunning || self.isDrumLoopActive || self.loopSessionActive
            guard active else { return }
            let expectedRate = self.activeOutputFormat?.sampleRate ?? self.currentOutputFormat().sampleRate
            let mismatch = AudioOutputFormatResolver.postStartMismatchedRate(
                engine: self.engine,
                expectedSampleRate: expectedRate
            ) != nil
            if !self.engine.isRunning || mismatch {
                self.reconfigureAfterScreenCaptureTransition()
            }
        }
        pendingConfigurationWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08, execute: item)
    }

    /// 画面録画 ON/OFF 後、SurvivalGameAudio の共有セッション再構成完了を受けてフレーズエンジンを clean restart する。
    private func reconfigureAfterScreenCaptureTransition() {
        guard !isMutatingGraph else {
            pendingConfigurationChange = true
            return
        }
        let wasPhraseActive = (phrasePlayer.isPlaying || phrasePlaybackAnchorHostTime != 0) && loadedPhraseURL != nil
        let resumeLoop = loopSessionActive
        let loopResumeTimelineSec = resumeLoop ? loopTimelineSecNowOrNil() : nil
        guard isPhraseEngineRunning || isDrumLoopActive || wasPhraseActive || resumeLoop else { return }
        guard AppAudioSession.shared.canStartAudioEngine else {
            needsEngineResumeOnActive = true
            return
        }

        let resumeDrum = isDrumLoopActive
        let resumeTimelineSec = wasPhraseActive
            ? (phraseWallClockTimelineSecNowOrNil() ?? max(0, phraseJudgmentTimelineSecNow()))
            : nil
        let resumePhraseURL = loadedPhraseURL

        isMutatingGraph = true
        pendingConfigurationChange = false
        defer {
            isMutatingGraph = false
            if pendingConfigurationChange {
                pendingConfigurationChange = false
                schedulePendingConfigurationCheck()
            }
        }

        isPhraseEngineRunning = false
        phrasePlaybackAnchorHostTime = 0

        rebuildEntireGraph(phraseInputFormat: nil, forcedSampleRate: nil, recreateEngine: true)
        startPhraseEngineIfNeeded(allowPostStartRetry: true)

        if resumeDrum {
            startDrumLoop()
        }

        if resumeLoop, let loopSec = loopResumeTimelineSec {
            resumeLoopSessionFromTimelineSec(loopSec)
        } else if wasPhraseActive,
                  let url = resumePhraseURL,
                  let offset = resumeTimelineSec,
                  !resumePhrasePlaybackFromOffset(url: url, timelineOffsetSec: offset) {
            NotificationCenter.default.post(
                name: Self.phrasePlaybackSuspendedAfterCaptureNotification,
                object: self
            )
        }
    }

    /// 出力グラフ形式へ PCM を変換する。既に一致していればそのまま返す。
    private func pcmBufferForOutput(_ buffer: AVAudioPCMBuffer) -> AVAudioPCMBuffer {
        let outputFormat = activeOutputFormat ?? currentOutputFormat()
        if buffer.format.isEqual(outputFormat) {
            return buffer
        }
        return Self.convertBuffer(buffer, to: outputFormat) ?? buffer
    }

    /// キャッシュ済み PCM を現行出力レートへ揃える（サンプルレート遷移後の再開用）。
    private func reconvertCachedPCMSamplesToOutputFormatIfNeeded() {
        if let drum = drumSourcePCM {
            drumPCM = pcmBufferForOutput(drum)
        }
        if let fire = fireSeSourcePCM {
            fireSePCM = pcmBufferForOutput(fire)
        }
    }

    /// 画面録画再構成後、同一タイムライン位置からフレーズを再開する。
    @discardableResult
    private func resumePhrasePlaybackFromOffset(url: URL, timelineOffsetSec: Double) -> Bool {
        guard loadedPhraseURL == url else { return false }

        let localURL = activePhraseLocalFileURL ?? cache.cachedLocalFileURLIfPresent(for: url)
        guard let local = localURL else { return false }

        let safeOffset = max(0, timelineOffsetSec)
        let bufferOffsetSec = EarTrainingPracticeSpeed.practiceBufferOffsetSec(
            timelineOffsetSec: safeOffset,
            speedPercent: Int(phrasePlaybackSpeedPercent)
        )
        let scheduleToken = playbackToken

        phraseTimelinePlaybackOffsetSec = safeOffset
        phraseMixer.outputVolume = phraseVolume

        let nowHost = mach_absolute_time()
        let leadHost = AVAudioTime.hostTime(forSeconds: Self.practiceSeekLeadInSec)
        let phraseHost = nowHost &+ leadHost
        let phraseWhen = AVAudioTime(hostTime: phraseHost)
        phrasePlaybackAnchorHostTime = phraseHost

        if let sourcePCM = activePhraseSourcePCM {
            let outputPCM = pcmBufferForOutput(sourcePCM)
            ensurePhraseGraphConnected(phraseInputFormat: outputPCM.format)
            startPhraseEngineIfNeeded()
            engine.prepare()

            let sampleRate = outputPCM.format.sampleRate
            guard sampleRate > 0 else { return false }
            let startFrame = AVAudioFramePosition(bufferOffsetSec * sampleRate)
            let totalFrames = AVAudioFramePosition(outputPCM.frameLength)
            let clampedStart = min(max(0, startFrame), max(0, totalFrames - 1))
            let remainingFrames = totalFrames - clampedStart
            guard remainingFrames > 0,
                  let slice = Self.slicePCMBuffer(
                    outputPCM,
                    startingFrame: clampedStart,
                    frameCount: AVAudioFrameCount(remainingFrames)
                  )
            else {
                return false
            }

            phrasePlayer.play()
            phrasePlayer.scheduleBuffer(
                slice,
                at: phraseWhen,
                options: [],
                completionCallbackType: .dataPlayedBack
            ) { [weak self] _ in
                self?.notifyScheduledPhraseBufferPlaybackEnded(
                    scheduleToken: scheduleToken,
                    restorePhraseMixerVolume: true
                )
            }
            startTimeTickerIfNeeded()
            return true
        }

        ensurePhraseGraphConnected()
        startPhraseEngineIfNeeded()
        engine.prepare()

        if let file = try? AVAudioFile(forReading: local) {
            activePhraseSourcePCM = nil
            ensurePhraseGraphConnected(phraseInputFormat: file.processingFormat)
            let sampleRate = file.processingFormat.sampleRate
            guard sampleRate > 0 else { return false }
            let startFrame = AVAudioFramePosition(bufferOffsetSec * sampleRate)
            let totalFrames = file.length
            let clampedStart = min(max(0, startFrame), max(0, totalFrames - 1))
            let remainingFrames = totalFrames - clampedStart
            guard remainingFrames > 0 else { return false }

            phrasePlayer.play()
            phrasePlayer.scheduleSegment(
                file,
                startingFrame: clampedStart,
                frameCount: AVAudioFrameCount(remainingFrames),
                at: phraseWhen,
                completionCallbackType: .dataPlayedBack
            ) { [weak self] _ in
                self?.notifyScheduledPhraseBufferPlaybackEnded(
                    scheduleToken: scheduleToken,
                    restorePhraseMixerVolume: true
                )
            }
            startTimeTickerIfNeeded()
            return true
        }

        return false
    }

    private func handleEngineConfigurationChange() {
        if isMutatingGraph {
            pendingConfigurationChange = true
            return
        }
        reconfigureAfterScreenCaptureTransition()
    }

    private func resumePhraseEngineAfterForeground() {
        guard isPhraseEngineRunning || needsEngineResumeOnActive else { return }
        guard !engine.isRunning else {
            needsEngineResumeOnActive = false
            return
        }
        guard AppAudioSession.shared.canStartAudioEngine else { return }
        needsEngineResumeOnActive = false
        startPhraseEngineIfNeeded()
        if isDrumLoopActive {
            startDrumLoop()
        }
    }

    private func stopPhrasePlaybackOnly() {
        phraseMixer.outputVolume = phraseVolume
        phrasePlayer.stop()
        clickPlayer.stop()
        stopTimeTicker()
        currentTimeSec = 0
        phrasePlaybackAnchorHostTime = 0
    }

    private func schedulePhrase(
        file: AVAudioFile,
        scheduleToken: Int,
        onStarted: (() -> Void)?,
        phraseMuted: Bool = false
    ) {
        startPhraseEngineIfNeeded()

        phrasePlayer.stop()
        currentTimeSec = 0
        phrasePlaybackAnchorHostTime = 0

        if phraseMuted {
            phraseMixer.outputVolume = 0
        }

        phrasePlayer.scheduleFile(file, at: nil, completionCallbackType: .dataPlayedBack) { [weak self] _ in
            self?.notifyScheduledPhraseBufferPlaybackEnded(
                scheduleToken: scheduleToken,
                restorePhraseMixerVolume: true
            )
        }

        phrasePlayer.play()
        phrasePlaybackAnchorHostTime = mach_absolute_time()
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

    /// 事前デコード済み PCM をファイル頭から即再生する（`schedulePhrase` の PCM 版）。
    private func schedulePhraseBuffer(
        _ buffer: AVAudioPCMBuffer,
        scheduleToken: Int,
        onStarted: (() -> Void)?,
        phraseMuted: Bool = false
    ) {
        let outputPCM = pcmBufferForOutput(buffer)
        ensurePhraseGraphConnected(phraseInputFormat: outputPCM.format)
        startPhraseEngineIfNeeded()

        phrasePlayer.stop()
        currentTimeSec = 0
        phrasePlaybackAnchorHostTime = 0

        if phraseMuted {
            phraseMixer.outputVolume = 0
        }

        engine.prepare()

        phrasePlayer.scheduleBuffer(
            outputPCM,
            at: nil,
            options: [],
            completionCallbackType: .dataPlayedBack
        ) { [weak self] _ in
            self?.notifyScheduledPhraseBufferPlaybackEnded(
                scheduleToken: scheduleToken,
                restorePhraseMixerVolume: true
            )
        }

        phrasePlayer.play()
        phrasePlaybackAnchorHostTime = mach_absolute_time()
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

    /// フレーズ MP3 バッファ再生完了。タイムラインは `stopPhrase()` まで継続する。
    private func notifyScheduledPhraseBufferPlaybackEnded(
        scheduleToken: Int,
        restorePhraseMixerVolume: Bool
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard self.playbackToken == scheduleToken else { return }
            if restorePhraseMixerVolume {
                self.phraseMixer.outputVolume = self.phraseVolume
            }
            self.onEnded?()
        }
    }

    private func emitPhraseTimeIfPlaying() {
        if loopSessionActive, let loopSec = loopTimelineSecNowOrNil() {
            currentTimeSec = loopSec
            onTimeUpdate?(loopSec)
            return
        }
        if isDrumLoopActive, drumLoopAnchorHostTime != 0, !phrasePlayer.isPlaying {
            let sec = Self.secondsFromMachHostDifference(from: drumLoopAnchorHostTime, to: mach_absolute_time())
            guard sec.isFinite else { return }
            currentTimeSec = max(0, sec)
            onTimeUpdate?(currentTimeSec)
            return
        }
        if let wallSec = phraseWallClockTimelineSecNowOrNil() {
            currentTimeSec = wallSec
            onTimeUpdate?(wallSec)
            return
        }
        guard phrasePlayer.isPlaying else { return }
        let anchor = phrasePlaybackAnchorHostTime
        if anchor != 0 {
            let now = mach_absolute_time()
            if now < anchor {
                if emitNegativePhraseTimelineBeforeAnchor {
                    let sec = -Self.secondsFromMachHostDifference(from: now, to: anchor)
                    guard sec.isFinite else { return }
                    currentTimeSec = sec
                    onTimeUpdate?(sec)
                } else {
                    currentTimeSec = 0
                }
                return
            }
            let sec = Self.secondsFromMachHostDifference(from: anchor, to: now)
            guard sec.isFinite else { return }
            currentTimeSec = adjustWallClockPhraseTimelineSec(sec)
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

    /// ノートオンなど、ティッカー待ちなしでフレーズ軸の秒を取得する（カウントイン中は負になり得る）。
    func phraseJudgmentTimelineSecNow() -> Double {
        if isDrumLoopActive, drumLoopAnchorHostTime != 0, !phrasePlayer.isPlaying {
            let sec = Self.secondsFromMachHostDifference(from: drumLoopAnchorHostTime, to: mach_absolute_time())
            return sec.isFinite ? max(0, sec) : currentTimeSec
        }
        guard phrasePlayer.isPlaying else {
            return currentTimeSec
        }
        let anchor = phrasePlaybackAnchorHostTime
        if anchor != 0 {
            let now = mach_absolute_time()
            if now < anchor {
                if emitNegativePhraseTimelineBeforeAnchor {
                    let sec = -Self.secondsFromMachHostDifference(from: now, to: anchor)
                    return sec.isFinite ? sec : currentTimeSec
                }
                return 0
            }
            let sec = Self.secondsFromMachHostDifference(from: anchor, to: now)
            guard sec.isFinite else { return currentTimeSec }
            return adjustWallClockPhraseTimelineSec(sec)
        }
        guard let nodeTime = phrasePlayer.lastRenderTime,
              let playerTime = phrasePlayer.playerTime(forNodeTime: nodeTime)
        else {
            return currentTimeSec
        }
        let sec = Double(playerTime.sampleTime) / playerTime.sampleRate
        guard sec.isFinite else { return currentTimeSec }
        return max(0, sec)
    }

    /// WEB `getPhraseTimelineSec()` 相当。判定可能なフレーズ軸が未確立なら `nil`。
    func phraseJudgmentTimelineSecNowOrNil() -> Double? {
        if isDrumLoopActive, drumLoopAnchorHostTime != 0, !phrasePlayer.isPlaying {
            let sec = Self.secondsFromMachHostDifference(from: drumLoopAnchorHostTime, to: mach_absolute_time())
            return sec.isFinite ? max(0, sec) : nil
        }
        guard phrasePlayer.isPlaying else {
            return nil
        }
        let anchor = phrasePlaybackAnchorHostTime
        if anchor != 0 {
            let now = mach_absolute_time()
            if now < anchor {
                if emitNegativePhraseTimelineBeforeAnchor {
                    let sec = -Self.secondsFromMachHostDifference(from: now, to: anchor)
                    return sec.isFinite ? sec : nil
                }
                return 0
            }
            let sec = Self.secondsFromMachHostDifference(from: anchor, to: now)
            guard sec.isFinite else { return nil }
            return adjustWallClockPhraseTimelineSec(sec)
        }
        guard let nodeTime = phrasePlayer.lastRenderTime,
              let playerTime = phrasePlayer.playerTime(forNodeTime: nodeTime)
        else {
            return nil
        }
        let sec = Double(playerTime.sampleTime) / playerTime.sampleRate
        guard sec.isFinite else { return nil }
        return max(0, sec)
    }

    /// MIDI パケット host time からフレーズタイムライン秒を推定（ハンドラ遅延よりパケット時刻を優先）。
    func phraseTimelineSecFromMidiHostTime(_ midiHostTime: UInt64) -> Double? {
        guard let wallNow = phraseWallClockTimelineSecNowOrNil() else { return nil }
        let delta = Self.secondsFromMachHostDifference(from: midiHostTime, to: mach_absolute_time())
        guard delta.isFinite else { return nil }
        return wallNow - delta
    }

    /// OSMD バトル用。WEB `getPhraseTimelineSec()` と同じ wall-clock 秒（スケール済みターゲット時刻と整合）。
    func phraseWallClockTimelineSecNowOrNil() -> Double? {
        if loopSessionActive, let loopSec = loopTimelineSecNowOrNil() {
            return loopSec + phraseTimelinePlaybackOffsetSec
        }
        if isDrumLoopActive, drumLoopAnchorHostTime != 0, !phrasePlayer.isPlaying {
            let sec = Self.secondsFromMachHostDifference(from: drumLoopAnchorHostTime, to: mach_absolute_time())
            return sec.isFinite ? max(0, sec) + phraseTimelinePlaybackOffsetSec : nil
        }
        guard phrasePlayer.isPlaying else {
            if phrasePlaybackAnchorHostTime != 0 {
                let now = mach_absolute_time()
                if now >= phrasePlaybackAnchorHostTime {
                    let sec = Self.secondsFromMachHostDifference(from: phrasePlaybackAnchorHostTime, to: now)
                    guard sec.isFinite else { return nil }
                    return sec + phraseTimelinePlaybackOffsetSec
                }
            }
            return phraseTimelinePlaybackOffsetSec > 0 ? phraseTimelinePlaybackOffsetSec : nil
        }
        let anchor = phrasePlaybackAnchorHostTime
        if anchor != 0 {
            let now = mach_absolute_time()
            if now < anchor {
                if emitNegativePhraseTimelineBeforeAnchor {
                    let sec = -Self.secondsFromMachHostDifference(from: now, to: anchor)
                    return sec.isFinite ? sec + phraseTimelinePlaybackOffsetSec : nil
                }
                return phraseTimelinePlaybackOffsetSec
            }
            let sec = Self.secondsFromMachHostDifference(from: anchor, to: now)
            guard sec.isFinite else { return nil }
            return sec + phraseTimelinePlaybackOffsetSec
        }
        guard let nodeTime = phrasePlayer.lastRenderTime,
              let playerTime = phrasePlayer.playerTime(forNodeTime: nodeTime)
        else {
            return nil
        }
        let sec = Double(playerTime.sampleTime) / playerTime.sampleRate
        guard sec.isFinite else { return nil }
        return max(0, sec) + phraseTimelinePlaybackOffsetSec
    }

    /// 精密モード練習用: カウントインなしで任意位置から再生。`preparePhraseForImmediatePlayback` 済みであること。
    func playPreparedPhraseFromTimelineOffset(
        url: URL,
        timelineOffsetSec: Double,
        onPhraseStarted: (() -> Void)? = nil
    ) -> Bool {
        guard preparedForImmediatePlaybackURL == url,
              loadedPhraseURL == url
        else {
            return false
        }

        let safeOffset = max(0, timelineOffsetSec)
        let bufferOffsetSec = EarTrainingPracticeSpeed.practiceBufferOffsetSec(
            timelineOffsetSec: safeOffset,
            speedPercent: Int(phrasePlaybackSpeedPercent)
        )
        let scheduleToken = playbackToken
        stopPhrasePlaybackOnly()

        phraseTimelinePlaybackOffsetSec = safeOffset

        let nowHost = mach_absolute_time()
        let leadHost = AVAudioTime.hostTime(forSeconds: Self.practiceSeekLeadInSec)
        let phraseHost = nowHost &+ leadHost
        let phraseWhen = AVAudioTime(hostTime: phraseHost)
        phrasePlaybackAnchorHostTime = phraseHost

        if let preparedPCM = preparedPhrasePCM {
            activePhraseSourcePCM = preparedPCM
            let outputPCM = pcmBufferForOutput(preparedPCM)
            ensurePhraseGraphConnected(phraseInputFormat: outputPCM.format)
            startPhraseEngineIfNeeded()
            engine.prepare()

            let sampleRate = outputPCM.format.sampleRate
            guard sampleRate > 0 else { return false }
            let startFrame = AVAudioFramePosition(bufferOffsetSec * sampleRate)
            let totalFrames = AVAudioFramePosition(outputPCM.frameLength)
            let clampedStart = min(max(0, startFrame), max(0, totalFrames - 1))
            let remainingFrames = totalFrames - clampedStart
            guard remainingFrames > 0,
                  let slice = Self.slicePCMBuffer(
                    outputPCM,
                    startingFrame: clampedStart,
                    frameCount: AVAudioFrameCount(remainingFrames)
                  )
            else {
                return false
            }

            phrasePlayer.play()
            phrasePlayer.scheduleBuffer(
                slice,
                at: phraseWhen,
                options: [],
                completionCallbackType: .dataPlayedBack
            ) { [weak self] _ in
                DispatchQueue.main.async {
                    guard let self else { return }
                    guard self.playbackToken == scheduleToken else { return }
                    self.phraseTimelinePlaybackOffsetSec = 0
                    self.phrasePlaybackAnchorHostTime = 0
                    self.stopTimeTicker()
                    self.phrasePlayer.stop()
                    self.onEnded?()
                }
            }
        } else if let local = preparedLocalFileURL, let file = try? AVAudioFile(forReading: local) {
            activePhraseSourcePCM = nil
            ensurePhraseGraphConnected(phraseInputFormat: file.processingFormat)
            startPhraseEngineIfNeeded()
            engine.prepare()

            let sampleRate = file.processingFormat.sampleRate
            guard sampleRate > 0 else { return false }
            let startFrame = AVAudioFramePosition(bufferOffsetSec * sampleRate)
            let totalFrames = file.length
            let clampedStart = min(max(0, startFrame), max(0, totalFrames - 1))
            let remainingFrames = totalFrames - clampedStart
            guard remainingFrames > 0 else { return false }

            phrasePlayer.play()
            phrasePlayer.scheduleSegment(
                file,
                startingFrame: clampedStart,
                frameCount: AVAudioFrameCount(remainingFrames),
                at: phraseWhen,
                completionCallbackType: .dataPlayedBack
            ) { [weak self] _ in
                DispatchQueue.main.async {
                    guard let self else { return }
                    guard self.playbackToken == scheduleToken else { return }
                    self.phraseTimelinePlaybackOffsetSec = 0
                    self.phrasePlaybackAnchorHostTime = 0
                    self.stopTimeTicker()
                    self.phrasePlayer.stop()
                    self.onEnded?()
                }
            }
        } else {
            return false
        }

        startTimeTickerIfNeeded()
        onPhraseStarted?()
        return true
    }

    private static func slicePCMBuffer(
        _ buffer: AVAudioPCMBuffer,
        startingFrame: AVAudioFramePosition,
        frameCount: AVAudioFrameCount
    ) -> AVAudioPCMBuffer? {
        guard frameCount > 0 else { return nil }
        let format = buffer.format
        guard let slice = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return nil }
        slice.frameLength = frameCount

        let channelCount = Int(format.channelCount)
        let start = Int(startingFrame)
        let count = Int(frameCount)
        guard start >= 0, start + count <= Int(buffer.frameLength) else { return nil }

        for channel in 0..<channelCount {
            guard let source = buffer.floatChannelData?[channel],
                  let destination = slice.floatChannelData?[channel]
            else {
                return nil
            }
            destination.update(from: source.advanced(by: start), count: count)
        }
        return slice
    }

    /// 一時停止（呼び出し側がタイムライン秒を保存すること）。
    func pausePhrasePlayback() {
        playbackToken += 1
        loopScheduleGen += 1
        scheduledLoopCycles.removeAll()
        phrasePlayer.stop()
        clickPlayer.stop()
        stopTimeTicker()
        phrasePlaybackAnchorHostTime = 0
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
        clickPCM = Self.loadDrumstickClickBuffer(for: format, peakAmplitude: 0.28)
        clickPCMFirstBeat = Self.loadDrumstickClickBuffer(for: format, peakAmplitude: 0.55)
    }

    private static func loadDrumstickClickBuffer(for format: AVAudioFormat, peakAmplitude: Double) -> AVAudioPCMBuffer? {
        guard let url = Bundle.main.url(forResource: "drumstick-count", withExtension: "mp3") else {
            return nil
        }
        guard let file = try? AVAudioFile(forReading: url),
              let decoded = decodeEntireFile(file: file),
              let scaled = scaleBuffer(decoded, peakAmplitude: peakAmplitude) else {
            return nil
        }
        if scaled.format.isEqual(format) {
            return scaled
        }
        return convertBuffer(scaled, to: format)
    }

    private static func scaleBuffer(_ source: AVAudioPCMBuffer, peakAmplitude: Double) -> AVAudioPCMBuffer? {
        guard let copy = AVAudioPCMBuffer(pcmFormat: source.format, frameCapacity: source.frameLength) else {
            return nil
        }
        copy.frameLength = source.frameLength
        guard let srcData = source.floatChannelData,
              let dstData = copy.floatChannelData else {
            return nil
        }
        let channels = Int(source.format.channelCount)
        let frames = Int(source.frameLength)
        let gain = Float(peakAmplitude)
        for ch in 0..<channels {
            let src = srcData[ch]
            let dst = dstData[ch]
            for i in 0..<frames {
                dst[i] = src[i] * gain
            }
        }
        return copy
    }

    static func convertBuffer(_ source: AVAudioPCMBuffer, to format: AVAudioFormat) -> AVAudioPCMBuffer? {
        guard source.frameLength > 0,
              source.format.sampleRate > 0,
              format.sampleRate > 0
        else {
            return nil
        }
        if source.format.isEqual(format) {
            return source
        }
        guard let converter = AVAudioConverter(from: source.format, to: format) else {
            return nil
        }
        converter.sampleRateConverterQuality = AVAudioQuality.max.rawValue
        let ratio = format.sampleRate / source.format.sampleRate
        let outCapacity = AVAudioFrameCount(ceil(Double(source.frameLength) * ratio)) + 64
        guard let output = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: outCapacity) else {
            return nil
        }

        var error: NSError?
        var consumed = false
        let inputBlock: AVAudioConverterInputBlock = { _, outStatus in
            if consumed {
                outStatus.pointee = .endOfStream
                return nil
            }
            consumed = true
            outStatus.pointee = .haveData
            return source
        }

        let firstStatus = converter.convert(to: output, error: &error, withInputFrom: inputBlock)
        if error != nil { return nil }
        if firstStatus == .error { return nil }
        if firstStatus == .endOfStream {
            guard output.frameLength > 0 else { return nil }
            return output
        }
        guard firstStatus == .haveData else { return nil }

        var written = Int(output.frameLength)
        guard let chunk = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: 4096) else {
            return nil
        }

        while true {
            chunk.frameLength = 0
            let status = converter.convert(to: chunk, error: &error, withInputFrom: inputBlock)
            if error != nil { return nil }
            if status == .error { return nil }

            let count = Int(chunk.frameLength)
            if count > 0 {
                let capacity = Int(output.frameCapacity)
                let toCopy = min(count, max(0, capacity - written))
                if toCopy == 0 { break }
                guard let dst = output.floatChannelData, let src = chunk.floatChannelData else { return nil }
                let channels = Int(format.channelCount)
                for ch in 0..<channels {
                    dst[ch].advanced(by: written).update(from: src[ch], count: toCopy)
                }
                written += toCopy
            }

            if status == .endOfStream { break }
            if status != .haveData { break }
        }

        guard written > 0 else { return nil }
        output.frameLength = AVAudioFrameCount(written)
        return output
    }

    // MARK: - Piano bridge (Survival サンプラー再利用)

    func pianoNoteOn(midi: Int, velocity: Int = 100) {
        SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: midi, velocity: velocity)
    }

    func pianoNoteOff(midi: Int) {
        SurvivalGameAudio.shared.pianoNoteOffRealtime(midi: midi)
    }

    func pianoNoteOnRealtime(midi: Int, velocity: Int) {
        SurvivalGameAudio.shared.pianoNoteOnRealtime(midi: midi, velocity: velocity)
    }

    func pianoNoteOffRealtime(midi: Int) {
        SurvivalGameAudio.shared.pianoNoteOffRealtime(midi: midi)
    }
}

