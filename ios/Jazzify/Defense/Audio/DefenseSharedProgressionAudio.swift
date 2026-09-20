import AVFoundation
import Foundation

final class DefenseSharedProgressionAudio {
    static let shared = DefenseSharedProgressionAudio()

    private let queue = DispatchQueue(label: "jp.jazzify.defense.shared-progression-audio")
    private static let masterHeadroomGain: Float = 0.7
    private static let voiceInputDuckFactor: Float = 0.5
    private let cache = RemoteAudioFileCache(subdirectory: "defense-shared-progression")
    private let engine = AVAudioEngine()
    private let playerA = AVAudioPlayerNode()
    private let playerB = AVAudioPlayerNode()
    private let deckMixer = AVAudioMixerNode()
    private let masterMixer = AVAudioMixerNode()
    private let timePitch = AVAudioUnitTimePitch()
    private var graphReady = false
    private var activeIsA = true
    private var stage: DefenseStageDefinition?
    private var playbackRatio: Double = 1
    private var progressionBars = 12
    private var switchEveryBars = 1
    private var barSec: Double = 2
    private var transportStartHostSec: Double = 0
    private var generation: UInt64 = 0
    private var requestRevision = 0
    private var desiredPhraseIndex = 0
    private var audiblePhraseIndex = 0
    private var scheduledSwitchAtHostSec: Double = -1
    private var scheduledPhraseIndex: Int?
    private var wakeWorkItem: DispatchWorkItem?
    private var buffersByPhraseIndex: [Int: AVAudioPCMBuffer] = [:]
    private var barFramesByPhraseIndex: [Int: [Int]] = [:]
    private var paused = false
    private var pausedOffsetSec: Double = 0
    private var userVolume: Float = 1
    private var voiceInputDucking = false

    private init() {}

    func setUserVolume(_ volume: Float) {
        userVolume = max(0, min(1, volume))
        applyMasterVolume()
    }

    func setVoiceInputDucking(_ enabled: Bool) {
        voiceInputDucking = enabled
        applyMasterVolume()
    }

    func setPlaybackRate(_ rate: Float) {
        timePitch.rate = max(0.1, rate)
        timePitch.bypass = abs(rate - 1) < 0.0001
    }

    private func applyMasterVolume() {
        var output = Self.masterHeadroomGain * userVolume
        if voiceInputDucking {
            output *= Self.voiceInputDuckFactor
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

        let outputFormat = EarTrainingAudio.preferredOutputFormat()
        var nextBuffers: [Int: AVAudioPCMBuffer] = [:]
        var nextBarFrames: [Int: [Int]] = [:]

        for index in stage.phrases.indices {
            let phrase = stage.phrases[index]
            guard let url = URL(string: phrase.audioUrl) else {
                throw URLError(.badURL)
            }
            let decoded = try await decodePCM(url: url, outputFormat: outputFormat)
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
            nextBuffers[index] = fitted
            nextBarFrames[index] = DefenseSharedProgressionTransport.buildBarFrameTable(
                progressionBars: progressionBars,
                barFrameCount: Int(fitted.frameLength)
            )
        }

        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            self.queue.async {
                self.stage = stage
                self.playbackRatio = max(0.1, speedRatio)
                self.progressionBars = progressionBars
                self.switchEveryBars = stage.phraseBars
                self.barSec = DefenseSharedProgressionTransport.barSeconds(
                    bpm: stage.bpm,
                    beatsPerBar: stage.beatsPerBar,
                    playbackRatio: self.playbackRatio
                )
                self.buffersByPhraseIndex = nextBuffers
                self.barFramesByPhraseIndex = nextBarFrames
                continuation.resume()
            }
        }
    }

    func start(initialPhraseIndex: Int) {
        queue.async { [weak self] in
            guard let self else { return }
            self.generation &+= 1
            self.stopPlayers(resetTransport: true)
            self.desiredPhraseIndex = initialPhraseIndex
            self.audiblePhraseIndex = initialPhraseIndex
            self.requestRevision = 0
            self.paused = false
            self.pausedOffsetSec = 0
            self.ensureGraph()
            self.transportStartHostSec = Self.hostTimeSec() + 0.15
            self.playPhraseLoop(at: initialPhraseIndex, offsetBar0: 0, startHostSec: self.transportStartHostSec)
        }
    }

    func requestPhrase(at index: Int, requestRevision: Int) {
        queue.async { [weak self] in
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
        queue.async { [weak self] in
            guard let self, !self.paused else { return }
            let now = Self.hostTimeSec()
            self.pausedOffsetSec = max(0, now - self.transportStartHostSec)
            self.paused = true
            self.generation &+= 1
            self.cancelWake()
            self.stopPlayers(resetTransport: false)
        }
    }

    func resumeProgression() {
        queue.async { [weak self] in
            guard let self, self.paused else { return }
            self.paused = false
            self.generation &+= 1
            let loopDuration = Double(self.progressionBars) * self.barSec
            let offsetSec = loopDuration > 0 ? self.pausedOffsetSec.truncatingRemainder(dividingBy: loopDuration) : 0
            let offsetBar0 = self.barSec > 0 ? Int(floor(offsetSec / self.barSec)) : 0
            let now = Self.hostTimeSec()
            self.transportStartHostSec = now - offsetSec
            self.playPhraseLoop(at: self.audiblePhraseIndex, offsetBar0: offsetBar0, startHostSec: now)
            if self.desiredPhraseIndex != self.audiblePhraseIndex {
                self.scheduleDesiredSwitch()
            }
        }
    }

    func restartFromProgressionStart(phraseIndex: Int, speedRatio: Double) {
        queue.async { [weak self] in
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
            self.transportStartHostSec = Self.hostTimeSec() + 0.15
            self.playPhraseLoop(at: phraseIndex, offsetBar0: 0, startHostSec: self.transportStartHostSec)
        }
    }

    func stop() {
        queue.async { [weak self] in
            guard let self else { return }
            self.generation &+= 1
            self.cancelWake()
            self.stopPlayers(resetTransport: true)
            self.stage = nil
            self.buffersByPhraseIndex.removeAll()
            self.barFramesByPhraseIndex.removeAll()
            if self.engine.isRunning {
                self.engine.stop()
            }
        }
    }

    private func scheduleDesiredSwitch() {
        let now = Self.hostTimeSec()
        let plan = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: now,
            transportStart: transportStartHostSec,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: DefenseSharedProgressionSwitchEveryBars(rawValue: switchEveryBars) ?? .one,
            schedulingLeadSec: 0.1
        )

        if scheduledSwitchAtHostSec >= 0,
           abs(scheduledSwitchAtHostSec - plan.switchAt) < 1e-6,
           now < plan.switchAt - 0.1 {
            scheduledPhraseIndex = desiredPhraseIndex
            return
        }

        if scheduledSwitchAtHostSec >= 0, now >= scheduledSwitchAtHostSec - 0.1 {
            return
        }

        scheduledPhraseIndex = desiredPhraseIndex
        scheduledSwitchAtHostSec = plan.switchAt
        scheduleWake(atHostSec: plan.switchAt - 0.12)
    }

