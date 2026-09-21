import AVFoundation
import Foundation
import os
import UIKit

final class DefenseSeparateTracksAudio: @unchecked Sendable {
    static let shared = DefenseSeparateTracksAudio()

    private let engine = AVAudioEngine()
    private let masterMixer = AVAudioMixerNode()
    private var sourceNode: AVAudioSourceNode?
    private var sourcePlaybackFormat: AVAudioFormat?
    private var mixerState: DefenseSeparateTracksMixerState?
    private var stage: DefenseStageDefinition?
    private var sessionGeneration: UInt64 = 0
    private var requestRevision = 0
    private var tempoRevision = 0
    private var isStopping = false

    private var mailboxLock = os_unfair_lock()
    private var pendingPhraseRequest: DefenseSeparateTracksPhraseRequest?
    private var pendingTempoRequest: DefenseSeparateTracksTempoRequest?

    private var snapshotAbsoluteCycle = 0
    private var snapshotPhaseFrame = 0
    private var snapshotGrid: DefenseSeparateTracksGrid?
    private var snapshotSpeedPercent = 100
    private var snapshotAudiblePhraseIndex = 0

    private var renderScratchLeft: [Float] = []
    private var renderScratchRight: [Float] = []
    private var renderScratchCapacity = 0

    private var engineConfigObserver: NSObjectProtocol?
    private var survivalCaptureObserver: NSObjectProtocol?
    private var appAudioSessionObserver: NSObjectProtocol?
    private var foregroundObserver: NSObjectProtocol?
    /// `stop` / `rebuildGraph` 中の同期 ConfigurationChange で旧グラフを再startしない。
    private var isMutatingGraph = false

    private var userVolume: Float = EarTrainingBattleVolumePreferences.loadPhraseVolume()
    private var voiceInputDucking = false
    private static let voiceInputDuckFactor: Float = 0.5
    private static let masterHeadroomGain: Float = 0.7
    private static let sampleRateMismatchThreshold = 0.01

    private init() {
        registerLifecycleObservers()
    }

    func prepare(stage: DefenseStageDefinition, speedRatio: Double) async throws {
        guard stage.audioRegistrationMode == .sharedProgressionSeparateTracks else {
            throw DefenseSeparateTracksAudioError.invalidMode
        }
        let playbackFormat = EarTrainingAudio.preferredOutputFormat()
        let prepared = try await DefenseSeparateTracksBuffers.prepare(
            stage: stage,
            speedRatio: speedRatio,
            sampleRate: playbackFormat.sampleRate
        )
        await MainActor.run {
            self.isStopping = true
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
            self.updateSnapshot(from: state)
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

            let format = DefenseSeparateTracksPlayback.sourceFormat(sampleRate: state.activeSet.grid.sampleRate)
            self.rebuildGraph(sourceFormat: format)
            self.updateSnapshot(from: state)
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.async(execute: apply)
        }
    }

    func requestPhrase(at phraseIndex: Int, requestRevision: Int) {
        os_unfair_lock_lock(&mailboxLock)
        pendingPhraseRequest = DefenseSeparateTracksPhraseRequest(
            phraseIndex: phraseIndex,
            revision: requestRevision,
            generation: sessionGeneration
        )
        os_unfair_lock_unlock(&mailboxLock)
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
        os_unfair_lock_lock(&mailboxLock)
        pendingTempoRequest = DefenseSeparateTracksTempoRequest(
            preparedSet: prepared,
            tempoRevision: revision,
            generation: generation
        )
        os_unfair_lock_unlock(&mailboxLock)
    }

    func pauseProgression() {
        mixerState?.paused = true
    }

    func resumeProgression() {
        mixerState?.paused = false
    }

