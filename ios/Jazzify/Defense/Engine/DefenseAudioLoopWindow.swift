import AVFoundation
import Foundation

struct DefenseAudioLoopWindow: Sendable, Equatable {
    let startMeasure: Int
    let endMeasure: Int
    let startSec: Double
    let endSec: Double
    let durationSec: Double
}

enum DefenseAudioLoopWindowResolver {
    static func resolve(
        startMeasure: Int,
        endMeasure: Int,
        bpm: Double,
        beatsPerBar: Int,
        bufferDurationSec: Double? = nil
    ) -> DefenseAudioLoopWindow {
        let safeStartMeasure = max(1, startMeasure)
        let safeEndMeasure = max(safeStartMeasure, endMeasure)
        let measureDurationSec = DefenseTransport.barSeconds(bpm: bpm, beatsPerBar: beatsPerBar)
        let startSec = Double(safeStartMeasure - 1) * measureDurationSec
        var endSec = Double(safeEndMeasure) * measureDurationSec
        if let bufferDurationSec {
            endSec = min(endSec, max(startSec, bufferDurationSec))
        }
        return DefenseAudioLoopWindow(
            startMeasure: safeStartMeasure,
            endMeasure: safeEndMeasure,
            startSec: startSec,
            endSec: endSec,
            durationSec: max(1e-6, endSec - startSec)
        )
    }

    static func resolveFrameRange(
        startMeasure: Int,
        endMeasure: Int,
        sampleRate: Double,
        bpm: Double,
        beatsPerBar: Int,
        bufferFrameLength: AVAudioFramePosition
    ) -> (startFrame: AVAudioFramePosition, frameCount: AVAudioFrameCount) {
        let window = resolve(
            startMeasure: startMeasure,
            endMeasure: endMeasure,
            bpm: bpm,
            beatsPerBar: beatsPerBar,
            bufferDurationSec: Double(bufferFrameLength) / sampleRate
        )
        let startFrame = min(
            bufferFrameLength,
            max(0, AVAudioFramePosition((window.startSec * sampleRate).rounded(.down)))
        )
        let endFrame = min(
            bufferFrameLength,
            max(startFrame, AVAudioFramePosition((window.endSec * sampleRate).rounded(.up)))
        )
        return (startFrame, AVAudioFrameCount(max(0, endFrame - startFrame)))
    }
}
