import AVFoundation
import Foundation

enum DefenseSeparateTracksBuffers {
    private static var nextSetId = 1

    static func prepare(
        stage: DefenseStageDefinition,
        speedRatio: Double,
        sampleRate: Double
    ) async throws -> DefenseSeparateTracksPreparedSet {
        guard stage.audioRegistrationMode == .sharedProgressionSeparateTracks,
              let bgmUrlString = stage.audioUrl,
              let melodyUrlString = stage.melodyAudioUrl,
              let bgmUrl = URL(string: bgmUrlString),
              let melodyUrl = URL(string: melodyUrlString) else {
            throw DefenseSeparateTracksAudioError.invalidMode
        }

        let phraseBars: DefenseSeparateTracksPhraseBars
        switch stage.phraseBars {
        case 1: phraseBars = .one
        case 2: phraseBars = .two
        case 4: phraseBars = .four
        default: phraseBars = .two
        }

        let progressionBars = stage.progressionBars ?? stage.phraseBars
        let grid = DefenseSeparateTracksTransport.computeGrid(
            sampleRate: sampleRate,
            bpm: stage.bpm,
            beatsPerBar: stage.beatsPerBar,
            phraseBars: phraseBars,
            progressionBars: progressionBars,
            playbackRatio: speedRatio
        )

        let cache = RemoteAudioFileCache(subdirectory: "defense-separate-tracks")
        let outputFormat = AVAudioFormat(
            standardFormatWithSampleRate: sampleRate,
            channels: 2
        ) ?? AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: sampleRate, channels: 2, interleaved: false)!
        let bgmBuffer = try await decodePCM(url: bgmUrl, cache: cache, outputFormat: outputFormat)
        let melodyBuffer = try await decodePCM(url: melodyUrl, cache: cache, outputFormat: outputFormat)

        let expectedBgmFrames = DefenseSeparateTracksTransport.measureSourceFrame(
            measureNumber: progressionBars,
            bpm: stage.bpm,
            beatsPerBar: stage.beatsPerBar,
            sampleRate: sampleRate
        )
        let expectedMelodyFrames = DefenseSeparateTracksTransport.measureSourceFrame(
            measureNumber: stage.phrases.count * stage.phraseBars,
            bpm: stage.bpm,
            beatsPerBar: stage.beatsPerBar,
            sampleRate: sampleRate
        )

        guard abs(Int(bgmBuffer.frameLength) - expectedBgmFrames) <= 1,
              abs(Int(melodyBuffer.frameLength) - expectedMelodyFrames) <= 1 else {
            throw DefenseSeparateTracksAudioError.invalidMode
        }

        let stretchedBgm = try await timeStretch(buffer: bgmBuffer, ratio: speedRatio)
        var phrasePcms: [DefenseSeparateTracksPhrasePcm] = []
        for rank in 0..<stage.phrases.count {
            let window = DefenseSeparateTracksTransport.phraseLoopWindow(
                rank: rank,
                phraseBars: phraseBars,
                bpm: stage.bpm,
                beatsPerBar: stage.beatsPerBar,
                sampleRate: sampleRate
            )
            let slice = sliceBuffer(
                melodyBuffer,
                startFrame: AVAudioFramePosition(window.sourceStartFrame),
                frameCount: AVAudioFrameCount(window.sourceEndFrame - window.sourceStartFrame)
            )
            let stretched = try await timeStretch(buffer: slice, ratio: speedRatio)
            let left = normalizeChannel(stretched, channel: 0, targetFrames: grid.cycleFrames)
            let right = normalizeChannel(stretched, channel: min(1, Int(stretched.format.channelCount) - 1), targetFrames: grid.cycleFrames)
            phrasePcms.append(DefenseSeparateTracksPhrasePcm(left: left, right: right))
        }

        let bgmLeft = normalizeChannel(stretchedBgm, channel: 0, targetFrames: grid.bgmFrames)
        let bgmRight = normalizeChannel(
            stretchedBgm,
            channel: min(1, Int(stretchedBgm.format.channelCount) - 1),
            targetFrames: grid.bgmFrames
        )

