import AVFoundation
import Foundation

enum DefensePhraseBacking {
    static func preloadUrls(for stage: DefenseStageDefinition, phraseIndices: [Int]) -> [URL] {
        if stage.audioRegistrationMode == .sharedProgressionSeparateTracks {
            var urls: [URL] = []
            if let bgm = stage.audioUrl, let url = URL(string: bgm) { urls.append(url) }
            if let melody = stage.melodyAudioUrl, let url = URL(string: melody) { urls.append(url) }
            var seen = Set<URL>()
            return urls.filter { seen.insert($0).inserted }
        }
        if stage.audioRegistrationMode == .sharedProgression {
            let urls = stage.phrases.compactMap { URL(string: $0.audioUrl) }
            var seen = Set<URL>()
            return urls.filter { seen.insert($0).inserted }
        }
        if stage.audioRegistrationMode == .singleSource {
            guard let urlString = stage.audioUrl, let url = URL(string: urlString) else {
                return []
            }
            return [url]
        }
        let urls = phraseIndices.compactMap { index -> URL? in
            guard stage.phrases.indices.contains(index) else { return nil }
            return URL(string: stage.phrases[index].audioUrl)
        }
        var seen = Set<URL>()
        return urls.filter { seen.insert($0).inserted }
    }

    static func barCount(stage: DefenseStageDefinition, phrase: DefensePhraseDefinition) -> Int {
        if stage.audioRegistrationMode == .sharedProgression
            || stage.audioRegistrationMode == .sharedProgressionSeparateTracks {
            return max(1, stage.progressionBars ?? stage.phraseBars)
        }
        if let startMeasure = phrase.loopStartMeasure, let endMeasure = phrase.loopEndMeasure {
            return max(1, endMeasure - startMeasure + 1)
        }
        return max(1, stage.phraseBars)
    }

    static func slicePCMBuffer(
        _ buffer: AVAudioPCMBuffer,
        startingFrame: AVAudioFramePosition,
        frameCount: AVAudioFrameCount
    ) -> AVAudioPCMBuffer? {
        guard frameCount > 0 else { return nil }
        let format = buffer.format
        guard let slice = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return nil }
        slice.frameLength = frameCount

        let channelCount = Int(format.channelCount)
        let start = Int(startingFrame)
        let count = Int(frameCount)
        guard start >= 0, start + count <= Int(buffer.frameLength) else { return nil }

        for channel in 0..<channelCount {
            guard let source = buffer.floatChannelData?[channel],
                  let destination = slice.floatChannelData?[channel]
            else {
                return nil
            }
            destination.update(from: source.advanced(by: start), count: count)
        }
        return slice
    }

    static func fitPCMBuffer(_ source: AVAudioPCMBuffer, frameCount: AVAudioFrameCount) -> AVAudioPCMBuffer? {
        guard frameCount > 0 else { return nil }
        if source.frameLength == frameCount {
            return source
        }
        let format = source.format
        guard let fitted = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            return nil
        }
        fitted.frameLength = frameCount
        let copyCount = min(Int(source.frameLength), Int(frameCount))
        let channelCount = Int(format.channelCount)
        for channel in 0..<channelCount {
            guard let destination = fitted.floatChannelData?[channel] else {
                return nil
            }
            if copyCount > 0, let sourceSamples = source.floatChannelData?[channel] {
                destination.update(from: sourceSamples, count: copyCount)
            }
            if copyCount < Int(frameCount) {
                destination.advanced(by: copyCount).update(repeating: 0, count: Int(frameCount) - copyCount)
            }
        }
        return fitted
    }

    static func preparePhraseBuffer(
        decoded: AVAudioPCMBuffer,
        stage: DefenseStageDefinition,
        phrase: DefensePhraseDefinition
    ) -> AVAudioPCMBuffer {
        guard stage.audioRegistrationMode == .singleSource,
              let startMeasure = phrase.loopStartMeasure,
              let endMeasure = phrase.loopEndMeasure
        else {
            return decoded
        }

        let range = DefenseAudioLoopWindowResolver.resolveFrameRange(
            startMeasure: startMeasure,
            endMeasure: endMeasure,
            sampleRate: decoded.format.sampleRate,
            bpm: stage.bpm,
            beatsPerBar: stage.beatsPerBar,
            bufferFrameLength: AVAudioFramePosition(decoded.frameLength)
        )
        guard range.frameCount > 0,
              let sliced = slicePCMBuffer(decoded, startingFrame: range.startFrame, frameCount: range.frameCount)
        else {
            return decoded
        }
        return sliced
    }
}
