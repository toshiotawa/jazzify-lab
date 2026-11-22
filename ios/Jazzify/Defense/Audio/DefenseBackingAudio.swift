import AVFoundation
import Darwin
import Foundation
import os
import UIKit

final class DefenseBackingAudio: @unchecked Sendable {
    static let shared = DefenseBackingAudio()

    private let engine = AVAudioEngine()
    private let deckMixer = AVAudioMixerNode()
    private let masterMixer = AVAudioMixerNode()
    private let timePitch = AVAudioUnitTimePitch()
    private let playerA = AVAudioPlayerNode()
    private let playerB = AVAudioPlayerNode()
    private let cache = RemoteAudioFileCache(subdirectory: "defense-backing")
    private var pcmCache: [URL: AVAudioPCMBuffer] = [:]
    private var pcmDecodeTasks: [URL: Task<AVAudioPCMBuffer, Error>] = [:]
    private var pcmDecodeGeneration: UInt64 = 0
    private var phraseBuffersByIndex: [Int: AVAudioPCMBuffer] = [:]
    private var preparedStage: DefenseStageDefinition?

    private var activeIsA = true
    private var sourceBufferA: AVAudioPCMBuffer?
    private var sourceBufferB: AVAudioPCMBuffer?
    private var bufferA: AVAudioPCMBuffer?
    private var bufferB: AVAudioPCMBuffer?
    private var isMutatingGraph = false
    private var graphReady = false
    private var deckFormat: AVAudioFormat?
    private var synthesizedTutorialConcertMidis: [Int]?
    private var desiredPlaybackRate: Float = 1
    private var needsRescheduleOnResume = false

    private var transportStartHostSec: Double = 0
    private var pausedAtHostSec: Double?
    private var bpm: Double = 120
    private var beatsPerBar: Int = 4
    private var currentBarCount: Int = 4
    private var presentationLatency: TimeInterval = 0
    private var switchScheduleToken: UInt64 = 0
    private(set) var didSwitchGeneration: UInt64 = 0
    private(set) var audiblePhraseIndex = 0
    private var outgoingStopWorkItem: DispatchWorkItem?

    private static let startLeadSec = 0.15
    private static let scheduleMinQuantumSec = 0.001
    private static let reconfigureLeadSec = 0.05

    private var voiceInputDucking = false
    /// フレーズ音源 × マスターの実効値（0...1）。`EarTrainingAudio` と同じヘッドルームを掛ける。
    private static let masterHeadroomGain: Float = 0.7
    private var userVolume: Float = EarTrainingBattleVolumePreferences.loadPhraseVolume()

    private var lock = os_unfair_lock()
    private var lifecycleObserversRegistered = false
    private var appAudioSessionObserver: NSObjectProtocol?
    private var engineConfigObserver: NSObjectProtocol?
    private var voicePolicyObserver: NSObjectProtocol?
    private var didBecomeActiveObserver: NSObjectProtocol?
    private var playbackIntended = false
    private var needsEngineResumeOnActive = false

    private init() {}

    func setTransportConfig(bpm: Double, beatsPerBar: Int) {
        let newBpm = max(1, bpm)
        let newBeats = max(1, beatsPerBar)
        let newBarSec = DefenseTransport.barSeconds(bpm: newBpm, beatsPerBar: newBeats)
        os_unfair_lock_lock(&lock)
        let oldBarSec = DefenseTransport.barSeconds(bpm: self.bpm, beatsPerBar: self.beatsPerBar)
        if transportStartHostSec > 0 {
            transportStartHostSec = DefenseTransport.rebaseTransportStart(
                now: Self.hostTimeSec(),
                transportStart: transportStartHostSec,
                oldBarSec: oldBarSec,
                newBarSec: newBarSec
            )
        }
        self.bpm = newBpm
        self.beatsPerBar = newBeats
        os_unfair_lock_unlock(&lock)
    }

    func invalidatePendingSwitch() {
        let apply = { [weak self] in
            guard let self else { return }
            self.switchScheduleToken &+= 1
            self.cancelOutgoingStopWork()
            let incoming = self.activeIsA ? self.playerB : self.playerA
            incoming.stop()
            incoming.reset()
            if self.activeIsA {
                self.bufferB = nil
                self.sourceBufferB = nil
            } else {
                self.bufferA = nil
                self.sourceBufferA = nil
            }
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.async(execute: apply)
        }
    }

