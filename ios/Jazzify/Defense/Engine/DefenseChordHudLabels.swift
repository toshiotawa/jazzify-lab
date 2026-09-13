import Foundation

struct DefenseChordHudLabels: Equatable {
    let current: String

    static func make(chordNames: [String], chordIndex: Int) -> DefenseChordHudLabels {
        guard !chordNames.isEmpty else {
            return DefenseChordHudLabels(current: "-")
        }
        let safeIndex = min(max(chordIndex, 0), chordNames.count - 1)
        let current = chordNames[safeIndex]
        return DefenseChordHudLabels(current: current)
    }
}
