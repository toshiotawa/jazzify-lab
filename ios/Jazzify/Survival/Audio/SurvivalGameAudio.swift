import Foundation
import AVFoundation
import AudioToolbox
import UIKit

/// アプリ同梱 SF2（`public/UprightPianoKW-small-bright-20190703.sf2` と同一）
private let kPianoSoundBankResourceName = "UprightPianoKW-small-bright-20190703"
/// GM program: Acoustic Grand Piano
private let kRootBlendGrandProgram: UInt8 = 0
/// GM program: Electric Piano 1 (Rhodes)
private let kRootBlendElectricProgram: UInt8 = 4
/// GM 正解ルートの再生オクターブシフト（呼び出し側は C2 起点 MIDI、そのまま C2 で再生）
private let kRootBassPlaybackOctaveShift = 0
/// GM 正解ルートに +12 MIDI を重ねるときのベロシティ（グランド / エレピ）
private let kRootGmOctaveVelGrand: UInt8 = 54
private let kRootGmOctaveVelElectric: UInt8 = 46
private let kRootGmOctaveVelGrandSpeaker: UInt8 = 68
private let kRootGmOctaveVelElectricSpeaker: UInt8 = 58

private func survivalAudioRouteUsesBuiltInSpeaker() -> Bool {
    AVAudioSession.sharedInstance().currentRoute.outputs.contains { $0.portType == .builtInSpeaker }
}

/// サバイバル ゲーム画面専用の軽量オーディオマネージャ。
/// - AVAudioEngine + AVAudioUnitSampler で SE 用 MIDI ノート再生（内蔵音色）
/// - 鍵盤 / 正解ルートは同梱 SF2 を `loadSoundBankInstrument` でゲーム開始前に 1 回ロード
/// - 正解ルート音は専用 `rootBassMixer` にアコースティックピアノ+エレピ
///   （別系統の `AVAudioUnitSampler` ×2）を再生する。ロード失敗時は無音
/// - BGM はステージ種別ごとの 1 URL を `AVQueuePlayer + AVPlayerLooper` でループ再生
/// - SE (my_attack / enemy_attack / stage_clear / stage_gameover) は内蔵サンプラーで簡易再生
final class SurvivalGameAudio {
    static let shared = SurvivalGameAudio()

    /// SE 種別 (WEB 版 `FantasySoundManager` の代表ケース)
    enum SoundEffect {
        case myAttack
        case enemyAttack
        case hit
        case damage
        case stageClear
        case stageGameOver
        case itemPickup
        case magicCast
    }

    // MARK: - Stored

    private let engine = AVAudioEngine()
    /// SFX (攻撃・被弾・ステージクリア等) 用サンプラー。`sfxMixer` 経由で音量制御される。
    private let sampler = AVAudioUnitSampler()
    /// 鍵盤サステイン用: 同梱 SF2 のアコースティックピアノ（`pianoMixer` 経由、低遅延）
    private let keyboardGrandSampler = AVAudioUnitSampler()
    private var keyboardGMReady = false
    private var keyboardGMLoadAttempted = false
    /// `start()` 完了後に鍵盤発音可能。SF2 ロード完了を示す。
    private var isPianoPrepared = false
    /// 同梱ピアノ SF2 の Bundle URL（初回解決後キャッシュ）
    private var pianoSoundBankURL: URL?
    /// SFX 音量を独立制御するためのミキサー (main mixer の手前に挟む)。
    private let sfxMixer = AVAudioMixerNode()
    /// ピアノ音量を独立制御するためのミキサー (main mixer の手前に挟む)。
    private let pianoMixer = AVAudioMixerNode()
    private let rootBassMixer = AVAudioMixerNode()
    /// 正解ルート用: 同梱 SF2 のアコースティックピアノ（メイン鍵盤とは別系統）
    private let rootGrandSampler = AVAudioUnitSampler()
    /// 正解ルート用: エレピ（GM electric_piano_1）を薄く重ねる
    private let rootElectricSampler = AVAudioUnitSampler()
    /// `rootGrandSampler` の SF2 ロード成功（エレピは任意）
    private var rootBlendGMReady = false
    private var rootBlendElectricReady = false
    private var rootBlendGMLoadAttempted = false
    private var isEngineStarted = false
    /// `stop()` 中 / 停止後のフラグ。MIDI コールバック (背景スレッド) から
    /// `pianoNoteOnRealtime` が遅延で飛んできた際に停止済みエンジン操作を
    /// 完全に遮断するための二重ガード。
    private var isStopping: Bool = false
    /// 風船破裂 SE (`Balloon.mp3`) の同時再生用プレイヤー。
    private var balloonPopPlayers: [AVAudioPlayer] = []

