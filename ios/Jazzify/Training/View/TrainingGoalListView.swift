import SwiftUI

/// 目標セット一覧（現在の目標を先頭に表示し、他の目標へ切り替え）
struct TrainingGoalListView: View {
    let goalSets: [TrainingGoalSet]
    let activeGoalSetId: UUID?
    let summaryById: [UUID: TrainingScoreSummary]
    let locale: AppLocale
    let onBack: () -> Void
    let onSelectGoal: (UUID) -> Void

    private var orderedSets: [TrainingGoalSet] {
        guard let active = TrainingGoalProgress.resolveActiveGoalSet(goalSets: goalSets, selectedGoalSetId: activeGoalSetId) else {
            return goalSets
        }
        return [active] + goalSets.filter { $0.id != active.id }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Button(locale == .ja ? "← 戻る" : "← Back", action: onBack)
                    .font(.subheadline)
                    .padding(.horizontal)

                Text(locale == .ja ? "目標セット一覧" : "Goal Sets")
                    .font(.title2.bold())
                    .padding(.horizontal)

                let sets = orderedSets
                ForEach(Array(sets.enumerated()), id: \.element.id) { index, goalSet in
                    goalRow(goalSet, isActive: index == 0)
                }
            }
            .padding(.vertical)
        }
    }

    private func goalRow(_ goalSet: TrainingGoalSet, isActive: Bool) -> some View {
        let progress = TrainingGoalProgress.compute(goalSet: goalSet, summaryByTrainingId: summaryById)
        return HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                if isActive {
                    Text(locale == .ja ? "現在の目標" : "CURRENT GOAL")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.indigo)
                }
                Text(goalSet.localizedTitle(locale))
                    .font(.subheadline.weight(.semibold))
                Text("\(progress.percent)%  (\(progress.cleared)/\(progress.total))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
            }
            Spacer()
            if !isActive {
                Button(locale == .ja ? "切り替える" : "Switch") {
                    onSelectGoal(goalSet.id)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .background(isActive ? Color.indigo.opacity(0.12) : Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isActive ? Color.indigo.opacity(0.5) : Color.clear, lineWidth: 1)
        )
        .padding(.horizontal)
    }
}
