import Foundation

/// サバイバルモード「魔王城降下」ステージ定義（Web 版 `SurvivalStageDefinitions.ts` と同一仕様）
/// - 21 コードタイプブロック × 5 ステージ + 5 Mixed = 110 ステージ
/// - 各ブロックは 5 つのルートパターン（CDE / FGAB / #系 / ♭系 / 全鍵盤）を順に並べる
/// - Mixed ステージは難易度グループ末尾のブロックに 1 つ追加される
/// ステージのタイプ。Web 版 `StageType` と同義。
enum SurvivalStageType: String, Codable, Sendable {
    case random
    case progression
    case phrases
}

/// マップ種別。Web 版 `SurvivalMapCategory` と同義。
/// - basic: 既存の 110 ステージのコードタイプ別マップ
/// - songs: 曲ベースのステージ群（追加予定 / 現在は basic stage 1 のモック 1 件のみ）
enum SurvivalMapCategory: String, Codable, Sendable, CaseIterable, Hashable {
    case basic
    case songs
    case phrases

    static let `default`: SurvivalMapCategory = .basic
}

enum SurvivalDifficulty: String, Codable, Sendable, CaseIterable {
    case easy
    case normal
    case hard
    case extreme

    func displayName(_ locale: AppLocale) -> String {
        switch self {
        case .easy:
            return locale == .ja ? "イージー" : "Easy"
        case .normal:
            return locale == .ja ? "ノーマル" : "Normal"
        case .hard:
            return locale == .ja ? "ハード" : "Hard"
        case .extreme:
            return locale == .ja ? "エクストリーム" : "Extreme"
        }
    }
}

/// ルートパターン (Web 側と同一)
enum SurvivalRootPattern: String, Sendable {
    case cde
    case fgab
    case sharp
    case flat
    case all

    static let displayOrder: [SurvivalRootPattern] = [.cde, .fgab, .sharp, .flat, .all]

    /// DB の `root_pattern` 値からの安全初期化（Progression 用に NULL/未知を許容）
    init?(dbValue: String?) {
        guard let raw = dbValue?.lowercased(), !raw.isEmpty else { return nil }
        self.init(rawValue: raw)
    }

    var roots: [String] {
        switch self {
        case .cde:
            return ["C", "D", "E"]
        case .fgab:
            return ["F", "G", "A", "B"]
        case .sharp:
            return ["C#", "D#", "F#", "G#", "A#"]
        case .flat:
            return ["Db", "Eb", "Gb", "Ab", "Bb"]
        case .all:
            return [
                "C", "C#", "Db", "D", "D#", "Eb", "E",
                "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
            ]
        }
    }

    var nameJa: String {
        switch self {
        case .cde: return "CDE"
        case .fgab: return "FGAB"
        case .sharp: return "#系のみ"
        case .flat: return "♭系のみ"
        case .all: return "白鍵黒鍵全て"
        }
    }

    var nameEn: String {
        switch self {
        case .cde: return "CDE"
        case .fgab: return "FGAB"
        case .sharp: return "Sharps"
        case .flat: return "Flats"
        case .all: return "All Keys"
        }
    }
}

/// ブロックキーは Supabase `survival_stage_blocks.block_key` の値そのまま。
/// クライアント側で固定列挙はせず、DB に追加された任意のキーを受け入れる。
struct SurvivalBlockKey: RawRepresentable, Hashable, Sendable, ExpressibleByStringLiteral {
    let rawValue: String

    init(rawValue: String) {
        self.rawValue = rawValue
    }

    init(stringLiteral value: String) {
        self.rawValue = value
    }
}

/// ブロック並び順 (blockIndex) からボス A→B→C をローテーションするヘルパー。
/// `SurvivalBossType` 自体の宣言は `SurvivalBossEngine.swift` 側にある。
extension SurvivalBossType {
    static func forBlockIndex(_ index: Int) -> SurvivalBossType {
        let mod = ((index % 3) + 3) % 3
        switch mod {
        case 0: return .A
        case 1: return .B
        default: return .C
        }
    }
}