    private let bgmPlayer = AVQueuePlayer()
    private var bgmLooper: AVPlayerLooper?
    private var bgmUrl: URL?
    private var currentBgmUrl: URL?

    private let userDefaults = UserDefaults.standard
    private let sfxVolumeKey = "survival_game_sfx_volume_v1"
    private let bgmVolumeKey = "survival_game_bgm_volume_v1"
    private let pianoVolumeKey = "survival_game_piano_volume_v1"
    private let mutedKey = "survival_game_audio_mute_v1"
    private let defaultSfxVolume: Float = 0.7
    private let defaultBgmVolume: Float = 0.3
    private let defaultPianoVolume: Float = 0.8

    private var interruptionObserver: NSObjectProtocol?
    private var engineConfigObserver: NSObjectProtocol?
    private var foregroundObserver: NSObjectProtocol?

    private init() {
        engine.attach(sampler)
        engine.attach(sfxMixer)
        engine.attach(pianoMixer)
        engine.attach(rootGrandSampler)
        engine.attach(rootElectricSampler)
        engine.attach(keyboardGrandSampler)
        engine.attach(rootBassMixer)
        engine.connect(sampler, to: sfxMixer, format: nil)
        engine.connect(sfxMixer, to: engine.mainMixerNode, format: nil)
        engine.connect(keyboardGrandSampler, to: pianoMixer, format: nil)
        engine.connect(pianoMixer, to: engine.mainMixerNode, format: nil)
        // 正解ルート音 (シンセ) は専用ミキサー経由にし、ピアノ音量に影響されない独立音量制御にする。
        // Web 版 `FantasySoundManager._playRootNote` の master gain (0.3 + effectiveVolume * 0.7)
        // 相当をここで再現する (`applyVolumesToNodes` で反映)。
        engine.connect(rootGrandSampler, to: rootBassMixer, format: nil)
        engine.connect(rootElectricSampler, to: rootBassMixer, format: nil)
        engine.connect(rootBassMixer, to: engine.mainMixerNode, format: nil)
        bgmPlayer.actionAtItemEnd = .advance
        registerLifecycleObservers()
    }

    // MARK: - Public API

    /// ゲーム画面の onAppear で呼ぶ。オーディオセッション + (任意で) BGM 起動。
    /// - Parameter playBackgroundMusic: false にすると BGM 起動をスキップする。耳コピバトルなど
    ///   フレーズ MP3 を主役に流すモードで使用する。
    func start(playBackgroundMusic: Bool = true) {
        configureAudioSession()
        // `preparePianoIfNeeded()` 内でも engine を起動する。下の呼び出しは冪等ガードのため二重でも安全。
        preparePianoIfNeeded()
        startEngineIfNeeded()
        if playBackgroundMusic {
            playBgm()
        } else {
            stopBgm()
        }
    }

    /// ゲーム画面の onDisappear で呼ぶ。BGM / エンジンを停止
    func stop() {
        // 最初に isStopping を立てて以降の新規 noteOn を遮断する。
        // MIDI コールバック (背景スレッド) がこの直後に `pianoNoteOnRealtime` を呼んでも
        // `isStopping` / `isEngineStarted` で早期 return する。
        isStopping = true
        stopBgm()
        stopAllKeyboardNotes()
        // 遅延コールバック (arpeggio / stopNote) がまだキューに残っていても、
        // `isEngineStarted == false` により `sampler` 操作をスキップさせる。
        isEngineStarted = false
        if engine.isRunning {
            engine.stop()
        }
    }

