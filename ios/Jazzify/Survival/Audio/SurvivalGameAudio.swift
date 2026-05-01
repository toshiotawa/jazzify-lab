import Foundation
import AVFoundation

/// サバイバル ゲーム画面専用の軽量オーディオマネージャ。
/// - AVAudioEngine + AVAudioUnitSampler (SoundFont 無しの内蔵音色) で SE 用 MIDI ノート再生
/// - ピアノ鍵盤 / 正解ルート音は `SurvivalPianoSampler` (Salamander サンプル) で再生し、
///   Web 版のピアノ音色と揃える。ノート ON/OFF で発音時間を制御する。
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
    /// ピアノ鍵盤タップ音専用サンプラー。`pianoMixer` 経由で音量制御される。
    /// Web 版 `Tone.Sampler` と同じ Salamander Grand Piano MP3 (C2-C7) を使って
    /// ボイスプール方式で再生する。`init` で `self` 参照が必要なため `!` で遅延初期化。
    private var pianoSampler: SurvivalPianoSampler!
    /// ピアノサンプルのロード + ボイス接続を 1 回だけ行うためのフラグ。
    private var isPianoPrepared = false
    /// SFX 音量を独立制御するためのミキサー (main mixer の手前に挟む)。
    private let sfxMixer = AVAudioMixerNode()
    /// ピアノ音量を独立制御するためのミキサー (main mixer の手前に挟む)。
    private let pianoMixer = AVAudioMixerNode()
    /// 正解時のシンセ ルート音 (Web 版 `FantasySoundManager._playRootNote` 相当) を
    /// 鳴らすための `AVAudioPlayerNode`。三角波 + エンベロープを pre-rendered バッファで再生する。
    /// Web 版はルート音専用の AudioContext + master gain で独立音量制御されているため、
    /// iOS もピアノ音量スライダーの影響を受けない専用ミキサー `rootBassMixer` を挟む。
    /// これにより「コード正解時のルート音が埋もれて聞こえにくい」要望に対し、
    /// ピアノ音量とは独立して大きめに鳴らせる。
    private let synthBassPlayer = AVAudioPlayerNode()
    private let rootBassMixer = AVAudioMixerNode()
    private let synthBassFormat: AVAudioFormat = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 1)!
    /// `AVAudioPlayerNode.play()` / `scheduleBuffer` をメインスレッドから逃がすためのキュー。
    /// 移動中にスキル発動した際の 1 フレーム落ちを防ぐ。
    private let synthBassQueue = DispatchQueue(label: "survival.synthbass", qos: .userInteractive)
    /// MIDI ノートごとに 1 度だけ生成して使い回すシンセ ルート音バッファ。
    /// プリウォーム (バックグラウンドスレッド) と再生 (main) の両方からアクセスされるため、
    /// `synthBassCacheLock` で排他制御する。
    private var synthBassBufferCache: [Int: AVAudioPCMBuffer] = [:]
    private let synthBassCacheLock = NSLock()
    private var isEngineStarted = false
    /// `stop()` 中 / 停止後のフラグ。MIDI コールバック (背景スレッド) から
    /// `pianoNoteOnRealtime` が遅延で飛んできた際に停止済みエンジン操作を
    /// 完全に遮断するための二重ガード。
    private var isStopping: Bool = false

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
        engine.attach(sfxMixer)
        engine.attach(pianoMixer)
        engine.attach(synthBassPlayer)
        engine.attach(rootBassMixer)
        engine.connect(sampler, to: sfxMixer, format: nil)
        engine.connect(sfxMixer, to: engine.mainMixerNode, format: nil)
        engine.connect(pianoMixer, to: engine.mainMixerNode, format: nil)
        // 正解ルート音 (シンセ) は専用ミキサー経由にし、ピアノ音量に影響されない独立音量制御にする。
        // Web 版 `FantasySoundManager._playRootNote` の master gain (0.3 + effectiveVolume * 0.7)
        // 相当をここで再現する (`applyVolumesToNodes` で反映)。
        engine.connect(synthBassPlayer, to: rootBassMixer, format: synthBassFormat)
        engine.connect(rootBassMixer, to: engine.mainMixerNode, format: synthBassFormat)
        bgmPlayer.actionAtItemEnd = .advance
        self.pianoSampler = SurvivalPianoSampler(engine: engine, output: pianoMixer)
    }

    // MARK: - Public API

    /// ゲーム画面の onAppear で呼ぶ。オーディオセッション + (任意で) BGM 起動。
    /// - Parameter playBackgroundMusic: false にすると BGM 起動をスキップする。耳コピバトルなど
    ///   フレーズ MP3 を主役に流すモードで使用する。
    func start(playBackgroundMusic: Bool = true) {
        configureAudioSession()
        preparePianoIfNeeded()
        startEngineIfNeeded()
        preWarmSynthBassBuffers()
        if playBackgroundMusic {
            currentPhase = .odd
            playBgm(phase: .odd)
        } else {
            stopBgm()
        }
    }

    /// コード正解時のシンセ ベース ルート音 (C2 起点 12 音) を事前にレンダリングして
    /// キャッシュする。初回発火時にバッファ生成 (約 17k サンプルの sin/asin ループ) で
    /// メインスレッドが一瞬ブロックされるのを避ける。
    /// - Note: キャラクターが移動中にスキル発動した際のフリーズ対策。
    private func preWarmSynthBassBuffers() {
        // 生成自体は重めなのでバックグラウンドで行う。再生時はキャッシュから即取り出すだけ。
        let synthBassQueue = DispatchQueue.global(qos: .utility)
        synthBassQueue.async { [weak self] in
            guard let self else { return }
            for midi in 36...47 {
                _ = self.synthBassBuffer(midi: midi)
            }
        }
    }

    /// ゲーム画面の onDisappear で呼ぶ。BGM / エンジンを停止
    func stop() {
        // 最初に isStopping を立てて以降の新規 noteOn を遮断する。
        // MIDI コールバック (背景スレッド) がこの直後に `pianoNoteOnRealtime`
        // を呼んでも `performNoteOn` 側で早期 return する。
        isStopping = true
        pianoSampler.setStopping(true)
        stopBgm()
        pianoSampler.stopAll()
        if synthBassPlayer.isPlaying {
            synthBassPlayer.stop()
        }
        // 遅延コールバック (arpeggio / stopNote) がまだキューに残っていても、
        // `isEngineStarted == false` により `sampler` 操作をスキップさせる。
        isEngineStarted = false
        if engine.isRunning {
            engine.stop()
        }
    }

    /// ピアノサンプルの事前ロード (非同期) + エンジン接続。初回のみ実行される。
    /// - Note: MP3 デコードで数百 ms main をブロックしないよう、ロード本体を
    ///   バックグラウンドへ逃がす。ロードとボイス接続が完了するまで
    ///   `isPianoReady == false` で noteOn を無音動作させてクラッシュを回避する。
    private func preparePianoIfNeeded() {
        guard !isPianoPrepared else {
            // ステージリスタート等で再度呼ばれた場合、stop() で立てた停止フラグを解除する。
            isStopping = false
            pianoSampler.setStopping(false)
            return
        }
        isPianoPrepared = true
        isStopping = false
        pianoSampler.setStopping(false)
        pianoSampler.loadBundledSamplesAsync { [weak self] _ in
            // ロード完了後に main で接続 (共有フォーマットの取得に baseBuffers を見るため
            // 必ず読み込み完了後に呼ぶ)。AVAudioEngine への attach/connect は
            // `engine.isRunning` の状態を問わず動作するので順序は問題ない。
            guard let self else { return }
            self.pianoSampler.attachToEngine()
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

    /// ピアノ音の発音を開始する (サステイン)。`pianoNoteOff` が呼ばれるまで
    /// サンプルの長さぶん鳴り続ける。Web 版の鍵盤押下時挙動に合わせる。
    func pianoNoteOn(midi: Int, velocity: Int = 100) {
        guard !isStopping else { return }
        preparePianoIfNeeded()
        startEngineIfNeeded()
        guard isEngineStarted, engine.isRunning else { return }
        pianoSampler.noteOn(midi: midi, velocity: velocity)
    }

    /// ピアノ音の発音を停止する (フェードアウト約 0.5 秒)。
    func pianoNoteOff(midi: Int) {
        guard isPianoPrepared else { return }
        pianoSampler.noteOff(midi: midi)
    }

    /// `pianoNoteOn` のリアルタイム経路 (任意スレッドから呼び出し可)。
    /// CoreMIDI コールバックから直接呼ぶことでメインスレッド混雑時の遅延を回避するため、
    /// `preparePianoIfNeeded` / `startEngineIfNeeded` など内部フラグの mutation 伴う
    /// 初期化処理をスキップする。代わりに `start()` が main から呼ばれている前提とする。
    /// - 前提: ゲーム開始時の `SurvivalGameController.start()` にて engine / sampler 初期化済み。
    /// - 実体: `SurvivalPianoSampler.noteOn` は内部で `audioQueue.async` に逃がすため
    ///   この経路自体は呼び出しスレッドをブロックしない。
    func pianoNoteOnRealtime(midi: Int, velocity: Int) {
        guard !isStopping, isPianoPrepared, isEngineStarted else { return }
        pianoSampler.noteOn(midi: midi, velocity: velocity)
    }

    func pianoNoteOffRealtime(midi: Int) {
        guard isPianoPrepared else { return }
        pianoSampler.noteOff(midi: midi)
    }

    /// ピアノ音を短時間だけ鳴らす (鍵盤プレビュー等のワンショット)。
    /// 指定 duration 後にリリースフェードをかける。
    /// - Note: noteOff の遅延ディスパッチはバックグラウンドキューで行い、
    ///   main を絶対にブロックしない (ゲームループの 60fps を守るため)。
    func pianoOneShot(midi: Int, duration: TimeInterval = 0.45, velocity: Int = 95) {
        guard !isStopping else { return }
        preparePianoIfNeeded()
        startEngineIfNeeded()
        guard isEngineStarted, engine.isRunning else { return }
        pianoSampler.noteOn(midi: midi, velocity: velocity)
        let release = max(0.1, min(0.6, duration))
        DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + duration) { [weak self] in
            self?.pianoSampler.noteOff(midi: midi, release: release)
        }
    }

    /// コード正解時に鳴らすシンセ ルート音 (Web 版 `FantasySoundManager._playRootNote` 相当)。
    /// 三角波オシレーター + エンベロープ (attack 10ms → decay 120ms → release 400ms) を
    /// バッファにレンダリングして `AVAudioPlayerNode` に流し込むことで、メインスレッドを
    /// 一切ブロックせずに低音を即時再生する。
    /// - Parameter midi: ルート音のピッチクラス (0=C) を C2 起点で鳴らす MIDI ノート番号推奨。
    func playSynthBassRoot(midi: Int) {
        guard !isStopping else { return }
        startEngineIfNeeded()
        guard isEngineStarted, engine.isRunning else { return }
        let clamped = max(0, min(127, midi))
        // バッファ生成 (初回のみ重い) と scheduleBuffer/play はバックグラウンドで実行。
        // 移動中にスキル発動してもメインスレッドを 1 フレームもブロックさせない。
        synthBassQueue.async { [weak self] in
            guard let self else { return }
            guard let buffer = self.synthBassBuffer(midi: clamped) else { return }
            guard self.engine.isRunning else { return }
            if !self.synthBassPlayer.isPlaying {
                self.synthBassPlayer.play()
            }
            self.synthBassPlayer.scheduleBuffer(buffer, at: nil, options: [.interrupts], completionHandler: nil)
        }
    }

    /// MIDI ノートから三角波 + エンベロープ済み PCM バッファを生成 (初回のみ)。
    /// 生成結果はキャッシュし、以降の同じノートでは再計算しない。
    /// - Note: `preWarmSynthBassBuffers` のバックグラウンド生成と main からの再生が
    ///   競合し得るため `synthBassCacheLock` で保護する。
    private func synthBassBuffer(midi: Int) -> AVAudioPCMBuffer? {
        synthBassCacheLock.lock()
        if let cached = synthBassBufferCache[midi] {
            synthBassCacheLock.unlock()
            return cached
        }
        synthBassCacheLock.unlock()
        let sampleRate = synthBassFormat.sampleRate
        // Web 版 `_playRootNote` と同じく total 400ms、linearRamp ベースのエンベロープに揃える。
        // - 0 → 10ms: attack、ゲイン 0 → peakScale
        // - 10ms → 120ms: decay、peakScale → sustainLevel (0.3)
        // - 120ms → 400ms: release、sustainLevel → 0
        // peakScale は Web 版 1.0 と同じ頭打ちにし、ミキサー (`rootBassMixer`) 側で
        // 0.3 + pianoVolume * 0.7 の gain を掛けることで実効音量を確保する。
        let totalDuration: Double = 0.40
        let frameCount = AVAudioFrameCount(sampleRate * totalDuration)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: synthBassFormat, frameCapacity: frameCount) else { return nil }
        buffer.frameLength = frameCount
        let freq = 440.0 * pow(2.0, Double(midi - 69) / 12.0)
        let attackEnd = Int(sampleRate * 0.01)
        let decayEnd = Int(sampleRate * 0.12)
        let releaseEnd = Int(sampleRate * 0.40)
        let phaseInc = 2.0 * .pi * freq / sampleRate
        var phase: Double = 0
        let data = buffer.floatChannelData![0]
        let peakScale: Double = 1.0
        let sustainLevel: Double = 0.3
        for i in 0..<Int(frameCount) {
            let sample = 2.0 / .pi * asin(sin(phase))
            let env: Double
            if i < attackEnd {
                env = Double(i) / Double(max(1, attackEnd))
            } else if i < decayEnd {
                let t = Double(i - attackEnd) / Double(max(1, decayEnd - attackEnd))
                env = 1.0 - (1.0 - sustainLevel) * t
            } else if i < releaseEnd {
                let t = Double(i - decayEnd) / Double(max(1, releaseEnd - decayEnd))
                env = sustainLevel * (1.0 - t)
            } else {
                env = 0
            }
            data[i] = Float(sample * env * peakScale)
            phase += phaseInc
            if phase > 2.0 * .pi { phase -= 2.0 * .pi }
        }
        synthBassCacheLock.lock()
        synthBassBufferCache[midi] = buffer
        synthBassCacheLock.unlock()
        return buffer
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
        rootBassMixer.outputVolume = effectiveRootBassVolume()
    }

    /// 正解時ルート音の実効音量。
    /// Web 版 `_syncRootBassVolume` と同じ「0.3 〜 1.0 の範囲へ持ち上げる」計算を踏襲し、
    /// iOS ではピアノ音量スライダー (`pianoVolume`) を effectiveVolume として扱う。
    /// ミュート時は 0 を返す。
    private func effectiveRootBassVolume() -> Float {
        if isMuted { return 0 }
        let effective = max(pianoVolume, 0)
        return 0.3 + min(1.0, effective) * 0.7
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
