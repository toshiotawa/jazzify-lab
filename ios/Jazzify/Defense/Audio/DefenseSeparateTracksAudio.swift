import AVFoundation
import Foundation
import os
import UIKit

final class DefenseSeparateTracksAudio: @unchecked Sendable {
    static let shared = DefenseSeparateTracksAudio()

    private var engine = AVAudioEngine()
    private var masterMixer = AVAudioMixerNode()
    private var sourceNode: AVAudioSourceNode?
    private var sourcePlaybackFormat: AVAudioFormat?
    private var mixerState: DefenseSeparateTracksMixerState?
    private var stage: DefenseStageDefinition?
    private var sessionGeneration: UInt64 = 0
    private var requestRevision = 0
    private var tempoRevision = 0
    private var isStopping = false

    private struct PhraseMailbox: Sendable {
        var pendingPhraseRequest: DefenseSeparateTracksPhraseRequest?
        var pendingTempoRequest: DefenseSeparateTracksTempoRequest?
    }

    private let mailbox = OSAllocatedUnfairLock(initialState: PhraseMailbox())

    private struct RenderPosition: Sendable {
        let endFrame: Int
        let endHostSec: Double
        let grid: DefenseSeparateTracksGrid
    }

    private let renderPosition = OSAllocatedUnfairLock(initialState: Optional<RenderPosition>.none)
    private var presentationLatency: TimeInterval = 0

    private var renderScratchLeft: [Float] = []
    private var renderScratchRight: [Float] = []
    private var renderScratchCapacity = 0

    private var engineConfigObserver: NSObjectProtocol?
    private var appAudioSessionObserver: NSObjectProtocol?
    private var voicePolicyObserver: NSObjectProtocol?
    private var foregroundObserver: NSObjectProtocol?
    private var reconfigureTask: Task<Void, Never>?
    /// バックグラウンド等で `engine.start()` をスキップしたときに立て、アクティブ復帰時に再開する。
    private var needsEngineResumeOnActive = false
    /// `stop` / `rebuildGraph` 中の同期 ConfigurationChange で旧グラフを再startしない。
    private var isMutatingGraph = false
    private var pendingConfigurationChange = false
    private var pendingConfigurationWorkItem: DispatchWorkItem?

    private var userVolume: Float = EarTrainingBattleVolumePreferences.loadPhraseVolume()
    private var voiceInputDucking = false
    private static let masterHeadroomGain: Float = 0.7
    private init() {
        registerLifecycleObservers()
    }

    func prepare(stage: DefenseStageDefinition, speedRatio: Double) async throws {
        guard stage.audioRegistrationMode == .sharedProgressionSeparateTracks else {
            throw DefenseSeparateTracksAudioError.invalidMode
        }
        let sampleRate = AudioOutputFormatResolver.resolveSampleRate(engine: engine)
        let prepared = try await DefenseSeparateTracksBuffers.prepare(
            stage: stage,
            speedRatio: speedRatio,
            sampleRate: sampleRate
        )
        await MainActor.run {
            self.isStopping = true
            self.needsEngineResumeOnActive = false
            self.reconfigureTask?.cancel()
            self.reconfigureTask = nil
            self.pendingConfigurationWorkItem?.cancel()
            self.pendingConfigurationWorkItem = nil
            self.pendingConfigurationChange = false
            self.isMutatingGraph = true
            defer { self.isMutatingGraph = false }
            self.detachPlaybackGraph(detachMasterMixer: true)
            self.stage = stage
            let state = DefenseSeparateTracksMixerState(
                preparedSet: prepared,
                sessionGeneration: self.sessionGeneration,
                initialPhraseIndex: 0
            )
            state.bgmGain = 0.5
            state.melodyGain = 0.5
            self.mixerState = state
        }
    }

