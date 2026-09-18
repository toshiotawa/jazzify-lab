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

    private var activeIsA = true
    private var bufferA: AVAudioPCMBuffer?
    private var bufferB: AVAudioPCMBuffer?
    private var graphReady = false
    private var deckFormat: AVAudioFormat?

    private var transportStartHostSec: Double = 0
    private var bpm: Double = 120
    private var beatsPerBar: Int = 4

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
        os_unfair_lock_lock(&lock)
        self.bpm = max(1, bpm)
        self.beatsPerBar = max(1, beatsPerBar)
        os_unfair_lock_unlock(&lock)
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

    func start(firstUrl: URL) async throws {
        let buffer = try await decodePCM(url: firstUrl)
        try await MainActor.run {
            self.stop()
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
        return await MainActor.run {
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

    private func decodePCM(url: URL) async throws -> AVAudioPCMBuffer {
        let local = try await cache.localFileURL(for: url)
        let file = try AVAudioFile(forReading: local)
        let format = file.processingFormat
        let frameCount = AVAudioFrameCount(file.length)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            throw URLError(.cannotDecodeContentData)
        }
        try file.read(into: buffer)
        let outputFormat = deckFormat ?? EarTrainingAudio.preferredOutputFormat()
        if buffer.format.isEqual(outputFormat) {
            return buffer
        }
        guard let converted = EarTrainingAudio.convertBuffer(buffer, to: outputFormat) else {
            throw URLError(.cannotDecodeContentData)
        }
        return converted
    }

    private func startEngine(with buffer: AVAudioPCMBuffer) throws {
        ensureGraph()
        stopPlayersAndResetPending()
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
        let barSec = DefenseTransport.barSeconds(bpm: bpm, beatsPerBar: beatsPerBar)
        let transportStart = transportStartHostSec
        os_unfair_lock_unlock(&lock)

        let now = Self.hostTimeSec()
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
