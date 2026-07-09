import Foundation

/// Web `earTrainingBattleOsuCircleNoteLabels.ts` 相当。
enum EarTrainingBattleOsuCircleNoteLabels {
    private static let pitchClassNames = [
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    ]

    static func resolve(from midis: [Int]) -> [String] {
        let unique = Array(Set(midis)).sorted()
        return unique.map { midi in
            let pc = ((midi % 12) + 12) % 12
            return pitchClassNames[pc]
        }
    }
}