    func setPlaybackRate(_ rate: Float) {
        let apply = { [weak self] in
            guard let self else { return }
            let clamped = max(0.5, min(1.5, rate))
            self.desiredPlaybackRate = clamped
            self.applyTimePitchSettings()
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.async(execute: apply)
        }
    }

    func setUserVolume(_ volume: Float) {
        let apply = { [weak self] in
            guard let self else { return }
            os_unfair_lock_lock(&self.lock)
            self.userVolume = max(0, min(1, volume))
            os_unfair_lock_unlock(&self.lock)
            self.applyMasterMixerVolume()
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.async(execute: apply)
        }
    }

    func setVoiceInputDucking(_ enabled: Bool) {
        let apply = { [weak self] in
            guard let self else { return }
            os_unfair_lock_lock(&self.lock)
            self.voiceInputDucking = enabled
            os_unfair_lock_unlock(&self.lock)
            self.applyMasterMixerVolume()
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.async(execute: apply)
        }
    }

    func preload(urls: [URL]) async throws {
        for url in urls {
            _ = try await ensureNativePCMInCache(url: url)
        }
    }

    func preparePhraseBuffers(stage: DefenseStageDefinition, phraseIndices: [Int]? = nil) async throws {
        os_unfair_lock_lock(&lock)
        preparedStage = stage
        phraseBuffersByIndex.removeAll(keepingCapacity: true)
        os_unfair_lock_unlock(&lock)
        let indices = phraseIndices ?? Array(stage.phrases.indices)
        if stage.audioRegistrationMode == .singleSource {
            guard let urlString = stage.audioUrl, let url = URL(string: urlString) else {
                throw URLError(.badURL)
            }
            let decoded = try await ensureNativePCMInCache(url: url)
            os_unfair_lock_lock(&lock)
            for index in indices where stage.phrases.indices.contains(index) {
                phraseBuffersByIndex[index] = DefensePhraseBacking.preparePhraseBuffer(
                    decoded: decoded,
                    stage: stage,
                    phrase: stage.phrases[index]
                )
            }
            os_unfair_lock_unlock(&lock)
            return
        }

        for index in indices where stage.phrases.indices.contains(index) {
            _ = try await bufferForPhrase(at: index)
        }
    }

    func start(firstUrl: URL, barCount: Int? = nil) async throws {
        let native = try await ensureNativePCMInCache(url: firstUrl)
        try await MainActor.run {
            self.synthesizedTutorialConcertMidis = nil
            self.stopPlayersAndResetPending()
            if let barCount, barCount > 0 {
                self.currentBarCount = barCount
            }
            try self.startEngine(with: native)
        }
    }

    func startPhrase(at index: Int) async throws {
        let buffer = try await bufferForPhrase(at: index)
        try await MainActor.run {
            self.synthesizedTutorialConcertMidis = nil
            self.stopPlayersAndResetPending()
            self.currentBarCount = self.barCount(for: index)
            self.audiblePhraseIndex = index
            try self.startEngine(with: buffer)
        }
    }

    func startSynthesizedTutorial(concertMidis: [Int]) async throws {
        try await MainActor.run {
            self.stop()
            self.ensureGraph()
            guard let buffer = DefenseTutorialAudio.synthesize(
                concertMidis: concertMidis,
                sampleRate: self.deckFormat?.sampleRate
            ) else {
                throw URLError(.cannotDecodeContentData)
            }
            self.synthesizedTutorialConcertMidis = concertMidis
            self.currentBarCount = DefenseTutorialConstants.audioLoopBars
            try self.startEngine(with: buffer)
        }
    }

    func scheduleSwitch(nextUrl: URL) async throws -> Int64 {
        let native = try await ensureNativePCMInCache(url: nextUrl)
        return await scheduleSwitch(buffer: native)
    }

