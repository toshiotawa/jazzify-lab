import AVFoundation
import Foundation
import OnnxRuntimeBindings
import os
import QuartzCore

/// PESTO v2 (ONNX) による単音ピッチ入力エンジン。
///
/// スレッド分離を厳密に守る:
/// - `AVAudioSinkNode` コールバック（オーディオレンダースレッド）: リング蓄積のみ。ヒープ割当なし。
/// - `inferenceQueue`: `ORTSession` / cache / `PitchOnsetTracker` / frameIndex を専有。
/// - main: `AVAudioEngine` のライフサイクル管理。
///
/// 可変状態はすべて上記いずれかのスレッドに閉じ込めるか NSLock で保護しているため
/// `@unchecked Sendable` として扱う。
final class PitchInputEngine: @unchecked Sendable {
    static let shared = PitchInputEngine()

    private static let chunkSize = 240
    private static let frameSec = Double(chunkSize) / targetSampleRate
    /// 推論スロット数。tap が書き込み中のスロットを推論側が読むのを避けるための余裕。
    private static let poolSlotCount = 4
    private static let cacheElementCount = 3_976
    private static let targetSampleRate: Double = 48_000
    /// モニタ UI 用: -60dB〜0dB を 0..1 にマップ。
    private static let monitorMinDb: Double = -60
    private static let monitorMaxDb: Double = 0

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

    /// 推論中フラグ。5ms に間に合わないフレームは最新 1 件だけ保留し、それ以前は捨てる。
    /// レンダースレッドから触るため os_unfair_lock を使用。
    private var inferringLock = os_unfair_lock()
    nonisolated(unsafe) private var isInferring = false
    nonisolated(unsafe) private var pendingInferenceSlot: Int?
    nonisolated(unsafe) private var pendingInferenceHostTime: UInt64 = 0
    private let stateLock = NSLock()
    /// stop() 時の取りこぼし解放用。押されているノート。
    nonisolated(unsafe) private var activeNote: Int?

    private let subscriberLock = NSLock()
    nonisolated(unsafe) private var simpleHandlers: [UUID: (UInt8, UInt8, UInt8) -> Void] = [:]
    nonisolated(unsafe) private var hostTimeHandlers: [UUID: (UInt8, UInt8, UInt8, UInt64) -> Void] = [:]

    /// 設定 UI 用モニタ（推論スレッドが更新、MainActor が 30Hz で読む）。
    private let monitorLock = NSLock()
    nonisolated(unsafe) private var latestVolume: Double = 0
    nonisolated(unsafe) private var latestDetectedNote: Int?
    nonisolated(unsafe) private var lastErrorMessage: String?
    nonisolated(unsafe) private var emaCaptureIntervalMs: Double = 0
    nonisolated(unsafe) private var emaInferenceMs: Double = 0
    nonisolated(unsafe) private var lastCaptureTime: Double = 0
    private static let latencyEmaAlpha = 0.1

    // MARK: - main 専有

    private var audioEngine: AVAudioEngine?
    private var isRunning = false
    private var isStarting = false
    private var observersRegistered = false
    private var routeChangeObserver: NSObjectProtocol?
    private var sessionReconfigureObserver: NSObjectProtocol?
    private var interruptionObserver: NSObjectProtocol?
    private var mediaServicesResetObserver: NSObjectProtocol?
    private var restartWorkItem: DispatchWorkItem?
    private var activeVoiceProcessing = false
    private var activeTapSampleRate: Double = 0
    private var captureSinkNode: AVAudioSinkNode?
    private var capturePipeline: CapturePipeline?

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

    // MARK: - モニタ

    struct MonitorSnapshot {
        let volume: Double
        let detectedNote: Int?
        let detectedNoteName: String?
        let isActive: Bool
        let lastError: String?
        /// キャプチャコールバック間隔の移動平均 (ms)。
        let captureIntervalMs: Double?
        /// ORT 推論所要時間の移動平均 (ms)。
        let inferenceMs: Double?
    }

