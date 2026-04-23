import Foundation

/// Web 版 `survival_characters` テーブルから取得するキャラクター初期値。
/// ステージモードでは主人公「ファイ」 (`id == "fai"`) を想定。
public struct SurvivalCharacterProfile: Sendable, Equatable {
    public let id: String
    public let name: String
    public let nameEn: String?
    public let avatarUrl: String?
    public let initialStats: SurvivalPlayerStats
    public let initialSkillsRaw: [String: JsonValue]
    public let initialMagicsRaw: [String: JsonValue]
    public let permanentEffects: [PermanentEffect]
    public let noMagic: Bool
    public let abColumnMagic: Bool
    public let hpRegenPerSecond: Double
    public let autoCollectExp: Bool

    public struct PermanentEffect: Sendable, Equatable, Decodable {
        public let type: String
        public let level: Int
    }

    /// ファイ ゲストプロフィール (Supabase 取得失敗時のフォールバック)
    public static let defaultFai: SurvivalCharacterProfile = SurvivalCharacterProfile(
        id: "fai",
        name: "ファイ",
        nameEn: "Fai",
        avatarUrl: nil,
        initialStats: SurvivalPlayerStats.defaultStage,
        initialSkillsRaw: [:],
        initialMagicsRaw: [:],
        permanentEffects: [],
        noMagic: true,
        abColumnMagic: false,
        hpRegenPerSecond: 0,
        autoCollectExp: true
    )
}

/// Supabase から取得した `survival_characters` 行の詳細版。Decodable に必要な緩いマッピング。
struct SurvivalCharacterDetailRow: Decodable, Sendable {
    let id: String
    let name: String
    let nameEn: String?
    let avatarUrl: String?
    let initialStats: [String: JsonValue]?
    let initialSkills: [String: JsonValue]?
    let initialMagics: [String: JsonValue]?
    let permanentEffects: [SurvivalCharacterProfile.PermanentEffect]?
    let noMagic: Bool?
    let abColumnMagic: Bool?
    let hpRegenPerSecond: Double?
    let autoCollectExp: Bool?

    enum CodingKeys: String, CodingKey {
        case id, name
        case nameEn = "name_en"
        case avatarUrl = "avatar_url"
        case initialStats = "initial_stats"
        case initialSkills = "initial_skills"
        case initialMagics = "initial_magics"
        case permanentEffects = "permanent_effects"
        case noMagic = "no_magic"
        case abColumnMagic = "ab_column_magic"
        case hpRegenPerSecond = "hp_regen_per_second"
        case autoCollectExp = "auto_collect_exp"
    }

    func toProfile() -> SurvivalCharacterProfile {
        SurvivalCharacterProfile(
            id: id,
            name: name,
            nameEn: nameEn,
            avatarUrl: avatarUrl,
            initialStats: SurvivalPlayerStats.fromJson(initialStats ?? [:]),
            initialSkillsRaw: initialSkills ?? [:],
            initialMagicsRaw: initialMagics ?? [:],
            permanentEffects: permanentEffects ?? [],
            noMagic: noMagic ?? true,
            abColumnMagic: abColumnMagic ?? false,
            hpRegenPerSecond: hpRegenPerSecond ?? 0,
            autoCollectExp: autoCollectExp ?? true
        )
    }
}

/// Supabase JSON を緩く受け取るためのヘルパ (Swift には標準 Any Decodable が無いため)
public enum JsonValue: Decodable, Sendable, Equatable {
    case number(Double)
    case bool(Bool)
    case string(String)
    case array([JsonValue])
    case object([String: JsonValue])
    case null

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let v = try? container.decode(Bool.self) {
            self = .bool(v)
        } else if let v = try? container.decode(Double.self) {
            self = .number(v)
        } else if let v = try? container.decode(String.self) {
            self = .string(v)
        } else if let v = try? container.decode([JsonValue].self) {
            self = .array(v)
        } else if let v = try? container.decode([String: JsonValue].self) {
            self = .object(v)
        } else {
            self = .null
        }
    }

    public var asInt: Int? {
        if case .number(let n) = self { return Int(n) }
        return nil
    }

    public var asDouble: Double? {
        if case .number(let n) = self { return n }
        return nil
    }

    public var asBool: Bool? {
        if case .bool(let b) = self { return b }
        return nil
    }
}
