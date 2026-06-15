import XCTest
@testable import Jazzify

final class LessonNavigationHelpersTests: XCTestCase {
    private let courseId = UUID()

    private func makeLesson(
        id: UUID = UUID(),
        orderIndex: Int,
        blockNumber: Int = 1
    ) -> Lesson {
        Lesson(
            id: id,
            courseId: courseId,
            title: "Lesson",
            titleEn: nil,
            description: nil,
            descriptionEn: nil,
            orderIndex: orderIndex,
            premiumOnly: nil,
            blockNumber: blockNumber,
            blockName: nil,
            blockNameEn: nil,
            blockDescription: nil,
            blockDescriptionEn: nil
        )
    }

    func testMainQuestSequentialLockBlocksNextWithoutCompletion() {
        let first = makeLesson(orderIndex: 0, blockNumber: 1)
        let second = makeLesson(orderIndex: 1, blockNumber: 1)

        let state = LessonNavigationHelpers.computeNavigationState(
            currentLesson: first,
            lessons: [first, second],
            completedIds: [],
            isMainQuest: true,
            isPremium: true
        )

        XCTAssertEqual(state.nextLesson?.id, second.id)
        XCTAssertFalse(state.canGoNext)
        XCTAssertEqual(state.nextBlockedReason, .sequentialLock)
    }

    func testMainQuestAllowsNextAfterCurrentCompletion() {
        let first = makeLesson(orderIndex: 0, blockNumber: 1)
        let second = makeLesson(orderIndex: 1, blockNumber: 1)

        let state = LessonNavigationHelpers.computeNavigationState(
            currentLesson: first,
            lessons: [first, second],
            completedIds: [first.id],
            isMainQuest: true,
            isPremium: true
        )

        XCTAssertTrue(state.canGoNext)
        XCTAssertNil(state.nextBlockedReason)
    }

    func testMainQuestFreeUserBlockedFromSecondChapter() {
        let block1Last = makeLesson(orderIndex: 1, blockNumber: 1)
        let block2First = makeLesson(orderIndex: 2, blockNumber: 2)
        let block1First = makeLesson(orderIndex: 0, blockNumber: 1)

        let state = LessonNavigationHelpers.computeNavigationState(
            currentLesson: block1Last,
            lessons: [block1First, block1Last, block2First],
            completedIds: [block1First.id, block1Last.id],
            isMainQuest: true,
            isPremium: false
        )

        XCTAssertEqual(state.nextLesson?.id, block2First.id)
        XCTAssertFalse(state.canGoNext)
        XCTAssertEqual(state.nextBlockedReason, .premiumRequired)
    }

    func testModalKindReturnsChapterCompletePremiumUpsellForFreeTierBlock() {
        let block1Last = makeLesson(orderIndex: 1, blockNumber: 1)
        let block2First = makeLesson(orderIndex: 2, blockNumber: 2)
        let block1First = makeLesson(orderIndex: 0, blockNumber: 1)
        let sorted = LessonNavigationHelpers.sortLessonsByOrder([block1First, block1Last, block2First])

        let kind = LessonNavigationHelpers.modalKind(
            currentLesson: block1Last,
            sortedLessons: sorted,
            nextLesson: block2First,
            canGoNext: false,
            nextBlockedReason: .premiumRequired
        )

        XCTAssertEqual(kind, .chapterCompletePremiumUpsell)
    }

    func testModalKindReturnsChapterCompleteWithNextForPremiumUser() {
        let block1Last = makeLesson(orderIndex: 1, blockNumber: 1)
        let block2First = makeLesson(orderIndex: 2, blockNumber: 2)
        let block1First = makeLesson(orderIndex: 0, blockNumber: 1)
        let sorted = LessonNavigationHelpers.sortLessonsByOrder([block1First, block1Last, block2First])

        let kind = LessonNavigationHelpers.modalKind(
            currentLesson: block1Last,
            sortedLessons: sorted,
            nextLesson: block2First,
            canGoNext: true,
            nextBlockedReason: nil
        )

        XCTAssertEqual(kind, .chapterCompleteWithNext)
    }

    func testModalKindReturnsChapterCompleteOnlyForFinalCourseChapter() {
        let block1Last = makeLesson(orderIndex: 1, blockNumber: 1)
        let block1First = makeLesson(orderIndex: 0, blockNumber: 1)
        let sorted = LessonNavigationHelpers.sortLessonsByOrder([block1First, block1Last])

        let kind = LessonNavigationHelpers.modalKind(
            currentLesson: block1Last,
            sortedLessons: sorted,
            nextLesson: nil,
            canGoNext: false,
            nextBlockedReason: .lastLesson
        )

        XCTAssertEqual(kind, .chapterCompleteOnly)
    }

    func testPurposeCourseAllowsSkippingWithinUnlockedBlock() {
        let first = makeLesson(orderIndex: 0, blockNumber: 1)
        let second = makeLesson(orderIndex: 1, blockNumber: 1)

        let state = LessonNavigationHelpers.computeNavigationState(
            currentLesson: first,
            lessons: [first, second],
            completedIds: [],
            isMainQuest: false,
            isPremium: false
        )

        XCTAssertTrue(state.canGoNext)
        XCTAssertNil(state.nextBlockedReason)
    }

    func testShouldShowQuestReadyToCompletePromptWhenAllTasksDoneAndNotCompleted() {
        XCTAssertTrue(
            LessonNavigationHelpers.shouldShowQuestReadyToCompletePrompt(
                hasRequirements: true,
                allRequirementsCompleted: true,
                isLessonCompleted: false
            )
        )
    }

    func testShouldNotShowReadyPromptWithoutRequirements() {
        XCTAssertFalse(
            LessonNavigationHelpers.shouldShowQuestReadyToCompletePrompt(
                hasRequirements: false,
                allRequirementsCompleted: true,
                isLessonCompleted: false
            )
        )
    }

    func testShouldNotShowReadyPromptWhenTasksIncomplete() {
        XCTAssertFalse(
            LessonNavigationHelpers.shouldShowQuestReadyToCompletePrompt(
                hasRequirements: true,
                allRequirementsCompleted: false,
                isLessonCompleted: false
            )
        )
    }

    func testShouldNotShowReadyPromptWhenAlreadyCompleted() {
        XCTAssertFalse(
            LessonNavigationHelpers.shouldShowQuestReadyToCompletePrompt(
                hasRequirements: true,
                allRequirementsCompleted: true,
                isLessonCompleted: true
            )
        )
    }
}
