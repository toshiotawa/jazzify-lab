import AVFoundation
import Foundation

final class DefenseSharedProgressionAudio: @unchecked Sendable {
    static let shared = DefenseSharedProgressionAudio()

    private static let masterHeadroomGain: Float = 0.7
    private static let voiceInputDuckFactor: Float = 0.5
    private static let startLeadSec = 0.15
    private static let scheduleMinQuantumSec = 0.001

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
            self.timePitch.rate = max(0.1, rate)
            self.timePitch.bypass = abs(rate - 1) < 0.0001
        }
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
        let prepared = try await decodePreparedPhrases(
            stage: stage,
            progressionBars: progressionBars,
            outputFormat: outputFormat
        )

        await MainActor.run {
            self.stage = stage
            self.playbackRatio = max(0.1, speedRatio)
            self.progressionBars = progressionBars
            self.switchEveryBars = stage.phraseBars
            self.barSec = DefenseSharedProgressionTransport.barSeconds(
                bpm: stage.bpm,
                beatsPerBar: stage.beatsPerBar,
                playbackRatio: self.playbackRatio
            )
            self.buffersByPhraseIndex = prepared.buffers
            self.barFramesByPhraseIndex = prepared.barFrames
        }
    }

    private func decodePreparedPhrases(
        stage: DefenseStageDefinition,
        progressionBars: Int,
        outputFormat: AVAudioFormat
    ) async throws -> (buffers: [Int: AVAudioPCMBuffer], barFrames: [Int: [Int]]) {
        var buffers: [Int: AVAudioPCMBuffer] = [:]
        var barFrames: [Int: [Int]] = [:]

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
            buffers[index] = fitted
            barFrames[index] = DefenseSharedProgressionTransport.buildBarFrameTable(
                progressionBars: progressionBars,
                barFrameCount: Int(fitted.frameLength)
            )
        }

        return (buffers, barFrames)
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
            let transportStart = Self.hostTimeSec() + Self.startLeadSec
            self.transportStartHostSec = transportStart
            self.playActivePhraseImmediate(
                at: initialPhraseIndex,
                offsetSec: 0,
                startAtHostSec: transportStart
            )
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
            let offsetSecSnapshot = offsetSec
            self.transportStartHostSec = Self.hostTimeSec() - offsetSecSnapshot
            self.playActivePhraseImmediate(at: self.audiblePhraseIndex, offsetSec: offsetSecSnapshot)
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
            self.transportStartHostSec = Self.hostTimeSec()
            self.playActivePhraseImmediate(at: phraseIndex, offsetSec: 0)
        }
    }

    func stop() {
        runOnMain { [weak self] in
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
        startAtHostSec: Double? = nil
    ) {
        guard let buffer = buffersByPhraseIndex[phraseIndex],
              let barFrames = barFramesByPhraseIndex[phraseIndex],
              barFrames.count > progressionBars
        else { return }

        ensureGraph()
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

        let playbackWhen: AVAudioTime? = {
            guard let startAtHostSec else { return nil }
            return AVAudioTime(hostTime: AVAudioTime.hostTime(forSeconds: startAtHostSec))
        }()

        if startFrame <= formStart {
            scheduleFullLoop(for: phraseIndex, player: active, at: playbackWhen)
        } else {
            let tailCount = AVAudioFrameCount(max(0, formEnd - startFrame))
            if tailCount > 0,
               let tailBuffer = DefensePhraseBacking.slicePCMBuffer(
                   buffer,
                   startingFrame: startFrame,
                   frameCount: tailCount
               ) {
                active.scheduleBuffer(tailBuffer, at: playbackWhen) { [weak self] in
                    self?.runOnMain {
                        self?.scheduleLoopHead(for: phraseIndex, player: active, at: nil)
                    }
                }
            } else {
                scheduleLoopHead(for: phraseIndex, player: active, at: playbackWhen)
            }
        }

        do {
            if !engine.isRunning {
                try engine.start()
            }
        } catch {
            return
        }

        if let playbackWhen {
            active.play(at: playbackWhen)
        } else {
            active.play()
        }
        applyMasterVolume()
    }

    private func prescheduleIncomingSwitch(
        phraseIndex: Int,
        plan: DefenseSharedProgressionSwitchPlan
    ) {
        guard let buffer = buffersByPhraseIndex[phraseIndex],
              let barFrames = barFramesByPhraseIndex[phraseIndex],
              barFrames.count > progressionBars
        else { return }

        ensureGraph()
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
                incoming.scheduleBuffer(tailBuffer, at: when) { [weak self] in
                    self?.runOnMain {
                        self?.scheduleLoopHead(for: phraseIndex, player: incoming, at: nil)
                    }
                }
            } else {
                scheduleLoopHead(for: phraseIndex, player: incoming, at: when)
            }
        }

        do {
            if !engine.isRunning {
                try engine.start()
            }
        } catch {
            return
        }

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

    private func runOnMain(_ block: @escaping () -> Void) {
        if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.async(execute: block)
        }
    }

    func beatInForm() -> Double {
        guard transportStartHostSec > 0, barSec > 0, progressionBars > 0 else { return 0 }
        let now = Self.hostTimeSec()
        let absoluteBar = max(0, (now - transportStartHostSec) / barSec)
        let barInForm = absoluteBar.truncatingRemainder(dividingBy: Double(progressionBars))
        let beatsPerBar = Double(stage?.beatsPerBar ?? 4)
        return barInForm * beatsPerBar
    }

    private static func hostTimeSec() -> Double {
        AVAudioTime.seconds(forHostTime: mach_absolute_time())
    }
}
