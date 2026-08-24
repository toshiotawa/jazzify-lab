import AVFoundation
import Foundation
import OnnxRuntimeBindings

/// PESTO v2 (ONNX) による単音ピッチ入力エンジン。
///
/// スレッド分離を厳密に守る:
/// - `installTap` クロージャ（オーディオレンダースレッド）: リング蓄積のみ。ヒープ割当なし。
/// - `inferenceQueue`: `ORTSession` / cache / `PitchOnsetTracker` / frameIndex を専有。
/// - main: `AVAudioEngine` のライフサイクル管理。
///
/// 可変状態はすべて上記いずれかのスレッドに閉じ込めるか NSLock で保護しているため
/// `@unchecked Sendable` として扱う。
final class PitchInputEngine: @unchecked Sendable {
    static let shared = PitchInputEngine()

    private static let chunkSize = 480
    /// 推論スロット数。tap が書き込み中のスロットを推論側が読むのを避けるための余裕。
    private static let poolSlotCount = 4
    private static let cacheElementCount = 3_856
    private static let targetSampleRate: Double = 48_000

    private let inferenceQueue = DispatchQueue(label: "jp.jazzify.pitch.inference", qos: .userInitiated)

    // MARK: - tap スレッド専有（start() 前に初期化し、engine 停止後は触られない）

    private let chunkPool: UnsafeMutablePointer<Float>
    private var ringWriteIndex = 0
    private var poolSlot = 0

    // MARK: - inferenceQueue 専有

    private var ortEnv: ORTEnv?
    private var ortSession: ORTSession?
    private let cacheBuffer: UnsafeMutablePointer<Float>
    private let tracker = PitchOnsetTracker()
    private var frameIndex = 0

    // MARK: - スレッド間共有（ロック保護）

    /// 推論中フラグ。10ms に間に合わないフレームは捨てて遅延の蓄積を防ぐ。
    private let stateLock = NSLock()
    nonisolated(unsafe) private var isInferring = false
    /// stop() 時の取りこぼし解放用。押されているノート。
    nonisolated(unsafe) private var activeNote: Int?

    private let subscriberLock = NSLock()
    nonisolated(unsafe) private var simpleHandlers: [UUID: (UInt8, UInt8, UInt8) -> Void] = [:]
    nonisolated(unsafe) private var hostTimeHandlers: [UUID: (UInt8, UInt8, UInt8, UInt64) -> Void] = [:]

    // MARK: - main 専有

    private var audioEngine: AVAudioEngine?
    private var isRunning = false

    private init() {
        chunkPool = UnsafeMutablePointer<Float>.allocate(
            capacity: Self.poolSlotCount * Self.chunkSize
        )
        chunkPool.initialize(repeating: 0, count: Self.poolSlotCount * Self.chunkSize)
        cacheBuffer = UnsafeMutablePointer<Float>.allocate(capacity: Self.cacheElementCount)
        cacheBuffer.initialize(repeating: 0, count: Self.cacheElementCount)
    }

    // MARK: - 権限

    enum MicrophonePermission {
        case granted
        case denied
        case undetermined
    }

