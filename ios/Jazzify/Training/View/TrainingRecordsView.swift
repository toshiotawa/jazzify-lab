import SwiftUI

/// トレーニング別・月別の本番ハイスコア推移（折れ線）
struct TrainingRecordsView: View {
    let trainings: [TrainingRow]
    let initialTrainingId: UUID?
    let timezone: String
    let locale: AppLocale
    let onBack: () -> Void

    @State private var selectedTrainingId: UUID?
    @State private var months: [String] = []
    @State private var selectedMonth: String = ""
    @State private var dailyBests: [TrainingDailyBest] = []
    @State private var isLoading = true

    private struct DailyBestsQuery: Equatable {
        let trainingId: UUID?
        let month: String
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Button(locale == .ja ? "← 戻る" : "← Back", action: onBack)
                    .font(.subheadline)

                Text(locale == .ja ? "トレーニング記録" : "Training Records")
                    .font(.title2.bold())

                Picker(locale == .ja ? "トレーニング" : "Training", selection: $selectedTrainingId) {
                    ForEach(trainings) { training in
                        Text(training.localizedTitle(locale)).tag(Optional(training.id))
                    }
                }
                .pickerStyle(.menu)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))

                Picker(locale == .ja ? "月" : "Month", selection: $selectedMonth) {
                    ForEach(months, id: \.self) { month in
                        Text(TrainingActivity.monthLabel(month, locale: locale)).tag(month)
                    }
                }
                .pickerStyle(.menu)
                .disabled(months.isEmpty)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))

                if isLoading {
                    ProgressView().frame(maxWidth: .infinity).padding()
                } else if months.isEmpty {
                    Text(locale == .ja ? "本番の記録がまだありません。" : "No production records yet.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .padding()
                } else {
                    TrainingLineChartView(
                        points: dailyBests,
                        daysInMonth: daysInSelectedMonth,
                        locale: locale
                    )
                    .frame(height: 240)
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            .padding()
        }
        .onAppear {
            if selectedTrainingId == nil {
                selectedTrainingId = initialTrainingId ?? trainings.first?.id
            }
        }
        .task(id: selectedTrainingId) { await loadMonths() }
        .task(id: DailyBestsQuery(trainingId: selectedTrainingId, month: selectedMonth)) { await loadDailyBests() }
    }

    private var daysInSelectedMonth: Int {
        guard let range = TrainingActivity.monthRange(monthKey: selectedMonth),
              let last = Int(range.to.suffix(2))
        else { return 31 }
        return last
    }

    private func loadMonths() async {
        guard let trainingId = selectedTrainingId else {
            if trainings.isEmpty { isLoading = false }
            return
        }
        isLoading = true
        do {
            let rows = try await SupabaseService.shared.fetchTrainingRecordMonths(timezone: timezone, trainingId: trainingId)
            guard !Task.isCancelled else { return }
            months = rows
            if !rows.contains(selectedMonth) {
                selectedMonth = rows.first ?? ""
            }
        } catch {
            guard !Task.isCancelled else { return }
            months = []
            selectedMonth = ""
        }
        isLoading = false
    }

    private func loadDailyBests() async {
        guard let trainingId = selectedTrainingId,
              !selectedMonth.isEmpty,
              let range = TrainingActivity.monthRange(monthKey: selectedMonth)
        else {
            dailyBests = []
            return
        }
        do {
            let rows = try await SupabaseService.shared.fetchTrainingDailyBests(
                timezone: timezone,
                from: range.from,
                to: range.to,
                trainingId: trainingId
            )
            guard !Task.isCancelled else { return }
            dailyBests = rows
        } catch {
            guard !Task.isCancelled else { return }
            dailyBests = []
        }
    }
}

/// 日付（1〜月末）を X 軸、スコアを Y 軸にした折れ線チャート
struct TrainingLineChartView: View {
    let points: [TrainingDailyBest]
    let daysInMonth: Int
    let locale: AppLocale

    private static let leftInset: CGFloat = 28
    private static let bottomInset: CGFloat = 18
    private static let topInset: CGFloat = 8

    var body: some View {
        let maxScore = max(10, ((points.map(\.bestScore).max() ?? 0) + 9) / 10 * 10)
        Canvas { context, size in
            let plotWidth = size.width - Self.leftInset
            let plotHeight = size.height - Self.bottomInset - Self.topInset
            guard plotWidth > 0, plotHeight > 0 else { return }

            func x(forDay day: Int) -> CGFloat {
                guard daysInMonth > 1 else { return Self.leftInset }
                return Self.leftInset + plotWidth * CGFloat(day - 1) / CGFloat(daysInMonth - 1)
            }
            func y(forScore score: Int) -> CGFloat {
                Self.topInset + plotHeight * (1 - CGFloat(score) / CGFloat(maxScore))
            }

            // Y グリッド（0, 半分, 最大）
            for score in [0, maxScore / 2, maxScore] {
                let yPos = y(forScore: score)
                var grid = Path()
                grid.move(to: CGPoint(x: Self.leftInset, y: yPos))
                grid.addLine(to: CGPoint(x: size.width, y: yPos))
                context.stroke(grid, with: .color(.secondary.opacity(0.25)), lineWidth: 1)
                context.draw(
                    Text("\(score)").font(.system(size: 9)).foregroundColor(.secondary),
                    at: CGPoint(x: Self.leftInset - 6, y: yPos),
                    anchor: .trailing
                )
            }

            // X ラベル（1, 10, 20, 月末）
            for day in [1, 10, 20, daysInMonth] where day <= daysInMonth {
                context.draw(
                    Text("\(day)").font(.system(size: 9)).foregroundColor(.secondary),
                    at: CGPoint(x: x(forDay: day), y: size.height - 4),
                    anchor: .bottom
                )
            }

            guard !points.isEmpty else {
                context.draw(
                    Text(locale == .ja ? "この月の記録はありません" : "No records this month")
                        .font(.caption)
                        .foregroundColor(.secondary),
                    at: CGPoint(x: Self.leftInset + plotWidth / 2, y: Self.topInset + plotHeight / 2)
                )
                return
            }

            var line = Path()
            var first = true
            for point in points {
                guard let day = Int(point.day.suffix(2)) else { continue }
                let position = CGPoint(x: x(forDay: day), y: y(forScore: point.bestScore))
                if first {
                    line.move(to: position)
                    first = false
                } else {
                    line.addLine(to: position)
                }
            }
            context.stroke(line, with: .color(.indigo), style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))

            for point in points {
                guard let day = Int(point.day.suffix(2)) else { continue }
                let position = CGPoint(x: x(forDay: day), y: y(forScore: point.bestScore))
                let dot = Path(ellipseIn: CGRect(x: position.x - 3.5, y: position.y - 3.5, width: 7, height: 7))
                context.fill(dot, with: .color(.indigo))
            }
        }
        .accessibilityLabel(locale == .ja ? "スコア推移グラフ" : "Score trend chart")
    }
}