    func scheduleSwitchPhrase(at index: Int, forceNextBar: Bool = false) async throws -> Int64 {
        let token = await MainActor.run {
            self.switchScheduleToken &+= 1
            return self.switchScheduleToken
        }
        let buffer = try await bufferForPhrase(at: index)
        return await MainActor.run {
            guard self.switchScheduleToken == token else { return 0 }
            return self.scheduleSwitchOnMain(buffer: buffer, phraseIndex: index, forceNextBar: forceNextBar)
        }
    }

    func elapsedFromTransportStart() -> Double? {
        os_unfair_lock_lock(&lock)
        let transportStart = transportStartHostSec
        os_unfair_lock_unlock(&lock)
        guard transportStart > 0, engine.isRunning else { return nil }
        return Self.hostTimeSec() - presentationLatency - transportStart
    }

    func currentBarSec() -> Double {
        os_unfair_lock_lock(&lock)
        let bpmSnapshot = bpm
        let beatsSnapshot = beatsPerBar
        os_unfair_lock_unlock(&lock)
        return currentBarSeconds(fallbackBpm: bpmSnapshot, fallbackBeats: beatsSnapshot)
    }

    func currentOutputTime() -> Double {
        Self.hostTimeSec() - presentationLatency
    }

    func scheduleSwitch(buffer: AVAudioPCMBuffer) async -> Int64 {
        await MainActor.run {
            self.scheduleSwitchOnMain(buffer: buffer)
        }
    }

    func pausePlayback() {
        let apply = { [weak self] in
            guard let self else { return }
            guard self.graphReady, self.engine.isRunning else { return }
            os_unfair_lock_lock(&self.lock)
            let alreadyPaused = self.pausedAtHostSec != nil
            if !alreadyPaused {
                self.pausedAtHostSec = Self.hostTimeSec()
            }
            os_unfair_lock_unlock(&self.lock)
            guard !alreadyPaused else { return }
            self.engine.pause()
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.sync(execute: apply)
        }
    }

    func resumePlayback() {
        let apply = { [weak self] in
            guard let self else { return }
            os_unfair_lock_lock(&self.lock)
            let pausedAt = self.pausedAtHostSec
            let transportStart = self.transportStartHostSec
            os_unfair_lock_unlock(&self.lock)
            guard pausedAt != nil, self.graphReady else { return }

            var elapsedSnapshot: Double = 0
            if let pausedAt, transportStart > 0 {
                elapsedSnapshot = max(0, pausedAt - transportStart)
            }

            os_unfair_lock_lock(&self.lock)
            self.pausedAtHostSec = nil
            os_unfair_lock_unlock(&self.lock)

            if self.needsRescheduleOnResume {
                self.needsRescheduleOnResume = false
                guard AppAudioSession.shared.canStartAudioEngine else {
                    self.needsEngineResumeOnActive = true
                    return
                }
                guard let native = self.activeIsA ? self.sourceBufferA : self.sourceBufferB else { return }
                let rebuilt = self.bufferMatchingDeckFormat(native)
                if self.activeIsA {
                    self.sourceBufferA = native
                    self.bufferA = rebuilt
                    self.sourceBufferB = nil
                    self.bufferB = nil
                } else {
                    self.sourceBufferB = native
                    self.bufferB = rebuilt
                    self.sourceBufferA = nil
                    self.bufferA = nil
                }
                let active = self.activeIsA ? self.playerA : self.playerB
                active.stop()
                active.reset()
                self.engine.prepare()
                do {
                    try self.engine.start()
                } catch {
                    return
                }
                self.applyMasterMixerVolume()
                self.applyTimePitchSettings()
                let resumeAt = Self.hostTimeSec() + Self.reconfigureLeadSec
                let when = AVAudioTime(hostTime: AVAudioTime.hostTime(forSeconds: resumeAt))
                self.scheduleLoopFromOffset(
                    buffer: rebuilt,
                    player: active,
                    at: nil,
                    offsetSec: elapsedSnapshot,
                    playbackRate: Double(self.desiredPlaybackRate)
                )
                active.play(at: when)
                self.presentationLatency = active.outputPresentationLatency
                os_unfair_lock_lock(&self.lock)
                self.transportStartHostSec = resumeAt - elapsedSnapshot
                os_unfair_lock_unlock(&self.lock)
                return
            }

            if let pausedAt, transportStart > 0 {
                os_unfair_lock_lock(&self.lock)
                let delta = max(0, Self.hostTimeSec() - pausedAt)
                self.transportStartHostSec += delta
                os_unfair_lock_unlock(&self.lock)
            }
            if !self.engine.isRunning {
                try? self.engine.start()
            }
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.sync(execute: apply)
        }
    }

