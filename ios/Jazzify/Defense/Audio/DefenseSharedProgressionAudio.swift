import AVFoundation
import Foundation
import UIKit

final class DefenseSharedProgressionAudio: @unchecked Sendable {
    static let shared = DefenseSharedProgressionAudio()

    private static let masterHeadroomGain: Float = 0.7
    private static let startLeadSec = 0.15
    private static let scheduleMinQuantumSec = 0.001

    private let cache = RemoteAudioFileCache(subdirectory: "defense-shared-progression")
    private var engine = AVAudioEngine()
    private var playerA = AVAudioPlayerNode()
    private var playerB = AVAudioPlayerNode()
    private var deckMixer = AVAudioMixerNode()
    private var masterMixer = AVAudioMixerNode()
    private var timePitch = AVAudioUnitTimePitch()
    private var graphReady = false
    private var isMutatingGraph = false
    private var pendingConfigurationChange = false
    private var pendingConfigurationWorkItem: DispatchWorkItem?
    private var activeIsA = true
    private var stage: DefenseStageDefinition?
    private var playbackRatio: Double = 1
    private var progressionBars = 12
    private var switchEveryBars = 1
    private var barSec: Double = 2
    private var presentationLatency: TimeInterval = 0
    private var transportStartHostSec: Double = 0
    private var generation: UInt64 = 0
    private var requestRevision = 0
    private var desiredPhraseIndex = 0
    private var audiblePhraseIndex = 0
    private var scheduledSwitchAtHostSec: Double = -1
    private var scheduledPhraseIndex: Int?
    private var wakeWorkItem: DispatchWorkItem?
    private var nativeBuffersByPhraseIndex: [Int: AVAudioPCMBuffer] = [:]
    private var buffersByPhraseIndex: [Int: AVAudioPCMBuffer] = [:]
    private var barFramesByPhraseIndex: [Int: [Int]] = [:]
    private var deckFormat: AVAudioFormat?
    private var buffersFormat: AVAudioFormat?
    private var desiredPlaybackRate: Float = 1
    private var paused = false
    private var pausedOffsetSec: Double = 0
    private var userVolume: Float = EarTrainingBattleVolumePreferences.loadPhraseVolume()
    private var voiceInputDucking = false
    private var lifecycleObserversRegistered = false
    private var appAudioSessionObserver: NSObjectProtocol?
    private var engineConfigObserver: NSObjectProtocol?
    private var voicePolicyObserver: NSObjectProtocol?
    private var didBecomeActiveObserver: NSObjectProtocol?
    private var needsEngineResumeOnActive = false

    private init() {}

    func setUserVolume(_ volume: Float) {
        runOnMain { [weak self] in
            guard let self else { return }
            self.userVolume = max(0, min(1, volume))
            self.applyMasterVolume()
        }
    }

    func setVoiceInputDucking(_ enabled: Bool) {
        runOnMain { [weak self] in
            guard let self else { return }
            self.voiceInputDucking = enabled
            self.applyMasterVolume()
        }
    }

    func setPlaybackRate(_ rate: Float) {
        runOnMain { [weak self] in
            guard let self else { return }
            self.desiredPlaybackRate = max(0.1, rate)
            self.applyTimePitchSettings()
        }
    }

    private func applyTimePitchSettings() {
        let rate = desiredPlaybackRate
        timePitch.rate = rate
        timePitch.pitch = 0
        timePitch.bypass = abs(rate - 1) < 0.0001
    }

    private func applyMasterVolume() {
        var output = Self.masterHeadroomGain * userVolume
        if voiceInputDucking {
            output *= VoiceSpeakerBleedCoordinator.shared.snapshot().duckFactor
        }
        masterMixer.outputVolume = output
    }