    func start(initialPhraseIndex: Int) {
        let apply = { [weak self] in
            guard let self else { return }
            self.sessionGeneration &+= 1
            self.requestRevision = 0
            self.isStopping = false
            guard let state = self.mixerState else { return }
            state.sessionGeneration = self.sessionGeneration
            state.audiblePhraseIndex = initialPhraseIndex
            state.desiredPhraseIndex = initialPhraseIndex
            state.absoluteCycle = 0
            state.phaseFrame = 0
            state.paused = false
            state.playbackAnchorHostTime = 0
            state.playbackAnchorAbsoluteSample = 0

            let format = DefenseSeparateTracksPlayback.sourceFormat(sampleRate: state.activeSet.grid.sampleRate)
            self.rebuildGraph(sourceFormat: format)
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.async(execute: apply)
        }
    }

    func requestPhrase(at phraseIndex: Int, requestRevision: Int) {
        let generation = sessionGeneration
        mailbox.withLock { state in
            state.pendingPhraseRequest = DefenseSeparateTracksPhraseRequest(
                phraseIndex: phraseIndex,
                revision: requestRevision,
                generation: generation
            )
        }
    }

    func requestTempo(speedPercent: Int) async {
        guard let stage, let state = mixerState else { return }
        tempoRevision += 1
        let revision = tempoRevision
        let generation = sessionGeneration
        let ratio = DefensePracticeSpeed.ratio(speedPercent)
        guard let prepared = try? await DefenseSeparateTracksBuffers.prepare(
            stage: stage,
            speedRatio: ratio,
            sampleRate: state.activeSet.grid.sampleRate
        ) else {
            return
        }
        mailbox.withLock { state in
            state.pendingTempoRequest = DefenseSeparateTracksTempoRequest(
                preparedSet: prepared,
                tempoRevision: revision,
                generation: generation
            )
        }
    }

    func pauseProgression() {
        mixerState?.paused = true
    }

    func resumeProgression() {
        let apply = { [weak self] in
            guard let self else { return }
            self.mixerState?.paused = false
            if self.mixerState != nil, !self.engine.isRunning {
                self.restartEngineIfNeeded()
            }
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.async(execute: apply)
        }
    }

    func stop() {
        let apply = { [weak self] in
            guard let self else { return }
            self.isStopping = true
            self.needsEngineResumeOnActive = false
            self.reconfigureTask?.cancel()
            self.reconfigureTask = nil
            self.pendingConfigurationWorkItem?.cancel()
            self.pendingConfigurationWorkItem = nil
            self.pendingConfigurationChange = false
            self.isMutatingGraph = true
            defer { self.isMutatingGraph = false }
            self.sessionGeneration &+= 1
            self.detachPlaybackGraph(detachMasterMixer: true)
            self.mixerState = nil
            self.stage = nil
            self.mailbox.withLock { state in
                state.pendingPhraseRequest = nil
                state.pendingTempoRequest = nil
            }
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.sync(execute: apply)
        }
    }

    func setUserVolume(_ volume: Float) {
        userVolume = max(0, min(1, volume))
        applyMasterVolume()
    }

    func setVoiceInputDucking(_ active: Bool) {
        voiceInputDucking = active
        applyVoiceInputPlaybackGains()
    }

    func beatInForm() -> Double? {
        guard let position = renderPosition.withLock({ $0 }), engine.isRunning else { return nil }
        let grid = position.grid
        let now = AVAudioTime.seconds(forHostTime: mach_absolute_time()) - presentationLatency
        let framesAhead = max(0, position.endHostSec - now) * grid.sampleRate
        let frame = Double(position.endFrame) - framesAhead
        guard frame >= 0 else { return nil }
        let audibleFrame = Int(frame)
        return DefenseSeparateTracksTransport.beatInForm(
            absoluteCycle: audibleFrame / grid.cycleFrames,
            phaseFrame: audibleFrame % grid.cycleFrames,
            cycleFrames: grid.cycleFrames,
            phraseBars: grid.phraseBars.rawValue,
            beatsPerBar: stage?.beatsPerBar ?? 4,
            cyclesPerForm: grid.cyclesPerForm
        )
    }

