import Foundation

struct UserStats: Sendable {
    let lessonCompletedCount: Int
    let dailyChallengeParticipationDays: Int
    let defenseClearCount: Int
    /// クリア済みトレーニング目標セット数
    let trainingGoalClearCount: Int
}
