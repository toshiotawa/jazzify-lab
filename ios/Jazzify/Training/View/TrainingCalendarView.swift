import SwiftUI

/// 月カレンダー（日曜始まり）と選択日の本番ハイスコア一覧
struct TrainingCalendarView: View {
    let trainingById: [UUID: TrainingRow]
    let activeDays: Set<String>
    let timezone: String
    let initialDateKey: String
    let locale: AppLocale
    let onBack: () -> Void

    @State private var monthKey: String = ""
    @State private var selectedDateKey: String = ""
    @State private var dayRecords: [TrainingDailyBest] = []

    var body: some View {
        let weeks = TrainingActivity.buildMonthCalendar(monthKey: monthKey)
        let weekdayLabels = TrainingActivity.weekdayLabels(locale)

        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Button(locale == .ja ? "← 戻る" : "← Back", action: onBack)
                    .font(.subheadline)

                HStack {
                    Text(locale == .ja ? "トレーニングカレンダー" : "Training Calendar")
                        .font(.title2.bold())
                    Spacer()
                }

                HStack {
                    Button {
                        monthKey = TrainingActivity.shiftMonth(monthKey, by: -1)
                    } label: {
                        Image(systemName: "chevron.left")
                    }
                    .buttonStyle(.bordered)
                    .accessibilityLabel(locale == .ja ? "前の月" : "Previous month")
                    Spacer()
                    Text(TrainingActivity.monthLabel(monthKey, locale: locale))
                        .font(.headline)
                    Spacer()
                    Button {
                        monthKey = TrainingActivity.shiftMonth(monthKey, by: 1)
                    } label: {
                        Image(systemName: "chevron.right")
                    }
                    .buttonStyle(.bordered)
                    .accessibilityLabel(locale == .ja ? "次の月" : "Next month")
                }

                VStack(spacing: 6) {
                    HStack(spacing: 4) {
                        ForEach(weekdayLabels, id: \.self) { label in
                            Text(label)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity)
                        }
                    }
                    ForEach(Array(weeks.enumerated()), id: \.offset) { _, week in
                        HStack(spacing: 4) {
                            ForEach(week) { cell in
                                dayCell(cell)
                            }
                        }
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))

                VStack(alignment: .leading, spacing: 10) {
                    Text(selectedDateKey)
                        .font(.headline)
                    if dayRecords.isEmpty {
                        Text(locale == .ja ? "この日の記録はありません。" : "No training records on this day.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(dayRecords, id: \.trainingId) { record in
                            if let training = trainingById[record.trainingId] {
                                HStack {
                                    Text(training.localizedTitle(locale))
                                        .font(.subheadline)
                                    Spacer()
                                    TrainingBestBadgesView(
                                        bestScore: record.bestScore,
                                        bestRank: record.bestRank,
                                        locale: locale,
                                        compact: true
                                    )
                                }
                            }
                        }
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding()
        }
        .onAppear {
            if selectedDateKey.isEmpty {
                selectedDateKey = initialDateKey
                monthKey = TrainingActivity.monthKey(fromDateKey: initialDateKey)
            }
        }
        .task(id: selectedDateKey) { await loadDayRecords() }
    }

    @ViewBuilder
    private func dayCell(_ cell: TrainingCalendarDayCell) -> some View {
        if let key = cell.key, let day = cell.dayOfMonth {
            let active = activeDays.contains(key)
            let selected = key == selectedDateKey
            Button {
                selectedDateKey = key
            } label: {
                VStack(spacing: 2) {
                    Text("\(day)")
                        .font(.subheadline)
                        .monospacedDigit()
                    Image(systemName: "circle.fill")
                        .font(.system(size: 6))
                        .foregroundStyle(active ? Color.green : Color.clear)
                }
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(selected ? Color.indigo : Color(.tertiarySystemBackground))
                .foregroundStyle(selected ? Color.white : Color.primary)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(key)\(active ? (locale == .ja ? " プレイ済み" : " played") : "")")
        } else {
            Color.clear.frame(maxWidth: .infinity, minHeight: 44)
        }
    }

    private func loadDayRecords() async {
        guard !selectedDateKey.isEmpty else { return }
        do {
            let rows = try await SupabaseService.shared.fetchTrainingDailyBests(
                timezone: timezone,
                from: selectedDateKey,
                to: selectedDateKey,
                trainingId: nil
            )
            guard !Task.isCancelled else { return }
            dayRecords = rows
        } catch {
            guard !Task.isCancelled else { return }
            dayRecords = []
        }
    }
}