    func monitorSnapshot(isActive: Bool) -> MonitorSnapshot {
        monitorLock.lock()
        let volume = Self.normalizedMonitorVolume(latestVolume)
        let note = latestDetectedNote
        let error = lastErrorMessage
        let captureMs = emaCaptureIntervalMs > 0 ? emaCaptureIntervalMs : nil
        let inferMs = emaInferenceMs > 0 ? emaInferenceMs : nil
        monitorLock.unlock()
        return MonitorSnapshot(
            volume: volume,
            detectedNote: note,
            detectedNoteName: note.map { Self.noteName(for: $0) },
            isActive: isActive,
            lastError: error,
            captureIntervalMs: captureMs,
            inferenceMs: inferMs
        )
    }

    private static func normalizedMonitorVolume(_ linearVolume: Double) -> Double {
        let db = 10 * log10(max(linearVolume, 1e-12))
        let range = monitorMaxDb - monitorMinDb
        guard range > 0 else { return 0 }
        return min(1, max(0, (db - monitorMinDb) / range))
    }

    private static func noteName(for midi: Int) -> String {
        let names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        let pc = ((midi % 12) + 12) % 12
        let octave = midi / 12 - 1
        return "\(names[pc])\(octave)"
    }

    private func setMonitorError(_ message: String?) {
        monitorLock.lock()
        lastErrorMessage = message
        monitorLock.unlock()
    }

    private func updateMonitorVolume(_ volume: Double) {
        monitorLock.lock()
        latestVolume = volume
        monitorLock.unlock()
    }

    private func updateMonitorDetectedNote(_ note: Int?) {
        monitorLock.lock()
        latestDetectedNote = note
        monitorLock.unlock()
    }

    // MARK: - ライフサイクル

    @MainActor
    func start() async throws {
        guard !isRunning else { return }
        guard !isStarting else { return }
        isStarting = true
        defer { isStarting = false }

        guard await Self.requestMicrophonePermission() else {
            setMonitorError(PitchInputEngineError.microphonePermissionDenied.localizedDescription)
            throw PitchInputEngineError.microphonePermissionDenied
        }
        guard !isRunning else { return }

        try await loadModelIfNeeded()
        AppAudioSession.shared.setRecordingEnabled(true)

        do {
            try await startEngineInternal()
            registerObserversIfNeeded()
            setMonitorError(nil)
        } catch {
            AppAudioSession.shared.setRecordingEnabled(false)
            setMonitorError(error.localizedDescription)
            throw error
        }
    }

    @MainActor
    private func startEngineInternal() async throws {
        let useVoiceProcessing = !AudioRouteHelper.hasHeadphoneOutput()

        AppAudioSession.shared.suppressAutomaticReconfigure(for: 1.0)

        let engine = AVAudioEngine()
        let inputNode = engine.inputNode

        if useVoiceProcessing {
            try? inputNode.setVoiceProcessingEnabled(true)
            if #available(iOS 17.0, *) {
                inputNode.voiceProcessingOtherAudioDuckingConfiguration = AVAudioVoiceProcessingOtherAudioDuckingConfiguration(
                    enableAdvancedDucking: false,
                    duckingLevel: .min
                )
            }
        }

        var inputFormat = inputNode.outputFormat(forBus: 0)
        if inputFormat.sampleRate <= 0 {
            try await Task.sleep(nanoseconds: 100_000_000)
            inputFormat = inputNode.outputFormat(forBus: 0)
        }
        guard inputFormat.sampleRate > 0 else {
            throw PitchInputEngineError.inputUnavailable
        }

        guard let outputFormat = AVAudioFormat(
            commonFormat: .pcmFormatFloat32,
            sampleRate: Self.targetSampleRate,
            channels: 1,
            interleaved: false
        ), let converter = AVAudioConverter(from: inputFormat, to: outputFormat) else {
            throw PitchInputEngineError.inputUnavailable
        }

