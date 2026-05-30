import Foundation

enum QuestCompletionModalKind: Equatable {
    case nextQuest
    case chapterCompleteWithNext
    case chapterCompleteOnly
    case none
}

enum LessonNavigationHelpers {
    static func sortLessonsByOrder(_ lessons: [Lesson]) -> [Lesson] {
        lessons.sorted { lhs, rhs in
            let leftBlock = lhs.blockNumber ?? 1
            let rightBlock = rhs.blockNumber ?? 1
            if leftBlock != rightBlock { return leftBlock < rightBlock }
            return lhs.orderIndex < rhs.orderIndex
        }
    }

    static func isLastLessonInBlock(currentLesson: Lesson, sortedLessons: [Lesson]) -> Bool {
        let blockNumber = currentLesson.blockNumber ?? 1
        let blockLessons = sortedLessons.filter { ($0.blockNumber ?? 1) == blockNumber }
        return blockLessons.last?.id == currentLesson.id
    }

    static func modalKind(
        currentLesson: Lesson,
        sortedLessons: [Lesson],
        nextLesson: Lesson?,
        canGoNext: Bool
    ) -> QuestCompletionModalKind {
        let isLastInChapter = isLastLessonInBlock(currentLesson: currentLesson, sortedLessons: sortedLessons)
        let hasNext = nextLesson != nil

        if isLastInChapter {
            if hasNext && canGoNext {
                return .chapterCompleteWithNext
            }
            return .chapterCompleteOnly
        }

        if hasNext && canGoNext {
            return .nextQuest
        }

        return .none
    }

    static func nextLesson(
        after currentLesson: Lesson,
        in sortedLessons: [Lesson]
    ) -> Lesson? {
        guard let index = sortedLessons.firstIndex(where: { $0.id == currentLesson.id }) else {
            return nil
        }
        let nextIndex = sortedLessons.index(after: index)
        guard nextIndex < sortedLessons.endIndex else { return nil }
        return sortedLessons[nextIndex]
    }

    static func canOpenNextLesson(
        nextLesson: Lesson,
        accessGraph: LessonJourneyAccessGraph
    ) -> Bool {
        accessGraph.lessonStates[nextLesson.id]?.isUnlocked == true
    }
}

struct QuestCompletionSheetModel: Identifiable {
    let id = UUID()
    let kind: QuestCompletionModalKind
    let chapterNumber: Int
    let nextLesson: Lesson?
}
