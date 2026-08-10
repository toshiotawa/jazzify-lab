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
            courseKind: .mainQuest,
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
            courseKind: .mainQuest,
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
            courseKind: .mainQuest,
            isPremium: false
        )

        XCTAssertEqual(state.nextLesson?.id, block2First.id)
        XCTAssertFalse(state.canGoNext)
        XCTAssertEqual(state.nextBlockedReason, .premiumRequired)
    }

    func testSoftLandingFreeUserBlockedFromSecondBlock() {
        let block1Last = makeLesson(orderIndex: 1, blockNumber: 1)
        let block2First = makeLesson(orderIndex: 2, blockNumber: 2)
        let block1First = makeLesson(orderIndex: 0, blockNumber: 1)

        let state = LessonNavigationHelpers.computeNavigationState(
            currentLesson: block1Last,
            lessons: [block1First, block1Last, block2First],
            completedIds: [block1First.id, block1Last.id],
            courseKind: .softLanding,
            isPremium: false
        )

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
            courseKind: .normal,
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

    func testShouldSkipReadyPromptForFreeTierBlock1PremiumUpsell() {
        XCTAssertTrue(
            LessonNavigationHelpers.shouldSkipQuestReadyToCompleteForFreeTierPremiumUpsell(
                courseKind: .mainQuest,
                isPremium: false,
                currentBlockNumber: 1,
                nextLessonBlockNumber: 2,
                nextBlockedReason: .premiumRequired
            )
        )
    }

    func testShouldSkipReadyPromptForSoftLandingBlock1PremiumUpsell() {
        XCTAssertTrue(
            LessonNavigationHelpers.shouldSkipQuestReadyToCompleteForFreeTierPremiumUpsell(
                courseKind: .softLanding,
                isPremium: false,
                currentBlockNumber: 1,
                nextLessonBlockNumber: 2,
                nextBlockedReason: .premiumRequired
            )
        )
    }

    func testShouldNotSkipReadyPromptForPremiumMember() {
        XCTAssertFalse(
            LessonNavigationHelpers.shouldSkipQuestReadyToCompleteForFreeTierPremiumUpsell(
                courseKind: .mainQuest,
                isPremium: true,
                currentBlockNumber: 1,
                nextLessonBlockNumber: 2,
                nextBlockedReason: .premiumRequired
            )
        )
    }

    func testShouldNotSkipReadyPromptWhenNextBlockIsStillBlock1() {
        XCTAssertFalse(
            LessonNavigationHelpers.shouldSkipQuestReadyToCompleteForFreeTierPremiumUpsell(
                courseKind: .mainQuest,
                isPremium: false,
                currentBlockNumber: 1,
                nextLessonBlockNumber: 1,
                nextBlockedReason: .sequentialLock
            )
        )
    }

    func testAreAllClearRequiredCompletedIgnoresOptionalTasks() {
        let requiredId = UUID()
        let optionalId = UUID()
        let required = makeRequirement(id: requiredId, orderIndex: 0, isClearRequired: true)
        let optional = makeRequirement(id: optionalId, orderIndex: 1, isClearRequired: false)
        let completedIds: Set<UUID> = [requiredId]

        XCTAssertTrue(
            LessonNavigationHelpers.areAllClearRequiredCompleted([required, optional]) { requirement in
                completedIds.contains(requirement.id)
            }
        )
    }

    func testAreAllClearRequiredCompletedReturnsFalseWhenRequiredIncomplete() {
        let required = makeRequirement(id: UUID(), orderIndex: 0, isClearRequired: true)
        let optional = makeRequirement(id: UUID(), orderIndex: 1, isClearRequired: false)

        XCTAssertFalse(
            LessonNavigationHelpers.areAllClearRequiredCompleted([required, optional]) { _ in false }
        )
    }

    func testSplitNextIncompleteRequirementsPrefersRequiredOverOptional() {
        let required = makeRequirement(id: UUID(), orderIndex: 0, isClearRequired: true)
        let optional = makeRequirement(id: UUID(), orderIndex: 1, isClearRequired: false)

        let split = LessonNavigationHelpers.splitNextIncompleteRequirements([required, optional]) { _ in false }

        XCTAssertEqual(split.required?.id, required.id)
        XCTAssertEqual(split.optional?.id, optional.id)
    }

    func testSplitNextIncompleteRequirementsReturnsOptionalWhenRequiredDone() {
        let requiredId = UUID()
        let optionalId = UUID()
        let required = makeRequirement(id: requiredId, orderIndex: 0, isClearRequired: true)
        let optional = makeRequirement(id: optionalId, orderIndex: 1, isClearRequired: false)
        let completedIds: Set<UUID> = [requiredId]

        let split = LessonNavigationHelpers.splitNextIncompleteRequirements([required, optional]) { requirement in
            completedIds.contains(requirement.id)
        }

        XCTAssertNil(split.required)
        XCTAssertEqual(split.optional?.id, optional.id)
    }

    private func makeRequirement(id: UUID, orderIndex: Int, isClearRequired: Bool) -> LessonSong {
        LessonSong(
            id: id,
            lessonId: UUID(),
            songId: nil,
            fantasyStageId: nil,
            earTrainingStageId: nil,
            isBalloonRush: nil,
            balloonRushStageId: nil,
            isVideoLesson: nil,
            videoLessonStageId: nil,
            isFantasy: false,
            isSurvival: true,
            isSurvivalTutorial: nil,
            survivalTutorialScriptId: nil,
            isEarTraining: nil,
            isEarTrainingTutorial: nil,
            earTrainingTutorialScriptId: nil,
            survivalStageNumber: 1,
            survivalMapCategory: "lesson",
            survivalCompositeConfig: nil,
            survivalRandomChords: nil,
            survivalLessonOverrides: nil,
            overrideProductionStaffHintMode: nil,
            overrideProductionKeyboardHintMode: nil,
            clearConditions: nil,
            isClearRequired: isClearRequired,
            orderIndex: orderIndex,
            title: "Task",
            titleEn: nil,
            fantasyStage: nil,
            earTrainingStage: nil,
            balloonRushStage: nil,
            videoLessonStage: nil
        )
    }
}