/// Progression ステージで出題する 1 コード分のエントリ。
/// `survival_stages.chord_progression` JSONB の各要素に対応する。
public struct SurvivalChordProgressionEntry: Codable, Sendable, Hashable {
    public let name: String
    public let voicing: [Int]
    /// Web / DB と同様の事前計算綴り（`voicing` と同じ長さ）。
    public let voicingNames: [String]?
    /// MusicXML の fifths と同じ -7…7。
    public let keyFifths: Int?

    enum CodingKeys: String, CodingKey {
        case name
        case voicing
        case voicingNames = "voicing_names"
        case keyFifths = "key_fifths"
    }

    public init(name: String, voicing: [Int], voicingNames: [String]? = nil, keyFifths: Int? = nil) {
        self.name = name
        self.voicing = voicing
        self.voicingNames = voicingNames
        self.keyFifths = keyFifths
    }
}

/// `survival_stages` テーブルの 1 行をデコードするための型。
/// Web 版 `fetchAllStages()` が読み取るのと同じ列セット。
struct SurvivalStageRow: Decodable, Sendable {
    /// `map_category` カラム。NULL/未設定時は `.basic` 扱い。
    let map_category: String?
    let stage_number: Int
    let stage_type: String
    let name: String
    let name_en: String
    let difficulty: String
    let chord_suffix: String?
    let chord_display_name: String?
    let chord_display_name_en: String?
    let root_pattern: String?
    let root_pattern_name: String?
    let root_pattern_name_en: String?
    let block_key: String
    let is_mixed_stage: Bool?
    let mixed_group_key: String?
    /// Progression 用コード進行（`[{"name": "FM7", "voicing": [65, 69, 72, 76]}, ...]`）
    let chord_progression: [SurvivalChordProgressionEntry]?
}

/// `survival_stage_blocks` テーブル 1 行。降下マップのブロックヘッダー表示名と並び順。
struct SurvivalStageBlockRow: Decodable, Sendable {
    let map_category: String
    let block_key: String
    let label: String
    let label_en: String
    let sort_order: Int?
}

struct SurvivalStageDefinition: Identifiable, Sendable, Hashable {
    /// 所属マップ。Basic / Songs を分離する。
    let mapCategory: SurvivalMapCategory
    let stageNumber: Int
    let stageType: SurvivalStageType
    let nameJa: String
    let nameEn: String
    let difficulty: SurvivalDifficulty
    let chordSuffix: String
    let chordDisplayJa: String
    let chordDisplayEn: String
    /// Progression ステージでは NULL 相当のため optional。
    let rootPattern: SurvivalRootPattern?
    let rootPatternJa: String
    let rootPatternEn: String
    let allowedChords: [String]
    let blockKey: SurvivalBlockKey
    let isMixedStage: Bool
    /// Progression ステージで使う事前ビルド済みのコード進行。Random ステージでは nil。
    let chordProgression: [SurvivalChordProgressionEntry]?

    /// `Identifiable` 用 ID。マップ間で `stageNumber` が重複し得るため、`mapCategory` を含めて一意化する。
    var id: String { "\(mapCategory.rawValue)-\(stageNumber)" }

    func localizedName(_ locale: AppLocale) -> String {
        locale == .en ? nameEn : nameJa
    }

    func localizedChordDisplay(_ locale: AppLocale) -> String {
        locale == .en ? chordDisplayEn : chordDisplayJa
    }

    func localizedRootPattern(_ locale: AppLocale) -> String {
        locale == .en ? rootPatternEn : rootPatternJa
    }
}

struct SurvivalBlockMeta: Identifiable, Sendable {
    let blockKey: SurvivalBlockKey
    let blockIndex: Int
    let labelJa: String
    let labelEn: String
    let stageNumbers: [Int]
    let mixedStageNumber: Int?
    let difficulty: SurvivalDifficulty
    /// ブロック並び順 (blockIndex) から決まるボスタイプ。
    let bossType: SurvivalBossType

    var id: String { blockKey.rawValue }
    var firstStage: Int { stageNumbers.first ?? 0 }
    var lastStage: Int { stageNumbers.last ?? 0 }
    var hasMixed: Bool { mixedStageNumber != nil }

    func localizedLabel(_ locale: AppLocale) -> String {
        locale == .en ? labelEn : labelJa
    }
}