    func prepare(stage: DefenseStageDefinition, speedRatio: Double) async throws {
        guard stage.audioRegistrationMode == .sharedProgression,
              let progressionBars = stage.progressionBars,
              progressionBars > 0,
              [1, 2, 4].contains(stage.phraseBars),
              progressionBars % stage.phraseBars == 0
        else {
            throw URLError(.badURL)
        }

        let outputFormat = AudioOutputFormatResolver.stereoFormat(
            sampleRate: AudioOutputFormatResolver.resolveSampleRate(
                outputNodeSampleRate: 0,
                sessionSampleRate: AVAudioSession.sharedInstance().sampleRate
            )
        )
        let prepared = try await decodePreparedPhrases(
            stage: stage,
            progressionBars: progressionBars,
            outputFormat: outputFormat
        )

        await MainActor.run {
            self.buffersFormat = outputFormat
            self.stage = stage
            self.playbackRatio = max(0.1, speedRatio)
            self.progressionBars = progressionBars
            self.switchEveryBars = stage.phraseBars
            self.barSec = DefenseSharedProgressionTransport.barSeconds(
                bpm: stage.bpm,
                beatsPerBar: stage.beatsPerBar,
                playbackRatio: self.playbackRatio
            )
            self.nativeBuffersByPhraseIndex = prepared.nativeBuffers
            self.buffersByPhraseIndex = prepared.buffers
            self.barFramesByPhraseIndex = prepared.barFrames
        }
    }

    private func decodePreparedPhrases(
        stage: DefenseStageDefinition,
        progressionBars: Int,
        outputFormat: AVAudioFormat
    ) async throws -> (
        buffers: [Int: AVAudioPCMBuffer],
        barFrames: [Int: [Int]],
        nativeBuffers: [Int: AVAudioPCMBuffer]
    ) {
        var buffers: [Int: AVAudioPCMBuffer] = [:]
        var barFrames: [Int: [Int]] = [:]
        var nativeBuffers: [Int: AVAudioPCMBuffer] = [:]

        for index in stage.phrases.indices {
            let phrase = stage.phrases[index]
            guard let url = URL(string: phrase.audioUrl) else {
                throw URLError(.badURL)
            }
            let decodedNative = try await decodeNativePCM(url: url)
            nativeBuffers[index] = decodedNative
            guard let decoded = EarTrainingAudio.convertBuffer(decodedNative, to: outputFormat) else {
                throw URLError(.cannotDecodeContentData)
            }
            let sampleRate = decoded.format.sampleRate
            let expectedFrames = DefenseSharedProgressionTransport.expectedFrameCount(
                progressionBars: progressionBars,
                bpm: stage.bpm,
                beatsPerBar: stage.beatsPerBar,
                sampleRate: sampleRate
            )
            guard DefenseSharedProgressionTransport.isFrameCountValid(
                actualFrames: Int(decoded.frameLength),
                expectedFrames: expectedFrames,
                sampleRate: sampleRate
            ) else {
                throw URLError(.cannotDecodeContentData)
            }
            guard let fitted = DefensePhraseBacking.fitPCMBuffer(
                decoded,
                frameCount: AVAudioFrameCount(max(1, expectedFrames))
            ) else {
                throw URLError(.cannotDecodeContentData)
            }
            buffers[index] = fitted
            barFrames[index] = DefenseSharedProgressionTransport.buildBarFrameTable(
                progressionBars: progressionBars,
                barFrameCount: Int(fitted.frameLength)
            )
        }

        return (buffers, barFrames, nativeBuffers)
    }

    func start(initialPhraseIndex: Int) {
        runOnMain { [weak self] in
            guard let self else { return }
            self.generation &+= 1
            self.stopPlayers(resetTransport: true)
            self.desiredPhraseIndex = initialPhraseIndex
            self.audiblePhraseIndex = initialPhraseIndex
            self.requestRevision = 0
            self.paused = false
            self.pausedOffsetSec = 0
            self.activeIsA = true
            self.playActivePhraseImmediate(at: initialPhraseIndex, offsetSec: 0)
        }
    }

    func requestPhrase(at index: Int, requestRevision: Int) {
        runOnMain { [weak self] in
            guard let self, !self.paused else { return }
            self.desiredPhraseIndex = index
            self.requestRevision = requestRevision
            if index == self.audiblePhraseIndex, self.scheduledPhraseIndex == nil {
                return
            }
            self.scheduleDesiredSwitch()
        }
    }

    func pauseProgression() {
        runOnMain { [weak self] in
            guard let self, !self.paused else { return }
            let now = Self.hostTimeSec()
            self.pausedOffsetSec = max(0, now - self.transportStartHostSec)
            self.paused = true
            self.needsEngineResumeOnActive = false
            self.generation &+= 1
            self.cancelWake()
            self.stopPlayers(resetTransport: false)
        }
    }

