import AVFoundation
import Foundation

enum DefenseTutorialAudio {
    private static func midiToFrequency(_ midi: Int) -> Double {
        440 * pow(2, Double(midi - 69) / 12)
    }

    static func synthesize(concertMidis: [Int]) -> AVAudioPCMBuffer? {
        guard concertMidis.count == 3 else { return nil }
        let format = EarTrainingAudio.preferredOutputFormat()
        let sampleRate = format.sampleRate
        let length = AVAudioFrameCount((DefenseTutorialConstants.loopSec * sampleRate).rounded(.up))
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: length) else {
            return nil
        }
        buffer.frameLength = length
        guard let channel = buffer.floatChannelData?[0] else { return nil }

        for index in 0..<3 {
            let midi = concertMidis[index]
            let freq = midiToFrequency(midi)
            let startSec = DefenseTutorialConstants.noteOnsetsSec[index]
            let startSample = Int((startSec * sampleRate).rounded(.down))
            let durationSamples = Int((DefenseTutorialConstants.noteDurationSec * sampleRate).rounded(.down))
            for offset in 0..<durationSamples {
                let sampleIndex = startSample + offset
                guard sampleIndex >= 0, sampleIndex < Int(length) else { break }
                let t = Double(offset) / sampleRate
                let attack = min(1, t / 0.02)
                let release = max(0, 1 - (t - 0.35) / 0.15)
                let envelope = attack * release
                channel[sampleIndex] += Float(sin(2 * Double.pi * freq * t) * envelope * 0.35)
            }
        }

        return buffer
    }
}
