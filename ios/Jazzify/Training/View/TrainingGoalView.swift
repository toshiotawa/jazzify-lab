import SwiftUI

/// 現在の目標セットの詳細（進捗ドーナツ・説明・目標トレーニング一覧）
struct TrainingGoalView: View {
    let goalSet: TrainingGoalSet
    let stageNumber: Int
    let summaryById: [UUID: TrainingScoreSummary]
    let trainingById: [UUID: TrainingRow]
    let locale: AppLocale
    let isTrainingLocked: (TrainingRow) -> Bool
    let onBack: () -> Void
    let onOpenGoals: (() -> Void)?
    let onPlay: (TrainingRow, Bool) -> Void
    let onOpenRecords: (UUID) -> Void
    let onLocked: () -> Void

    var body: some View {
        let progress = TrainingGoalProgress.compute(goalSet: goalSet, summaryByTrainingId: summaryById)
        let description = goalSet.localizedDescription(locale)
        let rankInfo = goalSet.resolveRankInfo(trainingById: trainingById)

        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Button(locale == .ja ? "← 戻る" : "← Back", action: onBack)
                    .font(.subheadline)
                    .padding(.horizontal)

                TrainingGoalArtCardView(stageNumber: stageNumber) {
                    HStack(spacing: 16) {
                        TrainingDonutView(percent: progress.percent, size: 96, lineWidth: 10)
                        VStack(alignment: .leading, spacing: 6) {
                            Text(locale == .ja ? "現在の目標" : "CURRENT GOAL")
                                .font(.caption2.weight(.semibold))
                                .foregroundStyle(Color(hex: "c7d2fe"))
                            Text(goalSet.localizedTitle(locale))
                                .font(.title2.bold())
                                .foregroundStyle(.white)
                            Text("\(progress.cleared)/\(progress.total)")
                                .font(.subheadline)
                                .foregroundStyle(Color(hex: "e0e7ff"))
                                .monospacedDigit()
                        }
                        Spacer()
                    }
                }
                .padding(.horizontal)

                VStack(alignment: .leading, spacing: 8) {
                    Text("\(locale == .ja ? "対象楽器" : "Target instrument"): \(goalSet.targetInstrument.localizedLabel(locale))")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text("\(locale == .ja ? "対象レベル" : "Target level"): \(goalSet.targetLevel.localizedLabel(locale))")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    if let rankInfo {
                        Text("\(locale == .ja ? "目標ランク" : "Target rank"): \(rankInfo.localizedLabel(locale))")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    if !description.isEmpty {
                        Text(description)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .padding(.top, 4)
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)

                if let onOpenGoals {
                    Button(action: onOpenGoals) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(locale == .ja ? "目標セット一覧" : "Goal Sets")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(.primary)
                                Text(locale == .ja ? "他の目標セットに切り替える" : "Switch to another goal set")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .background(
                            LinearGradient(
                                colors: [Color.indigo.opacity(0.18), Color(.secondarySystemBackground)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.indigo.opacity(0.4), lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal)
                }

                Text(locale == .ja ? "目標トレーニング" : "Goal Trainings")
                    .font(.headline)
                    .padding(.horizontal)

                ForEach(progress.items) { item in
                    if let training = trainingById[item.trainingId] {
                        itemRow(item, training: training)
                    }
                }
            }
            .padding(.vertical)
        }
    }

    private func itemRow(_ item: TrainingGoalItemState, training: TrainingRow) -> some View {
        let locked = isTrainingLocked(training)
        return VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(training.localizedTitle(locale))
                    .font(.subheadline.weight(.semibold))
                    .fixedSize(horizontal: false, vertical: true)
                Spacer()
                if item.cleared {
                    Label(locale == .ja ? "クリア" : "Cleared", systemImage: "checkmark.circle.fill")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.green)
                }
            }
            statusView(item)
            HStack(spacing: 8) {
                Button(locale == .ja ? "練習" : "Practice") {
                    if locked { onLocked() } else { onPlay(training, true) }
                }
                .buttonStyle(.bordered)
                .lineLimit(1)
                .fixedSize()
                Button(locale == .ja ? "本番" : "Production") {
                    if locked { onLocked() } else { onPlay(training, false) }
                }
                .buttonStyle(.borderedProminent)
                .lineLimit(1)
                .fixedSize()
                Button(locale == .ja ? "記録" : "Records") {
                    onOpenRecords(training.id)
                }
                .buttonStyle(.bordered)
                .tint(.secondary)
                .lineLimit(1)
                .fixedSize()
            }
        }
        .padding()
        .background(item.cleared ? Color.green.opacity(0.12) : Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(item.cleared ? Color.green.opacity(0.4) : Color.clear, lineWidth: 1)
        )
        .padding(.horizontal)
        .opacity(locked ? 0.65 : 1)
    }

    @ViewBuilder
    private func statusView(_ item: TrainingGoalItemState) -> some View {
        if let bestRank = item.bestRank {
            TrainingBestBadgesView(
                bestScore: item.bestScore ?? 0,
                bestRank: bestRank,
                targetRank: item.targetRank,
                cleared: item.cleared,
                locale: locale,
                compact: true
            )
        } else {
            Text(locale == .ja
                 ? "未プレイ · 目標 \(item.targetRank.rawValue)"
                 : "No record yet · Target \(item.targetRank.rawValue)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}
