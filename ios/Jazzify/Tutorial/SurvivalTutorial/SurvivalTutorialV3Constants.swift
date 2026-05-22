import Foundation

/// v3 チュートリアル共通タイミング（Web `survivalTutorialV3Constants.ts` と揃える）。
enum SurvivalTutorialV3Constants {
    /// 出題前セリフ（intro）の自動送り秒数。タップで即スキップ可。
    static let introHoldSeconds: Double = 3
    /// セリフのみの 1 行あたりの自動送り秒数。
    static let dialogueLineSeconds: Double = 3
    /// 正解後の余韻（Web `SURVIVAL_TUTORIAL_V3_AFTER_CORRECT_SECONDS` と揃える）。
    static let afterCorrectSeconds: Double = 1
    /// フレーズバトル reveal 時の静止敵数（譜面背後の視認性確保）。
    static let phraseRevealEnemyCount: Int = 1
    /// フレーズバトル reveal 時の静止敵リング半径。
    static let phraseRevealEnemyRadius: CGFloat = 180
}