    /// 鍵盤用 SF2 の準備 + エンジン起動。初回のみ `isPianoPrepared` を立てる。
    private func preparePianoIfNeeded() {
        guard !isPianoPrepared else {
            isStopping = false
            return
        }

        isStopping = false

        configureAudioSession()
        startEngineIfNeeded()
        prepareKeyboardGMBankIfNeeded()

        isPianoPrepared = keyboardGMReady
    }

    /// ステージ種別から BGM URL を注入 (未指定時はランダムステージ用デフォルト URL を維持)
    func setBgmUrl(_ url: URL?) {
        bgmUrl = url ?? SurvivalBgmDefaults.randomURL
        // 既に再生中なら即時反映
        if currentBgmUrl != nil {
            playBgm()
        }
    }

    var isMuted: Bool {
        userDefaults.bool(forKey: mutedKey)
    }

    @discardableResult
    func toggleMuted() -> Bool {
        let newValue = !isMuted
        userDefaults.set(newValue, forKey: mutedKey)
        applyVolumesToNodes()
        return newValue
    }

    func setMuted(_ muted: Bool) {
        guard muted != isMuted else { return }
        userDefaults.set(muted, forKey: mutedKey)
        applyVolumesToNodes()
    }

    /// 保存されている SFX 音量 (0.0 - 1.0)。ミュート中でも保存値をそのまま返す。
    var sfxVolume: Float {
        if userDefaults.object(forKey: sfxVolumeKey) == nil { return defaultSfxVolume }
        return max(0, min(1, userDefaults.float(forKey: sfxVolumeKey)))
    }

    /// 保存されている BGM 音量 (0.0 - 1.0)。
    var bgmVolume: Float {
        if userDefaults.object(forKey: bgmVolumeKey) == nil { return defaultBgmVolume }
        return max(0, min(1, userDefaults.float(forKey: bgmVolumeKey)))
    }

    /// 保存されているピアノ音量 (0.0 - 1.0)。
    /// 鍵盤タップ音 / 正解時のルート音に適用される。
    var pianoVolume: Float {
        if userDefaults.object(forKey: pianoVolumeKey) == nil { return defaultPianoVolume }
        return max(0, min(1, userDefaults.float(forKey: pianoVolumeKey)))
    }

    /// SFX 音量を設定。ミュート中でも保存値は更新し、再生音量はミュート解除時に反映される。
    func setSfxVolume(_ volume: Float) {
        let v = max(0, min(1, volume))
        userDefaults.set(v, forKey: sfxVolumeKey)
        applyVolumesToNodes()
    }

    /// BGM 音量を設定。
    func setBgmVolume(_ volume: Float) {
        let v = max(0, min(1, volume))
        userDefaults.set(v, forKey: bgmVolumeKey)
        applyVolumesToNodes()
    }

    /// ピアノ音量を設定。
    func setPianoVolume(_ volume: Float) {
        let v = max(0, min(1, volume))
        userDefaults.set(v, forKey: pianoVolumeKey)
        applyVolumesToNodes()
    }

