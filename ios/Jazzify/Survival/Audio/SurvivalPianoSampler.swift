import Foundation
import AVFoundation

/// Salamander Grand Piano の MP3 サンプル (C2, C3, C4, C5, C6, C7) をボイスプール方式で再生する
/// 軽量ピアノサンプラー。Web 版 `FantasySoundManager._loadPianoSampler` (Tone.Sampler) の挙動に合わせる。
///
/// - 16 ボイスのプールを持ち、各ボイスは
///   `AVAudioPlayerNode -> AVAudioUnitVarispeed -> AVAudioMixerNode -> output`
///   の順で接続される。
/// - ノート ON: 最も近い基準音 (C2/C3/.../C7) を選び、varispeed.rate = 2^(semitones/12) でピッチ調整。
/// - ノート OFF: ミキサー出力音量を線形フェード (約 0.5 秒) で 0 まで落とし、その後 `player.stop()`。
///   これにより鍵盤を離すまで発音し続け、離した時点で自然なリリースを掛けられる。
final class SurvivalPianoSampler {
    // MARK: - Types

    /// 1 ボイス分の再生パイプライン。ノートごとに 1 つ割り当てる。
    private final class Voice {
        let player = AVAudioPlayerNode()
        let varispeed = AVAudioUnitVarispeed()
        let mixer = AVAudioMixerNode()
        /// 発音中の MIDI 番号。`nil` は未使用ボイス。
        var midi: Int? = nil
        /// 発音開始時刻。LRU ボイススチーリング用。
        var startedAt: TimeInterval = 0
        /// リリースフェード中のタイマー (あれば有効)。重複リリース時に先行タイマーを止める。
        /// `DispatchSourceTimer` を使うことでバックグラウンドキューから直接制御できる。
        var fadeTimer: DispatchSourceTimer? = nil

        func cancelFade() {
            fadeTimer?.cancel()
            fadeTimer = nil
        }
    }

    // MARK: - Stored

    private let engine: AVAudioEngine
    private let output: AVAudioNode
    private let maxVoiceCount: Int
    private var voices: [Voice] = []
    /// 基準音 MIDI -> PCM バッファ (C2 = 36, C3 = 48 ... C7 = 96)
    private var baseBuffers: [Int: AVAudioPCMBuffer] = [:]
    private var baseMidis: [Int] = []
    private var isEngineAttached = false
    /// `stopAll` や外部 owner が「これ以上発音させない」ことを宣言するフラグ。
    /// MIDI コールバック (背景スレッド) から `noteOn` が遅延で飛んでくることが
    /// あるため、`performNoteOn` 側でも必ず参照する。
    private var isStopping: Bool = false
    /// ノート ON/OFF 操作を main から逃がすための専用シリアルキュー。
    /// `AVAudioPlayerNode.stop()` / `play()` は数 ms ブロックする場合があり、
    /// ゲーム描画スレッド (main) でそのまま実行すると 1 フレームスキップの原因になる。
    private let audioQueue = DispatchQueue(label: "survival.piano.sampler", qos: .userInteractive)

    // MARK: - Init

    /// - Parameters:
    ///   - engine: 既存の `AVAudioEngine` (共有エンジン)
    ///   - output: 最終出力ミキサー (通常はピアノ専用ミキサー)
    ///   - maxVoiceCount: 同時発音数。多すぎるとレイテンシが増えるため 16 程度が上限。
    init(engine: AVAudioEngine, output: AVAudioNode, maxVoiceCount: Int = 16) {
        self.engine = engine
        self.output = output
        self.maxVoiceCount = max(4, min(32, maxVoiceCount))
    }

    // MARK: - Public API

    /// Salamander サンプルをバンドルの `piano/` フォルダからロードする (同期)。
    /// - Important: 呼び出しスレッドをブロックする。ステージ開始直後など main から
    ///   呼ぶとウォッチドッグの対象になりうるため、可能な限り
    ///   `loadBundledSamplesAsync` を使用すること。
    @discardableResult
    func loadBundledSamples(folderSubdirectory: String = "piano") -> Bool {
        let loaded = Self.readSamplesOnCurrentThread(folderSubdirectory: folderSubdirectory)
        audioQueue.sync { self.applyLoadedBuffers(loaded) }
        return !loaded.isEmpty
    }