    func stop() {
        let apply = { [weak self] in
            guard let self else { return }
            self.switchScheduleToken &+= 1
            self.cancelOutgoingStopWork()
            if self.graphReady {
                self.playerA.stop()
                self.playerB.stop()
                if self.engine.isRunning {
                    self.engine.stop()
                }
            }
            self.bufferA = nil
            self.bufferB = nil
            self.sourceBufferA = nil
            self.sourceBufferB = nil
            os_unfair_lock_lock(&self.lock)
            self.pcmDecodeGeneration &+= 1
            self.pcmDecodeTasks.removeAll()
            self.pcmCache.removeAll(keepingCapacity: false)
            self.phraseBuffersByIndex.removeAll(keepingCapacity: false)
            self.preparedStage = nil
            self.synthesizedTutorialConcertMidis = nil
            self.needsRescheduleOnResume = false
            self.transportStartHostSec = 0
            self.pausedAtHostSec = nil
            self.playbackIntended = false
            self.needsEngineResumeOnActive = false
            os_unfair_lock_unlock(&self.lock)
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.sync(execute: apply)
        }
    }

    private func ensureGraph(forceRebuild: Bool = false) {
        registerLifecycleObserversIfNeeded()
        let resolved = AudioOutputFormatResolver.stereoFormat(engine: engine)
        if graphReady, !forceRebuild, let deckFormat,
           deckFormat.isEqual(resolved),
           AudioOutputFormatResolver.sampleRatesMatch(deckFormat.sampleRate, resolved.sampleRate) {
            return
        }
        let ownsMutationGuard = !isMutatingGraph
        if ownsMutationGuard {
            isMutatingGraph = true
        }
        defer {
            if ownsMutationGuard {
                isMutatingGraph = false
            }
        }
        if graphReady {
            engine.stop()
            if forceRebuild {
                engine.reset()
            }
            engine.disconnectNodeInput(engine.mainMixerNode)
            engine.detach(deckMixer)
            engine.detach(masterMixer)
            engine.detach(timePitch)
            engine.detach(playerA)
            engine.detach(playerB)
            graphReady = false
        }
        guard !graphReady else { return }
        let format = AudioOutputFormatResolver.stereoFormat(engine: engine)
        deckFormat = format

        engine.attach(deckMixer)
        engine.attach(masterMixer)
        engine.attach(timePitch)
        engine.attach(playerA)
        engine.attach(playerB)
        engine.connect(playerA, to: deckMixer, format: format)
        engine.connect(playerB, to: deckMixer, format: format)
        engine.connect(deckMixer, to: timePitch, format: format)
        engine.connect(timePitch, to: masterMixer, format: format)
        engine.connect(masterMixer, to: engine.mainMixerNode, format: nil)
        applyTimePitchSettings()
        graphReady = true
    }

    private func applyTimePitchSettings() {
        let rate = desiredPlaybackRate
        timePitch.rate = rate
        timePitch.pitch = 0
        timePitch.bypass = abs(rate - 1) < 0.0001
    }

    private func bufferMatchingDeckFormat(_ buffer: AVAudioPCMBuffer) -> AVAudioPCMBuffer {
        let target = deckFormat ?? AudioOutputFormatResolver.stereoFormat(engine: engine)
        if buffer.format.isEqual(target),
           AudioOutputFormatResolver.sampleRatesMatch(buffer.format.sampleRate, target.sampleRate) {
            return buffer
        }
        return EarTrainingAudio.convertBuffer(buffer, to: target) ?? buffer
    }

