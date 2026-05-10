import Foundation

/// サバイバル 1 プレイセッションの明示的ライフサイクル。
enum SurvivalSessionState: Equatable {
    case idle
    case loading
    case prewarming
    case ready
    case running
    case paused
    /// ステージ結果オーバーレイ表示中など。
    case finishing(phase: SurvivalStagePhase)
    case disposed
}
