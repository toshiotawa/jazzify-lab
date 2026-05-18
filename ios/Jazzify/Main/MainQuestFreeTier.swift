import Foundation

enum MainQuestFreeTier {
    /// フリープランでプレイ可能なチャプター `blockNumber` の上限（この値まで含む）
    static let maxFreeBlockNumber = 1

    static func isBlockPlayable(isPremium: Bool, blockNumber: Int) -> Bool {
        if isPremium { return true }
        return blockNumber <= maxFreeBlockNumber
    }

    /// `LessonJourneyAccessGraph.build` の結果に、フリー会員向けのチャプター2以降ロックを適用する
    static func applyLocks(graph: LessonJourneyAccessGraph, lessons: [Lesson], isPremium: Bool) -> LessonJourneyAccessGraph {
        guard !isPremium else { return graph }

        var lessonStates = graph.lessonStates
        var blockStates = graph.blockStates

        for lesson in lessons {
            let bn = lesson.blockNumber ?? 1
            guard bn > maxFreeBlockNumber else { continue }
            guard let prev = lessonStates[lesson.id] else { continue }
            lessonStates[lesson.id] = LessonJourneyAccessGraph.LessonState(isUnlocked: false, isCompleted: prev.isCompleted)
        }

        for (bn, bs) in graph.blockStates where bn > maxFreeBlockNumber {
            blockStates[bn] = LessonJourneyAccessGraph.BlockState(
                blockNumber: bn,
                isUnlocked: false,
                isCompleted: bs.isCompleted
            )
        }

        return LessonJourneyAccessGraph(lessonStates: lessonStates, blockStates: blockStates)
    }
}
