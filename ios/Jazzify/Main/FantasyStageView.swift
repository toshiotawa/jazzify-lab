import SwiftUI

struct FantasyStageView: View {
    @EnvironmentObject var appState: AppState
    @State private var stages: [FantasyStage] = []
    @State private var isLoading = true
    @State private var showGame = false
    @State private var selectedStage: FantasyStage?

    private var locale: AppLocale { appState.locale }

    private var groupedStages: [(rank: Int, stages: [FantasyStage])] {
        let grouped = Dictionary(grouping: stages) { $0.rankNumber ?? 0 }
        return grouped.sorted { $0.key < $1.key }.map { (rank: $0.key, stages: $0.value) }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "0f172a").ignoresSafeArea()

                if isLoading {
                    ProgressView()
                        .tint(.purple)
                } else if stages.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "gamecontroller")
                            .font(.system(size: 48))
                            .foregroundStyle(.gray)
                        Text(locale == .ja ? "ステージがありません" : "No stages available")
                            .foregroundStyle(.gray)
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 20) {
                            ForEach(groupedStages, id: \.rank) { group in
                                rankSection(group.rank, stages: group.stages)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle(locale == .ja ? "ファンタジー" : "Fantasy")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task { await loadStages() }
            .fullScreenCover(isPresented: $showGame) {
                if let stage = selectedStage {
                    GameWebView(
                        mode: .fantasy(stageNumber: stage.stageNumber),
                        locale: locale,
                        authToken: nil
                    )
                }
            }
        }
    }

    private func rankSection(_ rank: Int, stages: [FantasyStage]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(locale == .ja ? "ランク \(rank)" : "Rank \(rank)")
                .font(.title3.bold())
                .foregroundStyle(.white)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(stages) { stage in
                    stageCard(stage)
                }
            }
        }
    }

    private func stageCard(_ stage: FantasyStage) -> some View {
        let isLocked = !appState.isPremium && !stage.isUnlockedForFree

        return Button {
            guard !isLocked else { return }
            selectedStage = stage
            showGame = true
        } label: {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(stage.stageNumber)
                        .font(.caption.bold())
                        .foregroundStyle(.purple)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.purple.opacity(0.2))
                        .cornerRadius(4)

                    Spacer()

                    if isLocked {
                        Image(systemName: "lock.fill")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                }

                Text(stage.localizedName(locale))
                    .font(.subheadline.bold())
                    .foregroundStyle(isLocked ? .gray : .white)
                    .lineLimit(2)

                if let difficulty = stage.difficulty {
                    Text(difficulty.capitalized)
                        .font(.caption2)
                        .foregroundStyle(.gray)
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(hex: "1e293b"))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isLocked ? Color.gray.opacity(0.2) : Color.purple.opacity(0.3), lineWidth: 1)
            )
            .opacity(isLocked ? 0.6 : 1)
        }
        .disabled(isLocked)
    }

    private func loadStages() async {
        isLoading = true
        do {
            stages = try await SupabaseService.shared.fetchFantasyStages()
        } catch {
            stages = []
        }
        isLoading = false
    }
}
