import Foundation
import AVFoundation

/// サバイバル ゲーム画面専用の軽量オーディオマネージャ。
/// - AVAudioEngine + AVAudioUnitSampler (SoundFont 無しの内蔵音色) で MIDI ノート再生
/// - BGM は 奇数フェーズ / 偶数フェーズの 2 URL を `AVQueuePlayer + AVPlayerLooper` で切替再生
/// - SE (my_attack / enemy_attack / stage_clear / stage_gameover) は内蔵サンプラーで簡易再生
final class SurvivalGameAudio {
    static let shared = SurvivalGameAudio()

    /// BGM フェーズ。ステージ開始時は `.odd`、残り 30 秒で `.even` に切替わる。
    enum BgmPhase {
        case odd
        case even
    }

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
    /// ピアノ鍵盤タップ / 正解ルート音専用サンプラー。`pianoMixer` 経由で音量制御される。
    private let pianoSampler = AVAudioUnitSampler()
    /// SFX 音量を独立制御するためのミキサー (main mixer の手前に挟む)。
    private let sfxMixer = AVAudioMixerNode()
    /// ピアノ音量を独立制御するためのミキサー (main mixer の手前に挟む)。
    private let pianoMixer = AVAudioMixerNode()
    private var isEngineStarted = false

    private let bgmPlayer = AVQueuePlayer()
    private var bgmLooper: AVPlayerLooper?
    private var oddBgmUrl: URL?
    private var evenBgmUrl: URL?
    private var currentPhase: BgmPhase = .odd
    private var currentBgmUrl: URL?

    private let userDefaults = UserDefaults.standard
    private let sfxVolumeKey = "survival_game_sfx_volume_v1"
    private let bgmVolumeKey = "survival_game_bgm_volume_v1"
    private let pianoVolumeKey = "survival_game_piano_volume_v1"
    private let mutedKey = "survival_game_audio_mute_v1"
    private let defaultSfxVolume: Float = 0.7
    private let defaultBgmVolume: Float = 0.3
    private let defaultPianoVolume: Float = 0.8

    private init() {
        engine.attach(sampler)
        engine.attach(pianoSampler)
        engine.attach(sfxMixer)
        engine.attach(pianoMixer)
        engine.connect(sampler, to: sfxMixer, format: nil)
        engine.connect(pianoSampler, to: pianoMixer, format: nil)
        engine.connect(sfxMixer, to: engine.mainMixerNode, format: nil)
        engine.connect(pianoMixer, to: engine.mainMixerNode, format: nil)
        bgmPlayer.actionAtItemEnd = .advance
    }

    // MARK: - Public API

    /// ゲーム画面の onAppear で呼ぶ。オーディオセッション + BGM 起動
    func start() {
        configureAudioSession()
        startEngineIfNeeded()
        currentPhase = .odd
        playBgm(phase: .odd)
    }

    /// ゲーム画面の onDisappear で呼ぶ。BGM / エンジンを停止
    func stop() {
        stopBgm()
        // 遅延コールバック (arpeggio / stopNote) がまだキューに残っていても、
        // `isEngineStarted == false` により `sampler` 操作をスキップさせる。
        isEngineStarted = false
        if engine.isRunning {
            engine.stop()
        }
    }

    /// ステージ難易度から BGM URL を注入 (未指定時はデフォルト URL を維持)
    func setBgmUrls(odd: URL?, even: URL?) {
        oddBgmUrl = odd ?? SurvivalMapAudio.bgmURL
        evenBgmUrl = even ?? oddBgmUrl
        // 既に再生中なら即時反映
        if currentBgmUrl != nil {
            playBgm(phase: currentPhase)
        }
    }

    /// 残り時間に応じて BGM フェーズを切り替える。
    /// - Parameter useEven: `true` で偶数 BGM へ、`false` で奇数 BGM へ
    func switchWavePhase(useEven: Bool) {
        let target: BgmPhase = useEven ? .even : .odd
        guard target != currentPhase else { return }
        currentPhase = target
        playBgm(phase: target)
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
    /// - Parameter asPiano: `true` のときはピアノ専用サンプラー (ピアノ音量) で鳴らす。
    ///   `false` (デフォルト) は SFX サンプラーで鳴らし、効果音音量スライダーに従う。
    func playNote(_ note: Int, velocity: Int = 90, duration: TimeInterval = 0.5, asPiano: Bool = false) {
        startEngineIfNeeded()
        // エンジンが未起動なら sampler 操作はクラッシュするためスキップ
        guard isEngineStarted, engine.isRunning else { return }
        let clamped = UInt8(max(0, min(127, note)))
        let vel = UInt8(max(1, min(127, velocity)))
        let target = asPiano ? pianoSampler : sampler
        target.startNote(clamped, withVelocity: vel, onChannel: 0)
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) { [weak self] in
            guard let self, self.isEngineStarted, self.engine.isRunning else { return }
            target.stopNote(clamped, onChannel: 0)
        }
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
            playArpeggio([60, 64, 67, 72], stepInterval: 0.08, velocity: 95, duration: 0.25)
        case .stageGameOver:
            playArpeggio([60, 57, 53, 48], stepInterval: 0.12, velocity: 95, duration: 0.3)
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
        try? session.setActive(true, options: [])
    }

    private func startEngineIfNeeded() {
        guard !isEngineStarted else { return }
        do {
            try engine.start()
            applyVolumesToNodes()
            isEngineStarted = true
        } catch {
            // 無音動作。AVAudioUnitSampler は内蔵 DLS でも起動できないケースがあるため fail-safe。
        }
    }

    /// BGM / SFX / ピアノ それぞれの出力ボリュームを現在の保存値 & ミュート状態から更新する。
    /// main mixer は 1.0 固定にし、各入力ミキサーの `outputVolume` で個別制御する。
    private func applyVolumesToNodes() {
        bgmPlayer.volume = effectiveBgmVolume()
        engine.mainMixerNode.outputVolume = 1.0
        sfxMixer.outputVolume = effectiveSfxVolume()
        pianoMixer.outputVolume = effectivePianoVolume()
    }

    private func playBgm(phase: BgmPhase) {
        let targetUrl: URL? = {
            switch phase {
            case .odd: return oddBgmUrl ?? SurvivalMapAudio.bgmURL
            case .even: return evenBgmUrl ?? oddBgmUrl ?? SurvivalMapAudio.bgmURL
            }
        }()
        guard let url = targetUrl else { return }
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
