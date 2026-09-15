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
}