    private func registerLifecycleObservers() {
        let center = NotificationCenter.default
        rebindEngineConfigObserver()
        appAudioSessionObserver = center.addObserver(
            forName: AppAudioSession.didReconfigureNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleSharedAudioSessionReconfigure()
        }
        voicePolicyObserver = center.addObserver(
            forName: VoiceSpeakerBleedCoordinator.policyDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.applyVoiceInputPlaybackGains()
        }
        foregroundObserver = center.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self, !self.isStopping, !self.isMutatingGraph, self.mixerState != nil else { return }
            guard self.needsEngineResumeOnActive || !self.engine.isRunning else { return }
            self.restartEngineIfNeeded()
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

    private func handleEngineConfigurationChange() {
        guard !isStopping, mixerState != nil else { return }
        if isMutatingGraph {
            pendingConfigurationChange = true
            return
        }
        startReconfigureTask()
    }

    private func handleSharedAudioSessionReconfigure() {
        guard !isStopping, mixerState != nil else { return }
        if isMutatingGraph {
            pendingConfigurationChange = true
            return
        }
        startReconfigureTask()
    }

    private func schedulePendingConfigurationCheck() {
        pendingConfigurationWorkItem?.cancel()
        let item = DispatchWorkItem { [weak self] in
            guard let self, !self.isStopping, !self.isMutatingGraph, let state = self.mixerState else { return }
            let mismatch = AudioOutputFormatResolver.postStartMismatchedRate(
                engine: self.engine,
                expectedSampleRate: state.activeSet.grid.sampleRate
            ) != nil
            if !self.engine.isRunning || mismatch {
                self.startReconfigureTask()
            }
        }
        pendingConfigurationWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08, execute: item)
    }

    private func startReconfigureTask(
        forcedSampleRate: Double? = nil,
        allowPostStartRetry: Bool = true
    ) {
        reconfigureTask?.cancel()
        reconfigureTask = Task { @MainActor in
            await self.reconfigureAfterHardwareOrSessionChange(
                forcedSampleRate: forcedSampleRate,
                allowPostStartRetry: allowPostStartRetry
            )
        }
    }

    @MainActor
    private func reconfigureAfterHardwareOrSessionChange(
        forcedSampleRate: Double? = nil,
        allowPostStartRetry: Bool = true
    ) async {
        guard !isStopping, !isMutatingGraph, let state = mixerState else { return }
        let generation = sessionGeneration

        if engine.isRunning {
            engine.stop()
        }
        let hardwareRate = forcedSampleRate ?? AudioOutputFormatResolver.resolveSampleRate(engine: engine)
        let preparedRate = state.activeSet.grid.sampleRate
        let rateMismatch = !AudioOutputFormatResolver.sampleRatesMatch(hardwareRate, preparedRate)

        if rateMismatch, let stage {
            let ratio = DefensePracticeSpeed.ratio(state.activeSet.speedPercent)
            if let reconverted = try? await DefenseSeparateTracksBuffers.reconvert(
                preparedSet: state.activeSet,
                stage: stage,
                speedRatio: ratio,
                newSampleRate: hardwareRate
            ) {
                guard !Task.isCancelled,
                      !isStopping,
                      generation == sessionGeneration,
                      mixerState === state else { return }

                let oldCycleFrames = state.activeSet.grid.cycleFrames
                let oldPhaseFrame = state.phaseFrame

                state.activeSet = reconverted
                state.phaseFrame = AudioOutputFormatResolver.remapPhaseFrame(
                    phaseFrame: oldPhaseFrame,
                    oldCycleFrames: oldCycleFrames,
                    newCycleFrames: reconverted.grid.cycleFrames
                )
                state.pendingTempoSet = nil
                state.tempoCrossfadePreviousSet = nil
                state.tempoCrossfadeFramesRemaining = 0
                state.playbackAnchorHostTime = 0
                state.playbackAnchorAbsoluteSample = 0
            }
        }

        guard !Task.isCancelled,
              !isStopping,
              generation == sessionGeneration,
              mixerState === state else { return }
        let format = DefenseSeparateTracksPlayback.sourceFormat(sampleRate: state.activeSet.grid.sampleRate)
        rebuildGraph(sourceFormat: format, allowPostStartRetry: allowPostStartRetry)
    }

