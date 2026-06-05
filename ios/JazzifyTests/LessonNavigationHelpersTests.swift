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
}
