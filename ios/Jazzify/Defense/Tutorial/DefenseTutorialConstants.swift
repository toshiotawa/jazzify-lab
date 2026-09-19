import Foundation

/// Defense input-setup tutorial: written do-re-mi at BPM 60, 4/4.
enum DefenseTutorialConstants {
    static let key = "input-setup-v1"
    static let bpm: Double = 60
    static let beatsPerBar = 4
    static let writtenPitchClasses: [Int] = [0, 2, 4]
    static let targetConcertMidi = 60
    static let beatSec = 60.0 / bpm
    static let loopSec = beatSec * Double(beatsPerBar)
    static let noteOnsetsSec: [Double] = [0, 1, 2]
    static let noteDurationSec = 0.8
    static let solfegeLabels = ["ド", "レ", "ミ"]
    static let audioUrl = "https://jazzify-cdn.com/sozai/defense-tutorial-cde-bpm60.mp3"
}

enum DefenseTutorialWrittenOctave: Int, Sendable {
    case three = 3
    case four = 4
    case five = 5
    case six = 6
}
