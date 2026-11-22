import SwiftUI

struct DefenseEndlessRankingView: View {
    let locale: AppLocale
    let stageNodes: [PlayMapNode]
    let initialNodeId: UUID
    let onBack: () -> Void

    @State private var selectedNodeId: UUID
    @State private var rows: [DefenseEndlessRankingEntry] = []
    @State private var myRank: Int?
    @State private var loading = false

    init(
        locale: AppLocale,
        stageNodes: [PlayMapNode],
        initialNodeId: UUID,
        onBack: @escaping () -> Void
    ) {
        self.locale = locale
        self.stageNodes = stageNodes.filter { $0.nodeKind == .stage && $0.defenseStageId != nil }
        self.initialNodeId = initialNodeId
        self.onBack = onBack
        _selectedNodeId = State(initialValue: initialNodeId)
    }

    private var isEnglishCopy: Bool { locale == .en }

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Picker(isEnglishCopy ? "Stage" : "ステージ", selection: $selectedNodeId) {
                    ForEach(stageNodes) { node in
                        Text(node.localizedTitle(locale)).tag(node.id)
                    }
                }
                .pickerStyle(.menu)

                if loading {
                    ProgressView()
                } else {
                    List(rows) { row in
                        HStack {
                            Text("\(row.rankPosition)")
                                .font(.caption.monospacedDigit())
                                .frame(width: 28, alignment: .trailing)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(row.nickname.isEmpty ? "—" : row.nickname)
                                    .font(.subheadline)
                                Text("Lv.\(row.playerLevel)")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text(DefenseCallResponseTier.formatStarRank(row.starRank))
                                .font(.caption)
                            Text("\(row.enemiesDefeated)")
                                .font(.subheadline.monospacedDigit())
                                .frame(minWidth: 36, alignment: .trailing)
                        }
                    }
                    .listStyle(.plain)
                }

                if let myRank {
                    Text(isEnglishCopy
                         ? "Your rank: #\(myRank)"
                         : "自分の順位: \(myRank)位")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
            .navigationTitle(isEnglishCopy ? "Endless Ranking" : "エンドレスランキング")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(isEnglishCopy ? "Back" : "戻る", action: onBack)
                }
            }
            .task(id: selectedNodeId) {
                await loadRanking()
            }
        }
    }

    private func loadRanking() async {
        loading = true
        defer { loading = false }
        do {
            async let ranking = SupabaseService.shared.fetchDefenseEndlessRanking(nodeId: selectedNodeId)
            async let summary = SupabaseService.shared.fetchMyDefenseEndlessSummary()
            let (fetchedRows, mySummary) = try await (ranking, summary)
            rows = fetchedRows
            myRank = mySummary.first(where: { $0.nodeId == selectedNodeId })?.rankPosition
        } catch {
            rows = []
            myRank = nil
        }
    }
}