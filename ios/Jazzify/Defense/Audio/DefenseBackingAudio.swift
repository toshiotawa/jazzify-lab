import AVFoundation
import Foundation
import os

final class DefenseBackingAudio: @unchecked Sendable {
    static let shared = DefenseBackingAudio()

    private let engine = AVAudioEngine()
    private let cache = RemoteAudioFileCache(subdirectory: "defense-backing")
    private var sourceNode: AVAudioSourceNode?
    private var outputFormat: AVAudioFormat?

    private var currentBuffer: AVAudioPCMBuffer?
    private var playhead: Int = 0
    private var transportSample: Int64 = 0
    private var bpm: Double = 120
    private var beatsPerBar: Int = 4

    private var pendingSwitchBuffer: AVAudioPCMBuffer?
    private var pendingSwitchAtSample: Int64 = -1
    private var pendingSwitchScheduled = false

    private var switchGeneration: UInt64 = 0

    /// レンダースレッドで切替が実行されるたびに増える。メインスレッドはこれを監視して譜面を切り替える。
    var didSwitchGeneration: UInt64 {
        os_unfair_lock_lock(&lock)
        defer { os_unfair_lock_unlock(&lock) }
        return switchGeneration
    }

    private var fadeOutSamplesRemaining = 0
    private var fadeInSamplesRemaining = 0
    private let fadeOutLength = 256
    private let fadeInLength = 64
    private var voiceInputDucking = false
    private static let voiceInputDuckFactor: Float = 0.5

    private var lock = os_unfair_lock()

    private init() {}

    func setTransportConfig(bpm: Double, beatsPerBar: Int) {
        os_unfair_lock_lock(&lock)
        self.bpm = max(1, bpm)
        self.beatsPerBar = max(1, beatsPerBar)
        os_unfair_lock_unlock(&lock)
    }

    func setVoiceInputDucking(_ enabled: Bool) {
        os_unfair_lock_lock(&lock)
        voiceInputDucking = enabled
        os_unfair_lock_unlock(&lock)
    }

    func preload(urls: [URL]) async throws {
        for url in urls {
            _ = try await decodePCM(url: url)
        }
    }

    func start(firstUrl: URL) async throws {
        stop()
        let buffer = try await decodePCM(url: firstUrl)
        try await MainActor.run {
            try self.startEngine(with: buffer)
        }
    }

    func scheduleSwitch(nextUrl: URL) async throws -> Int64 {
        let buffer = try await decodePCM(url: nextUrl)
        os_unfair_lock_lock(&lock)
        defer { os_unfair_lock_unlock(&lock) }
        guard let format = outputFormat else { return -1 }
        let bar = DefenseTransport.barSamples(
            sampleRate: format.sampleRate,
            bpm: bpm,
            beatsPerBar: beatsPerBar
        )
        let deadline = DefenseTransport.deadlineSamples(sampleRate: format.sampleRate)
        let switchAt = DefenseTransport.nextSwitchSample(
            transportSample: transportSample,
            barSamples: bar,
            deadlineSamples: deadline
        )
        pendingSwitchBuffer = buffer
        pendingSwitchAtSample = switchAt
        pendingSwitchScheduled = true
        return switchAt
    }

    func commitSwitchFromMainThread() {
        os_unfair_lock_lock(&lock)
        pendingSwitchScheduled = false
        os_unfair_lock_unlock(&lock)
    }

    func stop() {
        engine.stop()
        if let sourceNode {
            engine.detach(sourceNode)
        }
        sourceNode = nil
        outputFormat = nil
        currentBuffer = nil
        playhead = 0
        transportSample = 0
        pendingSwitchBuffer = nil
        pendingSwitchAtSample = -1
        pendingSwitchScheduled = false
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
        guard let converted = PCMBufferConverter.convertToPreferredOutputFormat(buffer) else {
            throw URLError(.cannotDecodeContentData)
        }
        return converted
    }

    private func startEngine(with buffer: AVAudioPCMBuffer) throws {
        let format = buffer.format
        outputFormat = format
        currentBuffer = buffer
        playhead = 0
        transportSample = 0
        switchGeneration = 0

        let node = AVAudioSourceNode(format: format) { [weak self] _, _, frameCount, audioBufferList -> OSStatus in
            guard let self else { return noErr }
            return self.render(frames: frameCount, audioBufferList: audioBufferList)
        }
        sourceNode = node
        engine.attach(node)
        engine.connect(node, to: engine.mainMixerNode, format: format)
        try engine.start()
    }

    private func render(frames: AVAudioFrameCount, audioBufferList: UnsafeMutablePointer<AudioBufferList>) -> OSStatus {
        os_unfair_lock_lock(&lock)
        defer { os_unfair_lock_unlock(&lock) }

        let outBuffers = UnsafeMutableAudioBufferListPointer(audioBufferList)
        let frameCount = Int(frames)
        for outBuffer in outBuffers {
            if let outData = outBuffer.mData?.assumingMemoryBound(to: Float.self) {
                outData.update(repeating: 0, count: frameCount)
            }
        }

        guard let buffer = currentBuffer, buffer.floatChannelData != nil else {
            return noErr
        }

        let channelCount = Int(buffer.format.channelCount)
        let totalFrames = Int(buffer.frameLength)

        for frame in 0..<frameCount {
            if pendingSwitchScheduled,
               pendingSwitchAtSample >= 0,
               transportSample >= pendingSwitchAtSample,
               let next = pendingSwitchBuffer {
                currentBuffer = next
                playhead = 0
                pendingSwitchBuffer = nil
                pendingSwitchAtSample = -1
                pendingSwitchScheduled = false
                switchGeneration &+= 1
                fadeOutSamplesRemaining = 0
                fadeInSamplesRemaining = fadeInLength
            }

            var sample: Float = 0
            if totalFrames > 0, let active = currentBuffer, let activeData = active.floatChannelData {
                let idx = playhead % Int(active.frameLength)
                sample = activeData[0][idx]
                if channelCount > 1 {
                    sample = (sample + activeData[1][idx]) * 0.5
                }
                playhead += 1
            }

            if fadeInSamplesRemaining > 0 {
                let progress = Float(fadeInLength - fadeInSamplesRemaining + 1) / Float(fadeInLength)
                sample *= max(0, min(1, progress))
                fadeInSamplesRemaining -= 1
            }

            if fadeOutSamplesRemaining > 0 {
                let progress = Float(fadeOutSamplesRemaining) / Float(fadeOutLength)
                sample *= max(0, min(1, progress))
                fadeOutSamplesRemaining -= 1
            }

            if voiceInputDucking {
                sample *= Self.voiceInputDuckFactor
            }

            for outBuffer in outBuffers {
                if let outData = outBuffer.mData?.assumingMemoryBound(to: Float.self) {
                    outData[frame] = sample
                }
            }
            transportSample += 1

            if pendingSwitchScheduled,
               pendingSwitchAtSample >= 0,
               pendingSwitchAtSample - transportSample <= Int64(fadeOutLength) {
                fadeOutSamplesRemaining = max(fadeOutSamplesRemaining, fadeOutLength)
            }
        }

        return noErr
    }
}
