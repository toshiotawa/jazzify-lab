import Foundation

/// サバイバルモード「魔王城降下」ステージ定義（Web 版 `SurvivalStageDefinitions.ts` と同一仕様）
/// - 21 コードタイプブロック × 5 ステージ + 5 Mixed = 110 ステージ
/// - 各ブロックは 5 つのルートパターン（CDE / FGAB / #系 / ♭系 / 全鍵盤）を順に並べる
/// - Mixed ステージは難易度グループ末尾のブロックに 1 つ追加される
/// ステージのタイプ。Web 版 `StageType` と同義。
enum SurvivalStageType: String, Codable, Sendable {
    case random
    case progression
}

/// マップ種別。Web 版 `SurvivalMapCategory` と同義。
/// - basic: 既存の 110 ステージのコードタイプ別マップ
/// - songs: 曲ベースのステージ群（追加予定 / 現在は basic stage 1 のモック 1 件のみ）
enum SurvivalMapCategory: String, Codable, Sendable, CaseIterable, Hashable {
    case basic
    case songs

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

enum SurvivalBlockKey: String, Sendable, Hashable {
    case major, minor
    case M7, m7
    case seven = "7"
    case m7b5
    case mM7, dim7, aug7
    case six = "6"
    case m6
    case M7_9, m7_9
    case seven_9_13 = "7_9_13"
    case seven_b9_b13 = "7_b9_b13"
    case six_9 = "6_9"
    case m6_9
    case seven_b9_13 = "7_b9_13"
    case seven_sharp9_b13 = "7_sharp9_b13"
    case m7b5_11
    case dimM7
}

/// Progression ステージで出題する 1 コード分のエントリ。
/// `survival_stages.chord_progression` JSONB の各要素に対応する。
public struct SurvivalChordProgressionEntry: Codable, Sendable, Hashable {
    public let name: String
    public let voicing: [Int]

