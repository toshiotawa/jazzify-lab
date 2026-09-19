import AVFoundation
import Darwin
import Foundation
import os

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
    private var phraseBuffersByIndex: [Int: AVAudioPCMBuffer] = [:]
    private var preparedStage: DefenseStageDefinition?

    private var activeIsA = true
    private var bufferA: AVAudioPCMBuffer?
    private var bufferB: AVAudioPCMBuffer?
    private var graphReady = false
    private var deckFormat: AVAudioFormat?

    private var transportStartHostSec: Double = 0
    private var bpm: Double = 120
    private var beatsPerBar: Int = 4
    private var currentBarCount: Int = 4
    private var pendingBarCount: Int = 4
    private var switchScheduleToken: UInt64 = 0

    private var pendingSwitchAtHostSec: Double = -1
    private var switchGeneration: UInt64 = 0

    /// レンダー相当の切替時刻を過ぎると増える。メインスレッドはこれを監視して譜面を切り替える。
    var didSwitchGeneration: UInt64 {
        os_unfair_lock_lock(&lock)
        defer { os_unfair_lock_unlock(&lock) }
        if pendingSwitchAtHostSec >= 0, Self.hostTimeSec() >= pendingSwitchAtHostSec {
            pendingSwitchAtHostSec = -1
            switchGeneration &+= 1
        }
        return switchGeneration
    }

    private var voiceInputDucking = false
    private static let voiceInputDuckFactor: Float = 0.5
    /// フレーズ音源 × マスターの実効値（0...1）。`EarTrainingAudio` と同じヘッドルームを掛ける。
    private static let masterHeadroomGain: Float = 0.7
    private var userVolume: Float = EarTrainingBattleVolumePreferences.loadPhraseVolume()

    private var lock = os_unfair_lock()

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
            let incoming = self.activeIsA ? self.playerB : self.playerA
            incoming.stop()
            incoming.reset()
            if self.activeIsA {
                self.bufferB = nil
            } else {
                self.bufferA = nil
            }
            os_unfair_lock_lock(&self.lock)
            self.pendingSwitchAtHostSec = -1
            os_unfair_lock_unlock(&self.lock)
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
            self.timePitch.rate = clamped
            self.timePitch.pitch = 0
            self.timePitch.bypass = abs(clamped - 1) < 0.0001
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
            _ = try await decodePCM(url: url)
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
            let decoded = try await decodePCM(url: url)
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

    func start(firstUrl: URL) async throws {
        let buffer = try await decodePCM(url: firstUrl)
        try await MainActor.run {
            self.stopPlayersAndResetPending()
            try self.startEngine(with: buffer)
        }
    }

    func startPhrase(at index: Int) async throws {
        let buffer = try await bufferForPhrase(at: index)
        try await MainActor.run {
            self.stopPlayersAndResetPending()
            self.currentBarCount = self.barCount(for: index)
            self.pendingBarCount = self.currentBarCount
            try self.startEngine(with: buffer)
        }
    }

    func startSynthesizedTutorial(concertMidis: [Int]) async throws {
        guard let buffer = DefenseTutorialAudio.synthesize(concertMidis: concertMidis) else {
            throw URLError(.cannotDecodeContentData)
        }
        try await MainActor.run {
            self.stop()
            try self.startEngine(with: buffer)
        }
    }

    func scheduleSwitch(nextUrl: URL) async throws -> Int64 {
        let buffer = try await decodePCM(url: nextUrl)
        return await scheduleSwitch(buffer: buffer)
    }

    func scheduleSwitchPhrase(at index: Int) async throws -> Int64 {
        let token = await MainActor.run { self.switchScheduleToken }
        let buffer = try await bufferForPhrase(at: index)
        return await MainActor.run {
            guard self.switchScheduleToken == token else { return 0 }
            self.pendingBarCount = self.barCount(for: index)
            return self.scheduleSwitchOnMain(buffer: buffer)
        }
    }

    func scheduleSwitch(buffer: AVAudioPCMBuffer) async -> Int64 {
        await MainActor.run {
            self.scheduleSwitchOnMain(buffer: buffer)
        }
    }

    func commitSwitchFromMainThread() {
        let outgoing = activeIsA ? playerA : playerB
        outgoing.stop()
        outgoing.reset()
        if activeIsA {
            bufferA = nil
        } else {
            bufferB = nil
        }
        activeIsA.toggle()
        currentBarCount = pendingBarCount
        os_unfair_lock_lock(&lock)
        pendingSwitchAtHostSec = -1
        os_unfair_lock_unlock(&lock)
    }

    func stop() {
        let apply = { [weak self] in
            guard let self else { return }
            if self.graphReady {
                self.playerA.stop()
                self.playerB.stop()
                if self.engine.isRunning {
                    self.engine.stop()
                }
            }
            self.bufferA = nil
            self.bufferB = nil
            os_unfair_lock_lock(&self.lock)
            self.pcmCache.removeAll(keepingCapacity: false)
            self.phraseBuffersByIndex.removeAll(keepingCapacity: false)
            self.preparedStage = nil
            self.pendingSwitchAtHostSec = -1
            self.transportStartHostSec = 0
            os_unfair_lock_unlock(&self.lock)
        }
        if Thread.isMainThread {
            apply()
        } else {
            DispatchQueue.main.sync(execute: apply)
        }
    }

    private func ensureGraph() {
        guard !graphReady else { return }
        let format = EarTrainingAudio.preferredOutputFormat()
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
        timePitch.rate = 1
        timePitch.pitch = 0
        timePitch.bypass = true
        graphReady = true
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
            let decoded = try await decodePCM(url: url)
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
        let decoded = try await decodePCM(url: url)
        os_unfair_lock_lock(&lock)
        phraseBuffersByIndex[index] = decoded
        os_unfair_lock_unlock(&lock)
        return decoded
    }

    private func decodePCM(url: URL) async throws -> AVAudioPCMBuffer {
        os_unfair_lock_lock(&lock)
        let cached = pcmCache[url]
        os_unfair_lock_unlock(&lock)
        if let cached {
            return cached
        }

        let local = try await cache.localFileURL(for: url)
        let outputFormat = deckFormat ?? EarTrainingAudio.preferredOutputFormat()
        let resolved = try await Task.detached(priority: .userInitiated) {
            try Self.readPCM(localURL: local, outputFormat: outputFormat)
        }.value

        os_unfair_lock_lock(&lock)
        if let existing = pcmCache[url] {
            os_unfair_lock_unlock(&lock)
            return existing
        }
        pcmCache[url] = resolved
        os_unfair_lock_unlock(&lock)
        return resolved
    }

    private static func readPCM(localURL: URL, outputFormat: AVAudioFormat) throws -> AVAudioPCMBuffer {
        let file = try AVAudioFile(forReading: localURL)
        let format = file.processingFormat
        let frameCount = AVAudioFrameCount(file.length)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            throw URLError(.cannotDecodeContentData)
        }
        try file.read(into: buffer)
        if buffer.format.isEqual(outputFormat) {
            return buffer
        }
        if let converted = EarTrainingAudio.convertBuffer(buffer, to: outputFormat) {
            return converted
        }
        throw URLError(.cannotDecodeContentData)
    }

    private func startEngine(with buffer: AVAudioPCMBuffer) throws {
        ensureGraph()
        stopPlayersAndResetPending()
        switchScheduleToken &+= 1
        activeIsA = true
        bufferA = buffer
        bufferB = nil
        playerA.scheduleBuffer(buffer, at: nil, options: [.loops])
        applyMasterMixerVolume()
        if !engine.isRunning {
            try engine.start()
        }
        playerA.play()
        os_unfair_lock_lock(&lock)
        transportStartHostSec = Self.hostTimeSec()
        switchGeneration = 0
        pendingSwitchAtHostSec = -1
        os_unfair_lock_unlock(&lock)
    }

    private func scheduleSwitchOnMain(buffer: AVAudioPCMBuffer) -> Int64 {
        os_unfair_lock_lock(&lock)
        let bpmSnapshot = bpm
        let beatsSnapshot = beatsPerBar
        let transportStart = transportStartHostSec
        os_unfair_lock_unlock(&lock)

        let now = Self.hostTimeSec()
        let barSec = currentBarSeconds(fallbackBpm: bpmSnapshot, fallbackBeats: beatsSnapshot)
        let switchAt = DefenseTransport.nextSwitchTime(
            now: now,
            transportStart: transportStart,
            barSec: barSec,
            deadlineSec: 0.1
        )
        let when = AVAudioTime(hostTime: AVAudioTime.hostTime(forSeconds: switchAt))
        let incoming = activeIsA ? playerB : playerA
        if activeIsA {
            bufferB = buffer
        } else {
            bufferA = buffer
        }
        incoming.stop()
        incoming.reset()
        incoming.scheduleBuffer(buffer, at: when, options: [.loops])
        incoming.play()

        os_unfair_lock_lock(&lock)
        pendingSwitchAtHostSec = switchAt
        os_unfair_lock_unlock(&lock)

        return Int64((switchAt * 1_000).rounded())
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
        guard let stage, stage.phrases.indices.contains(index) else {
            return max(1, stage?.phraseBars ?? 4)
        }
        return DefensePhraseBacking.barCount(stage: stage, phrase: stage.phrases[index])
    }

    private func stopPlayersAndResetPending() {
        playerA.stop()
        playerB.stop()
        playerA.reset()
        playerB.reset()
        bufferA = nil
        bufferB = nil
        os_unfair_lock_lock(&lock)
        pendingSwitchAtHostSec = -1
        os_unfair_lock_unlock(&lock)
    }

    private static func hostTimeSec() -> Double {
        AVAudioTime.seconds(forHostTime: mach_absolute_time())
    }

    private func applyMasterMixerVolume() {
        os_unfair_lock_lock(&lock)
        let volume = userVolume
        let ducking = voiceInputDucking
        os_unfair_lock_unlock(&lock)
        var output = Self.masterHeadroomGain * volume
        if ducking {
            output *= Self.voiceInputDuckFactor
        }
        masterMixer.outputVolume = output
    }
}