        let setId = nextSetId
        nextSetId += 1
        return DefenseSeparateTracksPreparedSet(
            grid: grid,
            bgmLeft: bgmLeft,
            bgmRight: bgmRight,
            phrasePcms: phrasePcms,
            speedPercent: Int((speedRatio * 100).rounded()),
            setId: setId
        )
    }

    private static func decodePCM(
        url: URL,
        cache: RemoteAudioFileCache,
        outputFormat: AVAudioFormat
    ) async throws -> AVAudioPCMBuffer {
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

    private static func sliceBuffer(
        _ buffer: AVAudioPCMBuffer,
        startFrame: AVAudioFramePosition,
        frameCount: AVAudioFrameCount
    ) -> AVAudioPCMBuffer {
        guard let format = AVAudioFormat(
            commonFormat: buffer.format.commonFormat,
            sampleRate: buffer.format.sampleRate,
            channels: buffer.format.channelCount,
            interleaved: false
        ),
        let sliced = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            return buffer
        }
        sliced.frameLength = frameCount
        let start = Int(startFrame)
        for channel in 0..<Int(format.channelCount) {
            guard let src = buffer.floatChannelData?[channel],
                  let dst = sliced.floatChannelData?[channel] else { continue }
            dst.update(from: src.advanced(by: start), count: Int(frameCount))
        }
        return sliced
    }

    private static func normalizeChannel(
        _ buffer: AVAudioPCMBuffer,
        channel: Int,
        targetFrames: Int
    ) -> [Float] {
        var result = [Float](repeating: 0, count: targetFrames)
        guard let data = buffer.floatChannelData?[channel] else { return result }
        let copyCount = min(targetFrames, Int(buffer.frameLength))
        for i in 0..<copyCount {
            result[i] = data[i]
        }
        return result
    }

    private static func timeStretch(buffer: AVAudioPCMBuffer, ratio: Double) async throws -> AVAudioPCMBuffer {
        if abs(ratio - 1) < 0.0001 {
            return buffer
        }
        let engine = AVAudioEngine()
        let player = AVAudioPlayerNode()
        let timePitch = AVAudioUnitTimePitch()
        timePitch.rate = Float(ratio)
        engine.attach(player)
        engine.attach(timePitch)
        engine.connect(player, to: timePitch, format: buffer.format)
        engine.connect(timePitch, to: engine.mainMixerNode, format: buffer.format)
        let outputFrameCount = AVAudioFrameCount((Double(buffer.frameLength) / ratio).rounded())
        try engine.enableManualRenderingMode(
            .offline,
            format: buffer.format,
            maximumFrameCount: 4096
        )
        try engine.start()
        await player.scheduleBuffer(buffer, at: nil, options: [])
        player.play()
        guard let rendered = AVAudioPCMBuffer(pcmFormat: buffer.format, frameCapacity: outputFrameCount) else {
            return buffer
        }
        var renderedFrames: AVAudioFrameCount = 0
        while renderedFrames < outputFrameCount {
            let remaining = outputFrameCount - renderedFrames
            let chunk = min(remaining, engine.manualRenderingMaximumFrameCount)
            guard let temp = AVAudioPCMBuffer(pcmFormat: buffer.format, frameCapacity: chunk) else { break }
            let status = try engine.renderOffline(chunk, to: temp)
            if status == .insufficientDataFromInputNode || status == .cannotDoInCurrentContext {
                break
            }
            guard let dst = rendered.floatChannelData,
                  let src = temp.floatChannelData else { break }
            for channel in 0..<Int(buffer.format.channelCount) {
                dst[channel].advanced(by: Int(renderedFrames)).update(
                    from: src[channel],
                    count: Int(temp.frameLength)
                )
            }
            renderedFrames += temp.frameLength
        }
        rendered.frameLength = renderedFrames
        engine.stop()
        return rendered
    }
}