    public init(name: String, voicing: [Int]) {
        self.name = name
        self.voicing = voicing
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
///   同様に、`survival_stages` テーブルがソース。`load(rows:)` で DB 行から再構築する。
///   起動直後はローカルフォールバック（`generateStages()` の結果）を返す。
/// - マップカテゴリごとに `_stagesByCategory` / `_blocksByCategory` で別々に保持する。
///   既存呼び出し互換のため、無印プロパティ (`stages` 等) は `.basic` を返す。
enum SurvivalStageCatalog {
    /// `nonisolated(unsafe)`: Supabase ロード前後の単発書き換えのみ想定。
    /// ロード完了は MainActor 上で行うことで実用上の競合を避ける。
    nonisolated(unsafe) private static var _stagesByCategory: [SurvivalMapCategory: [SurvivalStageDefinition]] = [
        .basic: Self.generateStages(),
        .songs: []
    ]
    nonisolated(unsafe) private static var _blocksByCategory: [SurvivalMapCategory: [SurvivalBlockMeta]] = [
        .basic: Self.generateBlocks(from: Self.generateStages()),
        .songs: []
    ]

    // MARK: - Backward compatible (basic 固定) アクセサ

    static var stages: [SurvivalStageDefinition] { _stagesByCategory[.basic] ?? [] }
    static var blocks: [SurvivalBlockMeta] { _blocksByCategory[.basic] ?? [] }
    static var totalStages: Int { stages.count }
    static let stageTimeLimitSeconds: Int = 90

    /// 無料プランで遊べるステージ番号（第一階層＝Major ブロック = 1〜5）
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
    /// - random ステージは Web 版同様、`root_pattern + chord_suffix` から実行時に allowed_chords を再生成する。
    /// - progression ステージは `allowedChords = []` で、MusicXML を後段の XMLパーサで処理する。
    static func load(rows: [SurvivalStageRow]) {
        let mixedConfigs: [MixedGroupKey: MixedGroupConfig] = [
            .easy: MixedGroupConfig(suffixes: ["", "m"], difficulty: .easy, blockKey: .minor),
            .normalA: MixedGroupConfig(suffixes: ["M7", "m7", "7", "m7b5"], difficulty: .normal, blockKey: .m7b5),
            .normalB: MixedGroupConfig(suffixes: ["mM7", "dim7", "aug7", "6", "m6"], difficulty: .normal, blockKey: .m6),
            .hard: MixedGroupConfig(
                suffixes: ["M7(9)", "m7(9)", "7(9.6th)", "7(b9.b6th)", "6(9)", "m6(9)"],
                difficulty: .hard,
                blockKey: .m6_9
            ),
            .extreme: MixedGroupConfig(
                suffixes: ["7(b9.6th)", "7(#9.b6th)", "m7(b5)(11)", "dim(M7)"],
                difficulty: .extreme,
                blockKey: .dimM7
            )
        ]

        let definitions: [SurvivalStageDefinition] = rows.compactMap { row in
            let mapCategory = SurvivalMapCategory(rawValue: row.map_category ?? "") ?? .basic
            let stageType = SurvivalStageType(rawValue: row.stage_type) ?? .random
            let blockKey = SurvivalBlockKey(rawValue: row.block_key) ?? .major
            let difficulty = SurvivalDifficulty(rawValue: row.difficulty) ?? .normal
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
            case .progression:
                allowed = []
            }

            // 不正なエントリ（name 空 / voicing 空）は除去
            let progression: [SurvivalChordProgressionEntry]? = {
                guard let entries = row.chord_progression else { return nil }
                let cleaned = entries.compactMap { entry -> SurvivalChordProgressionEntry? in
                    let trimmed = entry.name.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !trimmed.isEmpty, !entry.voicing.isEmpty else { return nil }
                    return SurvivalChordProgressionEntry(name: trimmed, voicing: entry.voicing)
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
            blocksByCategory[category] = generateBlocks(from: stages)
        }

        _stagesByCategory = stagesByCategory
        _blocksByCategory = blocksByCategory
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

    private static let chordTypes: [ChordTypeDef] = [
        // Easy (2 blocks)
        ChordTypeDef(blockKey: .major, suffix: "", displayJa: "メジャー", displayEn: "Major", difficulty: .easy, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .minor, suffix: "m", displayJa: "マイナー", displayEn: "Minor", difficulty: .easy, trailingMixedGroup: .easy),
        // Normal 前半 (4 blocks)
        ChordTypeDef(blockKey: .M7, suffix: "M7", displayJa: "M7", displayEn: "M7", difficulty: .normal, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .m7, suffix: "m7", displayJa: "m7", displayEn: "m7", difficulty: .normal, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .seven, suffix: "7", displayJa: "7", displayEn: "7", difficulty: .normal, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .m7b5, suffix: "m7b5", displayJa: "m7b5", displayEn: "m7b5", difficulty: .normal, trailingMixedGroup: .normalA),
        // Normal 後半 (5 blocks)
        ChordTypeDef(blockKey: .mM7, suffix: "mM7", displayJa: "mM7", displayEn: "mM7", difficulty: .normal, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .dim7, suffix: "dim7", displayJa: "dim7", displayEn: "dim7", difficulty: .normal, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .aug7, suffix: "aug7", displayJa: "aug7", displayEn: "aug7", difficulty: .normal, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .six, suffix: "6", displayJa: "6", displayEn: "6", difficulty: .normal, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .m6, suffix: "m6", displayJa: "m6", displayEn: "m6", difficulty: .normal, trailingMixedGroup: .normalB),
        // Hard (6 blocks)
        ChordTypeDef(blockKey: .M7_9, suffix: "M7(9)", displayJa: "M7(9)", displayEn: "M7(9)", difficulty: .hard, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .m7_9, suffix: "m7(9)", displayJa: "m7(9)", displayEn: "m7(9)", difficulty: .hard, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .seven_9_13, suffix: "7(9.6th)", displayJa: "7(9.13)", displayEn: "7(9.13)", difficulty: .hard, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .seven_b9_b13, suffix: "7(b9.b6th)", displayJa: "7(b9.b13)", displayEn: "7(b9.b13)", difficulty: .hard, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .six_9, suffix: "6(9)", displayJa: "6(9)", displayEn: "6(9)", difficulty: .hard, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .m6_9, suffix: "m6(9)", displayJa: "m6(9)", displayEn: "m6(9)", difficulty: .hard, trailingMixedGroup: .hard),
        // Extreme (4 blocks)
        ChordTypeDef(blockKey: .seven_b9_13, suffix: "7(b9.6th)", displayJa: "7(b9.13)", displayEn: "7(b9.13)", difficulty: .extreme, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .seven_sharp9_b13, suffix: "7(#9.b6th)", displayJa: "7(#9.b13)", displayEn: "7(#9.b13)", difficulty: .extreme, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .m7b5_11, suffix: "m7(b5)(11)", displayJa: "m7(b5)(11)", displayEn: "m7(b5)(11)", difficulty: .extreme, trailingMixedGroup: nil),
        ChordTypeDef(blockKey: .dimM7, suffix: "dim(M7)", displayJa: "dim(M7)", displayEn: "dim(M7)", difficulty: .extreme, trailingMixedGroup: .extreme)
    ]

    private static let mixedGroups: [MixedGroup: MixedGroupConfig] = [
        .easy: MixedGroupConfig(suffixes: ["", "m"], difficulty: .easy, blockKey: .minor),
        .normalA: MixedGroupConfig(suffixes: ["M7", "m7", "7", "m7b5"], difficulty: .normal, blockKey: .m7b5),
        .normalB: MixedGroupConfig(suffixes: ["mM7", "dim7", "aug7", "6", "m6"], difficulty: .normal, blockKey: .m6),
        .hard: MixedGroupConfig(
            suffixes: ["M7(9)", "m7(9)", "7(9.6th)", "7(b9.b6th)", "6(9)", "m6(9)"],
            difficulty: .hard,
            blockKey: .m6_9
        ),
        .extreme: MixedGroupConfig(
            suffixes: ["7(b9.6th)", "7(#9.b6th)", "m7(b5)(11)", "dim(M7)"],
            difficulty: .extreme,
            blockKey: .dimM7
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

    private static let blockLabels: [SurvivalBlockKey: (ja: String, en: String)] = [
        .major: ("メジャー", "Major"),
        .minor: ("マイナー", "Minor"),
        .M7: ("M7", "M7"),
        .m7: ("m7", "m7"),
        .seven: ("7", "7"),
        .m7b5: ("m7b5", "m7b5"),
        .mM7: ("mM7", "mM7"),
        .dim7: ("dim7", "dim7"),
        .aug7: ("aug7", "aug7"),
        .six: ("6", "6"),
        .m6: ("m6", "m6"),
        .M7_9: ("M7(9)", "M7(9)"),
        .m7_9: ("m7(9)", "m7(9)"),
        .seven_9_13: ("7(9.13)", "7(9.13)"),
        .seven_b9_b13: ("7(b9.b13)", "7(b9.b13)"),
        .six_9: ("6(9)", "6(9)"),
        .m6_9: ("m6(9)", "m6(9)"),
        .seven_b9_13: ("7(b9.13)", "7(b9.13)"),
        .seven_sharp9_b13: ("7(#9.b13)", "7(#9.b13)"),
        .m7b5_11: ("m7(b5)(11)", "m7(b5)(11)"),
        .dimM7: ("dim(M7)", "dim(M7)")
    ]

    private static let blockOrder: [SurvivalBlockKey] = [
        .major, .minor,
        .M7, .m7, .seven, .m7b5,
        .mM7, .dim7, .aug7, .six, .m6,
        .M7_9, .m7_9, .seven_9_13, .seven_b9_b13, .six_9, .m6_9,
        .seven_b9_13, .seven_sharp9_b13, .m7b5_11, .dimM7
    ]

    private static func generateBlocks(from stages: [SurvivalStageDefinition]) -> [SurvivalBlockMeta] {
        var bucket: [SurvivalBlockKey: (stages: [Int], mixed: Int?, difficulty: SurvivalDifficulty)] = [:]
        for stage in stages {
            var entry = bucket[stage.blockKey] ?? (stages: [], mixed: nil, difficulty: stage.difficulty)
            entry.stages.append(stage.stageNumber)
            if stage.isMixedStage { entry.mixed = stage.stageNumber }
            entry.difficulty = stage.difficulty
            bucket[stage.blockKey] = entry
        }

        return blockOrder.enumerated().compactMap { index, key in
            guard let entry = bucket[key], let labels = blockLabels[key] else { return nil }
            return SurvivalBlockMeta(
                blockKey: key,
                blockIndex: index,
                labelJa: labels.ja,
                labelEn: labels.en,
                stageNumbers: entry.stages.sorted(),
                mixedStageNumber: entry.mixed,
                difficulty: entry.difficulty
            )
        }
    }
}