    private func bufferForPhrase(at index: Int) async throws -> AVAudioPCMBuffer {
        os_unfair_lock_lock(&lock)
        let cached = phraseBuffersByIndex[index]
        let stage = preparedStage
        os_unfair_lock_unlock(&lock)
        if let cached {
            return cached
        }
        guard let stage, stage.phrases.indices.contains(index) else {
            throw URLError(.cannotDecodeContentData)
        }
        let phrase = stage.phrases[index]
        if stage.audioRegistrationMode == .singleSource {
            guard let urlString = stage.audioUrl, let url = URL(string: urlString) else {
                throw URLError(.badURL)
            }
            let decoded = try await ensureNativePCMInCache(url: url)
            let sliced = DefensePhraseBacking.preparePhraseBuffer(
                decoded: decoded,
                stage: stage,
                phrase: phrase
            )
            os_unfair_lock_lock(&lock)
            phraseBuffersByIndex[index] = sliced
            os_unfair_lock_unlock(&lock)
            return sliced
        }
        guard let url = URL(string: phrase.audioUrl) else {
            throw URLError(.badURL)
        }
        let decoded = try await ensureNativePCMInCache(url: url)
        os_unfair_lock_lock(&lock)
        phraseBuffersByIndex[index] = decoded
        os_unfair_lock_unlock(&lock)
        return decoded
    }

    private func ensureNativePCMInCache(url: URL) async throws -> AVAudioPCMBuffer {
        os_unfair_lock_lock(&lock)
        if let cached = pcmCache[url] {
            os_unfair_lock_unlock(&lock)
            return cached
        }
        if let inFlight = pcmDecodeTasks[url] {
            os_unfair_lock_unlock(&lock)
            return try await inFlight.value
        }
        let generation = pcmDecodeGeneration
        let task = Task<AVAudioPCMBuffer, Error> { [weak self] in
            guard let self else { throw CancellationError() }
            let local = try await self.cache.localFileURL(for: url)
            let resolved = try await Task.detached(priority: .userInitiated) {
                try Self.readNativePCM(localURL: local)
            }.value
            os_unfair_lock_lock(&self.lock)
            if self.pcmDecodeGeneration == generation {
                if self.pcmCache[url] == nil {
                    self.pcmCache[url] = resolved
                }
                self.pcmDecodeTasks[url] = nil
            }
            let native = self.pcmCache[url] ?? resolved
            os_unfair_lock_unlock(&self.lock)
            return native
        }
        pcmDecodeTasks[url] = task
        os_unfair_lock_unlock(&lock)
        return try await task.value
    }

