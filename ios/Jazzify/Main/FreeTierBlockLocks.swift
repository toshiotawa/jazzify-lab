import Foundation

enum FreeTierBlockLocks {
    /// フリー会員向けに `maxBlockNumber` 超のブロックをロックする。
    static func apply(
        graph: LessonJourneyAccessGraph,
        lessons: [Lesson],
        maxBlockNumber: Int,
        isPremium: Bool
    ) -> LessonJourneyAccessGraph {
        guard !isPremium else { return graph }

        var lessonStates = graph.lessonStates
        var blockStates = graph.blockStates

        for lesson in lessons {
            let bn = lesson.blockNumber ?? 1
            guard bn > maxBlockNumber else { continue }
            guard let prev = lessonStates[lesson.id] else { continue }
            lessonStates[lesson.id] = LessonJourneyAccessGraph.LessonState(
                isUnlocked: false,
                isCompleted: prev.isCompleted
            )
        }

        for (bn, bs) in graph.blockStates where bn > maxBlockNumber {
            blockStates[bn] = LessonJourneyAccessGraph.BlockState(
                blockNumber: bn,
                isUnlocked: false,
                isCompleted: bs.isCompleted
            )
        }

        return LessonJourneyAccessGraph(lessonStates: lessonStates, blockStates: blockStates)
    }
}
