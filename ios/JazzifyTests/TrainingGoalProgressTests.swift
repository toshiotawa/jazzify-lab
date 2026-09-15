import XCTest
@testable import Jazzify

final class TrainingGoalProgressTests: XCTestCase {
    private let trainingA = UUID()
    private let trainingB = UUID()
    private let trainingC = UUID()

    private func makeGoalSet(items: [TrainingGoalSetItem]) -> TrainingGoalSet {
        TrainingGoalSet(
            id: UUID(),
            slug: "test",
            titleJa: "テスト",
            titleEn: "Test",
            descriptionJa: "",
            descriptionEn: "",
            targetInstrument: .all,
            targetLevel: .beginner,
            sortOrder: 0,
            items: items
        )
    }

    private func summary(_ trainingId: UUID, score: Int, rank: TrainingLetterRank) -> TrainingScoreSummary {
        TrainingScoreSummary(trainingId: trainingId, bestScore: score, bestRank: rank, rankPosition: nil)
    }

    func testClearedWhenBestRankMeetsOrExceedsTarget() {
        let goalSet = makeGoalSet(items: [
            TrainingGoalSetItem(trainingId: trainingA, targetRank: .C, sortOrder: 0),
            TrainingGoalSetItem(trainingId: trainingB, targetRank: .C, sortOrder: 1),
            TrainingGoalSetItem(trainingId: trainingC, targetRank: .A, sortOrder: 2),
        ])
        let progress = TrainingGoalProgress.compute(goalSet: goalSet, summaryByTrainingId: [
            trainingA: summary(trainingA, score: 30, rank: .C),
            trainingB: summary(trainingB, score: 55, rank: .A),
            trainingC: summary(trainingC, score: 45, rank: .B),
        ])

        XCTAssertEqual(progress.cleared, 2)
        XCTAssertEqual(progress.total, 3)
        XCTAssertEqual(progress.percent, 67)
        XCTAssertFalse(progress.isComplete)
        XCTAssertTrue(progress.items[0].cleared)
        XCTAssertTrue(progress.items[1].cleared)
        XCTAssertFalse(progress.items[2].cleared)
        XCTAssertEqual(progress.items[2].bestScore, 45)
    }

    func testMissingSummaryIsNotCleared() {
        let goalSet = makeGoalSet(items: [
            TrainingGoalSetItem(trainingId: trainingA, targetRank: .F, sortOrder: 0),
        ])
        let progress = TrainingGoalProgress.compute(goalSet: goalSet, summaryByTrainingId: [:])

        XCTAssertEqual(progress.cleared, 0)
        XCTAssertNil(progress.items[0].bestRank)
        XCTAssertFalse(progress.isComplete)
    }

    func testCompleteWhenAllCleared() {
        let goalSet = makeGoalSet(items: [
            TrainingGoalSetItem(trainingId: trainingA, targetRank: .C, sortOrder: 0),
        ])
        let progress = TrainingGoalProgress.compute(goalSet: goalSet, summaryByTrainingId: [
            trainingA: summary(trainingA, score: 60, rank: .S),
        ])

        XCTAssertTrue(progress.isComplete)
        XCTAssertEqual(progress.percent, 100)
    }

    func testEmptyGoalSetIsNotComplete() {
        let progress = TrainingGoalProgress.compute(goalSet: makeGoalSet(items: []), summaryByTrainingId: [:])
        XCTAssertEqual(progress.percent, 0)
        XCTAssertFalse(progress.isComplete)
    }

    func testResolveActiveGoalSetFallsBackToFirst() {
        let first = makeGoalSet(items: [])
        let second = makeGoalSet(items: [])

        XCTAssertEqual(TrainingGoalProgress.resolveActiveGoalSet(goalSets: [first, second], selectedGoalSetId: second.id)?.id, second.id)
        XCTAssertEqual(TrainingGoalProgress.resolveActiveGoalSet(goalSets: [first, second], selectedGoalSetId: UUID())?.id, first.id)
        XCTAssertEqual(TrainingGoalProgress.resolveActiveGoalSet(goalSets: [first, second], selectedGoalSetId: nil)?.id, first.id)
        XCTAssertNil(TrainingGoalProgress.resolveActiveGoalSet(goalSets: [], selectedGoalSetId: nil))
    }

