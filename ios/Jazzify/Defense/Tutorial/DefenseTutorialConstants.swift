import Foundation

/// Defense input-setup tutorial: fixed concert C–D–E at BPM 100, 4/4.
enum DefenseTutorialConstants {
    static let key = "input-setup-v1"
    static let bpm: Double = 100
    static let beatsPerBar = 4
    static let keyFifths = 0
    static let targetPitchClasses: [Int] = [0, 2, 4]
    static let beatSec = 60.0 / bpm
    static let loopSec = beatSec * Double(beatsPerBar)
    static let noteOnsetsSec: [Double] = [0, 0.6, 1.2]
    static let noteDurationSec = 0.5
    static let audioUrl = "https://jazzify-cdn.com/sozai/defense-tutorial-cde-bpm100.mp3"
}

enum DefenseTutorialConcertOctave: Int, Sendable {
    case three = 3
    case four = 4
    case five = 5
}
