import Foundation

/// ログイン前のデモプレイ（サバイバル）で使うステージ定義と BGM 設定。
///
/// Web 版 `src/components/survival/SurvivalMain.tsx` のデモ初期化ブロック
/// (`DEMO_CDE_NOTES` / `DEMO_BGM_URL`) と揃えた仕様:
/// - 出題コード: 単音 C / D / E のみ (`C_note`, `D_note`, `E_note`)
/// - ヒントモード前提 (呼び出し側で `hintMode = true` を指定する)
/// - BGM: Web 版デモと同じファンタジー BGM
///
/// ステージ番号 1 (Major ブロック先頭) を踏襲することで `SurvivalBossEngine.isBlockLastStage`
/// の判定で通常ステージ扱いとなり、ボス戦ロジックが有効化されない点も Web 版と一致する。
enum SurvivalDemoStage {
    static let allowedChords: [String] = ["C_note", "D_note", "E_note"]

    private static let bgmUrl: URL? = SurvivalBgmDefaults.randomURL

    /// ステージ 1 (メジャー CDE) をベースに `allowedChords` / `chordSuffix` のみ差し替えたデモ用定義。
    /// 他のプロパティ (難易度 / ルートパターン / ブロックキー) は流用してボス判定等の挙動を揃える。
    static let definition: SurvivalStageDefinition = {
        let base = SurvivalStageCatalog.stage(byNumber: 1) ?? fallbackBase
        return SurvivalStageDefinition(
            mapCategory: base.mapCategory,
            stageNumber: base.stageNumber,
            stageType: base.stageType,
            nameJa: "デモ CDE",
            nameEn: "Demo CDE",
            difficulty: base.difficulty,
            chordSuffix: "_note",
            chordDisplayJa: "単音 CDE",
            chordDisplayEn: "Single Notes CDE",
            rootPattern: base.rootPattern,
            rootPatternJa: base.rootPatternJa,
            rootPatternEn: base.rootPatternEn,
            allowedChords: allowedChords,
            blockKey: base.blockKey,
            isMixedStage: false,
            chordProgression: base.chordProgression
        )
    }()

    /// Web 版デモと同じ BGM URL を指定した `SurvivalStageConfig`。
    /// デフォルトより倍率系を緩め、サバイバル BGM ではなくファンタジー BGM を流す。
    static let config: SurvivalStageConfig = SurvivalStageConfig(
        difficulty: "demo",
        displayName: "Demo",
        description: nil,
        descriptionEn: nil,
        allowedChords: allowedChords,
        enemySpawnRate: 3,
        enemySpawnCount: 2,
        enemyStatMultiplier: 1.0,
        expMultiplier: 1.0,
        itemDropRate: 0.1,
        bgmUrl: bgmUrl
    )

    /// `SurvivalStageCatalog` が何らかの理由で空配列だった場合のフォールバック定義。
    /// 実運用ではステージ 1 が存在する前提だが、強制アンラップを避けるために用意している。
    private static let fallbackBase: SurvivalStageDefinition = SurvivalStageDefinition(
        mapCategory: .basic,
        stageNumber: 1,
        stageType: .random,
        nameJa: "デモ CDE",
        nameEn: "Demo CDE",
        difficulty: .easy,
        chordSuffix: "_note",
        chordDisplayJa: "単音 CDE",
        chordDisplayEn: "Single Notes CDE",
        rootPattern: .cde,
        rootPatternJa: SurvivalRootPattern.cde.nameJa,
        rootPatternEn: SurvivalRootPattern.cde.nameEn,
        allowedChords: allowedChords,
        blockKey: "major",
        isMixedStage: false,
        chordProgression: nil
    )
}