    func testStageNumberReturnsOneBasedPosition() {
        let first = makeGoalSet(items: [])
        let second = makeGoalSet(items: [])
        let third = makeGoalSet(items: [])
        let sets = [first, second, third]

        XCTAssertEqual(TrainingGoalProgress.stageNumber(goalSets: sets, goalSetId: first.id), 1)
        XCTAssertEqual(TrainingGoalProgress.stageNumber(goalSets: sets, goalSetId: second.id), 2)
        XCTAssertEqual(TrainingGoalProgress.stageNumber(goalSets: sets, goalSetId: third.id), 3)
        XCTAssertEqual(TrainingGoalProgress.stageNumber(goalSets: sets, goalSetId: UUID()), 1)
    }

    func testCollapsedCategoriesDefaultToGoalOnly() {
        let introId = UUID()
        let intervalId = UUID()
        let chordId = UUID()
        let categories = [
            makeCategory(id: introId, trainingIds: [trainingA, trainingB]),
            makeCategory(id: intervalId, trainingIds: [trainingC]),
            makeCategory(id: chordId, trainingIds: [UUID()]),
        ]

        let collapsed = TrainingGoalProgress.collapsedCategoryIds(
            categories: categories,
            goalTrainingIds: [trainingA],
            lastPlayedTrainingId: nil
        )

        XCTAssertEqual(collapsed, [intervalId, chordId])
    }

    func testCollapsedCategoriesOpenOnlyLastPlayedWhenReturning() {
        let introId = UUID()
        let intervalId = UUID()
        let categories = [
            makeCategory(id: introId, trainingIds: [trainingA]),
            makeCategory(id: intervalId, trainingIds: [trainingB]),
        ]

        let collapsed = TrainingGoalProgress.collapsedCategoryIds(
            categories: categories,
            goalTrainingIds: [trainingA],
            lastPlayedTrainingId: trainingB
        )

        XCTAssertEqual(collapsed, [introId])
    }

    func testCollapsedCategoriesAllClosedWithoutGoalOrLastPlayed() {
        let introId = UUID()
        let intervalId = UUID()
        let categories = [
            makeCategory(id: introId, trainingIds: [trainingA]),
            makeCategory(id: intervalId, trainingIds: [trainingB]),
        ]

        let collapsed = TrainingGoalProgress.collapsedCategoryIds(
            categories: categories,
            goalTrainingIds: [],
            lastPlayedTrainingId: nil
        )

        XCTAssertEqual(collapsed, [introId, intervalId])
    }

    private func makeCategory(id: UUID, trainingIds: [UUID]) -> TrainingCategoryWithTrainings {
        let category = TrainingCategoryRow(
            id: id,
            slug: id.uuidString,
            titleJa: "テスト",
            titleEn: "Test",
            descriptionJa: "",
            descriptionEn: "",
            sortOrder: 0,
            isFree: true,
            isActive: true
        )
        let trainings = trainingIds.map { trainingId in
            TrainingRow(
                id: trainingId,
                categoryId: id,
                slug: trainingId.uuidString,
                titleJa: "種目",
                titleEn: "Drill",
                sortOrder: 0,
                kind: .noteReading,
                clefMode: .instrument,
                useKeySignature: false,
                playRootOnCorrect: false,
                bgmUrl: "",
                config: TrainingConfig(
                    roots: nil,
                    quality: nil,
                    scale: nil,
                    interval: nil,
                    direction: nil,
                    clef: nil,
                    includeAccidentals: nil,
                    intervals: nil,
                    staves: nil,
                    voicingNotes: nil,
                    referenceRoot: nil,
                    minLowestNote: nil,
                    inversion: nil,
                    ordered: nil
                ),
                isActive: true
            )
        }
        return TrainingCategoryWithTrainings(category: category, trainings: trainings)
    }
}
