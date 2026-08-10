import Foundation

enum LessonCourseKind: Equatable {
    case mainQuest
    case softLanding
    case normal

    static func resolve(_ course: Course?) -> LessonCourseKind {
        guard let course else { return .normal }
        if course.isMainCourse == true { return .mainQuest }
        if SoftLandingFreeTier.isSoftLandingCourse(course) { return .softLanding }
        return .normal
    }

    var isSequential: Bool {
        switch self {
        case .mainQuest, .softLanding:
            return true
        case .normal:
            return false
        }
    }

    var freeMaxBlockNumber: Int? {
        switch self {
        case .mainQuest:
            return MainQuestFreeTier.maxFreeBlockNumber
        case .softLanding:
            return SoftLandingFreeTier.maxFreeBlockNumber
        case .normal:
            return nil
        }
    }
}

enum SoftLandingOfferEntry: String {
    case chapterComplete = "chapter_complete"
    case softLanding = "soft_landing"
    case dashboard = "dashboard"
}

struct SoftLandingCandidate {
    let course: Course
    let lessons: [Lesson]
    let block1Completed: Bool
}

enum SoftLandingFreeTier {
    static let maxFreeBlockNumber = 1

    static func isSoftLandingCourse(_ course: Course) -> Bool {
        course.softLandingOrder != nil
    }

    static func isSequentialCourse(_ course: Course) -> Bool {
        course.isMainCourse == true || isSoftLandingCourse(course)
    }

    static func isLessonBlockPlayable(
        course: Course,
        blockNumber: Int,
        isPremium: Bool
    ) -> Bool {
        isLessonBlockPlayable(
            courseKind: LessonCourseKind.resolve(course),
            blockNumber: blockNumber,
            isPremium: isPremium
        )
    }

    static func isLessonBlockPlayable(
        courseKind: LessonCourseKind,
        blockNumber: Int,
        isPremium: Bool
    ) -> Bool {
        if isPremium { return true }
        let bn = blockNumber
        guard let maxBlock = courseKind.freeMaxBlockNumber else { return true }
        return bn <= maxBlock
    }

    static func applyLocks(
        graph: LessonJourneyAccessGraph,
        lessons: [Lesson],
        isPremium: Bool
    ) -> LessonJourneyAccessGraph {
        FreeTierBlockLocks.apply(
            graph: graph,
            lessons: lessons,
            maxBlockNumber: maxFreeBlockNumber,
            isPremium: isPremium
        )
    }

    static func isBlock1Complete(lessons: [Lesson], completedIds: Set<UUID>) -> Bool {
        let block1Lessons = lessons.filter { ($0.blockNumber ?? 1) == 1 }
        guard !block1Lessons.isEmpty else { return false }
        return block1Lessons.allSatisfy { completedIds.contains($0.id) }
    }

    static func firstBlock1LessonId(lessons: [Lesson]) -> UUID? {
        lessons
            .filter { ($0.blockNumber ?? 1) == 1 }
            .sorted { $0.orderIndex < $1.orderIndex }
            .first?
            .id
    }

    static func resolveNextSoftLandingCourse(
        candidates: [SoftLandingCandidate],
        excludeCourseId: UUID? = nil
    ) -> SoftLandingCandidate? {
        let sorted = candidates.sorted {
            ($0.course.softLandingOrder ?? 0) < ($1.course.softLandingOrder ?? 0)
        }
        return sorted.first { candidate in
            !candidate.block1Completed && candidate.course.id != excludeCourseId
        }
    }

    static func isSoftLandingPaywallSource(_ entry: SubscriptionEntry) -> Bool {
        switch entry {
        case .chapterComplete, .mainQuest, .softLanding:
            return true
        case .default, .lessonList, .dashboard, .resumeModal, .accountModal:
            return false
        }
    }

    static func offerEntry(for subscriptionEntry: SubscriptionEntry) -> SoftLandingOfferEntry {
        switch subscriptionEntry {
        case .softLanding:
            return .softLanding
        case .dashboard:
            return .dashboard
        default:
            return .chapterComplete
        }
    }
}

enum SoftLandingOfferLoader {
    static func fetchCandidates(userId: UUID) async -> [SoftLandingCandidate] {
        guard let allCourses = try? await SupabaseService.shared.fetchCourses() else {
            return []
        }
        let targets = allCourses
            .filter { $0.softLandingOrder != nil }
            .sorted { ($0.softLandingOrder ?? 0) < ($1.softLandingOrder ?? 0) }

        return await withTaskGroup(of: SoftLandingCandidate?.self) { group in
            for course in targets {
                group.addTask {
                    guard let lessons = try? await SupabaseService.shared.fetchLessons(courseId: course.id) else {
                        return nil
                    }
                    let progress = (try? await SupabaseService.shared.fetchLessonProgress(
                        courseId: course.id,
                        userId: userId
                    )) ?? []
                    let completedIds = Set(progress.filter(\.completed).map(\.lessonId))
                    return SoftLandingCandidate(
                        course: course,
                        lessons: lessons,
                        block1Completed: SoftLandingFreeTier.isBlock1Complete(
                            lessons: lessons,
                            completedIds: completedIds
                        )
                    )
                }
            }

            var results: [SoftLandingCandidate] = []
            for await candidate in group {
                if let candidate {
                    results.append(candidate)
                }
            }
            return results.sorted {
                ($0.course.softLandingOrder ?? 0) < ($1.course.softLandingOrder ?? 0)
            }
        }
    }

    static func resolveNext(
        userId: UUID?,
        excludeCourseId: UUID? = nil
    ) async -> SoftLandingCandidate? {
        guard let userId else { return nil }
        let candidates = await fetchCandidates(userId: userId)
        return SoftLandingFreeTier.resolveNextSoftLandingCourse(
            candidates: candidates,
            excludeCourseId: excludeCourseId
        )
    }
}
