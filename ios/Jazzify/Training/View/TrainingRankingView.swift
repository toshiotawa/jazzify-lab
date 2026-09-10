import SwiftUI

struct TrainingRankingView: View {
    let categories: [TrainingCategoryWithTrainings]
    let onBack: () -> Void

    @EnvironmentObject var appState: AppState
    @State private var selectedId: UUID?
    @State private var rows: [TrainingRankingEntry] = []
    @State private var myRank: Int?
    @State private var isLoading = false

    private var locale: AppLocale { appState.locale }
    private var allTrainings: [TrainingRow] {
        categories.flatMap(\.trainings)
    }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 12) {
                Picker(locale == .ja ? "トレーニング" : "Training", selection: Binding(
                    get: { selectedId ?? allTrainings.first?.id },
                    set: { selectedId = $0 }
                )) {
                    ForEach(allTrainings) { training in
                        Text(training.localizedTitle(locale)).tag(Optional(training.id))
                    }
                }
                .pickerStyle(.menu)
                .padding(.horizontal)

                if let myRank {
                    Text(locale == .ja ? "あなたの順位 … \(myRank)位" : "Your rank … #\(myRank)")
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.indigo.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .padding(.horizontal)
                }

                if isLoading {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    List(rows) { row in
                        HStack {
                            Text("#\(row.rankPosition)").frame(width: 36, alignment: .leading)
                            VStack(alignment: .leading) {
                                Text(row.nickname)
                                Text("Lv.\(row.playerLevel)").font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text("\(row.bestScore)").fontWeight(.semibold)
                            Text(row.bestRank.rawValue).fontWeight(.bold).foregroundStyle(.yellow)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle(locale == .ja ? "ランキング" : "Ranking")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(locale == .ja ? "戻る" : "Back", action: onBack)
                }
            }
            .task(id: selectedId) { await reload() }
            .onAppear {
                if selectedId == nil {
                    selectedId = allTrainings.first?.id
                }
            }
        }
    }

    private func reload() async {
        guard let selectedId else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            async let ranking = SupabaseService.shared.fetchTrainingRanking(trainingId: selectedId)
            async let summary = SupabaseService.shared.fetchMyTrainingSummary()
            rows = try await ranking
            myRank = try await summary.first(where: { $0.trainingId == selectedId })?.rankPosition
        } catch {
            rows = []
            myRank = nil
        }
    }
}