    func resumeProgression() {
        runOnMain { [weak self] in
            guard let self, self.paused else { return }
            self.paused = false
            self.generation &+= 1
            let loopDuration = Double(self.progressionBars) * self.barSec
            let offsetSec = loopDuration > 0 ? self.pausedOffsetSec.truncatingRemainder(dividingBy: loopDuration) : 0
            self.playActivePhraseImmediate(at: self.audiblePhraseIndex, offsetSec: offsetSec)
            if self.desiredPhraseIndex != self.audiblePhraseIndex {
                self.scheduleDesiredSwitch()
            }
        }
    }

    func restartFromProgressionStart(phraseIndex: Int, speedRatio: Double) {
        runOnMain { [weak self] in
            guard let self, let stage = self.stage else { return }
            self.playbackRatio = max(0.1, speedRatio)
            self.barSec = DefenseSharedProgressionTransport.barSeconds(
                bpm: stage.bpm,
                beatsPerBar: stage.beatsPerBar,
                playbackRatio: self.playbackRatio
            )
            self.generation &+= 1
            self.stopPlayers(resetTransport: true)
            self.desiredPhraseIndex = phraseIndex
            self.audiblePhraseIndex = phraseIndex
            self.activeIsA = true
            self.playActivePhraseImmediate(at: phraseIndex, offsetSec: 0)
        }
    }

    func stop() {
        runOnMain { [weak self] in
            guard let self else { return }
            self.generation &+= 1
            self.cancelWake()
            self.pendingConfigurationWorkItem?.cancel()
            self.pendingConfigurationWorkItem = nil
            self.pendingConfigurationChange = false
            self.stopPlayers(resetTransport: true)
            self.stage = nil
            self.needsEngineResumeOnActive = false
            self.nativeBuffersByPhraseIndex.removeAll()
            self.buffersByPhraseIndex.removeAll()
            self.barFramesByPhraseIndex.removeAll()
            self.deckFormat = nil
            self.buffersFormat = nil
            if self.engine.isRunning {
                self.engine.stop()
            }
        }
    }

    private func scheduleDesiredSwitch() {
        guard let stage else { return }
        let now = Self.hostTimeSec()
        let beatSec = DefenseTransport.beatSeconds(bpm: stage.bpm, playbackRatio: playbackRatio)
        let plan = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: now,
            transportStart: transportStartHostSec,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: DefenseSharedProgressionSwitchEveryBars(rawValue: switchEveryBars) ?? .one,
            beatSec: beatSec
        )

        if plan.immediate {
            let switchAt = max(now + Self.scheduleMinQuantumSec, plan.switchAt)
            let offsetSec = max(0, now - transportStartHostSec)
            playActivePhraseImmediate(
                at: desiredPhraseIndex,
                offsetSec: offsetSec,
                startAtHostSec: switchAt
            )
            return
        }

        if scheduledSwitchAtHostSec >= 0,
           abs(scheduledSwitchAtHostSec - plan.switchAt) < 1e-6,
           now < plan.switchAt,
           scheduledPhraseIndex == desiredPhraseIndex {
            return
        }

        if scheduledSwitchAtHostSec >= 0, now >= scheduledSwitchAtHostSec {
            return
        }

