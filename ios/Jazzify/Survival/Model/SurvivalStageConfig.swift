import Foundation

/// Web 版 `DifficultySettings` (`survival_difficulty_settings` テーブル) を iOS で扱うためのモデル。
/// - ステージモードで使われるのは主に `bgmOddWaveUrl / bgmEvenWaveUrl` と倍率系 (敵/経験/アイテム) のみ
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
    public let bgmOddWaveUrl: URL?
    public let bgmEvenWaveUrl: URL?

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
        bgmOddWaveUrl: SurvivalMapAudio.bgmURL,
        bgmEvenWaveUrl: SurvivalMapAudio.bgmURL
    )
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
    let bgmOddWaveUrl: String?
    let bgmEvenWaveUrl: String?

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
        case bgmOddWaveUrl = "bgm_odd_wave_url"
        case bgmEvenWaveUrl = "bgm_even_wave_url"
    }

    func toConfig() -> SurvivalStageConfig {
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
            bgmOddWaveUrl: bgmOddWaveUrl.flatMap { URL(string: $0) } ?? SurvivalMapAudio.bgmURL,
            bgmEvenWaveUrl: bgmEvenWaveUrl.flatMap { URL(string: $0) } ?? SurvivalMapAudio.bgmURL
        )
    }
}
