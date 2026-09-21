import AVFoundation
import Foundation
import os

final class DefenseSeparateTracksAudio: @unchecked Sendable {
    static let shared = DefenseSeparateTracksAudio()

    private let engine = AVAudioEngine()
    private let masterMixer = AVAudioMixerNode()
    private var sourceNode: AVAudioSourceNode?
    private var mixerState: DefenseSeparateTracksMixerState?
    private var stage: DefenseStageDefinition?
    private var sessionGeneration: UInt64 = 0
    private var requestRevision = 0
    private var tempoRevision = 0

    private var mailboxLock = os_unfair_lock()
    private var pendingPhraseRequest: DefenseSeparateTracksPhraseRequest?
    private var pendingTempoRequest: DefenseSeparateTracksTempoRequest?

    private var snapshotAbsoluteCycle = 0
    private var snapshotPhaseFrame = 0
    private var snapshotGrid: DefenseSeparateTracksGrid?
    private var snapshotSpeedPercent = 100
    private var snapshotAudiblePhraseIndex = 0

    private var userVolume: Float = EarTrainingBattleVolumePreferences.loadPhraseVolume()
    private var voiceInputDucking = false
    private static let voiceInputDuckFactor: Float = 0.5
    private static let masterHeadroomGain: Float = 0.7

    private init() {}

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
        self.stage = stage
        let state = DefenseSeparateTracksMixerState(
            preparedSet: prepared,
            sessionGeneration: sessionGeneration,
            initialPhraseIndex: 0
        )
        state.bgmGain = 0.5
        state.melodyGain = 0.5
        self.mixerState = state
        updateSnapshot(from: state)
    }

    func start(initialPhraseIndex: Int) {
        sessionGeneration &+= 1
        requestRevision = 0
        guard let state = mixerState else { return }
        state.sessionGeneration = sessionGeneration
        state.audiblePhraseIndex = initialPhraseIndex
        state.desiredPhraseIndex = initialPhraseIndex
        state.absoluteCycle = 0
        state.phaseFrame = 0
        state.paused = false

        let format = EarTrainingAudio.preferredOutputFormat()
        engine.stop()
        sourceNode = AVAudioSourceNode(format: format) { [weak self] _, _, frameCount, audioBufferList -> OSStatus in
            guard let self else { return noErr }
            return self.render(frameCount: frameCount, audioBufferList: audioBufferList)
        }

        guard let sourceNode else { return }

        engine.stop()
        engine.reset()
        engine.attach(sourceNode)
        engine.attach(masterMixer)
        engine.connect(sourceNode, to: masterMixer, format: format)
        engine.connect(masterMixer, to: engine.mainMixerNode, format: format)
        applyMasterVolume()
        try? engine.start()
        updateSnapshot(from: state)
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
        guard let stage else { return }
        tempoRevision += 1
        let revision = tempoRevision
        let generation = sessionGeneration
        let ratio = DefensePracticeSpeed.ratio(speedPercent)
        guard let prepared = try? await DefenseSeparateTracksBuffers.prepare(
            stage: stage,
            speedRatio: ratio,
            sampleRate: EarTrainingAudio.preferredOutputFormat().sampleRate
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
        sessionGeneration &+= 1
        engine.stop()
        sourceNode = nil
        mixerState = nil
        stage = nil
        os_unfair_lock_lock(&mailboxLock)
        pendingPhraseRequest = nil
        pendingTempoRequest = nil
        os_unfair_lock_unlock(&mailboxLock)
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

    private func render(frameCount: AVAudioFrameCount, audioBufferList: UnsafeMutablePointer<AudioBufferList>) -> OSStatus {
        guard let state = mixerState else { return noErr }
        let ablPointer = UnsafeMutableAudioBufferListPointer(audioBufferList)
        guard ablPointer.count >= 2,
              let leftBuffer = ablPointer[0].mData?.assumingMemoryBound(to: Float.self),
              let rightBuffer = ablPointer[1].mData?.assumingMemoryBound(to: Float.self) else {
            return noErr
        }

        os_unfair_lock_lock(&mailboxLock)
        let phraseRequest = pendingPhraseRequest
        let tempoRequest = pendingTempoRequest
        pendingPhraseRequest = nil
        pendingTempoRequest = nil
        os_unfair_lock_unlock(&mailboxLock)

        let leadFrames = Int((state.activeSet.grid.sampleRate * 0.1).rounded())
        _ = DefenseSeparateTracksMix.renderBlock(
            state: state,
            outputLeft: leftBuffer,
            outputRight: rightBuffer,
            blockFrames: Int(frameCount),
            leadFrames: leadFrames,
            phraseRequest: phraseRequest,
            tempoRequest: tempoRequest
        )
        updateSnapshot(from: state)
        return noErr
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
