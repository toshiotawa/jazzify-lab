import Foundation

/// Defense input-setup tutorial: 8-bar call-and-response at BPM 60, 4/4.
enum DefenseTutorialConstants {
    static let key = "input-setup-v1"
    static let bpm: Double = 60
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
    static let audioUrl = "https://jazzify-cdn.com/sozai/defense-call-response/defense-tutorial-call-response-cde-bpm60.mp3"
    static let audioBaseUrl = "https://jazzify-cdn.com/sozai/defense-call-response/"

    static let pregeneratedRootMidis: [Int] = [
        27, 29, 34, 36, 39, 41, 46, 48, 51, 53, 58, 60, 63, 65, 70, 72, 75, 77, 82, 84,
    ]

    private static let pregeneratedRootMidiSet: Set<Int> = Set(pregeneratedRootMidis)

    static func audioUrl(forRootConcertMidi rootMidi: Int) -> String? {
        guard pregeneratedRootMidiSet.contains(rootMidi) else {
            return nil
        }
        return "\(audioBaseUrl)defense-tutorial-call-response-root-\(rootMidi)-bpm60.mp3"
    }

    static func audioUrl(forConcertMidis concertMidis: [Int]) -> String? {
        guard concertMidis.count == 3,
              concertMidis[1] == concertMidis[0] + 2,
              concertMidis[2] == concertMidis[0] + 4
        else {
            return nil
        }
        return audioUrl(forRootConcertMidi: concertMidis[0])
    }
}