        let scratchCapacity = AVAudioFrameCount(max(inputFormat.sampleRate, Self.targetSampleRate) * 0.1)
        guard let inputScratch = AVAudioPCMBuffer(pcmFormat: inputFormat, frameCapacity: scratchCapacity),
              let outputScratch = AVAudioPCMBuffer(pcmFormat: outputFormat, frameCapacity: scratchCapacity) else {
            throw PitchInputEngineError.inputUnavailable
        }

        resetInferenceState()
        ringWriteIndex = 0
        poolSlot = 0
        lastCaptureTime = 0
        monitorLock.lock()
        emaCaptureIntervalMs = 0
        emaInferenceMs = 0
        monitorLock.unlock()
        updateMonitorVolume(0)
        updateMonitorDetectedNote(nil)

        let pipeline = CapturePipeline(
            engine: self,
            converter: converter,
            inputFormat: inputFormat,
            inputScratch: inputScratch,
            outputScratch: outputScratch
        )
        let sink = AVAudioSinkNode { timestamp, frameCount, bufferList in
            pipeline.process(
                timestamp: timestamp,
                frameCount: frameCount,
                bufferList: bufferList
            )
        }
        engine.attach(sink)
        engine.connect(inputNode, to: sink, format: inputFormat)

        engine.prepare()
        do {
            try engine.start()
        } catch {
            engine.disconnectNodeInput(sink)
            engine.detach(sink)
            throw error
        }

