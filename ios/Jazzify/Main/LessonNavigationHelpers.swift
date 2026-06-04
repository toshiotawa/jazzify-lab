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

/// メインクエスト画面の目的別コースプレビュー（uuid_generate_v5(ns, 'course-chord-run-beginner')）
enum MainQuestPreviewCourses {
    static let chordRunBeginnerId = UUID(uuidString: "5FFF9E19-F04A-595F-B666-B9DCF4AA765C")!

    static func pick(from courses: [Course], limit: Int = 3) -> [Course] {
        let sorted = courses.sorted { lhs, rhs in
            let lt = lhs.resolvedDifficultyTier.sortIndex
            let rt = rhs.resolvedDifficultyTier.sortIndex
            if lt != rt { return lt < rt }
            return lhs.orderIndex < rhs.orderIndex
        }
        guard let chordRun = sorted.first(where: { $0.id == chordRunBeginnerId }) else {
            return Array(sorted.prefix(limit))
        }
        let rest = sorted.filter { $0.id != chordRunBeginnerId }
        return Array(([chordRun] + rest).prefix(limit))
    }
}

struct QuestCompletionSheetModel: Identifiable {
    let id = UUID()
    let kind: QuestCompletionModalKind
    let chapterNumber: Int
    let nextLesson: Lesson?
}