/// ステージ定義と階層情報をまとめて提供するカタログ。
/// - 注: Web 版 [src/components/survival/SurvivalStageDefinitions.ts](src/components/survival/SurvivalStageDefinitions.ts) と
///   同様に、`survival_stages` がステージ正、`survival_stage_blocks` がブロック表示名。`load` で DB 行から再構築する。
///   起動直後はローカルフォールバック（`generateStages()` の結果）を返す。
/// - マップカテゴリごとに `_stagesByCategory` / `_blocksByCategory` で別々に保持する。
///   既存呼び出し互換のため、無印プロパティ (`stages` 等) は `.basic` を返す。
enum SurvivalStageCatalog {
    /// `nonisolated(unsafe)`: Supabase ロード前後の単発書き換えのみ想定。
    /// ロード完了は MainActor 上で行うことで実用上の競合を避ける。
    nonisolated(unsafe) private static var _stagesByCategory: [SurvivalMapCategory: [SurvivalStageDefinition]] = [
        .basic: Self.generateStages(),
        .songs: [],
        .phrases: []
    ]
    nonisolated(unsafe) private static var _blocksByCategory: [SurvivalMapCategory: [SurvivalBlockMeta]] = [
        .basic: Self.generateBlocks(from: Self.generateStages(), blockOverrides: [:]),
        .songs: [],
        .phrases: []
    ]

    /// `chord_progression` の `voicing_names` が `voicing` と同じ長さのときだけ採用。
    private static func sanitizedProgressionVoicingNames(_ raw: [String]?, voicingCount: Int) -> [String]? {
        guard let raw else { return nil }
        let trimmed = raw.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        guard trimmed.count == voicingCount else { return nil }
        return trimmed
    }

    /// 採用範囲は -6..+5（F# キーは Gb で表現する方針）。
    private static func clampProgressionKeyFifths(_ raw: Int?) -> Int? {
        guard let raw else { return nil }
        return min(5, max(-6, raw))
    }

    // MARK: - Backward compatible (basic 固定) アクセサ

    static var stages: [SurvivalStageDefinition] { _stagesByCategory[.basic] ?? [] }
    static var blocks: [SurvivalBlockMeta] { _blocksByCategory[.basic] ?? [] }
    static var totalStages: Int { stages.count }
    static let stageTimeLimitSeconds: Int = 90

    /// 無料プランで遊べるステージ番号（当該マップの第一ブロック。Basic は Major 1〜5 相当）
    static var freeTierStageNumbers: Set<Int> {
        guard let first = blocks.first else { return [] }
        return Set(first.stageNumbers)
    }

    static func stage(byNumber stageNumber: Int) -> SurvivalStageDefinition? {
        stage(byNumber: stageNumber, in: .basic)
    }

    static func block(forStage stageNumber: Int) -> SurvivalBlockMeta? {
        block(forStage: stageNumber, in: .basic)
    }

    static func block(byKey blockKey: SurvivalBlockKey) -> SurvivalBlockMeta? {
        block(byKey: blockKey, in: .basic)
    }

    // MARK: - カテゴリ別アクセサ

    static func stages(in category: SurvivalMapCategory) -> [SurvivalStageDefinition] {
        _stagesByCategory[category] ?? []
    }

    static func blocks(in category: SurvivalMapCategory) -> [SurvivalBlockMeta] {
        _blocksByCategory[category] ?? []
    }

    static func totalStages(in category: SurvivalMapCategory) -> Int {
        stages(in: category).count
    }

    static func freeTierStageNumbers(in category: SurvivalMapCategory) -> Set<Int> {
        guard let first = blocks(in: category).first else { return [] }
        return Set(first.stageNumbers)
    }

    static func stage(byNumber stageNumber: Int, in category: SurvivalMapCategory) -> SurvivalStageDefinition? {
        guard stageNumber >= 1 else { return nil }
        return stages(in: category).first { $0.stageNumber == stageNumber }
    }

    static func block(forStage stageNumber: Int, in category: SurvivalMapCategory) -> SurvivalBlockMeta? {
        blocks(in: category).first { $0.stageNumbers.contains(stageNumber) }
    }

    static func block(byKey blockKey: SurvivalBlockKey, in category: SurvivalMapCategory) -> SurvivalBlockMeta? {
        blocks(in: category).first { $0.blockKey == blockKey }
    }

