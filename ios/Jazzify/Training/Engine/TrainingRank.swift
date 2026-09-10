import Foundation

enum TrainingLetterRank: String, Codable, Sendable, CaseIterable {
    case S, A, B, C, D, E, F
}

enum TrainingRank {
    private static let thresholds: [(minScore: Int, rank: TrainingLetterRank)] = [
        (60, .S),
        (50, .A),
        (40, .B),
        (30, .C),
        (20, .D),
        (10, .E),
    ]

    private static let order: [TrainingLetterRank] = [.F, .E, .D, .C, .B, .A, .S]

    static func scoreToRank(_ score: Int) -> TrainingLetterRank {
        let normalized = max(0, score)
        for entry in thresholds where normalized >= entry.minScore {
            return entry.rank
        }
        return .F
    }

    static func meetsRequirement(score: Int, requiredRank: TrainingLetterRank) -> Bool {
        let achieved = scoreToRank(score)
        guard let achievedIndex = order.firstIndex(of: achieved),
              let requiredIndex = order.firstIndex(of: requiredRank)
        else { return false }
        return achievedIndex >= requiredIndex
    }

    static func parseLetterRank(_ raw: String) -> TrainingLetterRank {
        TrainingLetterRank(rawValue: raw) ?? .F
    }
}
