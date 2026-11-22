import AVFoundation
import Foundation

enum DefenseTutorialAudio {
    private static func midiToFrequency(_ midi: Int) -> Double {
        440 * pow(2, Double(midi - 69) / 12)
    }

    private static func addKick(
        to channel: UnsafeMutablePointer<Float>,
        length: Int,
        sampleRate: Double,
        startSec: Double,
        amp: Double = 0.22
    ) {
        let startSample = Int((startSec * sampleRate).rounded(.down))
        let durationSamples = Int((0.08 * sampleRate).rounded(.down))
        for offset in 0..<durationSamples {
            let index = startSample + offset
            guard index >= 0, index < length else { break }
            let t = Double(offset) / sampleRate
            let env = exp(-t * 40)
            channel[index] += Float(sin(2 * Double.pi * 90 * t) * env * amp)
        }
    }

    private static func addHat(
        to channel: UnsafeMutablePointer<Float>,
        length: Int,
        sampleRate: Double,
        startSec: Double,
        amp: Double = 0.06
    ) {
        let startSample = Int((startSec * sampleRate).rounded(.down))
        let durationSamples = Int((0.04 * sampleRate).rounded(.down))
        for offset in 0..<durationSamples {
            let index = startSample + offset
            guard index >= 0, index < length else { break }
            let env = exp(-Double(offset) / (sampleRate * 0.015))
            let noise = sin(Double(index) * 12.9898 + Double(offset) * 78.233) * env * amp
            channel[index] += Float(noise)
        }
    }

    static func synthesize(concertMidis: [Int], sampleRate: Double? = nil) -> AVAudioPCMBuffer? {
        guard concertMidis.count == 3 else { return nil }
        let format: AVAudioFormat
        if let sampleRate {
            format = AudioOutputFormatResolver.stereoFormat(sampleRate: sampleRate)
        } else {
            format = EarTrainingAudio.preferredOutputFormat()
        }
        let sampleRate = format.sampleRate
        let length = AVAudioFrameCount((DefenseTutorialConstants.loopSec * sampleRate).rounded(.up))
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: length) else {
            return nil
        }
        buffer.frameLength = length
        guard let floatData = buffer.floatChannelData else { return nil }
        let channelCount = Int(format.channelCount)
        let frameCount = Int(length)
        for ch in 0..<channelCount {
            floatData[ch].initialize(repeating: 0, count: frameCount)
        }
        let channel = floatData[0]

        let cycleBars = DefenseTutorialConstants.callResponseBars * 2
        for barIdx in 0..<DefenseTutorialConstants.audioLoopBars {
            let barStartSec = Double(barIdx) * DefenseTutorialConstants.barSec
            for beat in 0..<DefenseTutorialConstants.beatsPerBar {
                let beatSec = barStartSec + Double(beat) * DefenseTutorialConstants.beatSec
                addKick(to: channel, length: frameCount, sampleRate: sampleRate, startSec: beatSec)
                addHat(
                    to: channel,
                    length: frameCount,
                    sampleRate: sampleRate,
                    startSec: beatSec + DefenseTutorialConstants.beatSec * 0.5
                )
            }
            let posInCycle = barIdx % cycleBars
            let isCall = posInCycle < DefenseTutorialConstants.callResponseBars
            guard isCall else { continue }
            for index in 0..<3 {
                let midi = concertMidis[index]
                let freq = midiToFrequency(midi)
                let startSec = barStartSec + DefenseTutorialConstants.noteBeatOffsets[index] * DefenseTutorialConstants.beatSec
                let startSample = Int((startSec * sampleRate).rounded(.down))
                let durationSamples = Int((DefenseTutorialConstants.noteDurationSec * sampleRate).rounded(.down))
                for offset in 0..<durationSamples {
                    let sampleIndex = startSample + offset
                    guard sampleIndex >= 0, sampleIndex < frameCount else { break }
                    let t = Double(offset) / sampleRate
                    let attack = min(1, t / 0.02)
                    let release = max(0, 1 - (t - 0.35) / 0.15)
                    let envelope = attack * release
                    channel[sampleIndex] += Float(sin(2 * Double.pi * freq * t) * envelope * 0.32)
                }
            }
        }

        if channelCount > 1 {
            for ch in 1..<channelCount {
                floatData[ch].update(from: channel, count: frameCount)
            }
        }

        return buffer
    }
}