    private func rebuildGraph(sourceFormat: AVAudioFormat, allowPostStartRetry: Bool = true) {
        isMutatingGraph = true
        pendingConfigurationChange = false
        var deferredForcedRetryRate: Double?
        defer {
            isMutatingGraph = false
            if let retryRate = deferredForcedRetryRate {
                startReconfigureTask(forcedSampleRate: retryRate, allowPostStartRetry: false)
            } else if pendingConfigurationChange {
                pendingConfigurationChange = false
                schedulePendingConfigurationCheck()
            }
        }

        detachPlaybackGraph(detachMasterMixer: true)
        engine.reset()
        engine = AVAudioEngine()
        masterMixer = AVAudioMixerNode()
        rebindEngineConfigObserver()

        let node = AVAudioSourceNode(format: sourceFormat) { [weak self] _, timestamp, frameCount, audioBufferList -> OSStatus in
            guard let self else { return noErr }
            return self.render(
                timestamp: timestamp,
                frameCount: frameCount,
                audioBufferList: audioBufferList
            )
        }
        sourceNode = node
        engine.attach(node)
        engine.attach(masterMixer)
        _ = engine.outputNode
        engine.connect(node, to: masterMixer, format: sourceFormat)
        engine.connect(masterMixer, to: engine.mainMixerNode, format: sourceFormat)
        sourcePlaybackFormat = sourceFormat
        applyMasterVolume()
        guard AppAudioSession.shared.canStartAudioEngine else {
            needsEngineResumeOnActive = true
            return
        }
        needsEngineResumeOnActive = false
        engine.prepare()
        do {
            try engine.start()
        } catch {
            if AppAudioSession.isCannotStartPlayingError(error) {
                needsEngineResumeOnActive = true
            }
            return
        }
        if allowPostStartRetry,
           let actualRate = AudioOutputFormatResolver.postStartMismatchedRate(
               engine: engine,
               expectedSampleRate: sourceFormat.sampleRate
           ) {
            AudioRateDiagnostics.logEngineStart(
                tag: "DefenseSeparateTracks.start.mismatch",
                engine: engine,
                deckSampleRate: sourceFormat.sampleRate,
                bufferSampleRate: sourceFormat.sampleRate,
                didRetry: false
            )
            deferredForcedRetryRate = actualRate
            return
        }
        AudioRateDiagnostics.logEngineStart(
            tag: "DefenseSeparateTracks.start",
            engine: engine,
            deckSampleRate: sourceFormat.sampleRate,
            bufferSampleRate: sourceFormat.sampleRate,
            didRetry: !allowPostStartRetry
        )
        presentationLatency = sourceNode?.outputPresentationLatency ?? 0
    }

    /// 旧 `AVAudioSourceNode` を engine から外す。`sourceNode = nil` だけでは attach が残り、
    /// 本番を繰り返すたびにレンダーが重なってザビつく。
    private func detachPlaybackGraph(detachMasterMixer: Bool) {
        if engine.isRunning {
            engine.stop()
        }

        if engine.attachedNodes.contains(masterMixer) {
            engine.disconnectNodeInput(masterMixer)
            engine.disconnectNodeOutput(masterMixer)
        }

        if let node = sourceNode {
            if engine.attachedNodes.contains(node) {
                engine.disconnectNodeOutput(node)
                engine.detach(node)
            }
            sourceNode = nil
        }

        let leakedSources = engine.attachedNodes.filter { $0 is AVAudioSourceNode }
        for node in leakedSources {
            engine.disconnectNodeOutput(node)
            engine.detach(node)
        }

        if detachMasterMixer, engine.attachedNodes.contains(masterMixer) {
            engine.detach(masterMixer)
        }

        renderPosition.withLock { $0 = nil }
        sourcePlaybackFormat = nil
    }

