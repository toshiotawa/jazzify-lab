import Foundation

struct SurvivalPhraseChordNote: Codable, Sendable, Equatable {
    let orderIndex: Int
    let pitchMidi: Int
    let pitchClass: Int
    let noteName: String
    let staff: Int
}

struct SurvivalPhraseChord: Codable, Sendable, Equatable, Identifiable {
    let id: String
    let orderIndex: Int
    let chordName: String
    let measureNumber: Int
    let notes: [SurvivalPhraseChordNote]
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