    /// 既知の Mixed グループ識別子（Web `MixedGroupKey` と同義）
    enum MixedGroupKey: String {
        case easy
        case normalA
        case normalB
        case hard
        case extreme
    }

    /// Supabase の `survival_stages` 行から `SurvivalStageDefinition` を構築する。
    /// - `blockLabelRows` で `survival_stage_blocks` の表示名を上書き（未取得時は `blockLabels`）。
    /// - random ステージは Web 版同様、`root_pattern + chord_suffix` から実行時に allowed_chords を再生成する。
    /// - progression ステージは `allowedChords = []` で、MusicXML を後段の XMLパーサで処理する。
    static func load(rows: [SurvivalStageRow], blockLabelRows: [SurvivalStageBlockRow] = []) {
        let blockOverridesByCategory = Self.blockOverrides(from: blockLabelRows)
        let mixedConfigs: [MixedGroupKey: MixedGroupConfig] = [
            .easy: MixedGroupConfig(suffixes: ["", "m"], difficulty: .easy, blockKey: "minor"),
            .normalA: MixedGroupConfig(suffixes: ["M7", "m7", "7", "m7b5"], difficulty: .easy, blockKey: "m7b5"),
            .normalB: MixedGroupConfig(suffixes: ["mM7", "dim7", "aug7", "6", "m6"], difficulty: .easy, blockKey: "m6"),
            .hard: MixedGroupConfig(
                suffixes: ["M7(9)", "m7(9)", "7(9.6th)", "7(b9.b6th)", "6(9)", "m6(9)"],
                difficulty: .easy,
                blockKey: "m6_9"
            ),
            .extreme: MixedGroupConfig(
                suffixes: ["7(b9.6th)", "7(#9.b6th)", "m7(b5)(11)", "dim(M7)"],
                difficulty: .easy,
                blockKey: "dimM7"
            )
        ]

        let definitions: [SurvivalStageDefinition] = rows.compactMap { row in
            let mapCategory = SurvivalMapCategory(rawValue: row.map_category ?? "") ?? .basic
            let stageType = SurvivalStageType(rawValue: row.stage_type) ?? .random
            let blockKeyRaw = row.block_key.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !blockKeyRaw.isEmpty else { return nil }
            let blockKey = SurvivalBlockKey(rawValue: blockKeyRaw)
            let difficulty = SurvivalDifficulty(rawValue: row.difficulty) ?? .easy
            let rootPattern = SurvivalRootPattern(dbValue: row.root_pattern)
            let isMixedStage = row.is_mixed_stage ?? false

            var allowed: [String] = []
            switch stageType {
            case .random:
                if isMixedStage,
                   let groupKeyRaw = row.mixed_group_key,
                   let groupKey = MixedGroupKey(rawValue: groupKeyRaw),
                   let config = mixedConfigs[groupKey] {
                    allowed = buildMixedAllowed(for: config)
                } else if let suffix = row.chord_suffix, let pattern = rootPattern {
                    allowed = buildAllowed(roots: pattern.roots, suffix: suffix)
                }
            case .progression, .phrases:
                allowed = []
            }

            // 不正なエントリ（name 空 / voicing 空）は除去
            let progression: [SurvivalChordProgressionEntry]? = {
                guard let entries = row.chord_progression else { return nil }
                let cleaned = entries.compactMap { entry -> SurvivalChordProgressionEntry? in
                    let trimmed = entry.name.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !trimmed.isEmpty, !entry.voicing.isEmpty else { return nil }
                    return SurvivalChordProgressionEntry(
                        name: trimmed,
                        voicing: entry.voicing,
                        voicingNames: Self.sanitizedProgressionVoicingNames(entry.voicingNames, voicingCount: entry.voicing.count),
                        keyFifths: Self.clampProgressionKeyFifths(entry.keyFifths)
                    )
                }
                return cleaned.isEmpty ? nil : cleaned
            }()

            return SurvivalStageDefinition(
                mapCategory: mapCategory,
                stageNumber: row.stage_number,
                stageType: stageType,
                nameJa: row.name,
                nameEn: row.name_en,
                difficulty: difficulty,
                chordSuffix: row.chord_suffix ?? "",
                chordDisplayJa: row.chord_display_name ?? "",
                chordDisplayEn: row.chord_display_name_en ?? "",
                rootPattern: rootPattern,
                rootPatternJa: row.root_pattern_name ?? "",
                rootPatternEn: row.root_pattern_name_en ?? "",
                allowedChords: allowed,
                blockKey: blockKey,
                isMixedStage: isMixedStage,
                chordProgression: progression
            )
        }

        // カテゴリ別にグルーピングして格納する。空カテゴリはフォールバック挙動が
        // 期待されるため Songs はキー自体を保持しつつ空配列にする。
        var stagesByCategory: [SurvivalMapCategory: [SurvivalStageDefinition]] = [:]
        for category in SurvivalMapCategory.allCases {
            stagesByCategory[category] = []
        }
        for def in definitions {
            stagesByCategory[def.mapCategory, default: []].append(def)
        }
        for key in stagesByCategory.keys {
            stagesByCategory[key]?.sort { $0.stageNumber < $1.stageNumber }
        }

        var blocksByCategory: [SurvivalMapCategory: [SurvivalBlockMeta]] = [:]
        for (category, stages) in stagesByCategory {
            let overrides = blockOverridesByCategory[category] ?? [:]
            blocksByCategory[category] = generateBlocks(from: stages, blockOverrides: overrides)
        }

        _stagesByCategory = stagesByCategory
        _blocksByCategory = blocksByCategory
    }

