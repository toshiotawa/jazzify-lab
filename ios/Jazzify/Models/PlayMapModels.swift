import Foundation

enum PlayMapMode: String, Codable, Sendable {
    case codeRun = "code_run"
    case defense
}

enum PlayMapTier: String, Codable, Sendable, CaseIterable {
    case basic
    case advanced
}

enum PlayMapNodeKind: String, Codable, Sendable {
    case stage
    case quest
    case tutorial
}

enum CodeRunLetterRank: String, Codable, Sendable, CaseIterable {
    case S, A, B, C, D, E, F
}

struct PlayMapBlock: Codable, Identifiable, Sendable {
    let id: UUID
    let mode: PlayMapMode
    let tier: PlayMapTier
    let blockKey: String
    let label: String
    let labelEn: String
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id, mode, tier, label
        case blockKey = "block_key"
        case labelEn = "label_en"
        case sortOrder = "sort_order"
    }

    func localizedLabel(_ locale: AppLocale) -> String {
        locale == .en ? (labelEn.isEmpty ? label : labelEn) : label
    }
}

struct PlayMapNode: Codable, Identifiable, Sendable {
    let id: UUID
    let blockId: UUID
    let sortOrder: Int
    let nodeKind: PlayMapNodeKind
    let survivalMapCategory: String?
    let survivalStageNumber: Int?
    let defenseStageId: String?
    let lessonId: UUID?
    let title: String
    let titleEn: String
    let requiredRank: CodeRunLetterRank
    let difficultyLevel: Int?
    let tutorialKey: String?

    enum CodingKeys: String, CodingKey {
        case id, title
        case blockId = "block_id"
        case sortOrder = "sort_order"
        case nodeKind = "node_kind"
        case survivalMapCategory = "survival_map_category"
        case survivalStageNumber = "survival_stage_number"
        case defenseStageId = "defense_stage_id"
        case lessonId = "lesson_id"
        case titleEn = "title_en"
        case requiredRank = "required_rank"
        case difficultyLevel = "difficulty_level"
        case tutorialKey = "tutorial_key"
    }

    func localizedTitle(_ locale: AppLocale) -> String {
        locale == .en ? (titleEn.isEmpty ? title : titleEn) : title
    }

    func resolvedDefenseDifficultyLevel(stageLevel: Int) -> Int {
        guard let difficultyLevel, (1...15).contains(difficultyLevel) else {
            return stageLevel
        }
        return difficultyLevel
    }
}

struct PlayMapNodeClear: Codable, Sendable {
    let nodeId: UUID
    let bestTimeSec: Double?
    let bestRank: CodeRunLetterRank?
    let bestSurviveSec: Int?
    let bestStarRank: Int?
    let bestEndlessEnemiesDefeated: Int?
    let clearCount: Int

    enum CodingKeys: String, CodingKey {
        case nodeId = "node_id"
        case bestTimeSec = "best_time_sec"
        case bestRank = "best_rank"
        case bestSurviveSec = "best_survive_sec"
        case bestStarRank = "best_star_rank"
        case bestEndlessEnemiesDefeated = "best_endless_enemies_defeated"
        case clearCount = "clear_count"
    }
}

struct RecordDefenseClearV2Result: Sendable {
    let isFirstClear: Bool
    let recordId: String?
    let nodeId: UUID?
    let error: String?
}

struct FinalizeDefenseEndlessRecordResult: Sendable {
    let recordId: String
    let nodeId: UUID
    let improvedEndlessBest: Bool
    let enemiesDefeated: Int
    let error: String?
}

struct DefenseEndlessRankingEntry: Identifiable, Sendable {
    let id: String
    let rankPosition: Int
    let userId: UUID
    let nickname: String
    let avatarUrl: String?
    let playerLevel: Int
    let enemiesDefeated: Int
    let starRank: Int?
}

struct DefenseEndlessSummaryRow: Sendable {
    let nodeId: UUID
    let enemiesDefeated: Int
    let starRank: Int?
    let rankPosition: Int?
}

struct CodeRunRankThreshold: Codable, Sendable {
    let rank: CodeRunLetterRank
    let maxSeconds: Int
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case rank
        case maxSeconds = "max_seconds"
        case sortOrder = "sort_order"
    }
}

