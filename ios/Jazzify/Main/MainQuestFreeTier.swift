import Foundation

enum MainQuestFreeTier {
    /// フリープランでプレイ可能なチャプター `blockNumber` の上限（この値まで含む）
    static let maxFreeBlockNumber = 1

    static func isBlockPlayable(isPremium: Bool, blockNumber: Int) -> Bool {
        SoftLandingFreeTier.isLessonBlockPlayable(
            courseKind: .mainQuest,
            blockNumber: blockNumber,
            isPremium: isPremium
        )
    }

    /// `LessonJourneyAccessGraph.build` の結果に、フリー会員向けのチャプター2以降ロックを適用する
    static func applyLocks(graph: LessonJourneyAccessGraph, lessons: [Lesson], isPremium: Bool) -> LessonJourneyAccessGraph {
        FreeTierBlockLocks.apply(
            graph: graph,
            lessons: lessons,
            maxBlockNumber: maxFreeBlockNumber,
            isPremium: isPremium
        )
    }
}