    fileprivate struct BlockOverride: Sendable {
        let labelJa: String
        let labelEn: String
        let sortOrder: Int
    }

    private static func blockOverrides(
        from rows: [SurvivalStageBlockRow]
    ) -> [SurvivalMapCategory: [SurvivalBlockKey: BlockOverride]] {
        var result: [SurvivalMapCategory: [SurvivalBlockKey: BlockOverride]] = [:]
        for row in rows {
            let catRaw = row.map_category.trimmingCharacters(in: .whitespacesAndNewlines)
            guard let category = SurvivalMapCategory(rawValue: catRaw) else { continue }
            let keyRaw = row.block_key.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !keyRaw.isEmpty else { continue }
            let blockKey = SurvivalBlockKey(rawValue: keyRaw)
            let ja = row.label.trimmingCharacters(in: .whitespacesAndNewlines)
            let en = row.label_en.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !ja.isEmpty, !en.isEmpty else { continue }
            var inner = result[category] ?? [:]
            inner[blockKey] = BlockOverride(
                labelJa: ja,
                labelEn: en,
                sortOrder: row.sort_order ?? Int.max
            )
            result[category] = inner
        }
        return result
    }

    // MARK: - Private generators

    private struct ChordTypeDef {
        let blockKey: SurvivalBlockKey
        let suffix: String
        let displayJa: String
        let displayEn: String
        let difficulty: SurvivalDifficulty
        /// true のときこのブロック末尾に難易度グループ用 Mixed ステージを挿入
        let trailingMixedGroup: MixedGroup?
    }

    private enum MixedGroup {
        case easy, normalA, normalB, hard, extreme
    }

    private struct MixedGroupConfig {
        let suffixes: [String]
        let difficulty: SurvivalDifficulty
        let blockKey: SurvivalBlockKey
    }

