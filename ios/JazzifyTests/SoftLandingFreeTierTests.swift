import XCTest
@testable import Jazzify

final class SoftLandingFreeTierTests: XCTestCase {
    private let courseId = UUID()

    private func makeCourse(
        id: UUID = UUID(),
        isMainCourse: Bool? = false,
        softLandingOrder: Int? = nil
    ) -> Course {
        Course(
            id: id,
            title: "Test Course",
            titleEn: nil,
            description: nil,
            descriptionEn: nil,
            orderIndex: 0,
            premiumOnly: true,
            isTutorial: nil,
            audience: nil,
            difficultyTier: nil,
            isDeveloperOnly: nil,
            isMainCourse: isMainCourse,
            softLandingOrder: softLandingOrder
        )
    }

    private func makeLesson(orderIndex: Int, blockNumber: Int = 1) -> Lesson {
        Lesson(
            id: UUID(),
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

    func testIsSoftLandingCourseWhenOrderIsSet() {
        let course = makeCourse(softLandingOrder: 1)
        XCTAssertTrue(SoftLandingFreeTier.isSoftLandingCourse(course))
    }

    func testIsSoftLandingCourseWhenOrderIsNil() {
        let course = makeCourse(softLandingOrder: nil)
        XCTAssertFalse(SoftLandingFreeTier.isSoftLandingCourse(course))
    }

    func testIsLessonBlockPlayableMainQuestFreeUser() {
        let course = makeCourse(isMainCourse: true)
        XCTAssertTrue(SoftLandingFreeTier.isLessonBlockPlayable(course: course, blockNumber: 1, isPremium: false))
        XCTAssertFalse(SoftLandingFreeTier.isLessonBlockPlayable(course: course, blockNumber: 2, isPremium: false))
    }

    func testIsLessonBlockPlayableSoftLandingFreeUser() {
        let course = makeCourse(softLandingOrder: 2)
        XCTAssertTrue(SoftLandingFreeTier.isLessonBlockPlayable(course: course, blockNumber: 1, isPremium: false))
        XCTAssertFalse(SoftLandingFreeTier.isLessonBlockPlayable(course: course, blockNumber: 2, isPremium: false))
    }

    func testIsLessonBlockPlayableNormalCourse() {
        let course = makeCourse()
        XCTAssertTrue(SoftLandingFreeTier.isLessonBlockPlayable(course: course, blockNumber: 99, isPremium: false))
    }

    func testResolveNextSoftLandingCourseSortsByOrder() {
        let c1 = makeCourse(id: UUID(), softLandingOrder: 2)
        let c2 = makeCourse(id: UUID(), softLandingOrder: 1)
        let candidates = [
            SoftLandingCandidate(course: c1, lessons: [], block1Completed: false),
            SoftLandingCandidate(course: c2, lessons: [], block1Completed: false),
        ]
        let next = SoftLandingFreeTier.resolveNextSoftLandingCourse(candidates: candidates)
        XCTAssertEqual(next?.course.id, c2.id)
    }

    func testResolveNextSoftLandingCourseReturnsNilWhenAllCompleted() {
        let c1 = makeCourse(softLandingOrder: 1)
        let candidates = [
            SoftLandingCandidate(course: c1, lessons: [], block1Completed: true),
        ]
        XCTAssertNil(SoftLandingFreeTier.resolveNextSoftLandingCourse(candidates: candidates))
    }

    func testResolveNextSoftLandingCourseExcludesCourseId() {
        let c1 = makeCourse(id: UUID(), softLandingOrder: 1)
        let c2 = makeCourse(id: UUID(), softLandingOrder: 2)
        let candidates = [
            SoftLandingCandidate(course: c1, lessons: [], block1Completed: false),
            SoftLandingCandidate(course: c2, lessons: [], block1Completed: false),
        ]
        let next = SoftLandingFreeTier.resolveNextSoftLandingCourse(
            candidates: candidates,
            excludeCourseId: c1.id
        )
        XCTAssertEqual(next?.course.id, c2.id)
    }

    func testFreeTierBlockLocksBlocksHigherBlocks() {
        let block1 = makeLesson(orderIndex: 0, blockNumber: 1)
        let block2 = makeLesson(orderIndex: 1, blockNumber: 2)
        let graph = LessonJourneyAccessGraph.build(
            lessons: [block1, block2],
            completedIds: [],
            enforceSequentialWithinBlocks: true
        )
        let locked = FreeTierBlockLocks.apply(
            graph: graph,
            lessons: [block1, block2],
            maxBlockNumber: 1,
            isPremium: false
        )
        XCTAssertTrue(locked.lessonStates[block2.id]?.isUnlocked == false)
        XCTAssertFalse(locked.blockStates[2]?.isUnlocked ?? true)
    }

    func testFirstBlock1LessonIdReturnsLowestOrderIndex() {
        let second = makeLesson(orderIndex: 1, blockNumber: 1)
        let first = makeLesson(orderIndex: 0, blockNumber: 1)
        let id = SoftLandingFreeTier.firstBlock1LessonId(lessons: [second, first])
        XCTAssertEqual(id, first.id)
    }

    func testIsBlock1CompleteRequiresAllBlock1Lessons() {
        let l1 = makeLesson(orderIndex: 0, blockNumber: 1)
        let l2 = makeLesson(orderIndex: 1, blockNumber: 1)
        XCTAssertFalse(SoftLandingFreeTier.isBlock1Complete(lessons: [l1, l2], completedIds: [l1.id]))
        XCTAssertTrue(SoftLandingFreeTier.isBlock1Complete(lessons: [l1, l2], completedIds: [l1.id, l2.id]))
    }
}