    /// 指定 MIDI ノートを短時間再生する。
    /// - Parameter asPiano: `true` のときはピアノサンプラー (ピアノ音量) で鳴らす。
    ///   `false` (デフォルト) は SFX サンプラー (AVAudioUnitSampler / 内蔵音色) で鳴らし、
    ///   効果音音量スライダーに従う。
    func playNote(_ note: Int, velocity: Int = 90, duration: TimeInterval = 0.5, asPiano: Bool = false) {
        guard !isStopping else { return }
        if asPiano {
            pianoOneShot(midi: note, duration: duration, velocity: velocity)
            return
        }
        startEngineIfNeeded()
        guard isEngineStarted, engine.isRunning else { return }
        let clamped = UInt8(max(0, min(127, note)))
        let vel = UInt8(max(1, min(127, velocity)))
        sampler.startNote(clamped, withVelocity: vel, onChannel: 0)
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) { [weak self] in
            guard let self, self.isEngineStarted, self.engine.isRunning else { return }
            self.sampler.stopNote(clamped, onChannel: 0)
        }
    }

    /// ピアノ音の発音を開始する (サステイン)。`pianoNoteOff` が呼ばれるまで鳴り続ける。
    func pianoNoteOn(midi: Int, velocity: Int = 100) {
        guard !isStopping else { return }
        preparePianoIfNeeded()
        pianoNoteOnRealtime(midi: midi, velocity: velocity)
    }

    func pianoChordOn(midis: [Int], velocity: Int = 100) {
        guard !isStopping else { return }
        preparePianoIfNeeded()
        guard isEngineStarted, engine.isRunning, keyboardGMReady else { return }
        var seen = Set<Int>()
        for midi in midis {
            let clamped = max(0, min(127, midi))
            guard seen.insert(clamped).inserted else { continue }
            performKeyboardNoteOn(midi: clamped, velocity: velocity)
        }
    }

    /// ピアノ音の発音を停止する。
    func pianoNoteOff(midi: Int) {
        pianoNoteOffRealtime(midi: midi)
    }

    /// 鍵盤の低遅延経路 (任意スレッドから呼び出し可)。内蔵 GM の `startNote` を同期で叩く。
    /// - 前提: ゲーム開始時の `start()` にて engine 起動済み。
    func pianoNoteOnRealtime(midi: Int, velocity: Int) {
        guard !isStopping, isEngineStarted, engine.isRunning else { return }
        prepareKeyboardGMBankIfNeeded()
        guard keyboardGMReady else { return }
        performKeyboardNoteOn(midi: midi, velocity: velocity)
    }

    func pianoNoteOffRealtime(midi: Int) {
        guard keyboardGMReady else { return }
        performKeyboardNoteOff(midi: midi)
    }

    /// ピアノ音を短時間だけ鳴らす (鍵盤プレビュー等のワンショット)。
    func pianoOneShot(midi: Int, duration: TimeInterval = 0.45, velocity: Int = 95) {
        guard !isStopping else { return }
        preparePianoIfNeeded()
        pianoNoteOnRealtime(midi: midi, velocity: velocity)
        let clampedDuration = max(0.1, min(0.6, duration))
        let midiCopy = max(0, min(127, midi))
        DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + clampedDuration) { [weak self] in
            self?.performKeyboardNoteOff(midi: midiCopy)
        }
    }

    /// コード正解時のルート音。同梱 SF2 のピアノ+エレピ混合を再生する。ロード失敗時は無音。
    /// - Parameter midi: ルート音のピッチクラス (0=C) を C2 起点で渡す MIDI ノート番号。そのまま再生する。
    func playSynthBassRoot(midi: Int) {
        guard !isStopping else { return }
        startEngineIfNeeded()
        guard isEngineStarted, engine.isRunning else { return }

        let shifted = midi + kRootBassPlaybackOctaveShift
        let clamped = max(0, min(127, shifted))
        prepareRootBlendGMBankIfNeeded()

        _ = playRootGMBlendOneShot(midi: clamped)

        // 三角波フォールバックは使わない。
        // GM が鳴らないなら、安っぽいサイン波を鳴らすより無音の方がマシ。
    }

    /// 風船ラッシュ: 破裂 SE（小さめ音量）。
    func playBalloonPop() {
        guard !isStopping else { return }
        guard let url = Bundle.main.url(forResource: "Balloon", withExtension: "mp3") else { return }
        do {
            let player = try AVAudioPlayer(contentsOf: url)
            let base: Float = 0.23
            player.volume = isMuted ? 0 : base * effectiveSfxVolume()
            player.prepareToPlay()
            player.play()
            balloonPopPlayers.append(player)
            balloonPopPlayers.removeAll { !$0.isPlaying }
        } catch {
            // 無音動作
        }
    }

    /// 正解ルート用 SF2 楽器をロードする（1 回のみ試行）。
    private func prepareRootBlendGMBankIfNeeded() {
        guard !rootBlendGMLoadAttempted else { return }
        rootBlendGMLoadAttempted = true
        rootBlendGMReady = loadSamplerInstrument(rootGrandSampler, program: kRootBlendGrandProgram)
        rootBlendElectricReady = loadSamplerInstrument(rootElectricSampler, program: kRootBlendElectricProgram)
    }

    /// GM 混合ワンショット。成功したら true。
    private func playRootGMBlendOneShot(midi: Int) -> Bool {
        guard rootBlendGMReady, !isStopping, isEngineStarted, engine.isRunning else { return false }
        let n = UInt8(clamping: midi)
        let velGrand: UInt8 = 118
        let velElectric: UInt8 = 100
        rootGrandSampler.startNote(n, withVelocity: velGrand, onChannel: 0)
        if rootBlendElectricReady {
            rootElectricSampler.startNote(n, withVelocity: velElectric, onChannel: 0)
        }
        var octaveStop: UInt8?
        let octaveRaw = midi + 12
        if octaveRaw <= 127 {
            let no = UInt8(truncatingIfNeeded: octaveRaw)
            octaveStop = no
            let speaker = survivalAudioRouteUsesBuiltInSpeaker()
            let velOctGrand = speaker ? kRootGmOctaveVelGrandSpeaker : kRootGmOctaveVelGrand
            let velOctElectric = speaker ? kRootGmOctaveVelElectricSpeaker : kRootGmOctaveVelElectric
            rootGrandSampler.startNote(no, withVelocity: velOctGrand, onChannel: 0)
            if rootBlendElectricReady {
                rootElectricSampler.startNote(no, withVelocity: velOctElectric, onChannel: 0)
            }
        }
        let stopDelay: TimeInterval = 0.45
        DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + stopDelay) { [weak self] in
            guard let self, self.rootBlendGMReady else { return }
            self.rootGrandSampler.stopNote(n, onChannel: 0)
            if self.rootBlendElectricReady {
                self.rootElectricSampler.stopNote(n, onChannel: 0)
            }
            if let no = octaveStop {
                self.rootGrandSampler.stopNote(no, onChannel: 0)
                if self.rootBlendElectricReady {
                    self.rootElectricSampler.stopNote(no, onChannel: 0)
                }
            }
        }
        return true
    }

    /// コード発動時のヒット音 (和音 2 音)
    func playHitCue() { playEffect(.hit) }

    /// 被弾音
    func playDamageCue() { playEffect(.damage) }

    /// SE を鳴らす (WEB 版 FantasySoundManager 相当)
    func playEffect(_ effect: SoundEffect) {
        switch effect {
        case .myAttack:
            playChord([76, 79], velocity: 80, duration: 0.14)
        case .enemyAttack:
            playChord([48, 52], velocity: 90, duration: 0.18)
        case .hit:
            playNote(72, velocity: 70, duration: 0.12)
        case .damage:
            playNote(48, velocity: 85, duration: 0.22)
        case .stageClear:
            stopBgm()
            QuestJinglePlayer.playComplete()
        case .stageGameOver:
            stopBgm()
            QuestJinglePlayer.playGameOver()
        case .itemPickup:
            playChord([72, 76], velocity: 80, duration: 0.12)
        case .magicCast:
            playChord([60, 67, 72], velocity: 90, duration: 0.2)
        }
    }

    // MARK: - Private

    private func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? session.setPreferredSampleRate(44_100)
        try? session.setPreferredIOBufferDuration(0.005)
        try? session.setActive(true, options: [])
    }

    private func resolvePianoSoundBankURL() -> URL? {
        if let cached = pianoSoundBankURL {
            return cached
        }
        let url =
            Bundle.main.url(forResource: kPianoSoundBankResourceName, withExtension: "sf2") ??
            Bundle.main.url(forResource: kPianoSoundBankResourceName, withExtension: "dls")
        pianoSoundBankURL = url
        return url
    }

    @discardableResult
    private func loadSamplerInstrument(_ sampler: AVAudioUnitSampler, program: UInt8) -> Bool {
        guard let bankURL = resolvePianoSoundBankURL() else { return false }
        do {
            try sampler.loadSoundBankInstrument(
                at: bankURL,
                program: program,
                bankMSB: UInt8(kAUSampler_DefaultMelodicBankMSB),
                bankLSB: UInt8(kAUSampler_DefaultBankLSB)
            )
            return true
        } catch {
            return false
        }
    }

    private func prepareKeyboardGMBankIfNeeded() {
        guard !keyboardGMLoadAttempted else { return }
        keyboardGMLoadAttempted = true

        guard resolvePianoSoundBankURL() != nil else {
            keyboardGMReady = false
            assertionFailure("\(kPianoSoundBankResourceName).sf2 or .dls not found in app bundle")
            return
        }

        keyboardGMReady = loadSamplerInstrument(keyboardGrandSampler, program: kRootBlendGrandProgram)
        if !keyboardGMReady {
            assertionFailure("Failed to load keyboard piano instrument from \(kPianoSoundBankResourceName)")
        }
    }

    private func performKeyboardNoteOn(midi: Int, velocity: Int) {
        let n = UInt8(clamping: max(0, min(127, midi)))
        let vel = UInt8(max(1, min(127, velocity)))
        keyboardGrandSampler.stopNote(n, onChannel: 0)
        keyboardGrandSampler.startNote(n, withVelocity: vel, onChannel: 0)
    }

    private func performKeyboardNoteOff(midi: Int) {
        let n = UInt8(clamping: max(0, min(127, midi)))
        keyboardGrandSampler.stopNote(n, onChannel: 0)
    }

    private func stopAllKeyboardNotes() {
        guard keyboardGMReady else { return }
        for midi in 0...127 {
            let n = UInt8(clamping: midi)
            keyboardGrandSampler.stopNote(n, onChannel: 0)
        }
    }

    private func registerLifecycleObservers() {
        let center = NotificationCenter.default
        interruptionObserver = center.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] notification in
            self?.handleAudioSessionInterruption(notification)
        }
        engineConfigObserver = center.addObserver(
            forName: .AVAudioEngineConfigurationChange,
            object: engine,
            queue: .main
        ) { [weak self] _ in
            self?.handleEngineConfigurationChange()
        }
        foregroundObserver = center.addObserver(
            forName: UIApplication.willEnterForegroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.reactivateAudioAfterForeground()
        }
    }

    private func handleAudioSessionInterruption(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
        switch type {
        case .began:
            if bgmPlayer.timeControlStatus == .playing {
                bgmPlayer.pause()
            }
        case .ended:
            let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
            let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
            if options.contains(.shouldResume) {
                reactivateAudioAfterForeground()
            }
        @unknown default:
            break
        }
    }

    /// バックグラウンド復帰・割り込み終了・ルート変更後に AVAudioSession / エンジン / BGM を再開する。
    private func reactivateAudioAfterForeground() {
        guard !isStopping else { return }
        guard isEngineStarted || currentBgmUrl != nil || isPianoPrepared else { return }
        configureAudioSession()
        startEngineIfNeeded()
        if currentBgmUrl != nil {
            playBgm()
        }
    }

    private func handleEngineConfigurationChange() {
        guard !isStopping else { return }
        guard isEngineStarted || isPianoPrepared else { return }
        DispatchQueue.main.async { [weak self] in
            guard let self, !self.isStopping else { return }
            self.startEngineIfNeeded()
        }
    }

    private func startEngineIfNeeded() {
        guard !isStopping else { return }
        if isEngineStarted && engine.isRunning { return }
        do {
            try engine.start()
            applyVolumesToNodes()
            isEngineStarted = true
        } catch {
            isEngineStarted = false
        }
    }

    /// BGM / SFX / ピアノ それぞれの出力ボリュームを現在の保存値 & ミュート状態から更新する。
    /// main mixer は 1.0 固定にし、各入力ミキサーの `outputVolume` で個別制御する。
    private func applyVolumesToNodes() {
        bgmPlayer.volume = effectiveBgmVolume()
        engine.mainMixerNode.outputVolume = 1.0
        sfxMixer.outputVolume = effectiveSfxVolume()
        pianoMixer.outputVolume = effectivePianoVolume()
        rootBassMixer.outputVolume = effectiveRootBassVolume()
    }

    /// 正解時ルート音の実効音量。
    /// Web 版 `_syncRootBassVolume` と同じ「0.3 〜 1.0 の範囲へ持ち上げる」計算を踏襲し、
    /// iOS ではピアノ音量スライダー (`pianoVolume`) を effectiveVolume として扱う。
    /// ミュート時は 0 を返す。
    private func effectiveRootBassVolume() -> Float {
        if isMuted { return 0 }
        let effective = max(pianoVolume, 0)
        return 0.42 + min(1.0, effective) * 0.58
    }

    private func playBgm() {
        let url = bgmUrl ?? SurvivalBgmDefaults.randomURL
        if currentBgmUrl == url, bgmPlayer.timeControlStatus == .playing {
            bgmPlayer.volume = effectiveBgmVolume()
            return
        }
        bgmPlayer.removeAllItems()
        bgmLooper = nil
        let asset = AVAsset(url: url)
        let item = AVPlayerItem(asset: asset)
        bgmLooper = AVPlayerLooper(player: bgmPlayer, templateItem: item)
        currentBgmUrl = url
        bgmPlayer.volume = effectiveBgmVolume()
        bgmPlayer.play()
    }

    private func stopBgm() {
        bgmPlayer.pause()
        bgmPlayer.removeAllItems()
        bgmLooper = nil
        currentBgmUrl = nil
    }

    private func playChord(_ notes: [Int], velocity: Int, duration: TimeInterval) {
        guard !isStopping else { return }
        startEngineIfNeeded()
        guard isEngineStarted, engine.isRunning else { return }
        let vel = UInt8(max(1, min(127, velocity)))
        for note in notes {
            let n = UInt8(max(0, min(127, note)))
            sampler.startNote(n, withVelocity: vel, onChannel: 0)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) { [weak self] in
            guard let self, self.isEngineStarted, self.engine.isRunning else { return }
            for note in notes {
                let n = UInt8(max(0, min(127, note)))
                self.sampler.stopNote(n, onChannel: 0)
            }
        }
    }

    private func playArpeggio(_ notes: [Int], stepInterval: TimeInterval, velocity: Int, duration: TimeInterval) {
        guard !isStopping else { return }
        startEngineIfNeeded()
        guard isEngineStarted, engine.isRunning else { return }
        for (idx, note) in notes.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(idx) * stepInterval) { [weak self] in
                // `playNote` 内で再度 isEngineStarted / engine.isRunning をチェックするため
                // ここでは追加のガードは不要。
                self?.playNote(note, velocity: velocity, duration: duration)
            }
        }
    }

    private func effectiveSfxVolume() -> Float {
        if isMuted { return 0 }
        if userDefaults.object(forKey: sfxVolumeKey) == nil { return defaultSfxVolume }
        return max(0, min(1, userDefaults.float(forKey: sfxVolumeKey)))
    }

    private func effectiveBgmVolume() -> Float {
        if isMuted { return 0 }
        if userDefaults.object(forKey: bgmVolumeKey) == nil { return defaultBgmVolume }
        return max(0, min(1, userDefaults.float(forKey: bgmVolumeKey)))
    }

    private func effectivePianoVolume() -> Float {
        if isMuted { return 0 }
        if userDefaults.object(forKey: pianoVolumeKey) == nil { return defaultPianoVolume }
        return max(0, min(1, userDefaults.float(forKey: pianoVolumeKey)))
    }
}
