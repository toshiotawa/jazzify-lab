import Foundation

enum PhraseProgressIdleReset {
    static let intervalSec: TimeInterval = 15

    static func isExpired(lastProgressAt: TimeInterval?, now: TimeInterval) -> Bool {
        guard let lastProgressAt else { return false }
        return now - lastProgressAt >= intervalSec
    }
}
