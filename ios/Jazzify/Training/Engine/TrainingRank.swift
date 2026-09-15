import Foundation

enum TrainingLetterRank: String, Codable, Sendable, CaseIterable {
    case S, A, B, C, D, E, F
}

enum TrainingRank {
    private static let defaultThresholds: [(minScore: Int, rank: TrainingLetterRank)] = [
        (60, .S),
        (50, .A),
        (40, .B),
        (30, .C),
        (20, .D),
        (10, .E),
    ]

    private static let scaleThresholds: [(minScore: Int, rank: TrainingLetterRank)] = [
        (30, .S),
        (25, .A),
        (20, .B),
        (15, .C),
        (10, .D),
        (5, .E),
    ]

    private static let order: [TrainingLetterRank] = [.F, .E, .D, .C, .B, .A, .S]

    private static func thresholds(for kind: TrainingKind) -> [(minScore: Int, rank: TrainingLetterRank)] {
        kind == .scale ? scaleThresholds : defaultThresholds
    }

    static func scoreToRank(_ score: Int, kind: TrainingKind = .chord) -> TrainingLetterRank {
        let normalized = max(0, score)
        for entry in thresholds(for: kind) where normalized >= entry.minScore {
            return entry.rank
        }
        return .F
    }

    static func meetsRank(achieved: TrainingLetterRank, required: TrainingLetterRank) -> Bool {
        guard let achievedIndex = order.firstIndex(of: achieved),
              let requiredIndex = order.firstIndex(of: required)
        else { return false }
        return achievedIndex >= requiredIndex
    }

    static func meetsRequirement(score: Int, requiredRank: TrainingLetterRank, kind: TrainingKind = .chord) -> Bool {
        meetsRank(achieved: scoreToRank(score, kind: kind), required: requiredRank)
    }

    static func parseLetterRank(_ raw: String) -> TrainingLetterRank {
        TrainingLetterRank(rawValue: raw) ?? .F
    }
}