    /// DB 取得前の Basic マップ用ローカルフォールバック。
    /// 難易度は全ブロック `.easy` に統一し、敵強度カーブを揃える。
    private static let chordTypes: [ChordTypeDef] = [
        // Easy (2 blocks)
        ChordTypeDef(blockKey: "major", suffix: "", displayJa: "メジャー", displayEn: "Major", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "minor", suffix: "m", displayJa: "マイナー", displayEn: "Minor", difficulty: .easy, trailingMixedGroup: .easy),
        // Normal 前半 (4 blocks)
        ChordTypeDef(blockKey: "M7", suffix: "M7", displayJa: "M7", displayEn: "M7", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "m7", suffix: "m7", displayJa: "m7", displayEn: "m7", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "7", suffix: "7", displayJa: "7", displayEn: "7", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "m7b5", suffix: "m7b5", displayJa: "m7b5", displayEn: "m7b5", difficulty: .easy, trailingMixedGroup: .normalA),
        // Normal 後半 (5 blocks)
        ChordTypeDef(blockKey: "mM7", suffix: "mM7", displayJa: "mM7", displayEn: "mM7", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "dim7", suffix: "dim7", displayJa: "dim7", displayEn: "dim7", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "aug7", suffix: "aug7", displayJa: "aug7", displayEn: "aug7", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "6", suffix: "6", displayJa: "6", displayEn: "6", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "m6", suffix: "m6", displayJa: "m6", displayEn: "m6", difficulty: .easy, trailingMixedGroup: .normalB),
        // Hard (6 blocks)
        ChordTypeDef(blockKey: "M7_9", suffix: "M7(9)", displayJa: "M7(9)", displayEn: "M7(9)", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "m7_9", suffix: "m7(9)", displayJa: "m7(9)", displayEn: "m7(9)", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "7_9_13", suffix: "7(9.6th)", displayJa: "7(9.13)", displayEn: "7(9.13)", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "7_b9_b13", suffix: "7(b9.b6th)", displayJa: "7(b9.b13)", displayEn: "7(b9.b13)", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "6_9", suffix: "6(9)", displayJa: "6(9)", displayEn: "6(9)", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "m6_9", suffix: "m6(9)", displayJa: "m6(9)", displayEn: "m6(9)", difficulty: .easy, trailingMixedGroup: .hard),
        // Extreme (4 blocks)
        ChordTypeDef(blockKey: "7_b9_13", suffix: "7(b9.6th)", displayJa: "7(b9.13)", displayEn: "7(b9.13)", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "7_sharp9_b13", suffix: "7(#9.b6th)", displayJa: "7(#9.b13)", displayEn: "7(#9.b13)", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "m7b5_11", suffix: "m7(b5)(11)", displayJa: "m7(b5)(11)", displayEn: "m7(b5)(11)", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: "dimM7", suffix: "dim(M7)", displayJa: "dim(M7)", displayEn: "dim(M7)", difficulty: .easy, trailingMixedGroup: .extreme)
    ]

    private static let mixedGroups: [MixedGroup: MixedGroupConfig] = [
        .easy: MixedGroupConfig(suffixes: ["", "m"], difficulty: .easy, blockKey: "minor"),
        .normalA: MixedGroupConfig(suffixes: ["M7", "m7", "7", "m7b5"], difficulty: .easy, blockKey: "m7b5"),
        .normalB: MixedGroupConfig(suffixes: ["mM7", "dim7", "aug7", "6", "m6"], difficulty: .easy, blockKey: "m6"),
        .hard: MixedGroupConfig(
            suffixes: ["M7(9)", "m7(9)", "7(9.6th)", "7(b9.b6th)", "6(9)", "m6(9)"],
            difficulty: .easy,
            blockKey: "m6_9"
        ),
        .extreme: MixedGroupConfig(
            suffixes: ["7(b9.6th)", "7(#9.b6th)", "m7(b5)(11)", "dim(M7)"],
            difficulty: .easy,
            blockKey: "dimM7"
        )
    ]

    private static func buildAllowed(roots: [String], suffix: String) -> [String] {
        roots.map { "\($0)\(suffix)" }
    }

    private static func buildMixedAllowed(for group: MixedGroupConfig) -> [String] {
        let allRoots = SurvivalRootPattern.all.roots
        var combined: [String] = []
        for suffix in group.suffixes {
            combined.append(contentsOf: buildAllowed(roots: allRoots, suffix: suffix))
        }
        return combined
    }