    private func restartEngineIfNeeded() {
        guard !isStopping, !isMutatingGraph, mixerState != nil, sourceNode != nil else { return }
        if engine.isRunning {
            engine.stop()
        }
        guard AppAudioSession.shared.canStartAudioEngine else {
            needsEngineResumeOnActive = true
            return
        }
        needsEngineResumeOnActive = false
        engine.prepare()
        do {
            try engine.start()
            applyMasterVolume()
        } catch {
            if AppAudioSession.isCannotStartPlayingError(error) || !AppAudioSession.shared.canStartAudioEngine {
                needsEngineResumeOnActive = true
                return
            }
            if let format = sourcePlaybackFormat {
                rebuildGraph(sourceFormat: format)
            }
            return
        }
        if let expectedRate = sourcePlaybackFormat?.sampleRate {
            if let actualRate = AudioOutputFormatResolver.postStartMismatchedRate(
                engine: engine,
                expectedSampleRate: expectedRate
            ) {
                AudioRateDiagnostics.logEngineStart(
                    tag: "DefenseSeparateTracks.restart.mismatch",
                    engine: engine,
                    deckSampleRate: expectedRate,
                    bufferSampleRate: expectedRate,
                    didRetry: false
                )
                startReconfigureTask(forcedSampleRate: actualRate, allowPostStartRetry: false)
                return
            }
            AudioRateDiagnostics.logEngineStart(
                tag: "DefenseSeparateTracks.restart",
                engine: engine,
                deckSampleRate: expectedRate,
                bufferSampleRate: expectedRate,
                didRetry: false
            )
        }
        presentationLatency = sourceNode?.outputPresentationLatency ?? 0
    }

    private func render(
        timestamp: UnsafePointer<AudioTimeStamp>,
        frameCount: AVAudioFrameCount,
        audioBufferList: UnsafeMutablePointer<AudioBufferList>
    ) -> OSStatus {
        let blockFrames = Int(frameCount)
        zeroFillAudioBufferList(audioBufferList, frameCount: blockFrames)

        guard !isStopping, let state = mixerState else { return noErr }

        ensureScratchCapacity(blockFrames)

        let hostTimeValid = timestamp.pointee.mFlags.contains(.hostTimeValid)
        let hostTime = timestamp.pointee.mHostTime
        if hostTimeValid, state.playbackAnchorHostTime == 0 {
            state.playbackAnchorHostTime = hostTime
            let cycleFrames = max(1, state.activeSet.grid.cycleFrames)
            state.playbackAnchorAbsoluteSample = state.absoluteCycle * cycleFrames + state.phaseFrame
        }

        let requests = mailbox.withLock { state -> (
            DefenseSeparateTracksPhraseRequest?,
            DefenseSeparateTracksTempoRequest?
        ) in
            let phraseRequest = state.pendingPhraseRequest
            let tempoRequest = state.pendingTempoRequest
            state.pendingPhraseRequest = nil
            state.pendingTempoRequest = nil
            return (phraseRequest, tempoRequest)
        }
        let phraseRequest = requests.0
        let tempoRequest = requests.1

        renderScratchLeft.withUnsafeMutableBufferPointer { leftPointer in
            renderScratchRight.withUnsafeMutableBufferPointer { rightPointer in
                guard let leftBase = leftPointer.baseAddress,
                      let rightBase = rightPointer.baseAddress else {
                    return
                }
                _ = DefenseSeparateTracksMix.renderBlock(
                    state: state,
                    outputLeft: leftBase,
                    outputRight: rightBase,
                    blockFrames: blockFrames,
                    phraseRequest: phraseRequest,
                    tempoRequest: tempoRequest,
                    phraseEvalAbsoluteCycle: state.absoluteCycle,
                    phraseEvalPhaseFrame: state.phaseFrame
                )
            }
        }
        writeRenderedBlock(
            audioBufferList: audioBufferList,
            left: renderScratchLeft,
            right: renderScratchRight,
            frameCount: blockFrames
        )
        if !state.paused {
            let grid = state.activeSet.grid
            let blockHost = hostTimeValid ? hostTime : mach_absolute_time()
            let endHostSec = AVAudioTime.seconds(forHostTime: blockHost) + Double(blockFrames) / grid.sampleRate
            let position = RenderPosition(
                endFrame: state.absoluteCycle * grid.cycleFrames + state.phaseFrame,
                endHostSec: endHostSec,
                grid: grid
            )
            // The next audio block can refresh the HUD if the UI is reading this one.
            _ = renderPosition.withLockIfAvailable { $0 = position }
        }
        return noErr
    }

