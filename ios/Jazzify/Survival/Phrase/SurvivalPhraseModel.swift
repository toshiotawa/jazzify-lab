import Foundation

struct SurvivalPhraseChordNote: Codable, Sendable, Equatable {
    let orderIndex: Int
    let pitchMidi: Int
    let pitchClass: Int
    let noteName: String
    let staff: Int
    /// Simultaneous-note group within the chunk. nil = one note per step (legacy).
    var stepIndex: Int? = nil
    /// Optional staff label above this note step (defense mode).
    var staffChordName: String? = nil

    enum CodingKeys: String, CodingKey {
        case orderIndex = "order_index"
        case pitchMidi = "pitch_midi"
        case pitchClass = "pitch_class"
        case noteName = "note_name"
        case staff
        case stepIndex = "step_index"
        case staffChordName = "staff_chord_name"
    }
}

struct SurvivalPhraseChord: Codable, Sendable, Equatable, Identifiable {
    let id: String
    let orderIndex: Int
    let chordName: String
    let measureNumber: Int
    let notes: [SurvivalPhraseChordNote]
    /// staff3(ベース) の実音高 MIDI。表示・判定対象外で、塊を正解した瞬間にアプリ音源で発音する（play 専用）。
    var bass: [Int]?
}

struct SurvivalPhraseDefinition: Codable, Sendable, Equatable {
    let id: String
    let mapCategory: String
    let stageNumber: Int
    let title: String
    let bgmUrl: String?
    let keyFifths: Int
    let chords: [SurvivalPhraseChord]
}
