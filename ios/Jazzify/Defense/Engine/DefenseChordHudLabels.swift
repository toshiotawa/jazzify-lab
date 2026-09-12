import Foundation

struct DefenseChordHudLabels: Equatable {
    let current: String
    let next: String

    static func make(chordNames: [String], chordIndex: Int) -> DefenseChordHudLabels {
        guard !chordNames.isEmpty else {
            return DefenseChordHudLabels(current: "-", next: "-")
        }
        let safeIndex = min(max(chordIndex, 0), chordNames.count - 1)
        let current = chordNames[safeIndex]
        let nextIndex = safeIndex + 1
        let next = nextIndex < chordNames.count ? chordNames[nextIndex] : "-"
        return DefenseChordHudLabels(current: current, next: next)
    }
}
