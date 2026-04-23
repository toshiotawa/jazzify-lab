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
    private let sampler = AVAudioUnitSampler()
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
    private let mutedKey = "survival_game_audio_mute_v1"
    private let defaultSfxVolume: Float = 0.7
    private let defaultBgmVolume: Float = 0.3

    private init() {
        engine.attach(sampler)
        engine.connect(sampler, to: engine.mainMixerNode, format: nil)
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
        bgmPlayer.volume = effectiveBgmVolume()
        engine.mainMixerNode.outputVolume = effectiveSfxVolume()
        return newValue
    }

    /// 指定 MIDI ノートを短時間再生 (ルート音鳴動用)
    func playNote(_ note: Int, velocity: Int = 90, duration: TimeInterval = 0.5) {
        startEngineIfNeeded()
        // エンジンが未起動なら sampler 操作はクラッシュするためスキップ
        guard isEngineStarted, engine.isRunning else { return }
        let clamped = UInt8(max(0, min(127, note)))
        let vel = UInt8(max(1, min(127, velocity)))
        sampler.startNote(clamped, withVelocity: vel, onChannel: 0)
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) { [weak self] in
            guard let self, self.isEngineStarted, self.engine.isRunning else { return }
            self.sampler.stopNote(clamped, onChannel: 0)
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
            engine.mainMixerNode.outputVolume = effectiveSfxVolume()
            isEngineStarted = true
        } catch {
            // 無音動作。AVAudioUnitSampler は内蔵 DLS でも起動できないケースがあるため fail-safe。
        }
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
}
