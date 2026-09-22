import AVFoundation
import Foundation

enum DefenseSeparateTracksBuffers {
    private static var nextSetId = 1
    private static let loopOverlapMs: Double = 15
    private static let sampleRateMismatchThreshold = 0.01

    private struct NativeSourceCacheKey: Hashable {
        let bgmUrl: String
        let melodyUrl: String
    }

    private struct NativePCM {
        let buffer: AVAudioPCMBuffer
        let sampleRate: Double
    }

    private static var nativeSourceCache: [NativeSourceCacheKey: (bgm: NativePCM, melody: NativePCM)] = [:]

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

        let cacheKey = NativeSourceCacheKey(bgmUrl: bgmUrlString, melodyUrl: melodyUrlString)
        let cache = RemoteAudioFileCache(subdirectory: "defense-separate-tracks")

        let nativeBgm: NativePCM
        let nativeMelody: NativePCM
        if let cached = nativeSourceCache[cacheKey] {
            nativeBgm = cached.bgm
            nativeMelody = cached.melody
        } else {
            nativeBgm = try await readNativePCM(url: bgmUrl, cache: cache)
            nativeMelody = try await readNativePCM(url: melodyUrl, cache: cache)
            nativeSourceCache[cacheKey] = (nativeBgm, nativeMelody)
        }