    /// サンプルのロード・デコードをバックグラウンドで行い、完了後に audioQueue で反映する。
    /// ロード完了前に `noteOn` が呼ばれた場合は `baseBuffers.isEmpty` により無音となる。
    /// - Note: ステージ開始時の main ブロック (> 数百 ms) を回避するために使用する。
    func loadBundledSamplesAsync(
        folderSubdirectory: String = "piano",
        completion: ((Bool) -> Void)? = nil
    ) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let loaded = Self.readSamplesOnCurrentThread(folderSubdirectory: folderSubdirectory)
            guard let self else { return }
            self.audioQueue.async {
                self.applyLoadedBuffers(loaded)
                if let completion {
                    let ok = !loaded.isEmpty
                    DispatchQueue.main.async { completion(ok) }
                }
            }
        }
    }

    /// self 非依存の純粋関数として MP3 を読み込む。バックグラウンド呼び出し可。
    private static func readSamplesOnCurrentThread(
        folderSubdirectory: String
    ) -> [(midi: Int, buffer: AVAudioPCMBuffer)] {
        let pairs: [(midi: Int, name: String)] = [
            (36, "C2"), (48, "C3"), (60, "C4"),
            (72, "C5"), (84, "C6"), (96, "C7")
        ]
        var out: [(midi: Int, buffer: AVAudioPCMBuffer)] = []
        out.reserveCapacity(pairs.count)
        for (midi, name) in pairs {
            let url = Bundle.main.url(forResource: name, withExtension: "mp3", subdirectory: folderSubdirectory)
                ?? Bundle.main.url(forResource: name, withExtension: "mp3")
            guard let url else { continue }
            do {
                let file = try AVAudioFile(forReading: url)
                let format = file.processingFormat
                guard let buffer = AVAudioPCMBuffer(
                    pcmFormat: format,
                    frameCapacity: AVAudioFrameCount(file.length)
                ) else { continue }
                try file.read(into: buffer)
                out.append((midi, buffer))
            } catch {
                continue
            }
        }
        return out
    }

    private func applyLoadedBuffers(_ loaded: [(midi: Int, buffer: AVAudioPCMBuffer)]) {
        for (midi, buffer) in loaded {
            baseBuffers[midi] = buffer
        }
        baseMidis = baseBuffers.keys.sorted()
    }

    /// エンジンにボイスを接続する。エンジン `start()` 後でも呼んで OK。
    func attachToEngine() {
        guard !isEngineAttached else { return }
        isEngineAttached = true

        // 基準バッファの読み込みフォーマットをそのまま接続フォーマットにする (Varispeed は任意フォーマットを受け入れる)。
        // サンプルが 1 つも無い場合はダミーフォーマットで接続 (無音動作)。
        let sharedFormat: AVAudioFormat = baseBuffers.values.first?.format
            ?? AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 2)!

        for _ in 0..<maxVoiceCount {
            let voice = Voice()
            engine.attach(voice.player)
            engine.attach(voice.varispeed)
            engine.attach(voice.mixer)
            engine.connect(voice.player, to: voice.varispeed, format: sharedFormat)
            engine.connect(voice.varispeed, to: voice.mixer, format: sharedFormat)
            engine.connect(voice.mixer, to: output, format: sharedFormat)
            voice.mixer.outputVolume = 1.0
            voices.append(voice)
        }
    }

    /// 以降のノート ON を無視するモードにする/解除する (A4 レース対策)。
    func setStopping(_ stopping: Bool) {
        audioQueue.async { [weak self] in
            self?.isStopping = stopping
        }
    }

    /// 指定 MIDI ノートの発音を開始する。`noteOff` が呼ばれるまで (またはサンプル終端まで) 鳴り続ける。
    /// - Parameters:
    ///   - midi: MIDI ノート (0-127)
    ///   - velocity: 0-127 (音量に比例)
    /// - Note: 重い AVAudioPlayerNode.stop()/play() 操作を main から逃がすため、
    ///   専用キューへディスパッチする (レイテンシは数 ms 増えるが体感上は無視できる)。
    func noteOn(midi: Int, velocity: Int = 100) {
        audioQueue.async { [weak self] in
            guard let self else { return }
            self.performNoteOn(midi: midi, velocity: velocity)
        }
    }

    /// 指定 MIDI の発音を止める (リリース: 約 0.5 秒でフェードアウト)。
    func noteOff(midi: Int, release: TimeInterval = 0.5) {
        audioQueue.async { [weak self] in
            guard let self else { return }
            let clampedMidi = max(0, min(127, midi))
            for voice in self.voices where voice.midi == clampedMidi {
                self.startRelease(voice: voice, duration: release)
            }
        }
    }

    /// 全ボイスを即時停止する (ステージ終了やエンジン停止前に呼ぶ)。
    /// 以降 `setStopping(false)` が呼ばれるまで `noteOn` は無視される。
    func stopAll() {
        audioQueue.sync {
            isStopping = true
            for voice in voices {
                voice.cancelFade()
                voice.mixer.outputVolume = 0
                if voice.player.isPlaying { voice.player.stop() }
                voice.midi = nil
            }
        }
    }

    // MARK: - Actual playback (audioQueue)

    private func performNoteOn(midi: Int, velocity: Int) {
        guard !isStopping else { return }
        guard !baseBuffers.isEmpty else { return }
        guard engine.isRunning else { return }
        let clampedMidi = max(0, min(127, midi))
        // 既に同じ MIDI が鳴っていれば止めてから再発音する (同一鍵連打)
        stopNoteImmediately(midi: clampedMidi)

        guard let voice = allocateVoice() else { return }
        guard let (rootMidi, buffer) = nearestBaseBuffer(for: clampedMidi) else { return }

        let semitones = Double(clampedMidi - rootMidi)
        let rate = Float(pow(2.0, semitones / 12.0))
        // Varispeed の有効範囲 [0.25, 4.0] にクランプ (通常範囲内だが安全のため)
        voice.varispeed.rate = max(0.25, min(4.0, rate))

        let v = max(1, min(127, velocity))
        let gain = Float(v) / 127.0
        voice.cancelFade()
        voice.mixer.outputVolume = gain
        voice.midi = clampedMidi
        voice.startedAt = CACurrentMediaTime()

        // `player.stop()` は呼ばず、`scheduleBuffer(.interrupts)` に再生切替を任せる。
        // stop() は現在バッファの完了をブロック待機する場合があるため、ここでは省略。
        voice.player.scheduleBuffer(buffer, at: nil, options: [.interrupts], completionHandler: nil)
        if !voice.player.isPlaying {
            voice.player.play()
        }
    }

    // MARK: - Private

    private func nearestBaseBuffer(for midi: Int) -> (rootMidi: Int, buffer: AVAudioPCMBuffer)? {
        guard !baseMidis.isEmpty else { return nil }
        var bestMidi = baseMidis[0]
        var bestDiff = abs(midi - bestMidi)
        for candidate in baseMidis.dropFirst() {
            let diff = abs(midi - candidate)
            if diff < bestDiff {
                bestDiff = diff
                bestMidi = candidate
            }
        }
        guard let buf = baseBuffers[bestMidi] else { return nil }
        return (bestMidi, buf)
    }

    private func allocateVoice() -> Voice? {
        // まず空きボイス (midi == nil) を探す
        if let free = voices.first(where: { $0.midi == nil && !$0.player.isPlaying }) {
            return free
        }
        // 見つからなければ LRU (最も古いボイス) を奪う
        guard let oldest = voices.min(by: { $0.startedAt < $1.startedAt }) else { return nil }
        oldest.cancelFade()
        if oldest.player.isPlaying { oldest.player.stop() }
        oldest.midi = nil
        return oldest
    }

    private func stopNoteImmediately(midi: Int) {
        for voice in voices where voice.midi == midi {
            voice.cancelFade()
            if voice.player.isPlaying { voice.player.stop() }
            voice.midi = nil
            voice.mixer.outputVolume = 0
        }
    }

    /// リリースエンベロープ。30 fps 程度の DispatchSourceTimer で線形フェード。
    /// `audioQueue` で実行されるため main は一切ブロックしない。
    private func startRelease(voice: Voice, duration: TimeInterval) {
        voice.cancelFade()
        let steps = max(1, Int(duration * 30))
        let interval = duration / Double(steps)
        let startGain = voice.mixer.outputVolume
        var currentStep = 0
        let timer = DispatchSource.makeTimerSource(queue: audioQueue)
        timer.schedule(deadline: .now() + interval, repeating: interval)
        timer.setEventHandler { [weak voice] in
            guard let voice else { timer.cancel(); return }
            currentStep += 1
            let progress = Float(currentStep) / Float(steps)
            let clampedProgress = min(1.0, progress)
            voice.mixer.outputVolume = startGain * (1.0 - clampedProgress)
            if clampedProgress >= 1.0 {
                timer.cancel()
                voice.fadeTimer = nil
                if voice.player.isPlaying { voice.player.stop() }
                voice.midi = nil
                voice.mixer.outputVolume = 0
            }
        }
        voice.fadeTimer = timer
        timer.resume()
    }
}