        prescheduleIncomingSwitch(phraseIndex: desiredPhraseIndex, plan: plan)
    }

    private func performScheduledSwitch() {
        guard !paused else { return }
        let now = Self.hostTimeSec()
        guard scheduledSwitchAtHostSec >= 0 else { return }
        if now + 0.005 < scheduledSwitchAtHostSec {
            scheduleWake(atHostSec: scheduledSwitchAtHostSec - 0.12)
            return
        }

        let outgoing = activeIsA ? playerA : playerB
        outgoing.stop()
        outgoing.reset()

        if let scheduled = scheduledPhraseIndex {
            audiblePhraseIndex = scheduled
        } else {
            audiblePhraseIndex = desiredPhraseIndex
        }

        activeIsA.toggle()
        scheduledPhraseIndex = nil
        scheduledSwitchAtHostSec = -1
    }

    private func playActivePhraseImmediate(
        at phraseIndex: Int,
        offsetSec: Double,
        startAtHostSec: Double? = nil,
        forcedSampleRate: Double? = nil,
        allowPostStartRetry: Bool = true
    ) {
        if let forcedSampleRate {
            ensureGraph(forceRebuild: true, forcedSampleRate: forcedSampleRate)
        } else {
            ensureGraph()
        }
        if let format = deckFormat {
            rebuildBuffersIfNeeded(for: format)
        }

        guard let buffer = buffersByPhraseIndex[phraseIndex],
              let barFrames = barFramesByPhraseIndex[phraseIndex],
              barFrames.count > progressionBars
        else { return }

        cancelWake()
        scheduledPhraseIndex = nil
        scheduledSwitchAtHostSec = -1

        let active = activeIsA ? playerA : playerB
        let inactive = activeIsA ? playerB : playerA

        inactive.stop()
        inactive.reset()
        active.stop()
        active.reset()

        let totalSec = Double(progressionBars) * barSec
        let wrappedOffset = totalSec > 0 ? offsetSec.truncatingRemainder(dividingBy: totalSec) : 0
        let formStart = AVAudioFramePosition(barFrames[0])
        let formEnd = AVAudioFramePosition(barFrames[progressionBars])
        let formFrames = max(1, formEnd - formStart)
        let startFrame = wrappedOffset <= 0
            ? formStart
            : formStart + AVAudioFramePosition((wrappedOffset / totalSec) * Double(formFrames))

        if startFrame <= formStart {
            scheduleFullLoop(for: phraseIndex, player: active, at: nil)
        } else {
            let tailCount = AVAudioFrameCount(max(0, formEnd - startFrame))
            if tailCount > 0,
               let tailBuffer = DefensePhraseBacking.slicePCMBuffer(
                   buffer,
                   startingFrame: startFrame,
                   frameCount: tailCount
               ) {
                active.scheduleBuffer(tailBuffer, at: nil, options: [])
                scheduleLoopHead(for: phraseIndex, player: active, at: nil)
            } else {
                scheduleLoopHead(for: phraseIndex, player: active, at: nil)
            }
        }

        do {
            if !engine.isRunning {
                guard AppAudioSession.shared.canStartAudioEngine else {
                    needsEngineResumeOnActive = true
                    return
                }
                engine.prepare()
                try engine.start()
            }
        } catch {
            if AppAudioSession.isCannotStartPlayingError(error) {
                needsEngineResumeOnActive = true
            }
            return
        }
        needsEngineResumeOnActive = false

        if allowPostStartRetry,
           let expectedRate = deckFormat?.sampleRate,
           let actualRate = AudioOutputFormatResolver.postStartMismatchedRate(
               engine: engine,
               expectedSampleRate: expectedRate
           ) {
            AudioRateDiagnostics.logEngineStart(
                tag: "DefenseSharedProgression.play.mismatch",
                engine: engine,
                deckSampleRate: expectedRate,
                bufferSampleRate: buffer.format.sampleRate,
                didRetry: false
            )
            playActivePhraseImmediate(
                at: phraseIndex,
                offsetSec: offsetSec,
                startAtHostSec: startAtHostSec,
                forcedSampleRate: actualRate,
                allowPostStartRetry: false
            )
            return
        }

        AudioRateDiagnostics.logEngineStart(
            tag: "DefenseSharedProgression.play",
            engine: engine,
            deckSampleRate: deckFormat?.sampleRate ?? 0,
            bufferSampleRate: buffer.format.sampleRate,
            didRetry: !allowPostStartRetry
        )

        let now = Self.hostTimeSec()
        let start = max(now + Self.scheduleMinQuantumSec, startAtHostSec ?? (now + Self.startLeadSec))
        presentationLatency = active.outputPresentationLatency
        transportStartHostSec = start - offsetSec
        active.play(at: AVAudioTime(hostTime: AVAudioTime.hostTime(forSeconds: start)))
        applyMasterVolume()
    }

    private func prescheduleIncomingSwitch(
        phraseIndex: Int,
        plan: DefenseSharedProgressionSwitchPlan
    ) {
        ensureGraph()
        if let format = deckFormat {
            rebuildBuffersIfNeeded(for: format)
        }

        guard let buffer = buffersByPhraseIndex[phraseIndex],
              let barFrames = barFramesByPhraseIndex[phraseIndex],
              barFrames.count > progressionBars
        else { return }

        cancelWake()

        let when = AVAudioTime(hostTime: AVAudioTime.hostTime(forSeconds: plan.switchAt))
        let incoming = activeIsA ? playerB : playerA

        incoming.stop()
        incoming.reset()

        if plan.destinationBar0 <= 0 {
            scheduleFullLoop(for: phraseIndex, player: incoming, at: when)
        } else {
            let startFrame = AVAudioFramePosition(barFrames[plan.destinationBar0])
            let endFrame = AVAudioFramePosition(barFrames[progressionBars])
            let tailCount = AVAudioFrameCount(max(0, endFrame - startFrame))
            if tailCount > 0,
               let tailBuffer = DefensePhraseBacking.slicePCMBuffer(
                   buffer,
                   startingFrame: startFrame,
                   frameCount: tailCount
               ) {
                incoming.scheduleBuffer(tailBuffer, at: when, options: [])
                scheduleLoopHead(for: phraseIndex, player: incoming, at: nil)
            } else {
                scheduleLoopHead(for: phraseIndex, player: incoming, at: when)
            }
        }

        do {
            if !engine.isRunning {
                guard AppAudioSession.shared.canStartAudioEngine else {
                    needsEngineResumeOnActive = true
                    return
                }
                try engine.start()
            }
        } catch {
            if AppAudioSession.isCannotStartPlayingError(error) {
                needsEngineResumeOnActive = true
            }
            return
        }
        needsEngineResumeOnActive = false

        incoming.play()
        applyMasterVolume()

        scheduledPhraseIndex = phraseIndex
        scheduledSwitchAtHostSec = plan.switchAt
        scheduleWake(atHostSec: plan.switchAt)
    }

    private func scheduleFullLoop(
        for phraseIndex: Int,
        player: AVAudioPlayerNode,
        at when: AVAudioTime?
    ) {
        guard let buffer = buffersByPhraseIndex[phraseIndex],
              let barFrames = barFramesByPhraseIndex[phraseIndex],
              barFrames.count > progressionBars
        else { return }
        let loopCount = AVAudioFrameCount(max(1, barFrames[progressionBars] - barFrames[0]))
        guard let loopBuffer = DefensePhraseBacking.slicePCMBuffer(
            buffer,
            startingFrame: AVAudioFramePosition(barFrames[0]),
            frameCount: loopCount
        ) else { return }
        player.scheduleBuffer(loopBuffer, at: when, options: [.loops])
    }

    private func scheduleLoopHead(
        for phraseIndex: Int,
        player: AVAudioPlayerNode,
        at when: AVAudioTime?
    ) {
        scheduleFullLoop(for: phraseIndex, player: player, at: when)
    }

    private func scheduleWake(atHostSec: Double) {
        cancelWake()
        let delay = max(0, atHostSec - Self.hostTimeSec())
        let item = DispatchWorkItem { [weak self] in
            self?.performScheduledSwitch()
        }
        wakeWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: item)
    }

    private func cancelWake() {
        wakeWorkItem?.cancel()
        wakeWorkItem = nil
    }

    private func stopPlayers(resetTransport: Bool) {
        playerA.stop()
        playerB.stop()
        playerA.reset()
        playerB.reset()
        cancelWake()
        scheduledPhraseIndex = nil
        scheduledSwitchAtHostSec = -1
        if resetTransport {
            transportStartHostSec = 0
        }
    }

    private func ensureGraph(forceRebuild: Bool = false, forcedSampleRate: Double? = nil) {
        registerLifecycleObserversIfNeeded()
        let resolved = forcedSampleRate.map { AudioOutputFormatResolver.stereoFormat(sampleRate: $0) }
            ?? AudioOutputFormatResolver.stereoFormat(engine: engine)
        if graphReady, !forceRebuild, forcedSampleRate == nil, let deckFormat,
           deckFormat.isEqual(resolved),
           AudioOutputFormatResolver.sampleRatesMatch(deckFormat.sampleRate, resolved.sampleRate) {
            return
        }
        let needsRebuild = !graphReady
            || forceRebuild
            || forcedSampleRate != nil
            || deckFormat == nil
            || !AudioOutputFormatResolver.sampleRatesMatch(deckFormat?.sampleRate ?? 0, resolved.sampleRate)
        guard needsRebuild else { return }

        let ownsMutationGuard = !isMutatingGraph
        if ownsMutationGuard {
            isMutatingGraph = true
        }
        defer {
            if ownsMutationGuard {
                isMutatingGraph = false
                if pendingConfigurationChange {
                    pendingConfigurationChange = false
                    schedulePendingConfigurationCheck()
                }
            }
        }

        if graphReady || forceRebuild || forcedSampleRate != nil {
            playerA.stop()
            playerB.stop()
            if engine.isRunning {
                engine.stop()
            }
            engine.reset()
            engine = AVAudioEngine()
            playerA = AVAudioPlayerNode()
            playerB = AVAudioPlayerNode()
            deckMixer = AVAudioMixerNode()
            masterMixer = AVAudioMixerNode()
            timePitch = AVAudioUnitTimePitch()
            rebindEngineConfigObserver()
            graphReady = false
        }
        let format = forcedSampleRate.map { AudioOutputFormatResolver.stereoFormat(sampleRate: $0) }
            ?? AudioOutputFormatResolver.stereoFormat(engine: engine)
        deckFormat = format
        engine.attach(deckMixer)
        engine.attach(masterMixer)
        engine.attach(timePitch)
        engine.attach(playerA)
        engine.attach(playerB)
        _ = engine.outputNode
        engine.connect(playerA, to: deckMixer, format: format)
        engine.connect(playerB, to: deckMixer, format: format)
        engine.connect(deckMixer, to: timePitch, format: format)
        engine.connect(timePitch, to: masterMixer, format: format)
        engine.connect(masterMixer, to: engine.mainMixerNode, format: format)
        applyTimePitchSettings()
        applyMasterVolume()
        graphReady = true
    }

    private func rebuildBuffersIfNeeded(for format: AVAudioFormat) {
        guard let stage, !nativeBuffersByPhraseIndex.isEmpty else { return }
        if let buffersFormat,
           buffersFormat.isEqual(format),
           AudioOutputFormatResolver.sampleRatesMatch(buffersFormat.sampleRate, format.sampleRate),
           !buffersByPhraseIndex.isEmpty {
            return
        }
        var rebuiltBuffers: [Int: AVAudioPCMBuffer] = [:]
        var rebuiltBarFrames: [Int: [Int]] = [:]
        for (index, native) in nativeBuffersByPhraseIndex {
            guard let converted = EarTrainingAudio.convertBuffer(native, to: format) else { continue }
            let expectedFrames = DefenseSharedProgressionTransport.expectedFrameCount(
                progressionBars: progressionBars,
                bpm: stage.bpm,
                beatsPerBar: stage.beatsPerBar,
                sampleRate: format.sampleRate
            )
            guard let fitted = DefensePhraseBacking.fitPCMBuffer(
                converted,
                frameCount: AVAudioFrameCount(max(1, expectedFrames))
            ) else { continue }
            rebuiltBuffers[index] = fitted
            rebuiltBarFrames[index] = DefenseSharedProgressionTransport.buildBarFrameTable(
                progressionBars: progressionBars,
                barFrameCount: Int(fitted.frameLength)
            )
        }
        buffersByPhraseIndex = rebuiltBuffers
        barFramesByPhraseIndex = rebuiltBarFrames
        buffersFormat = format
    }

    private func decodeNativePCM(url: URL) async throws -> AVAudioPCMBuffer {
        let local = try await cache.localFileURL(for: url)
        return try await Task.detached(priority: .userInitiated) {
            let file = try AVAudioFile(forReading: local)
            let frameCount = AVAudioFrameCount(file.length)
            guard let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat, frameCapacity: frameCount) else {
                throw URLError(.cannotDecodeContentData)
            }
            try file.read(into: buffer)
            guard buffer.frameLength > 0 else {
                throw URLError(.cannotDecodeContentData)
            }
            return buffer
        }.value
    }

    private func runOnMain(_ block: @escaping () -> Void) {
        if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.async(execute: block)
        }
    }

    func beatInForm() -> Double? {
        guard transportStartHostSec > 0, engine.isRunning, barSec > 0, progressionBars > 0 else { return nil }
        let elapsed = Self.hostTimeSec() - presentationLatency - transportStartHostSec
        guard elapsed >= 0 else { return nil }
        let absoluteBar = elapsed / barSec
        let barInForm = absoluteBar.truncatingRemainder(dividingBy: Double(progressionBars))
        let beatsPerBar = Double(stage?.beatsPerBar ?? 4)
        return barInForm * beatsPerBar
    }

    private static func hostTimeSec() -> Double {
        AVAudioTime.seconds(forHostTime: mach_absolute_time())
    }

    private func registerLifecycleObserversIfNeeded() {
        guard !lifecycleObserversRegistered else { return }
        lifecycleObserversRegistered = true
        let center = NotificationCenter.default
        appAudioSessionObserver = center.addObserver(
            forName: AppAudioSession.didReconfigureNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.handleSharedAudioSessionReconfigure()
        }
        rebindEngineConfigObserver()
        voicePolicyObserver = center.addObserver(
            forName: VoiceSpeakerBleedCoordinator.policyDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.applyMasterVolume()
        }
        didBecomeActiveObserver = center.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self, self.stage != nil, !self.paused else { return }
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
        if isMutatingGraph {
            pendingConfigurationChange = true
            return
        }
        restartEngineIfNeeded()
    }

    private func schedulePendingConfigurationCheck() {
        pendingConfigurationWorkItem?.cancel()
        let item = DispatchWorkItem { [weak self] in
            guard let self, !self.isMutatingGraph, self.stage != nil, !self.paused else { return }
            let rateMismatch: Bool = {
                guard let expected = self.deckFormat?.sampleRate else { return true }
                return AudioOutputFormatResolver.postStartMismatchedRate(
                    engine: self.engine,
                    expectedSampleRate: expected
                ) != nil
            }()
            if !self.engine.isRunning || rateMismatch {
                self.restartEngineIfNeeded()
            }
        }
        pendingConfigurationWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08, execute: item)
    }

    private func handleSharedAudioSessionReconfigure() {
        runOnMain { [weak self] in
            guard let self, self.stage != nil else { return }
            if self.isMutatingGraph {
                self.pendingConfigurationChange = true
                return
            }
            guard AppAudioSession.shared.canStartAudioEngine else {
                if !self.paused {
                    self.needsEngineResumeOnActive = true
                }
                return
            }
            let offset = self.transportStartHostSec > 0
                ? max(0, Self.hostTimeSec() - self.presentationLatency - self.transportStartHostSec)
                : 0
            let phrase = self.audiblePhraseIndex
            let wasPaused = self.paused
            let desired = self.desiredPhraseIndex
            self.ensureGraph(forceRebuild: true)
            if let format = self.deckFormat {
                self.rebuildBuffersIfNeeded(for: format)
            }
            guard !wasPaused else { return }
            self.playActivePhraseImmediate(at: phrase, offsetSec: offset)
            if desired != phrase {
                self.desiredPhraseIndex = desired
                self.scheduleDesiredSwitch()
            }
        }
    }

    private func restartEngineIfNeeded() {
        guard !isMutatingGraph else {
            pendingConfigurationChange = true
            return
        }
        guard graphReady else { return }
        guard stage != nil, !paused else { return }
        guard AppAudioSession.shared.canStartAudioEngine else {
            needsEngineResumeOnActive = true
            return
        }
        let offset = transportStartHostSec > 0
            ? max(0, Self.hostTimeSec() - presentationLatency - transportStartHostSec)
            : 0
        let phrase = audiblePhraseIndex
        let desired = desiredPhraseIndex
        ensureGraph(forceRebuild: true)
        if let format = deckFormat {
            rebuildBuffersIfNeeded(for: format)
        }
        playActivePhraseImmediate(at: phrase, offsetSec: offset)
        if desired != phrase {
            desiredPhraseIndex = desired
            scheduleDesiredSwitch()
        }
    }
}
