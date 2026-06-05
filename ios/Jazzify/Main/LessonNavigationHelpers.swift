import Foundation

enum QuestCompletionModalKind: Equatable {
    case nextQuest
    case chapterCompleteWithNext
    case chapterCompletePremiumUpsell
    case chapterCompleteOnly
    case none
}

enum NavigationBlockedReason: Equatable {
    case firstLesson
    case lastLesson
    case sequentialLock
    case previousBlockIncomplete
    case premiumRequired
}

struct LessonNavigationState: Equatable {
    let previousLesson: Lesson?
    let nextLesson: Lesson?
    let canGoPrevious: Bool
    let canGoNext: Bool
    let previousBlockedReason: NavigationBlockedReason?
    let nextBlockedReason: NavigationBlockedReason?
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

    static func buildAccessGraph(
        lessons: [Lesson],
        completedIds: Set<UUID>,
        isMainQuest: Bool,
        isPremium: Bool
    ) -> LessonJourneyAccessGraph {
        let sorted = sortLessonsByOrder(lessons)
        var graph = LessonJourneyAccessGraph.build(
            lessons: sorted,
            completedIds: completedIds,
            enforceSequentialWithinBlocks: isMainQuest
        )
        if isMainQuest {
            graph = MainQuestFreeTier.applyLocks(graph: graph, lessons: sorted, isPremium: isPremium)
        }
        return graph
    }

    static func computeNavigationState(
        currentLesson: Lesson,
        lessons: [Lesson],
        completedIds: Set<UUID>,
        isMainQuest: Bool,
        isPremium: Bool
    ) -> LessonNavigationState {
        let sorted = sortLessonsByOrder(lessons)
        guard let currentIndex = sorted.firstIndex(where: { $0.id == currentLesson.id }) else {
            return LessonNavigationState(
                previousLesson: nil,
                nextLesson: nil,
                canGoPrevious: false,
                canGoNext: false,
                previousBlockedReason: nil,
                nextBlockedReason: nil
            )
        }

        let previousLesson = currentIndex > 0 ? sorted[currentIndex - 1] : nil
        let nextLesson = currentIndex < sorted.count - 1 ? sorted[currentIndex + 1] : nil

        let baseGraph = LessonJourneyAccessGraph.build(
            lessons: sorted,
            completedIds: completedIds,
            enforceSequentialWithinBlocks: isMainQuest
        )
        let accessGraph = buildAccessGraph(
            lessons: lessons,
            completedIds: completedIds,
            isMainQuest: isMainQuest,
            isPremium: isPremium
        )

        let canGoPrevious = previousLesson.map { accessGraph.lessonStates[$0.id]?.isUnlocked == true } ?? false
        let canGoNext = nextLesson.map { accessGraph.lessonStates[$0.id]?.isUnlocked == true } ?? false

        return LessonNavigationState(
            previousLesson: previousLesson,
            nextLesson: nextLesson,
            canGoPrevious: previousLesson != nil && canGoPrevious,
            canGoNext: nextLesson != nil && canGoNext,
            previousBlockedReason: resolvePreviousBlockedReason(
                previousLesson: previousLesson,
                canGoPrevious: previousLesson != nil && canGoPrevious
            ),
            nextBlockedReason: resolveNextBlockedReason(
                currentLesson: currentLesson,
                nextLesson: nextLesson,
                canGoNext: nextLesson != nil && canGoNext,
                baseGraph: baseGraph,
                completedIds: completedIds,
                isMainQuest: isMainQuest,
                isPremium: isPremium
            )
        )
    }

    static func navigationBlockedMessage(
        direction: NavigationDirection,
        reason: NavigationBlockedReason?,
        locale: AppLocale,
        nextLesson: Lesson?
    ) -> String {
        let resolvedReason: NavigationBlockedReason
        switch direction {
        case .previous:
            resolvedReason = reason ?? .sequentialLock
        case .next:
            resolvedReason = reason ?? .previousBlockIncomplete
        }

        switch resolvedReason {
        case .firstLesson:
            return locale == .ja
                ? "これがコースの最初のクエストです。"
                : "This is the first quest in the course."
        case .lastLesson:
            return locale == .ja
                ? "これがコースの最後のクエストです。すべてのクエストを完了されました！"
                : "This is the last quest. You have finished the course!"
        case .sequentialLock:
            return locale == .ja
                ? "先に現在のクエストを完了してください。"
                : "Complete the current quest before moving to the next one."
        case .premiumRequired:
            return locale == .ja
                ? "メインクエスト第2チャプター以降はプレミアムが必要です。"
                : "Main Quest chapters after Chapter 1 require Premium."
        case .previousBlockIncomplete:
            if let nextLesson {
                let blockLabel = locale == .ja
                    ? "ブロック \(nextLesson.blockNumber ?? 1)"
                    : "Block \(nextLesson.blockNumber ?? 1)"
                return locale == .ja
                    ? "次のクエスト（\(blockLabel)）はまだ解放されていません。前のブロックの全クエストを完了してください。"
                    : "The next quest (\(blockLabel)) is still locked. Complete every quest in the previous block first."
            }
            return locale == .ja
                ? "次のクエストはまだ解放されていません。現在のブロックの全クエストを完了してください。"
                : "The next quest is still locked. Complete every quest in the current block first."
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
        canGoNext: Bool,
        nextBlockedReason: NavigationBlockedReason?
    ) -> QuestCompletionModalKind {
        let isLastInChapter = isLastLessonInBlock(currentLesson: currentLesson, sortedLessons: sortedLessons)
        let hasNext = nextLesson != nil

        if isLastInChapter {
            if hasNext && canGoNext {
                return .chapterCompleteWithNext
            }
            if hasNext && !canGoNext && nextBlockedReason == .premiumRequired {
                return .chapterCompletePremiumUpsell
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

    private static func resolvePreviousBlockedReason(
        previousLesson: Lesson?,
        canGoPrevious: Bool
    ) -> NavigationBlockedReason? {
        if previousLesson == nil {
            return .firstLesson
        }
        if canGoPrevious {
            return nil
        }
        return .sequentialLock
    }

    private static func resolveNextBlockedReason(
        currentLesson: Lesson,
        nextLesson: Lesson?,
        canGoNext: Bool,
        baseGraph: LessonJourneyAccessGraph,
        completedIds: Set<UUID>,
        isMainQuest: Bool,
        isPremium: Bool
    ) -> NavigationBlockedReason? {
        guard let nextLesson else {
            return .lastLesson
        }
        if canGoNext {
            return nil
        }

        let nextBlockNumber = nextLesson.blockNumber ?? 1
        if isMainQuest && !MainQuestFreeTier.isBlockPlayable(isPremium: isPremium, blockNumber: nextBlockNumber) {
            return .premiumRequired
        }

        let nextBlockUnlocked = baseGraph.blockStates[nextBlockNumber]?.isUnlocked == true
        if !nextBlockUnlocked {
            return .previousBlockIncomplete
        }

        let currentBlockNumber = currentLesson.blockNumber ?? 1
        if isMainQuest
            && currentBlockNumber == nextBlockNumber
            && !completedIds.contains(currentLesson.id) {
            return .sequentialLock
        }

        return .previousBlockIncomplete
    }
}

enum NavigationDirection {
    case previous
    case next
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