    static var microphonePermission: MicrophonePermission {
        if #available(iOS 17.0, *) {
            switch AVAudioApplication.shared.recordPermission {
            case .granted: return .granted
            case .denied: return .denied
            default: return .undetermined
            }
        }
        switch AVAudioSession.sharedInstance().recordPermission {
        case .granted: return .granted
        case .denied: return .denied
        default: return .undetermined
        }
    }

    /// 設定画面で「音声」を選んだ時点でプロンプトを出すために公開する。
    @discardableResult
    static func ensureMicrophonePermission() async -> Bool {
        await requestMicrophonePermission()
    }

    private static func requestMicrophonePermission() async -> Bool {
        switch microphonePermission {
        case .granted: return true
        case .denied: return false
        case .undetermined: break
        }

        return await withCheckedContinuation { continuation in
            if #available(iOS 17.0, *) {
                AVAudioApplication.requestRecordPermission { granted in
                    continuation.resume(returning: granted)
                }
            } else {
                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    continuation.resume(returning: granted)
                }
            }
        }
    }

    // MARK: - 設定

    func setSensitivity(_ level: Int) {
        let config = PitchOnsetSensitivity.scaleConfig(sensitivity: level)
        inferenceQueue.async { [tracker] in
            tracker.setConfig(config)
        }
    }

    // MARK: - 購読

    func subscribe(_ handler: @escaping (UInt8, UInt8, UInt8) -> Void) -> MIDISubscription {
        let id = UUID()
        subscriberLock.lock()
        simpleHandlers[id] = handler
        subscriberLock.unlock()
        return PitchInputSubscriptionToken(engine: self, id: id, isHostTime: false)
    }

    func subscribeWithHostTime(_ handler: @escaping (UInt8, UInt8, UInt8, UInt64) -> Void) -> MIDISubscription {
        let id = UUID()
        subscriberLock.lock()
        hostTimeHandlers[id] = handler
        subscriberLock.unlock()
        return PitchInputSubscriptionToken(engine: self, id: id, isHostTime: true)
    }

    nonisolated fileprivate func removeSubscriber(id: UUID, isHostTime: Bool) {
        subscriberLock.lock()
        if isHostTime {
            hostTimeHandlers.removeValue(forKey: id)
        } else {
            simpleHandlers.removeValue(forKey: id)
        }
        subscriberLock.unlock()
    }

    // MARK: - ライフサイクル

    @MainActor
    func start() async throws {
        guard !isRunning else { return }

        guard await Self.requestMicrophonePermission() else {
            throw PitchInputEngineError.microphonePermissionDenied
        }
        guard !isRunning else { return }

        try await loadModelIfNeeded()
        AppAudioSession.shared.setRecordingEnabled(true)

        let engine = AVAudioEngine()
        let inputNode = engine.inputNode
        let inputFormat = inputNode.outputFormat(forBus: 0)
        guard inputFormat.sampleRate > 0 else {
            AppAudioSession.shared.setRecordingEnabled(false)
            throw PitchInputEngineError.inputUnavailable
        }

        guard let outputFormat = AVAudioFormat(
            commonFormat: .pcmFormatFloat32,
            sampleRate: Self.targetSampleRate,
            channels: 1,
            interleaved: false
        ), let converter = AVAudioConverter(from: inputFormat, to: outputFormat) else {
            AppAudioSession.shared.setRecordingEnabled(false)
            throw PitchInputEngineError.inputUnavailable
        }

        // tap クロージャがキャプチャして専有する。プロパティ経由の共有を避ける。
        let scratchCapacity = AVAudioFrameCount(max(inputFormat.sampleRate, Self.targetSampleRate) * 0.1)
        guard let inputScratch = AVAudioPCMBuffer(pcmFormat: inputFormat, frameCapacity: scratchCapacity),
              let outputScratch = AVAudioPCMBuffer(pcmFormat: outputFormat, frameCapacity: scratchCapacity) else {
            AppAudioSession.shared.setRecordingEnabled(false)
            throw PitchInputEngineError.inputUnavailable
        }

        resetInferenceState()
        ringWriteIndex = 0
        poolSlot = 0

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: inputFormat) { [weak self] buffer, time in
            self?.handleInputBuffer(
                buffer,
                hostTime: time.hostTime,
                converter: converter,
                inputScratch: inputScratch,
                outputScratch: outputScratch
            )
        }

        engine.prepare()
        do {
            try engine.start()
        } catch {
            inputNode.removeTap(onBus: 0)
            AppAudioSession.shared.setRecordingEnabled(false)
            throw error
        }

        audioEngine = engine
        isRunning = true
    }

    @MainActor
    func stop() {
        guard isRunning else { return }
        audioEngine?.inputNode.removeTap(onBus: 0)
        audioEngine?.stop()
        audioEngine = nil
        isRunning = false

        // 押されたままのノートを解放してゲーム側に残らないようにする
        stateLock.lock()
        let heldNote = activeNote
        activeNote = nil
        stateLock.unlock()
        if let heldNote {
            notify(status: 0x80, note: heldNote, velocity: 0, hostTime: 0)
        }

        AppAudioSession.shared.setRecordingEnabled(false)
    }

    @MainActor
    var isActive: Bool { isRunning }

    // MARK: - モデル

    @MainActor
    private func loadModelIfNeeded() async throws {
        guard let modelURL = Bundle.main.url(
            forResource: "pesto-mir1k-g7-48000-480",
            withExtension: "onnx"
        ) else {
            throw PitchInputEngineError.modelMissing
        }

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            inferenceQueue.async { [self] in
                if ortSession != nil {
                    continuation.resume()
                    return
                }
                do {
                    let env = try ORTEnv(loggingLevel: .warning)
                    let options = try ORTSessionOptions()
                    ortEnv = env
                    ortSession = try ORTSession(env: env, modelPath: modelURL.path, sessionOptions: options)
                    continuation.resume()
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    private func resetInferenceState() {
        inferenceQueue.async { [self] in
            tracker.reset()
            frameIndex = 0
            cacheBuffer.update(repeating: 0, count: Self.cacheElementCount)
        }
        stateLock.lock()
        isInferring = false
        stateLock.unlock()
    }

    // MARK: - オーディオレンダースレッド

    private func handleInputBuffer(
        _ buffer: AVAudioPCMBuffer,
        hostTime: UInt64,
        converter: AVAudioConverter,
        inputScratch: AVAudioPCMBuffer,
        outputScratch: AVAudioPCMBuffer
    ) {
        let frameCount = Int(buffer.frameLength)
        guard frameCount > 0,
              frameCount <= Int(inputScratch.frameCapacity),
              let src = buffer.floatChannelData?[0],
              let scratchDst = inputScratch.floatChannelData?[0] else { return }

        inputScratch.frameLength = AVAudioFrameCount(frameCount)
        scratchDst.update(from: src, count: frameCount)

        var conversionError: NSError?
        var consumed = false
        let inputBlock: AVAudioConverterInputBlock = { _, outStatus in
            if consumed {
                outStatus.pointee = .noDataNow
                return nil
            }
            consumed = true
            outStatus.pointee = .haveData
            return inputScratch
        }
        converter.convert(to: outputScratch, error: &conversionError, withInputFrom: inputBlock)
        guard conversionError == nil,
              let out = outputScratch.floatChannelData?[0] else { return }

        let chunkSize = Self.chunkSize
        let outCount = Int(outputScratch.frameLength)
        var slotBase = chunkPool + poolSlot * chunkSize

        for i in 0..<outCount {
            slotBase[ringWriteIndex] = out[i]
            ringWriteIndex += 1
            if ringWriteIndex >= chunkSize {
                ringWriteIndex = 0
                let slot = poolSlot
                poolSlot = (poolSlot + 1) % Self.poolSlotCount
                slotBase = chunkPool + poolSlot * chunkSize
                enqueueInference(slot: slot, hostTime: hostTime)
            }
        }
    }

    private func enqueueInference(slot: Int, hostTime: UInt64) {
        stateLock.lock()
        if isInferring {
            stateLock.unlock()
            return
        }
        isInferring = true
        stateLock.unlock()

        inferenceQueue.async { [self] in
            runInference(slot: slot, hostTime: hostTime)
            stateLock.lock()
            isInferring = false
            stateLock.unlock()
        }
    }

    // MARK: - inferenceQueue

    private func runInference(slot: Int, hostTime: UInt64) {
        guard let session = ortSession else { return }

        let chunkSize = Self.chunkSize
        let cacheCount = Self.cacheElementCount
        let slotBase = chunkPool + slot * chunkSize

        do {
            // freeWhenDone: false。chunkPool / cacheBuffer はエンジンより長寿命なのでコピー不要。
            let audioTensor = try ORTValue(
                tensorData: NSMutableData(
                    bytesNoCopy: slotBase,
                    length: chunkSize * MemoryLayout<Float>.size,
                    freeWhenDone: false
                ),
                elementType: .float,
                shape: [1, NSNumber(value: chunkSize)]
            )
            let cacheTensor = try ORTValue(
                tensorData: NSMutableData(
                    bytesNoCopy: cacheBuffer,
                    length: cacheCount * MemoryLayout<Float>.size,
                    freeWhenDone: false
                ),
                elementType: .float,
                shape: [1, NSNumber(value: cacheCount)]
            )

            let outputs = try session.run(
                withInputs: ["audio": audioTensor, "cache": cacheTensor],
                outputNames: ["prediction", "confidence", "volume", "cache_out"],
                runOptions: nil
            )

            if let cacheOut = outputs["cache_out"] {
                let data = try cacheOut.tensorData()
                let byteCount = min(data.length, cacheCount * MemoryLayout<Float>.size)
                memcpy(cacheBuffer, data.bytes, byteCount)
            }

            let frame = PitchFrame(
                prediction: Double(readScalar(outputs["prediction"])),
                confidence: Double(readScalar(outputs["confidence"])),
                volume: Double(readScalar(outputs["volume"]))
            )

            let events = tracker.processFrame(frame, frameIndex: frameIndex)
            frameIndex += 1

            for event in events {
                switch event {
                case let .noteOn(note, _):
                    notify(status: 0x90, note: note, velocity: 64, hostTime: hostTime)
                case let .noteOff(note, _):
                    notify(status: 0x80, note: note, velocity: 0, hostTime: hostTime)
                }
            }
        } catch {
            // 推論失敗は非致命。次フレームで復帰する。
        }
    }

    private func readScalar(_ value: ORTValue?) -> Float {
        guard let value,
              let data = try? value.tensorData(),
              data.length >= MemoryLayout<Float>.size else { return 0 }
        return data.bytes.assumingMemoryBound(to: Float.self).pointee
    }

    // MARK: - 通知

    /// MIDIManager.deliverChannelVoice と同じく呼び出し元スレッドで同期配信する。
    /// main へホップさせると入力方式による挙動差とレイテンシ差が生まれる。
    private func notify(status: UInt8, note: Int, velocity: UInt8, hostTime: UInt64) {
        let noteByte = UInt8(clamping: note)

        stateLock.lock()
        activeNote = status == 0x90 ? note : nil
        stateLock.unlock()

        subscriberLock.lock()
        let simple = Array(simpleHandlers.values)
        let hostTimed = Array(hostTimeHandlers.values)
        subscriberLock.unlock()

        for handler in simple {
            handler(status, noteByte, velocity)
        }
        for handler in hostTimed {
            handler(status, noteByte, velocity, hostTime)
        }
    }
}

enum PitchInputEngineError: LocalizedError {
    case microphonePermissionDenied
    case modelMissing
    case inputUnavailable

    var errorDescription: String? {
        switch self {
        case .microphonePermissionDenied:
            return "Microphone permission was denied."
        case .modelMissing:
            return "PESTO model not found in bundle."
        case .inputUnavailable:
            return "Audio input is unavailable."
        }
    }
}

private final class PitchInputSubscriptionToken: MIDISubscription {
    private weak var engine: PitchInputEngine?
    private let id: UUID
    private let isHostTime: Bool

    init(engine: PitchInputEngine, id: UUID, isHostTime: Bool) {
        self.engine = engine
        self.id = id
        self.isHostTime = isHostTime
    }

    func cancel() {
        engine?.removeSubscriber(id: id, isHostTime: isHostTime)
    }
}
