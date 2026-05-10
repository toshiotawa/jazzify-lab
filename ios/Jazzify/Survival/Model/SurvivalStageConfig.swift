import Foundation

enum SurvivalBgmDefaults {
    /// Web `DEFAULT_SURVIVAL_RANDOM_BGM_URL` と一致
    static let randomURL = URL(
        string: "https://jazzify-cdn.com/fantasy-bgm/727a4d3b-21b9-4889-933b-ba170c6037bc.mp3"
    )!
    static let progressionURL = URL(
        string: "https://jazzify-cdn.com/fantasy-bgm/74099219-644e-46c1-b509-bedf9adadf10.mp3"
    )!

    static func url(for stageType: SurvivalStageType) -> URL {
        switch stageType {
        case .random:
            return randomURL
        case .progression:
            return progressionURL
        }
    }
}

/// Web 版 `DifficultySettings` (`survival_difficulty_settings` テーブル) を iOS で扱うためのモデル。
/// - ステージモードで使われるのは主に倍率系 (敵/経験/アイテム) とステージ種別BGM
/// - `allowedChords` と `enemySpawnRate / enemySpawnCount` はステージ定義側の値を優先するため保持のみ
public struct SurvivalStageConfig: Sendable, Equatable {
    public let difficulty: String
    public let displayName: String
    public let description: String?
    public let descriptionEn: String?
    public let allowedChords: [String]
    public let enemySpawnRate: Double
    public let enemySpawnCount: Int
    public let enemyStatMultiplier: Double
    public let expMultiplier: Double
    public let itemDropRate: Double
    public let bgmUrl: URL?

    public static let `default`: SurvivalStageConfig = SurvivalStageConfig(
        difficulty: "normal",
        displayName: "Normal",
        description: nil,
        descriptionEn: nil,
        allowedChords: [],
        enemySpawnRate: 3,
        enemySpawnCount: 2,
        enemyStatMultiplier: 1.0,
        expMultiplier: 1.0,
        itemDropRate: 0.1,
        bgmUrl: SurvivalBgmDefaults.randomURL
    )
}

/// Supabase `survival_bgm_settings` 行モデル。
struct SurvivalBgmSettingRow: Decodable, Sendable {
    let stageType: String
    let bgmUrl: String

    enum CodingKeys: String, CodingKey {
        case stageType = "stage_type"
        case bgmUrl = "bgm_url"
    }

    func url() -> URL? {
        URL(string: bgmUrl)
    }
}

/// Supabase `survival_difficulty_settings` 行モデル (全カラム)
struct SurvivalDifficultyDetailRow: Decodable, Sendable {
    let id: UUID?
    let difficulty: String
    let displayName: String
    let description: String?
    let descriptionEn: String?
    let allowedChords: [String]?
    let enemySpawnRate: Double?
    let enemySpawnCount: Int?
    let enemyStatMultiplier: Double?
    let expMultiplier: Double?
    let itemDropRate: Double?

    enum CodingKeys: String, CodingKey {
        case id, difficulty, description
        case displayName = "display_name"
        case descriptionEn = "description_en"
        case allowedChords = "allowed_chords"
        case enemySpawnRate = "enemy_spawn_rate"
        case enemySpawnCount = "enemy_spawn_count"
        case enemyStatMultiplier = "enemy_stat_multiplier"
        case expMultiplier = "exp_multiplier"
        case itemDropRate = "item_drop_rate"
    }

    func toConfig(stageType: SurvivalStageType = .random, bgmUrl: URL? = nil) -> SurvivalStageConfig {
        SurvivalStageConfig(
            difficulty: difficulty,
            displayName: displayName,
            description: description,
            descriptionEn: descriptionEn,
            allowedChords: allowedChords ?? [],
            enemySpawnRate: enemySpawnRate ?? 3,
            enemySpawnCount: enemySpawnCount ?? 2,
            enemyStatMultiplier: enemyStatMultiplier ?? 1.0,
            expMultiplier: expMultiplier ?? 1.0,
            itemDropRate: itemDropRate ?? 0.1,
            bgmUrl: bgmUrl ?? SurvivalBgmDefaults.url(for: stageType)
        )
    }
}