        return try await buildPreparedSet(
            stage: stage,
            speedRatio: speedRatio,
            sampleRate: sampleRate,
            nativeBgm: nativeBgm,
            nativeMelody: nativeMelody
        )
    }

    /// セッション sampleRate 遷移後、キャッシュ済み native PCM から新レートへ再構築する。
    static func reconvert(
        preparedSet: DefenseSeparateTracksPreparedSet,
        stage: DefenseStageDefinition,
        speedRatio: Double,
        newSampleRate: Double
    ) async throws -> DefenseSeparateTracksPreparedSet {
        guard abs(newSampleRate - preparedSet.grid.sampleRate) / preparedSet.grid.sampleRate
            > sampleRateMismatchThreshold else {
            return preparedSet
        }

        guard stage.audioRegistrationMode == .sharedProgressionSeparateTracks,
              let bgmUrlString = stage.audioUrl,
              let melodyUrlString = stage.melodyAudioUrl,
              let bgmUrl = URL(string: bgmUrlString),
              let melodyUrl = URL(string: melodyUrlString) else {
            throw DefenseSeparateTracksAudioError.invalidMode
        }

        let cacheKey = NativeSourceCacheKey(bgmUrl: bgmUrlString, melodyUrl: melodyUrlString)
        let cache = RemoteAudioFileCache(subdirectory: "defense-separate-tracks")

        let nativeBgm: NativePCM
        let nativeMelody: NativePCM
        if let cached = nativeSourceCache[cacheKey] {
            nativeBgm = cached.bgm
            nativeMelody = cached.melody
        } else {
            nativeBgm = try await readNativePCM(url: bgmUrl, cache: cache)
            nativeMelody = try await readNativePCM(url: melodyUrl, cache: cache)
            nativeSourceCache[cacheKey] = (nativeBgm, nativeMelody)
        }

        return try await buildPreparedSet(
            stage: stage,
            speedRatio: speedRatio,
            sampleRate: newSampleRate,
            nativeBgm: nativeBgm,
            nativeMelody: nativeMelody
        )
    }

    /// メロディ PCM のループ切れ目を等パワー重なりでつなぐ（Web 15ms overlap と同等）。
    static func applyMelodyLoopCrossfade(_ samples: inout [Float], sampleRate: Double) {
        guard !samples.isEmpty else { return }
        let overlapFrames = max(1, Int((sampleRate * loopOverlapMs / 1000).rounded()))
        guard samples.count > overlapFrames * 2 else { return }

        for index in 0..<overlapFrames {
            let head = samples[index]
            let tailIndex = samples.count - overlapFrames + index
            let tail = samples[tailIndex]
            let progress = Double(index) / Double(overlapFrames)
            let fadeOut = Float(cos((Double.pi / 2) * progress))
            let fadeIn = Float(sin((Double.pi / 2) * progress))
            samples[tailIndex] = tail * fadeOut + head * fadeIn
        }
    }

    /// 後方互換の別名。フェードアウトは行わずループ重なりのみ適用する。
    static func applyMelodyEnvelope(_ samples: inout [Float], sampleRate: Double) {
        applyMelodyLoopCrossfade(&samples, sampleRate: sampleRate)
    }

    private static func buildPreparedSet(
        stage: DefenseStageDefinition,
        speedRatio: Double,
        sampleRate: Double,
        nativeBgm: NativePCM,
        nativeMelody: NativePCM
    ) async throws -> DefenseSeparateTracksPreparedSet {
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

        let outputFormat = DefenseSeparateTracksPlayback.sourceFormat(sampleRate: sampleRate)

        let expectedBgmFrames = DefenseSeparateTracksTransport.measureSourceFrame(
            measureNumber: progressionBars,
            bpm: stage.bpm,
            beatsPerBar: stage.beatsPerBar,
            sampleRate: nativeBgm.sampleRate
        )
        let expectedMelodyFrames = DefenseSeparateTracksTransport.measureSourceFrame(
            measureNumber: stage.phrases.count * stage.phraseBars,
            bpm: stage.bpm,
            beatsPerBar: stage.beatsPerBar,
            sampleRate: nativeMelody.sampleRate
        )

        guard DefenseSeparateTracksTransport.isSourceFrameCountValid(
            actualFrames: Int(nativeBgm.buffer.frameLength),
            expectedFrames: expectedBgmFrames
        ), DefenseSeparateTracksTransport.isSourceFrameCountValid(
            actualFrames: Int(nativeMelody.buffer.frameLength),
            expectedFrames: expectedMelodyFrames
        ) else {
            throw DefenseSeparateTracksAudioError.sourceLengthMismatch
        }

        let bgmBuffer = try convertIfNeeded(nativeBgm.buffer, to: outputFormat)
        let melodyBuffer = try convertIfNeeded(nativeMelody.buffer, to: outputFormat)

        let stretchedBgm = try await timeStretch(buffer: bgmBuffer, ratio: speedRatio)
        var phrasePcms: [DefenseSeparateTracksPhrasePcm] = []
        for rank in 0..<stage.phrases.count {
            let window = DefenseSeparateTracksTransport.phraseLoopWindow(
                rank: rank,
                phraseBars: phraseBars,
                bpm: stage.bpm,
                beatsPerBar: stage.beatsPerBar,
                sampleRate: melodyBuffer.format.sampleRate
            )
            let slice = sliceBuffer(
                melodyBuffer,
                startFrame: AVAudioFramePosition(window.sourceStartFrame),
                frameCount: AVAudioFrameCount(window.sourceEndFrame - window.sourceStartFrame)
            )
            let stretched = try await timeStretch(buffer: slice, ratio: speedRatio)
            var left = normalizeChannel(stretched, channel: 0, targetFrames: grid.cycleFrames)
            var right = normalizeChannel(
                stretched,
                channel: min(1, Int(stretched.format.channelCount) - 1),
                targetFrames: grid.cycleFrames
            )
            applyMelodyEnvelope(&left, sampleRate: grid.sampleRate)
            applyMelodyEnvelope(&right, sampleRate: grid.sampleRate)
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

    private static func readNativePCM(
        url: URL,
        cache: RemoteAudioFileCache
    ) async throws -> NativePCM {
        let local = try await cache.localFileURL(for: url)
        return try await Task.detached(priority: .userInitiated) {
            let file = try AVAudioFile(forReading: local)
            let frameCount = AVAudioFrameCount(file.length)
            guard let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat, frameCapacity: frameCount) else {
                throw DefenseSeparateTracksAudioError.decodeFailed
            }
            try file.read(into: buffer)
            return NativePCM(buffer: buffer, sampleRate: file.processingFormat.sampleRate)
        }.value
    }

    private static func convertIfNeeded(
        _ buffer: AVAudioPCMBuffer,
        to outputFormat: AVAudioFormat
    ) throws -> AVAudioPCMBuffer {
        if buffer.format.isEqual(outputFormat) {
            return buffer
        }
        guard let converted = EarTrainingAudio.convertBuffer(buffer, to: outputFormat) else {
            throw DefenseSeparateTracksAudioError.decodeFailed
        }
        return converted
    }

    private static func sliceBuffer(
        _ buffer: AVAudioPCMBuffer,
        startFrame: AVAudioFramePosition,
        frameCount: AVAudioFrameCount
    ) -> AVAudioPCMBuffer {
        let start = max(0, min(Int(startFrame), Int(buffer.frameLength)))
        let available = max(0, Int(buffer.frameLength) - start)
        let count = min(max(0, Int(frameCount)), available)
        let capacity = AVAudioFrameCount(max(1, count))
        guard let format = AVAudioFormat(
            commonFormat: buffer.format.commonFormat,
            sampleRate: buffer.format.sampleRate,
            channels: buffer.format.channelCount,
            interleaved: false
        ),
        let sliced = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: capacity) else {
            return buffer
        }
        sliced.frameLength = AVAudioFrameCount(count)
        guard count > 0 else { return sliced }
        for channel in 0..<Int(format.channelCount) {
            guard let src = buffer.floatChannelData?[channel],
                  let dst = sliced.floatChannelData?[channel] else { continue }
            dst.update(from: src.advanced(by: start), count: count)
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
        for index in 0..<copyCount {
            result[index] = data[index]
        }
        if copyCount > 1, copyCount < targetFrames {
            result[copyCount] = data[copyCount - 1]
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

enum DefenseSeparateTracksPlayback {
    static func sourceFormat(sampleRate: Double) -> AVAudioFormat {
        EarTrainingAudio.preferredOutputFormat(sampleRate: sampleRate)
    }
}