        audioEngine = engine
        captureSinkNode = sink
        capturePipeline = pipeline
        isRunning = true
        activeVoiceProcessing = useVoiceProcessing
        activeTapSampleRate = inputFormat.sampleRate
        SurvivalGameAudio.shared.setVoiceInputDucking(true)
    }

    @MainActor
    private func engineConfigurationMatchesDesired() -> Bool {
        guard isRunning, let engine = audioEngine, engine.isRunning else { return false }
        let desiredVoiceProcessing = !AudioRouteHelper.hasHeadphoneOutput()
        let currentRate = engine.inputNode.outputFormat(forBus: 0).sampleRate
        guard currentRate > 0 else { return false }
        return activeVoiceProcessing == desiredVoiceProcessing
            && abs(activeTapSampleRate - currentRate) < 1.0
    }

    @MainActor
    private func restart() async {
        guard isRunning else { return }
        if engineConfigurationMatchesDesired() {
            return
        }
        tearDownEngine(releaseRecordingSession: false)
        do {
            try await startEngineInternal()
            setMonitorError(nil)
        } catch {
            isRunning = false
            setMonitorError(error.localizedDescription)
        }
    }

    @MainActor
    func stop() {
        restartWorkItem?.cancel()
        restartWorkItem = nil
        if isRunning || audioEngine != nil {
            tearDownEngine(releaseRecordingSession: true)
        } else {
            AppAudioSession.shared.setRecordingEnabled(false)
        }
        unregisterObserversIfNeeded()
    }

    @MainActor
    private func tearDownEngine(releaseRecordingSession: Bool) {
        SurvivalGameAudio.shared.setVoiceInputDucking(false)
        if let engine = audioEngine, let sink = captureSinkNode {
            engine.stop()
            engine.disconnectNodeInput(sink)
            engine.detach(sink)
        } else {
            audioEngine?.stop()
        }
        audioEngine = nil
        captureSinkNode = nil
        capturePipeline = nil
        isRunning = false
        activeVoiceProcessing = false
        activeTapSampleRate = 0

        stateLock.lock()
        let heldNote = activeNote
        activeNote = nil
        stateLock.unlock()
        if let heldNote {
            notify(status: 0x80, note: heldNote, velocity: 0, hostTime: 0)
        }
        updateMonitorDetectedNote(nil)

        if releaseRecordingSession {
            AppAudioSession.shared.setRecordingEnabled(false)
        }
    }

    @MainActor
    var isActive: Bool { isRunning }

    // MARK: - ルート / セッション監視

    @MainActor
    private func registerObserversIfNeeded() {
        guard !observersRegistered else { return }
        observersRegistered = true

        let center = NotificationCenter.default
        let session = AVAudioSession.sharedInstance()

        routeChangeObserver = center.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: session,
            queue: .main
        ) { [weak self] notification in
            Task { @MainActor in
                self?.handleRouteChange(notification)
            }
        }

        sessionReconfigureObserver = center.addObserver(
            forName: AppAudioSession.didReconfigureNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.scheduleRestartIfRunning()
            }
        }

        interruptionObserver = center.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: session,
            queue: .main
        ) { [weak self] notification in
            Task { @MainActor in
                self?.handleInterruption(notification)
            }
        }

        mediaServicesResetObserver = center.addObserver(
            forName: AVAudioSession.mediaServicesWereResetNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.scheduleRestartIfRunning()
            }
        }
    }

    @MainActor
    private func unregisterObserversIfNeeded() {
        guard observersRegistered else { return }
        observersRegistered = false

        let center = NotificationCenter.default
        if let routeChangeObserver {
            center.removeObserver(routeChangeObserver)
            self.routeChangeObserver = nil
        }
        if let sessionReconfigureObserver {
            center.removeObserver(sessionReconfigureObserver)
            self.sessionReconfigureObserver = nil
        }
        if let interruptionObserver {
            center.removeObserver(interruptionObserver)
            self.interruptionObserver = nil
        }
        if let mediaServicesResetObserver {
            center.removeObserver(mediaServicesResetObserver)
            self.mediaServicesResetObserver = nil
        }
    }

    @MainActor
    private func handleRouteChange(_ notification: Notification) {
        guard isRunning else { return }
        guard let reasonValue = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }
        switch reason {
        case .oldDeviceUnavailable, .newDeviceAvailable:
            scheduleRestartIfRunning()
        default:
            break
        }
    }

    @MainActor
    private func handleInterruption(_ notification: Notification) {
        guard isRunning else { return }
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }
        if type == .ended {
            scheduleRestartIfRunning()
        }
    }

    @MainActor
    private func scheduleRestartIfRunning() {
        guard isRunning else { return }
        restartWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            Task { @MainActor in
                await self?.restart()
            }
        }
        restartWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15, execute: work)
    }

    // MARK: - モデル

    @MainActor
    private func loadModelIfNeeded() async throws {
        guard let modelURL = Bundle.main.url(
            forResource: "pesto-mir1k-g7-48000-240-refill",
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
        os_unfair_lock_lock(&inferringLock)
        isInferring = false
        os_unfair_lock_unlock(&inferringLock)
    }

    fileprivate func recordCaptureInterval() {
        let now = CACurrentMediaTime()
        defer { lastCaptureTime = now }
        guard lastCaptureTime > 0 else { return }
        let intervalMs = (now - lastCaptureTime) * 1000
        monitorLock.lock()
        let alpha = Self.latencyEmaAlpha
        if emaCaptureIntervalMs <= 0 {
            emaCaptureIntervalMs = intervalMs
        } else {
            emaCaptureIntervalMs = emaCaptureIntervalMs * (1 - alpha) + intervalMs * alpha
        }
        monitorLock.unlock()
    }

    private func recordInferenceDuration(startTime: CFTimeInterval) {
        let elapsedMs = (CACurrentMediaTime() - startTime) * 1000
        monitorLock.lock()
        let alpha = Self.latencyEmaAlpha
        if emaInferenceMs <= 0 {
            emaInferenceMs = elapsedMs
        } else {
            emaInferenceMs = emaInferenceMs * (1 - alpha) + elapsedMs * alpha
        }
        monitorLock.unlock()
    }

    // MARK: - オーディオレンダースレッド

    fileprivate func handleInputBuffer(
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
        os_unfair_lock_lock(&inferringLock)
        if isInferring {
            pendingInferenceSlot = slot
            pendingInferenceHostTime = hostTime
            os_unfair_lock_unlock(&inferringLock)
            return
        }
        isInferring = true
        os_unfair_lock_unlock(&inferringLock)

        inferenceQueue.async { [self] in
            drainInference(startSlot: slot, startHostTime: hostTime)
        }
    }

    private func drainInference(startSlot: Int, startHostTime: UInt64) {
        var slot = startSlot
        var hostTime = startHostTime
        while true {
            runInference(slot: slot, hostTime: hostTime)
            os_unfair_lock_lock(&inferringLock)
            guard let nextSlot = pendingInferenceSlot else {
                isInferring = false
                os_unfair_lock_unlock(&inferringLock)
                return
            }
            slot = nextSlot
            hostTime = pendingInferenceHostTime
            pendingInferenceSlot = nil
            os_unfair_lock_unlock(&inferringLock)
        }
    }

    // MARK: - inferenceQueue

    private func runInference(slot: Int, hostTime: UInt64) {
        guard let session = ortSession else { return }

        let inferenceStart = CACurrentMediaTime()
        defer { recordInferenceDuration(startTime: inferenceStart) }

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

            updateMonitorVolume(frame.volume)

            let events = tracker.processFrame(frame, frameIndex: frameIndex)
            frameIndex += 1

            for event in events {
                switch event {
                case let .noteOn(note, frameIndex, onsetFrameIndex):
                    let backdatedFrames = frameIndex - onsetFrameIndex
                    let onsetHostTime = Self.hostTimeBackdated(
                        bySec: Double(backdatedFrames) * Self.frameSec,
                        from: hostTime
                    )
                    notify(status: 0x90, note: note, velocity: 64, hostTime: onsetHostTime)
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

        if status == 0x90 {
            updateMonitorDetectedNote(note)
        } else if status == 0x80 {
            monitorLock.lock()
            if latestDetectedNote == note {
                latestDetectedNote = nil
            }
            monitorLock.unlock()
        }

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

    private static let machTimebaseInfo: mach_timebase_info_data_t = {
        var info = mach_timebase_info_data_t()
        mach_timebase_info(&info)
        return info
    }()

    private static func hostTimeBackdated(bySec sec: Double, from hostTime: UInt64) -> UInt64 {
        guard sec > 0 else { return hostTime }
        let info = machTimebaseInfo
        let ticks = UInt64((sec * 1_000_000_000 * Double(info.denom) / Double(info.numer)).rounded())
        return hostTime &- ticks
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

private final class CapturePipeline {
    let converter: AVAudioConverter
    let inputScratch: AVAudioPCMBuffer
    let outputScratch: AVAudioPCMBuffer
    let inputFormat: AVAudioFormat
    unowned let engine: PitchInputEngine

    init(
        engine: PitchInputEngine,
        converter: AVAudioConverter,
        inputFormat: AVAudioFormat,
        inputScratch: AVAudioPCMBuffer,
        outputScratch: AVAudioPCMBuffer
    ) {
        self.engine = engine
        self.converter = converter
        self.inputFormat = inputFormat
        self.inputScratch = inputScratch
        self.outputScratch = outputScratch
    }

    func process(
        timestamp: UnsafePointer<AudioTimeStamp>,
        frameCount: AVAudioFrameCount,
        bufferList: UnsafePointer<AudioBufferList>
    ) -> OSStatus {
        guard frameCount > 0,
              let buffer = AVAudioPCMBuffer(pcmFormat: inputFormat, bufferListNoCopy: bufferList) else {
            return noErr
        }
        buffer.frameLength = frameCount
        engine.recordCaptureInterval()
        engine.handleInputBuffer(
            buffer,
            hostTime: timestamp.pointee.mHostTime,
            converter: converter,
            inputScratch: inputScratch,
            outputScratch: outputScratch
        )
        return noErr
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