struct RecordPlayMapNodeClearResult: Sendable {
    let isFirstClear: Bool
    let nodeId: UUID
    let mode: PlayMapMode
    let error: String?
}

enum MainQuestInstrument: String, Sendable {
    case piano
    case all

    static func resolve(profileInstrument: String?) -> MainQuestInstrument {
        profileInstrument == "piano" || profileInstrument == nil ? .piano : .all
    }
}

enum CodeRunRankCalculator {
    static let defaultThresholds: [CodeRunRankThreshold] = [
        CodeRunRankThreshold(rank: .S, maxSeconds: 60, sortOrder: 0),
        CodeRunRankThreshold(rank: .A, maxSeconds: 90, sortOrder: 1),
        CodeRunRankThreshold(rank: .B, maxSeconds: 120, sortOrder: 2),
        CodeRunRankThreshold(rank: .C, maxSeconds: 150, sortOrder: 3),
        CodeRunRankThreshold(rank: .D, maxSeconds: 165, sortOrder: 4),
        CodeRunRankThreshold(rank: .E, maxSeconds: 180, sortOrder: 5),
        CodeRunRankThreshold(rank: .F, maxSeconds: 195, sortOrder: 6),
    ]

    static func scoreToRank(elapsedSec: Double, thresholds: [CodeRunRankThreshold]) -> CodeRunLetterRank {
        let sorted = thresholds.sorted { $0.sortOrder < $1.sortOrder }
        for threshold in sorted where elapsedSec <= Double(threshold.maxSeconds) {
            return threshold.rank
        }
        return .F
    }

    static func meetsRequirement(
        achieved: CodeRunLetterRank,
        required: CodeRunLetterRank,
        thresholds: [CodeRunRankThreshold]
    ) -> Bool {
        rankOrder(achieved, thresholds: thresholds) <= rankOrder(required, thresholds: thresholds)
    }

    private static func rankOrder(_ rank: CodeRunLetterRank, thresholds: [CodeRunRankThreshold]) -> Int {
        thresholds.first(where: { $0.rank == rank })?.sortOrder ?? 99
    }
}

enum PlayMapDefenseStageResolve {
    static let callResponseMinMarketingVersion = "1.5.2"

    static func appSupportsCallResponsePlayMapStages(marketingVersion: String) -> Bool {
        marketingVersionCompare(marketingVersion, isAtLeast: callResponseMinMarketingVersion)
    }

    static func resolvedDefenseStageId(
        legacyStageId: String?,
        callResponseStageId: String?,
        marketingVersion: String
    ) -> String? {
        guard appSupportsCallResponsePlayMapStages(marketingVersion: marketingVersion) else {
            return legacyStageId
        }
        guard let trimmed = callResponseStageId?.trimmingCharacters(in: .whitespacesAndNewlines),
              !trimmed.isEmpty else {
            return legacyStageId
        }
        return trimmed
    }

    static func resolvedDifficultyLevel(
        legacyLevel: Int?,
        callResponseLevel: Int?,
        marketingVersion: String
    ) -> Int? {
        guard appSupportsCallResponsePlayMapStages(marketingVersion: marketingVersion) else {
            return legacyLevel
        }
        guard let callResponseLevel, (1...15).contains(callResponseLevel) else {
            return legacyLevel
        }
        return callResponseLevel
    }

    /// `CFBundleShortVersionString` 形式（例: 1.5.2）をセグメントごとに数値比較する。
    static func marketingVersionCompare(_ lhs: String, isAtLeast rhs: String) -> Bool {
        let left = parseVersionSegments(lhs)
        let right = parseVersionSegments(rhs)
        let count = max(left.count, right.count)
        for index in 0..<count {
            let l = index < left.count ? left[index] : 0
            let r = index < right.count ? right[index] : 0
            if l > r { return true }
            if l < r { return false }
        }
        return true
    }

    private static func parseVersionSegments(_ version: String) -> [Int] {
        version
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .split(separator: ".")
            .map { segment in
                let digits = segment.prefix { $0.isNumber }
                return Int(digits) ?? 0
            }
    }
}
