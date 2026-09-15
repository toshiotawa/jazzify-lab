import Foundation

struct TrainingGoalItemState: Identifiable, Sendable, Equatable {
    let trainingId: UUID
    let targetRank: TrainingLetterRank
    let bestRank: TrainingLetterRank?
    let bestScore: Int?
    let cleared: Bool

    var id: UUID { trainingId }
}

struct TrainingGoalProgress: Sendable, Equatable {
    let cleared: Int
    let total: Int
    let percent: Int
    let isComplete: Bool
    let items: [TrainingGoalItemState]

    static let empty = TrainingGoalProgress(cleared: 0, total: 0, percent: 0, isComplete: false, items: [])

    static func compute(
        goalSet: TrainingGoalSet,
        summaryByTrainingId: [UUID: TrainingScoreSummary]
    ) -> TrainingGoalProgress {
        var items: [TrainingGoalItemState] = []
        items.reserveCapacity(goalSet.items.count)
        var clearedCount = 0
        for item in goalSet.items {
            let summary = summaryByTrainingId[item.trainingId]
            let bestRank = summary?.bestRank
            let cleared = bestRank.map { TrainingRank.meetsRank(achieved: $0, required: item.targetRank) } ?? false
            if cleared { clearedCount += 1 }
            items.append(TrainingGoalItemState(
                trainingId: item.trainingId,
                targetRank: item.targetRank,
                bestRank: bestRank,
                bestScore: summary?.bestScore,
                cleared: cleared
            ))
        }
        let total = items.count
        let percent = total > 0 ? Int((Double(clearedCount) / Double(total) * 100).rounded()) : 0
        return TrainingGoalProgress(
            cleared: clearedCount,
            total: total,
            percent: percent,
            isComplete: total > 0 && clearedCount == total,
            items: items
        )
    }

    /// 選択中の目標が無効/未設定なら先頭の目標セットへフォールバック
    static func resolveActiveGoalSet(goalSets: [TrainingGoalSet], selectedGoalSetId: UUID?) -> TrainingGoalSet? {
        if let selectedGoalSetId, let selected = goalSets.first(where: { $0.id == selectedGoalSetId }) {
            return selected
        }
        return goalSets.first
    }

    /// 目標セット配列内の 1 始まり位置（横長画像の stageNumber に使用）
    static func stageNumber(goalSets: [TrainingGoalSet], goalSetId: UUID) -> Int {
        guard let index = goalSets.firstIndex(where: { $0.id == goalSetId }) else {
            return 1
        }
        return index + 1
    }

    /// 閉じるカテゴリ ID。直前プレイがあればそのカテゴリだけ開き、なければ目標カテゴリだけ開く。
    static func collapsedCategoryIds(
        categories: [TrainingCategoryWithTrainings],
        goalTrainingIds: [UUID],
        lastPlayedTrainingId: UUID?
    ) -> Set<UUID> {
        var openIds = Set<UUID>()

        if let lastPlayedTrainingId {
            if let played = categories.first(where: { category in
                category.trainings.contains(where: { $0.id == lastPlayedTrainingId })
            }) {
                openIds.insert(played.category.id)
            }
        }

        if openIds.isEmpty, !goalTrainingIds.isEmpty {
            let goalIds = Set(goalTrainingIds)
            for category in categories where category.trainings.contains(where: { goalIds.contains($0.id) }) {
                openIds.insert(category.category.id)
            }
        }

        return Set(categories.map(\.category.id).filter { !openIds.contains($0) })
    }
}