    private static func generateStages() -> [SurvivalStageDefinition] {
        var result: [SurvivalStageDefinition] = []
        var stageNumber = 1

        for chordType in chordTypes {
            for pattern in SurvivalRootPattern.displayOrder {
                let roots = pattern.roots
                result.append(
                    SurvivalStageDefinition(
                        mapCategory: .basic,
                        stageNumber: stageNumber,
                        stageType: .random,
                        nameJa: "\(stageNumber). \(chordType.displayJa) \(pattern.nameJa)",
                        nameEn: "\(stageNumber). \(chordType.displayEn) \(pattern.nameEn)",
                        difficulty: chordType.difficulty,
                        chordSuffix: chordType.suffix,
                        chordDisplayJa: chordType.displayJa,
                        chordDisplayEn: chordType.displayEn,
                        rootPattern: pattern,
                        rootPatternJa: pattern.nameJa,
                        rootPatternEn: pattern.nameEn,
                        allowedChords: buildAllowed(roots: roots, suffix: chordType.suffix),
                        blockKey: chordType.blockKey,
                        isMixedStage: false,
                        chordProgression: nil
                    )
                )
                stageNumber += 1
            }

            if let groupKey = chordType.trailingMixedGroup, let group = mixedGroups[groupKey] {
                let patternAll = SurvivalRootPattern.all
                result.append(
                    SurvivalStageDefinition(
                        mapCategory: .basic,
                        stageNumber: stageNumber,
                        stageType: .random,
                        nameJa: "\(stageNumber). ミックス \(patternAll.nameJa)",
                        nameEn: "\(stageNumber). Mixed \(patternAll.nameEn)",
                        difficulty: group.difficulty,
                        chordSuffix: "mixed",
                        chordDisplayJa: "ミックス",
                        chordDisplayEn: "Mixed",
                        rootPattern: .all,
                        rootPatternJa: patternAll.nameJa,
                        rootPatternEn: patternAll.nameEn,
                        allowedChords: buildMixedAllowed(for: group),
                        blockKey: group.blockKey,
                        isMixedStage: true,
                        chordProgression: nil
                    )
                )
                stageNumber += 1
            }
        }

        return result
    }

    /// `survival_stage_blocks.sort_order` を最優先、なければ最小 `stage_number` でブロックを並べ、
     /// ラベルは DB 値を使う (未登録時は block_key そのもの)。
    private static func generateBlocks(
        from stages: [SurvivalStageDefinition],
        blockOverrides: [SurvivalBlockKey: BlockOverride]
    ) -> [SurvivalBlockMeta] {
        struct Bucket {
            var stages: [Int]
            var mixed: Int?
            var difficulty: SurvivalDifficulty
            var firstStageNumber: Int
        }
        var bucket: [SurvivalBlockKey: Bucket] = [:]
        for stage in stages {
            if var entry = bucket[stage.blockKey] {
                entry.stages.append(stage.stageNumber)
                if stage.isMixedStage { entry.mixed = stage.stageNumber }
                entry.difficulty = stage.difficulty
                if stage.stageNumber < entry.firstStageNumber {
                    entry.firstStageNumber = stage.stageNumber
                }
                bucket[stage.blockKey] = entry
            } else {
                bucket[stage.blockKey] = Bucket(
                    stages: [stage.stageNumber],
                    mixed: stage.isMixedStage ? stage.stageNumber : nil,
                    difficulty: stage.difficulty,
                    firstStageNumber: stage.stageNumber
                )
            }
        }

        let sortedKeys: [SurvivalBlockKey] = bucket.keys.sorted { lhs, rhs in
            let lo = blockOverrides[lhs]?.sortOrder
            let ro = blockOverrides[rhs]?.sortOrder
            switch (lo, ro) {
            case let (l?, r?) where l != r:
                return l < r
            case (.some, .none):
                return true
            case (.none, .some):
                return false
            default:
                let lf = bucket[lhs]?.firstStageNumber ?? Int.max
                let rf = bucket[rhs]?.firstStageNumber ?? Int.max
                if lf != rf { return lf < rf }
                return lhs.rawValue < rhs.rawValue
            }
        }

        var result: [SurvivalBlockMeta] = []
        result.reserveCapacity(sortedKeys.count)
        for (index, key) in sortedKeys.enumerated() {
            guard let entry = bucket[key] else { continue }
            let override = blockOverrides[key]
            let labelJa = override?.labelJa ?? key.rawValue
            let labelEn = override?.labelEn ?? key.rawValue
            result.append(
                SurvivalBlockMeta(
                    blockKey: key,
                    blockIndex: index,
                    labelJa: labelJa,
                    labelEn: labelEn,
                    stageNumbers: entry.stages.sorted(),
                    mixedStageNumber: entry.mixed,
                    difficulty: entry.difficulty,
                    bossType: SurvivalBossType.forBlockIndex(index)
                )
            )
        }
        return result
    }
}
