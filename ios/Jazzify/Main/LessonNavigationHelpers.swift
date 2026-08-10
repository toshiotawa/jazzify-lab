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
        courseKind: LessonCourseKind,
        isPremium: Bool
    ) -> LessonJourneyAccessGraph {
        let sorted = sortLessonsByOrder(lessons)
        var graph = LessonJourneyAccessGraph.build(
            lessons: sorted,
            completedIds: completedIds,
            enforceSequentialWithinBlocks: courseKind.isSequential
        )
        if let maxBlock = courseKind.freeMaxBlockNumber {
            graph = FreeTierBlockLocks.apply(
                graph: graph,
                lessons: sorted,
                maxBlockNumber: maxBlock,
                isPremium: isPremium
            )
        }
        return graph
    }

    static func computeNavigationState(
        currentLesson: Lesson,
        lessons: [Lesson],
        completedIds: Set<UUID>,
        courseKind: LessonCourseKind,
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
            enforceSequentialWithinBlocks: courseKind.isSequential
        )
        let accessGraph = buildAccessGraph(
            lessons: lessons,
            completedIds: completedIds,
            courseKind: courseKind,
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
                courseKind: courseKind,
                isPremium: isPremium
            )
        )
    }

    static func navigationBlockedMessage(
        direction: NavigationDirection,
        reason: NavigationBlockedReason?,
        locale: AppLocale,
        nextLesson: Lesson?,
        courseKind: LessonCourseKind = .normal
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
            switch courseKind {
            case .mainQuest:
                return locale == .ja
                    ? "メインクエスト第2チャプター以降はプレミアムが必要です。"
                    : "Main Quest chapters after Chapter 1 require Premium."
            case .softLanding:
                return locale == .ja
                    ? "第2ブロック以降はプレミアムが必要です。"
                    : "Blocks after Block 1 require Premium."
            case .normal:
                return locale == .ja
                    ? "この先はプレミアムが必要です。"
                    : "Premium is required to continue."
            }
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

    /// クエスト詳細を開いたときに「完了を促すプロンプト」を自動表示すべきか判定する。
    /// 課題が1つ以上あり、全課題クリア済みで、まだクエスト未完了のときだけ true。
    static func shouldShowQuestReadyToCompletePrompt(
        hasRequirements: Bool,
        allRequirementsCompleted: Bool,
        isLessonCompleted: Bool
    ) -> Bool {
        hasRequirements && allRequirementsCompleted && !isLessonCompleted
    }

    /// 無料枠 block1 最終クエスト: ReadyToComplete を挟まず完了シートへ直行するか
    static func shouldSkipQuestReadyToCompleteForFreeTierPremiumUpsell(
        courseKind: LessonCourseKind,
        isPremium: Bool,
        currentBlockNumber: Int,
        nextLessonBlockNumber: Int?,
        nextBlockedReason: NavigationBlockedReason?
    ) -> Bool {
        guard courseKind.isSequential, !isPremium, currentBlockNumber == 1 else { return false }
        guard let nextLessonBlockNumber, nextLessonBlockNumber > 1 else { return false }
        return nextBlockedReason == .premiumRequired
    }

    static func isClearRequiredLessonSong(_ requirement: LessonSong) -> Bool {
        requirement.isClearRequired != false
    }

    /// Web `isLegendOnlyLessonRequirement` と同等 — レジェンド（曲）課題は非表示。
    static func isLegendOnlyLessonRequirement(_ requirement: LessonSong) -> Bool {
        guard requirement.songId != nil else { return false }
        return requirement.isFantasy == false
            && requirement.isSurvival != true
            && requirement.isSurvivalTutorial != true
            && requirement.isEarTraining != true
            && requirement.isEarTrainingTutorial != true
            && requirement.isBalloonRush != true
            && requirement.isVideoLesson != true
    }

    static func areAllClearRequiredCompleted(
        _ requirements: [LessonSong],
        isCompleted: (LessonSong) -> Bool
    ) -> Bool {
        let required = requirements.filter {
            isClearRequiredLessonSong($0) && !isLegendOnlyLessonRequirement($0)
        }
        if required.isEmpty { return true }
        return required.allSatisfy { isCompleted($0) }
    }

    static func splitNextIncompleteRequirements(
        _ requirements: [LessonSong],
        isCompleted: (LessonSong) -> Bool
    ) -> (required: LessonSong?, optional: LessonSong?) {
        var nextRequired: LessonSong?
        var nextOptional: LessonSong?

        for requirement in requirements {
            if isLegendOnlyLessonRequirement(requirement) { continue }
            if isCompleted(requirement) { continue }
            if isClearRequiredLessonSong(requirement) {
                if nextRequired == nil { nextRequired = requirement }
            } else if nextOptional == nil {
                nextOptional = requirement
            }
            if nextRequired != nil && nextOptional != nil { break }
        }

        return (nextRequired, nextOptional)
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
        courseKind: LessonCourseKind,
        isPremium: Bool
    ) -> NavigationBlockedReason? {
        guard let nextLesson else {
            return .lastLesson
        }
        if canGoNext {
            return nil
        }

        let nextBlockNumber = nextLesson.blockNumber ?? 1
        if let maxBlock = courseKind.freeMaxBlockNumber, !isPremium, nextBlockNumber > maxBlock {
            return .premiumRequired
        }

        let nextBlockUnlocked = baseGraph.blockStates[nextBlockNumber]?.isUnlocked == true
        if !nextBlockUnlocked {
            return .previousBlockIncomplete
        }

        let currentBlockNumber = currentLesson.blockNumber ?? 1
        if courseKind.isSequential
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

struct QuestCompletionSheetModel: Identifiable {
    let id = UUID()
    let kind: QuestCompletionModalKind
    let chapterNumber: Int
    let nextLesson: Lesson?
}