    private func ensureScratchCapacity(_ frames: Int) {
        guard frames > renderScratchCapacity else { return }
        renderScratchLeft = [Float](repeating: 0, count: frames)
        renderScratchRight = [Float](repeating: 0, count: frames)
        renderScratchCapacity = frames
    }

    private func zeroFillAudioBufferList(_ audioBufferList: UnsafeMutablePointer<AudioBufferList>, frameCount: Int) {
        let ablPointer = UnsafeMutableAudioBufferListPointer(audioBufferList)
        for buffer in ablPointer {
            guard let data = buffer.mData else { continue }
            let byteCount = frameCount * Int(buffer.mNumberChannels) * MemoryLayout<Float>.size
            memset(data, 0, byteCount)
        }
    }

    private func writeRenderedBlock(
        audioBufferList: UnsafeMutablePointer<AudioBufferList>,
        left: [Float],
        right: [Float],
        frameCount: Int
    ) {
        let ablPointer = UnsafeMutableAudioBufferListPointer(audioBufferList)
        guard frameCount > 0 else { return }

        if ablPointer.count >= 2,
           let leftData = ablPointer[0].mData?.assumingMemoryBound(to: Float.self),
           let rightData = ablPointer[1].mData?.assumingMemoryBound(to: Float.self),
           ablPointer[0].mNumberChannels == 1,
           ablPointer[1].mNumberChannels == 1 {
            leftData.update(from: left, count: frameCount)
            rightData.update(from: right, count: frameCount)
            return
        }

        if ablPointer.count == 1,
           ablPointer[0].mNumberChannels >= 2,
           let interleaved = ablPointer[0].mData?.assumingMemoryBound(to: Float.self) {
            for frame in 0..<frameCount {
                interleaved[frame * 2] = left[frame]
                interleaved[frame * 2 + 1] = right[frame]
            }
        }
    }

    private func applyVoiceInputPlaybackGains() {
        guard let state = mixerState else {
            applyMasterVolume()
            return
        }
        let snap = VoiceSpeakerBleedCoordinator.shared.snapshot()
        if voiceInputDucking, snap.voiceInputActive {
            state.melodyGain = snap.separateTracksMelodyGain
            state.bgmGain = VoiceInputAudioPolicy.defaultMelodyGain
        } else {
            state.melodyGain = VoiceInputAudioPolicy.defaultMelodyGain
            state.bgmGain = VoiceInputAudioPolicy.defaultMelodyGain
        }
        applyMasterVolume()
    }

    private func applyMasterVolume() {
        let duck = voiceInputDucking
            ? VoiceSpeakerBleedCoordinator.shared.snapshot().duckFactor
            : 1
        masterMixer.outputVolume = userVolume * duck * Self.masterHeadroomGain
    }
}

enum DefenseSeparateTracksAudioError: Error {
    case invalidMode
    case decodeFailed
    case sourceLengthMismatch
}