    func stop() {
        let apply = { [weak self] in
            guard let self else { return }
            self.isStopping = true
            self.isMutatingGraph = true
            defer { self.isMutatingGraph = false }
            self.sessionGeneration &+= 1
            self.detachPlaybackGraph(detachMasterMixer: true)
            self.mixerState = nil
            self.stage = nil
            self.snapshotGrid = nil
            self.snapshotAbsoluteCycle = 0
            self.snapshotPhaseFrame = 0
            os_unfair_lock_lock(&self.mailboxLock)
            self.pendingPhraseRequest = nil
            self.pendingTempoRequest = nil
            os_unfair_lock_unlock(&self.mailboxLock)
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
        applyMasterVolume()
    }

    func beatInForm() -> Double {
        guard let grid = snapshotGrid else { return 0 }
        return DefenseSeparateTracksTransport.beatInForm(
            absoluteCycle: snapshotAbsoluteCycle,
            phaseFrame: snapshotPhaseFrame,
            cycleFrames: grid.cycleFrames,
            phraseBars: grid.phraseBars.rawValue,
            beatsPerBar: stage?.beatsPerBar ?? 4,
            cyclesPerForm: grid.cyclesPerForm
        )
    }

    private func registerLifecycleObservers() {
        let center = NotificationCenter.default
        engineConfigObserver = center.addObserver(
            forName: .AVAudioEngineConfigurationChange,
            object: engine,
            queue: .main
        ) { [weak self] _ in
            self?.handleEngineConfigurationChange()
        }
        survivalCaptureObserver = center.addObserver(
            forName: SurvivalGameAudio.didReconfigureAudioGraphNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleSharedAudioSessionReconfigure()
        }
        appAudioSessionObserver = center.addObserver(
            forName: AppAudioSession.didReconfigureNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleSharedAudioSessionReconfigure()
        }
        foregroundObserver = center.addObserver(
            forName: UIApplication.willEnterForegroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self, !self.isStopping, !self.isMutatingGraph else { return }
            self.restartEngineIfNeeded()
        }
    }

    private func handleEngineConfigurationChange() {
        guard !isStopping, !isMutatingGraph, mixerState != nil else { return }
        restartEngineIfNeeded()
    }

    private func handleSharedAudioSessionReconfigure() {
        guard !isStopping, !isMutatingGraph, mixerState != nil else { return }
        Task { @MainActor in
            await self.reconvertAndReconnectIfNeeded()
        }
    }

    @MainActor
    private func reconvertAndReconnectIfNeeded() async {
        guard !isStopping, !isMutatingGraph, let state = mixerState, let stage else { return }
        let generation = sessionGeneration

        let hardwareRate = EarTrainingAudio.preferredHardwareSampleRate()
        let preparedRate = state.activeSet.grid.sampleRate
        let rateMismatch = abs(hardwareRate - preparedRate) / preparedRate > Self.sampleRateMismatchThreshold

        if rateMismatch {
            let ratio = DefensePracticeSpeed.ratio(state.activeSet.speedPercent)
            guard let reconverted = try? await DefenseSeparateTracksBuffers.reconvert(
                preparedSet: state.activeSet,
                stage: stage,
                speedRatio: ratio,
                newSampleRate: hardwareRate
            ) else {
                guard !isStopping, generation == sessionGeneration, mixerState === state else { return }
                restartEngineIfNeeded()
                return
            }
            guard !isStopping, generation == sessionGeneration, mixerState === state else { return }
            guard reconverted.setId != state.activeSet.setId else {
                restartEngineIfNeeded()
                return
            }

            let audiblePhraseIndex = state.audiblePhraseIndex
            let absoluteCycle = state.absoluteCycle
            let phaseFrame = state.phaseFrame
            let paused = state.paused

            state.activeSet = reconverted
            state.pendingTempoSet = nil
            state.tempoCrossfadePreviousSet = nil
            state.tempoCrossfadeFramesRemaining = 0
            state.audiblePhraseIndex = audiblePhraseIndex
            state.desiredPhraseIndex = audiblePhraseIndex
            state.absoluteCycle = absoluteCycle
            state.phaseFrame = min(phaseFrame, max(1, reconverted.grid.cycleFrames) - 1)
            state.paused = paused

            let format = DefenseSeparateTracksPlayback.sourceFormat(sampleRate: reconverted.grid.sampleRate)
            rebuildGraph(sourceFormat: format)
            updateSnapshot(from: state)
            return
        }

        restartEngineIfNeeded()
    }

    private func rebuildGraph(sourceFormat: AVAudioFormat) {
        isMutatingGraph = true
        defer { isMutatingGraph = false }

        detachPlaybackGraph(detachMasterMixer: false)

        let node = AVAudioSourceNode(format: sourceFormat) { [weak self] _, _, frameCount, audioBufferList -> OSStatus in
            guard let self else { return noErr }
            return self.render(frameCount: frameCount, audioBufferList: audioBufferList)
        }
        sourceNode = node
        engine.attach(node)
        if !engine.attachedNodes.contains(masterMixer) {
            engine.attach(masterMixer)
        }
        engine.connect(node, to: masterMixer, format: sourceFormat)
        engine.connect(masterMixer, to: engine.mainMixerNode, format: nil)
        sourcePlaybackFormat = sourceFormat
        applyMasterVolume()
        engine.prepare()
        try? engine.start()
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

        sourcePlaybackFormat = nil
    }

    private func restartEngineIfNeeded() {
        guard !isStopping, !isMutatingGraph, mixerState != nil, sourceNode != nil else { return }
        if engine.isRunning {
            engine.stop()
        }
        engine.prepare()
        try? engine.start()
    }

    private func render(frameCount: AVAudioFrameCount, audioBufferList: UnsafeMutablePointer<AudioBufferList>) -> OSStatus {
        let blockFrames = Int(frameCount)
        zeroFillAudioBufferList(audioBufferList, frameCount: blockFrames)

        guard !isStopping, let state = mixerState else { return noErr }

        ensureScratchCapacity(blockFrames)

        os_unfair_lock_lock(&mailboxLock)
        let phraseRequest = pendingPhraseRequest
        let tempoRequest = pendingTempoRequest
        pendingPhraseRequest = nil
        pendingTempoRequest = nil
        os_unfair_lock_unlock(&mailboxLock)

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
                    tempoRequest: tempoRequest
                )
            }
        }
        writeRenderedBlock(
            audioBufferList: audioBufferList,
            left: renderScratchLeft,
            right: renderScratchRight,
            frameCount: blockFrames
        )
        updateSnapshot(from: state)
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

    private func updateSnapshot(from state: DefenseSeparateTracksMixerState) {
        snapshotAbsoluteCycle = state.absoluteCycle
        snapshotPhaseFrame = state.phaseFrame
        snapshotGrid = state.activeSet.grid
        snapshotSpeedPercent = state.activeSet.speedPercent
        snapshotAudiblePhraseIndex = state.audiblePhraseIndex
    }

    private func applyMasterVolume() {
        let duck = voiceInputDucking ? Self.voiceInputDuckFactor : 1
        masterMixer.outputVolume = userVolume * duck * Self.masterHeadroomGain
    }
}

enum DefenseSeparateTracksAudioError: Error {
    case invalidMode
    case decodeFailed
    case sourceLengthMismatch
}