    private static func readNativePCM(localURL: URL) throws -> AVAudioPCMBuffer {
        let file = try AVAudioFile(forReading: localURL)
        let format = file.processingFormat
        let frameCount = AVAudioFrameCount(file.length)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            throw URLError(.cannotDecodeContentData)
        }
        try file.read(into: buffer)
        guard buffer.frameLength > 0 else {
            throw URLError(.cannotDecodeContentData)
        }
        return buffer
    }

    private func startEngine(with buffer: AVAudioPCMBuffer) throws {
        ensureGraph()
        stopPlayersAndResetPending()
        cancelOutgoingStopWork()
        switchScheduleToken &+= 1
        activeIsA = true
        let outputBuffer = bufferMatchingDeckFormat(buffer)
        sourceBufferA = buffer
        sourceBufferB = nil
        bufferA = outputBuffer
        bufferB = nil
        playerA.scheduleBuffer(outputBuffer, at: nil, options: [.loops])
        applyMasterMixerVolume()
        if !engine.isRunning {
            guard AppAudioSession.shared.canStartAudioEngine else {
                playbackIntended = true
                needsEngineResumeOnActive = true
                return
            }
            try engine.start()
        }
        needsEngineResumeOnActive = false
        presentationLatency = playerA.outputPresentationLatency
        let transportStart = Self.hostTimeSec() + Self.startLeadSec
        let when = AVAudioTime(hostTime: AVAudioTime.hostTime(forSeconds: transportStart))
        playerA.play(at: when)
        playbackIntended = true
        os_unfair_lock_lock(&lock)
        transportStartHostSec = transportStart
        os_unfair_lock_unlock(&lock)
    }

    private func scheduleSwitchOnMain(
        buffer: AVAudioPCMBuffer,
        phraseIndex: Int? = nil,
        forceNextBar: Bool = false
    ) -> Int64 {
        cancelOutgoingStopWork()
        os_unfair_lock_lock(&lock)
        let bpmSnapshot = bpm
        let beatsSnapshot = beatsPerBar
        let transportStart = transportStartHostSec
        os_unfair_lock_unlock(&lock)

        let now = Self.hostTimeSec()
        let barSec = currentBarSeconds(fallbackBpm: bpmSnapshot, fallbackBeats: beatsSnapshot)
        let beatSec = barSec / Double(max(1, beatsSnapshot))
        let plan: DefenseSwitchPlan
        if forceNextBar {
            let switchAt = DefenseTransport.planNextBarSwitch(
                now: now,
                transportStart: transportStart,
                barSec: barSec
            )
            plan = DefenseSwitchPlan(switchAt: switchAt, immediate: false, cutAt: switchAt)
        } else {
            plan = DefenseTransport.planSwitch(
                now: now,
                transportStart: transportStart,
                cutIntervalSec: barSec,
                beatSec: beatSec
            )
        }
        var switchAt = plan.switchAt
        let outputBuffer = bufferMatchingDeckFormat(buffer)
        let incoming = activeIsA ? playerB : playerA
        let outgoing = activeIsA ? playerA : playerB
        if activeIsA {
            sourceBufferB = buffer
            bufferB = outputBuffer
        } else {
            sourceBufferA = buffer
            bufferA = outputBuffer
        }
        incoming.stop()
        incoming.reset()

        let playbackWhen: AVAudioTime
        if plan.immediate {
            switchAt = max(now + Self.scheduleMinQuantumSec, switchAt)
            playbackWhen = AVAudioTime(hostTime: AVAudioTime.hostTime(forSeconds: switchAt))
            let rate = max(0.1, Double(timePitch.rate))
            let overshootSec = max(0, switchAt - plan.cutAt)
            scheduleLoopFromOffset(
                buffer: outputBuffer,
                player: incoming,
                at: nil,
                offsetSec: overshootSec,
                playbackRate: rate
            )
        } else {
            playbackWhen = AVAudioTime(hostTime: AVAudioTime.hostTime(forSeconds: switchAt))
            incoming.scheduleBuffer(outputBuffer, at: nil, options: [.loops])
        }
        incoming.play(at: playbackWhen)
        scheduleOutgoingStop(
            outgoing: outgoing,
            atHostSec: switchAt,
            transportStartAfter: plan.cutAt,
            phraseIndex: phraseIndex
        )

        return Int64((switchAt * 1_000).rounded())
    }

    private func cancelOutgoingStopWork() {
        outgoingStopWorkItem?.cancel()
        outgoingStopWorkItem = nil
    }

    private func scheduleOutgoingStop(
        outgoing: AVAudioPlayerNode,
        atHostSec: Double,
        transportStartAfter: Double,
        phraseIndex: Int?
    ) {
        let delay = max(0, atHostSec - Self.hostTimeSec())
        let item = DispatchWorkItem { [weak self] in
            guard let self else { return }
            outgoing.stop()
            outgoing.reset()
            if self.activeIsA {
                self.bufferA = nil
                self.sourceBufferA = nil
            } else {
                self.bufferB = nil
                self.sourceBufferB = nil
            }
            self.activeIsA.toggle()
            if let phraseIndex {
                self.currentBarCount = self.barCount(for: phraseIndex)
                self.audiblePhraseIndex = phraseIndex
            }
            os_unfair_lock_lock(&self.lock)
            self.transportStartHostSec = transportStartAfter
            os_unfair_lock_unlock(&self.lock)
            self.didSwitchGeneration &+= 1
        }
        outgoingStopWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: item)
    }

    private func scheduleLoopFromOffset(
        buffer: AVAudioPCMBuffer,
        player: AVAudioPlayerNode,
        at when: AVAudioTime?,
        offsetSec: Double,
        playbackRate: Double
    ) {
        let sampleRate = buffer.format.sampleRate
        guard sampleRate > 0, buffer.frameLength > 0 else {
            player.scheduleBuffer(buffer, at: when, options: [.loops])
            return
        }
        let loopDur = Double(buffer.frameLength) / sampleRate / playbackRate
        guard loopDur > 0 else {
            player.scheduleBuffer(buffer, at: when, options: [.loops])
            return
        }
        let wrappedOffset = offsetSec.truncatingRemainder(dividingBy: loopDur)
        let startFrame = AVAudioFramePosition((wrappedOffset * sampleRate * playbackRate).rounded())
        let safeStart = max(0, min(startFrame, AVAudioFramePosition(buffer.frameLength) - 1))
        let tailCount = AVAudioFrameCount(max(0, Int(buffer.frameLength) - Int(safeStart)))
        if tailCount > 0,
           let tailBuffer = DefensePhraseBacking.slicePCMBuffer(
               buffer,
               startingFrame: safeStart,
               frameCount: tailCount
           ) {
            player.scheduleBuffer(tailBuffer, at: when, options: [])
            player.scheduleBuffer(buffer, at: nil, options: [.loops])
        } else {
            player.scheduleBuffer(buffer, at: when, options: [.loops])
        }
    }

    private func runOnMain(_ block: @escaping () -> Void) {
        if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.async(execute: block)
        }
    }

    private func currentBarSeconds(fallbackBpm: Double, fallbackBeats: Int) -> Double {
        let currentBuffer = activeIsA ? bufferA : bufferB
        if let currentBuffer, currentBuffer.format.sampleRate > 0, currentBuffer.frameLength > 0 {
            let rate = max(0.1, Double(timePitch.rate))
            let loopDur = Double(currentBuffer.frameLength) / currentBuffer.format.sampleRate / rate
            return DefenseTransport.barSecondsFromLoop(
                loopStartSec: 0,
                loopEndSec: loopDur,
                barCount: currentBarCount
            )
        }
        return DefenseTransport.barSeconds(bpm: fallbackBpm, beatsPerBar: fallbackBeats)
    }

    private func barCount(for index: Int) -> Int {
        os_unfair_lock_lock(&lock)
        let stage = preparedStage
        os_unfair_lock_unlock(&lock)
        if let stage, let audioLoopBars = stage.audioLoopBars, audioLoopBars > 0 {
            return audioLoopBars
        }
        guard let stage, stage.phrases.indices.contains(index) else {
            return max(1, stage?.phraseBars ?? 4)
        }
        return DefensePhraseBacking.barCount(stage: stage, phrase: stage.phrases[index])
    }

    private func stopPlayersAndResetPending() {
        cancelOutgoingStopWork()
        playerA.stop()
        playerB.stop()
        playerA.reset()
        playerB.reset()
        bufferA = nil
        bufferB = nil
        sourceBufferA = nil
        sourceBufferB = nil
    }

    func beatInLoop() -> Double? {
        os_unfair_lock_lock(&lock)
        let transportStart = transportStartHostSec
        let bpmSnapshot = bpm
        let beatsSnapshot = beatsPerBar
        os_unfair_lock_unlock(&lock)

        guard transportStart > 0, engine.isRunning else { return nil }
        let elapsed = Self.hostTimeSec() - presentationLatency - transportStart
        guard elapsed >= 0 else { return nil }
        let barSec = currentBarSeconds(fallbackBpm: bpmSnapshot, fallbackBeats: beatsSnapshot)
        let loopDuration = barSec * Double(currentBarCount)
        return elapsed.truncatingRemainder(dividingBy: loopDuration) / barSec * Double(beatsSnapshot)
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
        engineConfigObserver = center.addObserver(
            forName: .AVAudioEngineConfigurationChange,
            object: engine,
            queue: .main
        ) { [weak self] _ in
            self?.handleEngineConfigurationChange()
        }
        voicePolicyObserver = center.addObserver(
            forName: VoiceSpeakerBleedCoordinator.policyDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.applyMasterMixerVolume()
        }
        didBecomeActiveObserver = center.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self else { return }
            guard self.needsEngineResumeOnActive || (self.playbackIntended && !self.engine.isRunning) else { return }
            self.restartEngineIfNeeded()
        }
    }

    private func handleEngineConfigurationChange() {
        guard !isMutatingGraph else { return }
        restartEngineIfNeeded()
    }

    private func handleSharedAudioSessionReconfigure() {
        runOnMain { [weak self] in
            guard let self else { return }
            self.ensureGraph()
            self.restartEngineIfNeeded()
        }
    }

    private func restartEngineIfNeeded() {
        guard !isMutatingGraph else { return }
        guard graphReady || playbackIntended else { return }
        isMutatingGraph = true
        defer { isMutatingGraph = false }

        os_unfair_lock_lock(&lock)
        let pausedAt = pausedAtHostSec
        let transportStart = transportStartHostSec
        os_unfair_lock_unlock(&lock)

        let snapshotNow = Self.hostTimeSec()
        let elapsedSnapshot: Double
        if let pausedAt, transportStart > 0 {
            elapsedSnapshot = max(0, pausedAt - transportStart)
        } else if transportStart > 0 {
            elapsedSnapshot = max(0, snapshotNow - presentationLatency - transportStart)
        } else {
            elapsedSnapshot = 0
        }

        let shouldResume = playbackIntended
        cancelOutgoingStopWork()

        if engine.isRunning {
            engine.stop()
        }
        ensureGraph(forceRebuild: true)

        let rebuiltOutput: AVAudioPCMBuffer?
        let rebuiltSource: AVAudioPCMBuffer?
        if let midis = synthesizedTutorialConcertMidis,
           let synthesized = DefenseTutorialAudio.synthesize(
               concertMidis: midis,
               sampleRate: deckFormat?.sampleRate
           ) {
            rebuiltSource = synthesized
            rebuiltOutput = synthesized
        } else if let nativeSource = activeIsA ? sourceBufferA : sourceBufferB {
            rebuiltSource = nativeSource
            rebuiltOutput = bufferMatchingDeckFormat(nativeSource)
        } else {
            rebuiltSource = nil
            rebuiltOutput = nil
        }

        if let rebuiltOutput {
            if activeIsA {
                bufferA = rebuiltOutput
                sourceBufferA = rebuiltSource
                bufferB = nil
                sourceBufferB = nil
            } else {
                bufferB = rebuiltOutput
                sourceBufferB = rebuiltSource
                bufferA = nil
                sourceBufferA = nil
            }
        }

        if pausedAt != nil {
            needsRescheduleOnResume = true
            return
        }

        guard AppAudioSession.shared.canStartAudioEngine else {
            if shouldResume {
                needsEngineResumeOnActive = true
            }
            return
        }
        needsEngineResumeOnActive = false
        needsRescheduleOnResume = false

        guard shouldResume, let buffer = activeIsA ? bufferA : bufferB else { return }

        engine.prepare()
        do {
            try engine.start()
        } catch {
            if AppAudioSession.isCannotStartPlayingError(error) {
                needsEngineResumeOnActive = true
            }
            return
        }
        applyMasterMixerVolume()
        applyTimePitchSettings()

        let active = activeIsA ? playerA : playerB
        let inactive = activeIsA ? playerB : playerA
        inactive.stop()
        inactive.reset()
        active.stop()
        active.reset()

        let resumeAt = Self.hostTimeSec() + Self.reconfigureLeadSec
        let when = AVAudioTime(hostTime: AVAudioTime.hostTime(forSeconds: resumeAt))
        let targetElapsed = elapsedSnapshot + max(0, resumeAt - snapshotNow)
        scheduleLoopFromOffset(
            buffer: buffer,
            player: active,
            at: nil,
            offsetSec: targetElapsed,
            playbackRate: Double(desiredPlaybackRate)
        )
        active.play(at: when)
        presentationLatency = active.outputPresentationLatency
        os_unfair_lock_lock(&lock)
        transportStartHostSec = resumeAt - targetElapsed
        os_unfair_lock_unlock(&lock)
    }

    private func applyMasterMixerVolume() {
        os_unfair_lock_lock(&lock)
        let volume = userVolume
        let ducking = voiceInputDucking
        os_unfair_lock_unlock(&lock)
        var output = Self.masterHeadroomGain * volume
        if ducking {
            output *= VoiceSpeakerBleedCoordinator.shared.snapshot().duckFactor
        }
        masterMixer.outputVolume = output
    }
}
