import AVFoundation
import Foundation

enum DefensePhraseBacking {
    static func preloadUrls(for stage: DefenseStageDefinition, phraseIndices: [Int]) -> [URL] {
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
