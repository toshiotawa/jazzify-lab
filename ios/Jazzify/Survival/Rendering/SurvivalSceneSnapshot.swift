import Foundation

/// シミュレーション 1 ステップ後にシーンへ渡す描画用スナップショット。
struct SurvivalSceneSnapshot: Sendable {
    let runtime: SurvivalStageRuntime
    let bossBattle: SurvivalBossBattleState?
}

/// `SurvivalScene` がシミュレーションを進めるためのドライバ（実装は `SurvivalGameSession`）。
@MainActor
protocol SurvivalSceneDriver: AnyObject {
    func advanceSceneFrame(currentTime: TimeInterval) -> SurvivalSceneSnapshot
}
