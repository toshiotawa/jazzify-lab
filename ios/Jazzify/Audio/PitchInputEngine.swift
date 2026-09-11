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
    /// 推論スロット数。tap が書き込み中のスロットを推論側が読むのを避けるための余裕（80ms @ 5ms hop）。
    private static let poolSlotCount = 16
    /// connect/start 前に HW フォーマットが揃うまで待つ最大回数。
    private static let inputFormatRetryCount = 10
    private static let inputFormatRetryDelayNs: UInt64 = 100_000_000
    /// route 変更直後の restart 失敗時に再試行する最大回数。
    private static let restartRetryMaxAttempts = 3
    private static let restartRetryDelaySec: TimeInterval = 0.5
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
    private struct InferenceDispatchState {
        var isInferring = false
        var pendingSlot: Int?
        var pendingHostTime: UInt64 = 0
    }

    private let inferenceDispatchLock = OSAllocatedUnfairLock(initialState: InferenceDispatchState())
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
    nonisolated(unsafe) private var cachedInputLatencySec: Double = 0
    private static let latencyEmaAlpha = 0.1

    // MARK: - main 専有

    private var audioEngine: AVAudioEngine?
    private var isRunning = false
    private var isStarting = false
    /// stop() ごとにインクリメント。start/restart の各 await 後に一致を確認する。
    private var lifecycleGeneration = 0
    private var restartPending = false
    private var restartRetryAttempt = 0
    private var observersRegistered = false
    private var routeChangeObserver: NSObjectProtocol?
    private var sessionReconfigureObserver: NSObjectProtocol?
    private var interruptionObserver: NSObjectProtocol?
    private var mediaServicesResetObserver: NSObjectProtocol?
    private var engineConfigurationChangeObserver: NSObjectProtocol?
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
        restartPending = false
        restartRetryAttempt = 0
        let generation = lifecycleGeneration
        defer { isStarting = false }

        guard await Self.requestMicrophonePermission() else {
            setMonitorError(PitchInputEngineError.microphonePermissionDenied.localizedDescription)
            throw PitchInputEngineError.microphonePermissionDenied
        }
        guard lifecycleGeneration == generation, !isRunning else { return }

        try await loadModelIfNeeded()
        guard lifecycleGeneration == generation, !isRunning else { return }

        AppAudioSession.shared.setRecordingEnabled(true)

        do {
            try await startEngineInternal(generation: generation)
            guard lifecycleGeneration == generation else { return }
            registerObserversIfNeeded()
            setMonitorError(nil)
        } catch {
            guard lifecycleGeneration == generation else { return }
            AppAudioSession.shared.setRecordingEnabled(false)
            setMonitorError(error.localizedDescription)
            throw error
        }
    }

    @MainActor
    private func startEngineInternal(generation: Int) async throws {
        guard lifecycleGeneration == generation else {
            throw CancellationError()
        }

        let session = AVAudioSession.sharedInstance()
        guard session.isInputAvailable, session.category == .playAndRecord else {
            throw PitchInputEngineError.inputUnavailable
        }

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

        let inputFormat = try await Self.waitForStableInputFormat(on: inputNode) { [weak self] in
            self?.lifecycleGeneration == generation
        }
        guard lifecycleGeneration == generation else {
            throw CancellationError()
        }

        let connectFormat: AVAudioFormat
        if inputFormat.commonFormat == .pcmFormatFloat32, !inputFormat.isInterleaved {
            connectFormat = inputFormat
        } else if let standard = AVAudioFormat(
            standardFormatWithSampleRate: inputFormat.sampleRate,
            channels: inputFormat.channelCount
        ) {
            connectFormat = standard
        } else {
            throw PitchInputEngineError.inputUnavailable
        }

        guard let outputFormat = AVAudioFormat(
            commonFormat: .pcmFormatFloat32,
            sampleRate: Self.targetSampleRate,
            channels: 1,
            interleaved: false
        ), let converter = AVAudioConverter(from: connectFormat, to: outputFormat) else {
            throw PitchInputEngineError.inputUnavailable
        }

        let scratchCapacity = AVAudioFrameCount(max(connectFormat.sampleRate, Self.targetSampleRate) * 0.1)
        guard let inputScratch = AVAudioPCMBuffer(pcmFormat: connectFormat, frameCapacity: scratchCapacity),
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
        cachedInputLatencySec = session.inputLatency

        let pipeline = CapturePipeline(
            engine: self,
            converter: converter,
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
        engine.connect(inputNode, to: sink, format: connectFormat)

        registerEngineConfigurationObserver(for: engine)

        engine.prepare()
        do {
            try engine.start()
        } catch {
            unregisterEngineConfigurationObserver()
            engine.disconnectNodeInput(sink)
            engine.detach(sink)
            throw error
        }

        guard lifecycleGeneration == generation else {
            unregisterEngineConfigurationObserver()
            engine.stop()
            engine.disconnectNodeInput(sink)
            engine.detach(sink)
            throw CancellationError()
        }

        audioEngine = engine
        captureSinkNode = sink
        capturePipeline = pipeline
        isRunning = true
        activeVoiceProcessing = useVoiceProcessing
        activeTapSampleRate = connectFormat.sampleRate
        SurvivalGameAudio.shared.setVoiceInputDucking(true)
        DefenseBackingAudio.shared.setVoiceInputDucking(true)
    }

    @MainActor
    private static func waitForStableInputFormat(
        on inputNode: AVAudioInputNode,
        isStillValid: @escaping () -> Bool
    ) async throws -> AVAudioFormat {
        for attempt in 0..<inputFormatRetryCount {
            let outputFormat = inputNode.outputFormat(forBus: 0)
            let hardwareFormat = inputNode.inputFormat(forBus: 0)
            if outputFormat.sampleRate > 0,
               outputFormat.channelCount > 0,
               hardwareFormat.sampleRate > 0,
               hardwareFormat.channelCount > 0,
               abs(outputFormat.sampleRate - hardwareFormat.sampleRate) < 1.0 {
                return outputFormat
            }
            guard isStillValid() else { throw CancellationError() }
            if attempt + 1 < inputFormatRetryCount {
                try await Task.sleep(nanoseconds: inputFormatRetryDelayNs)
            }
        }
        throw PitchInputEngineError.inputUnavailable
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
        guard isRunning || AppAudioSession.shared.isRecordingEnabled else { return }
        guard !isStarting else {
            restartPending = true
            return
        }
        if engineConfigurationMatchesDesired() {
            restartRetryAttempt = 0
            return
        }

        isStarting = true
        restartPending = false
        let generation = lifecycleGeneration
        defer {
            isStarting = false
            if restartPending {
                restartPending = false
                scheduleRestartIfRunning()
            }
        }

        tearDownEngine(releaseRecordingSession: false)
        do {
            try await startEngineInternal(generation: generation)
            guard lifecycleGeneration == generation else { return }
            restartRetryAttempt = 0
            setMonitorError(nil)
        } catch is CancellationError {
            return
        } catch {
            isRunning = false
            setMonitorError(error.localizedDescription)
            scheduleRestartRetryIfNeeded(failureGeneration: generation)
        }
    }

    @MainActor
    private func scheduleRestartRetryIfNeeded(failureGeneration: Int) {
        guard lifecycleGeneration == failureGeneration else { return }
        guard restartRetryAttempt < Self.restartRetryMaxAttempts else { return }
        restartRetryAttempt += 1
        restartWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            Task { @MainActor in
                await self?.restart()
            }
        }
        restartWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.restartRetryDelaySec, execute: work)
    }

    @MainActor
    func stop() {
        lifecycleGeneration += 1
        restartPending = false
        restartRetryAttempt = 0
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
        DefenseBackingAudio.shared.setVoiceInputDucking(false)
        unregisterEngineConfigurationObserver()
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
        guard isRunning || AppAudioSession.shared.isRecordingEnabled else { return }
        restartWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            Task { @MainActor in
                await self?.restart()
            }
        }
        restartWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15, execute: work)
    }

    @MainActor
    private func registerEngineConfigurationObserver(for engine: AVAudioEngine) {
        unregisterEngineConfigurationObserver()
        engineConfigurationChangeObserver = NotificationCenter.default.addObserver(
            forName: .AVAudioEngineConfigurationChange,
            object: engine,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.scheduleRestartIfRunning()
            }
        }
    }

    @MainActor
    private func unregisterEngineConfigurationObserver() {
        guard let engineConfigurationChangeObserver else { return }
        NotificationCenter.default.removeObserver(engineConfigurationChangeObserver)
        self.engineConfigurationChangeObserver = nil
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
        inferenceDispatchLock.withLock { state in
            state.isInferring = false
            state.pendingSlot = nil
            state.pendingHostTime = 0
        }
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

    fileprivate func handleConvertedSamples(
        _ samples: UnsafePointer<Float>,
        count: Int,
        hostTime: UInt64
    ) {
        guard count > 0 else { return }

        let chunkSize = Self.chunkSize
        var slotBase = chunkPool + poolSlot * chunkSize

        for i in 0..<count {
            slotBase[ringWriteIndex] = samples[i]
            ringWriteIndex += 1
            if ringWriteIndex >= chunkSize {
                ringWriteIndex = 0
                let slot = poolSlot
                poolSlot = (poolSlot + 1) % Self.poolSlotCount
                slotBase = chunkPool + poolSlot * chunkSize
                let adjustedHostTime = Self.hostTimeBackdated(
                    bySec: cachedInputLatencySec,
                    from: hostTime
                )
                enqueueInference(slot: slot, hostTime: adjustedHostTime)
            }
        }
    }

    private func enqueueInference(slot: Int, hostTime: UInt64) {
        let shouldDispatch = inferenceDispatchLock.withLock { state -> Bool in
            if state.isInferring {
                state.pendingSlot = slot
                state.pendingHostTime = hostTime
                return false
            }
            state.isInferring = true
            return true
        }
        guard shouldDispatch else { return }

        inferenceQueue.async { [self] in
            drainInference(startSlot: slot, startHostTime: hostTime)
        }
    }

    private func drainInference(startSlot: Int, startHostTime: UInt64) {
        var slot = startSlot
        var hostTime = startHostTime
        while true {
            runInference(slot: slot, hostTime: hostTime)
            let next = inferenceDispatchLock.withLock { state -> (slot: Int, hostTime: UInt64)? in
                guard let nextSlot = state.pendingSlot else {
                    state.isInferring = false
                    return nil
                }
                let nextHostTime = state.pendingHostTime
                state.pendingSlot = nil
                return (nextSlot, nextHostTime)
            }
            guard let next else { return }
            slot = next.slot
            hostTime = next.hostTime
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
                if !Self.copyFiniteFloats(from: data.bytes, byteCount: byteCount, into: cacheBuffer) {
                    cacheBuffer.update(repeating: 0, count: cacheCount)
                    return
                }
            }

            let prediction = Double(readScalar(outputs["prediction"]))
            let confidence = Double(readScalar(outputs["confidence"]))
            let volume = Double(readScalar(outputs["volume"]))
            guard prediction.isFinite, confidence.isFinite, volume.isFinite, volume >= 0 else {
                cacheBuffer.update(repeating: 0, count: cacheCount)
                return
            }

            let frame = PitchFrame(
                prediction: prediction,
                confidence: confidence,
                volume: volume
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
        let scalar = data.bytes.assumingMemoryBound(to: Float.self).pointee
        return scalar.isFinite ? scalar : 0
    }

    /// cache_out を cacheBuffer へコピー。非有限値が 1 つでもあれば false。
    private static func copyFiniteFloats(
        from bytes: UnsafeRawPointer,
        byteCount: Int,
        into destination: UnsafeMutablePointer<Float>
    ) -> Bool {
        let count = byteCount / MemoryLayout<Float>.size
        guard count > 0 else { return false }
        let source = bytes.assumingMemoryBound(to: Float.self)
        for index in 0..<count {
            let value = source[index]
            guard value.isFinite else { return false }
            destination[index] = value
        }
        return true
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

private final class ConversionConsumedFlag {
    var value = false
}

private final class CapturePipeline {
    let converter: AVAudioConverter
    let inputScratch: AVAudioPCMBuffer
    let outputScratch: AVAudioPCMBuffer
    unowned let engine: PitchInputEngine
    private let conversionConsumed = ConversionConsumedFlag()
    private let conversionInputBlock: AVAudioConverterInputBlock

    init(
        engine: PitchInputEngine,
        converter: AVAudioConverter,
        inputScratch: AVAudioPCMBuffer,
        outputScratch: AVAudioPCMBuffer
    ) {
        self.engine = engine
        self.converter = converter
        self.inputScratch = inputScratch
        self.outputScratch = outputScratch
        let consumed = conversionConsumed
        let scratch = inputScratch
        self.conversionInputBlock = { _, outStatus in
            if consumed.value {
                outStatus.pointee = .noDataNow
                return nil
            }
            consumed.value = true
            outStatus.pointee = .haveData
            return scratch
        }
    }

    func process(
        timestamp: UnsafePointer<AudioTimeStamp>,
        frameCount: AVAudioFrameCount,
        bufferList: UnsafePointer<AudioBufferList>
    ) -> OSStatus {
        guard frameCount > 0 else { return noErr }

        let bufferListPointer = UnsafeMutableAudioBufferListPointer(
            UnsafeMutablePointer(mutating: bufferList)
        )
        guard let firstBuffer = bufferListPointer.first,
              let sourceBytes = firstBuffer.mData else {
            return noErr
        }

        let availableSamples = Int(firstBuffer.mDataByteSize) / MemoryLayout<Float>.size
        let copyCount = min(
            Int(frameCount),
            availableSamples,
            Int(inputScratch.frameCapacity)
        )
        guard copyCount > 0,
              let scratchDst = inputScratch.floatChannelData?[0] else {
            return noErr
        }

        let source = sourceBytes.assumingMemoryBound(to: Float.self)
        scratchDst.update(from: source, count: copyCount)
        inputScratch.frameLength = AVAudioFrameCount(copyCount)

        conversionConsumed.value = false
        var conversionError: NSError?
        converter.convert(to: outputScratch, error: &conversionError, withInputFrom: conversionInputBlock)
        guard conversionError == nil,
              let out = outputScratch.floatChannelData?[0] else {
            return noErr
        }

        let outCount = Int(outputScratch.frameLength)
        guard outCount > 0 else { return noErr }

        engine.recordCaptureInterval()
        engine.handleConvertedSamples(
            out,
            count: outCount,
            hostTime: timestamp.pointee.mHostTime
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
