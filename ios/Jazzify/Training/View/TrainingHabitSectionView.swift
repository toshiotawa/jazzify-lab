import SwiftUI

/// 今週の習慣（週3日目標ドーナツ・日曜始まりの週・連続日数）
struct TrainingHabitSectionView: View {
    let todayKey: String
    let activeDays: Set<String>
    let locale: AppLocale
    let onOpenCalendar: (String) -> Void

    var body: some View {
        let week = TrainingActivity.sundayStartWeek(todayKey: todayKey)
        let activeThisWeek = TrainingActivity.countActiveDays(in: week, activeDays: activeDays)
        let streak = TrainingActivity.computeStreak(activeDays: activeDays, todayKey: todayKey)
        let percent = TrainingActivity.weeklyGoalPercent(activeDaysThisWeek: activeThisWeek)
        let weekdayLabels = TrainingActivity.weekdayLabels(locale)

        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 16) {
                TrainingDonutView(percent: percent)
                VStack(alignment: .leading, spacing: 4) {
                    Text(locale == .ja
                         ? "今週 \(activeThisWeek)/\(TrainingActivity.weeklyTarget)"
                         : "This week \(activeThisWeek)/\(TrainingActivity.weeklyTarget)")
                        .font(.subheadline.weight(.semibold))
                    Text(locale == .ja ? "目標: 週3日" : "Goal: 3 days per week")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(locale == .ja ? "\(streak)日連続" : "\(streak)-day streak")
                        .font(.subheadline)
                        .foregroundStyle(.indigo)
                        .padding(.top, 4)
                }
                Spacer()
                Button {
                    onOpenCalendar(todayKey)
                } label: {
                    HStack(spacing: 2) {
                        Text(locale == .ja ? "カレンダーを開く" : "Open calendar")
                        Image(systemName: "chevron.right")
                            .font(.caption2.weight(.semibold))
                    }
                    .font(.caption)
                    .foregroundStyle(.indigo)
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 6) {
                ForEach(week) { cell in
                    let active = activeDays.contains(cell.key)
                    let isToday = cell.key == todayKey
                    Button {
                        onOpenCalendar(cell.key)
                    } label: {
                        VStack(spacing: 4) {
                            Text(weekdayLabels[cell.weekdayIndex])
                                .font(.system(size: 10))
                                .foregroundStyle(.secondary)
                            Text("\(cell.dayOfMonth)")
                                .font(.subheadline.weight(.semibold))
                                .monospacedDigit()
                            Image(systemName: active ? "circle.fill" : "circle")
                                .font(.system(size: 8))
                                .foregroundStyle(active ? Color.green : Color.secondary.opacity(0.4))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color(.tertiarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(isToday ? Color.indigo.opacity(0.7) : Color.clear, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(cell.key)\(active ? (locale == .ja ? " プレイ済み" : " played") : "")")
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .padding(.horizontal)
    }
}
