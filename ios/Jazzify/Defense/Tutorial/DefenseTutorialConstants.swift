import Foundation

/// Defense input-setup tutorial: 8-bar call-and-response at BPM 120, 4/4.
enum DefenseTutorialConstants {
    static let key = "input-setup-v1"
    static let bpm: Double = 120
    static let beatsPerBar = 4
    static let audioLoopBars = 8
    static let callResponseBars = 1
    static let keyFifths = 0
    static let writtenPitchClasses: [Int] = [0, 2, 4]
    static let targetConcertMidi = 60
    /// Written do-re-mi octave on bass clef (C3/D3/E3 in C).
    static let bassWrittenOctave = 3
    static let beatSec = 60.0 / bpm
    static let barSec = beatSec * Double(beatsPerBar)
    static let loopSec = barSec * Double(audioLoopBars)
    /// Beat offsets within the call bar (0, 1, 2).
    static let noteBeatOffsets: [Double] = [0, 1, 2]
    static let noteDurationSec = 0.8
    static let solfegeLabels = ["ド", "レ", "ミ"]
    static let audioUrl = "https://jazzify-cdn.com/sozai/defense-tutorial-cde-bpm120-cr.mp3"
}