    private func performScheduledSwitch() {
        guard !paused else { return }
        let now = Self.hostTimeSec()
        let plan = DefenseSharedProgressionTransport.planSwitch(
            nowAudioTime: now,
            transportStart: transportStartHostSec,
            barSec: barSec,
            progressionBars: progressionBars,
            switchEveryBars: DefenseSharedProgressionSwitchEveryBars(rawValue: switchEveryBars) ?? .one,
            schedulingLeadSec: 0.1
        )
        guard now + 0.005 >= plan.switchAt else {
            scheduleWake(atHostSec: plan.switchAt - 0.12)
            return
        }

        let phraseIndex = desiredPhraseIndex
        audiblePhraseIndex = phraseIndex
        scheduledPhraseIndex = nil
        scheduledSwitchAtHostSec = -1
        playPhraseLoop(at: phraseIndex, offsetBar0: plan.destinationBar0, startHostSec: plan.switchAt)
    }

    private func playPhraseLoop(at phraseIndex: Int, offsetBar0: Int, startHostSec: Double) {
        guard let buffer = buffersByPhraseIndex[phraseIndex],
              let barFrames = barFramesByPhraseIndex[phraseIndex],
              barFrames.count > progressionBars
        else { return }

        ensureGraph()
        cancelWake()
        scheduledPhraseIndex = nil
        scheduledSwitchAtHostSec = -1

        let startFrame = AVAudioFramePosition(barFrames[offsetBar0])
        let endFrame = AVAudioFramePosition(barFrames[progressionBars])
        let tailCount = AVAudioFrameCount(max(0, endFrame - startFrame))
        let when = AVAudioTime(hostTime: AVAudioTime.hostTime(forSeconds: startHostSec))
        let outgoing = activeIsA ? playerA : playerB
        let incoming = activeIsA ? playerB : playerA

        incoming.stop()
        incoming.reset()
        if tailCount > 0,
           let tailBuffer = DefensePhraseBacking.slicePCMBuffer(
               buffer,
               startingFrame: startFrame,
               frameCount: tailCount
           ) {
            incoming.scheduleBuffer(tailBuffer, at: when, completionHandler: { [weak self] in
                self?.queue.async {
                    guard let self else { return }
                    self.scheduleLoopHead(for: phraseIndex, player: incoming)
                }
            })
        } else {
            scheduleLoopHead(for: phraseIndex, player: incoming, at: when)
        }

        incoming.play(at: when)
        let stopDelay = max(0, startHostSec - Self.hostTimeSec())
        queue.asyncAfter(deadline: .now() + stopDelay) {
            outgoing.stop()
            outgoing.reset()
        }
        activeIsA.toggle()

        if !engine.isRunning {
            try? engine.start()
        }
        applyMasterVolume()
    }

    private func scheduleLoopHead(
        for phraseIndex: Int,
        player: AVAudioPlayerNode,
        at when: AVAudioTime? = nil
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
        if !player.isPlaying {
            player.play(at: when)
        }
    }

    private func scheduleWake(atHostSec: Double) {
        cancelWake()
        let delay = max(0.01, atHostSec - Self.hostTimeSec())
        let item = DispatchWorkItem { [weak self] in
            self?.performScheduledSwitch()
        }
        wakeWorkItem = item
        queue.asyncAfter(deadline: .now() + delay, execute: item)
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

    private func ensureGraph() {
        guard !graphReady else { return }
        let format = EarTrainingAudio.preferredOutputFormat()
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

    private func decodePCM(url: URL, outputFormat: AVAudioFormat) async throws -> AVAudioPCMBuffer {
        let local = try await cache.localFileURL(for: url)
        return try await Task.detached(priority: .userInitiated) {
            let file = try AVAudioFile(forReading: local)
            let frameCount = AVAudioFrameCount(file.length)
            guard let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat, frameCapacity: frameCount) else {
                throw URLError(.cannotDecodeContentData)
            }
            try file.read(into: buffer)
            if buffer.format.isEqual(outputFormat) {
                return buffer
            }
            guard let converted = EarTrainingAudio.convertBuffer(buffer, to: outputFormat) else {
                throw URLError(.cannotDecodeContentData)
            }
            return converted
        }.value
    }

    private static func hostTimeSec() -> Double {
        AVAudioTime.seconds(forHostTime: mach_absolute_time())
    }
}
