import SwiftUI

// MARK: - Stage Definitions (mirrors SurvivalStageDefinitions.ts)

enum SurvivalStageDifficulty: String, CaseIterable {
    case easy, normal, hard, extreme

    var label: String {
        switch self {
        case .easy: return "Easy"
        case .normal: return "Normal"
        case .hard: return "Hard"
        case .extreme: return "Extreme"
        }
    }

    var color: Color {
        switch self {
        case .easy: return .green
        case .normal: return .orange
        case .hard: return .red
        case .extreme: return .purple
        }
    }

    var icon: String {
        switch self {
        case .easy: return "star.fill"
        case .normal: return "flame"
        case .hard: return "flame.fill"
        case .extreme: return "bolt.fill"
        }
    }
}

struct SurvivalStage: Identifiable {
    let stageNumber: Int
    let nameJa: String
    let nameEn: String
    let difficulty: SurvivalStageDifficulty
    let chordDisplayJa: String
    let chordDisplayEn: String
    let rootPatternJa: String
    let rootPatternEn: String

    var id: Int { stageNumber }
}

private let chordTypes: [(suffix: String, ja: String, en: String, difficulty: SurvivalStageDifficulty)] = [
    ("", "メジャー", "Major", .easy),
    ("m", "マイナー", "Minor", .easy),
    ("M7", "M7", "M7", .normal),
    ("m7", "m7", "m7", .normal),
    ("7", "7", "7", .normal),
    ("m7b5", "m7b5", "m7b5", .normal),
    ("mM7", "mM7", "mM7", .normal),
    ("dim7", "dim7", "dim7", .normal),
    ("aug7", "aug7", "aug7", .normal),
    ("6", "6", "6", .normal),
    ("m6", "m6", "m6", .normal),
    ("M7(9)", "M7(9)", "M7(9)", .hard),
    ("m7(9)", "m7(9)", "m7(9)", .hard),
    ("7(9.6th)", "7(9.13)", "7(9.13)", .hard),
    ("7(b9.b6th)", "7(b9.b13)", "7(b9.b13)", .hard),
    ("6(9)", "6(9)", "6(9)", .hard),
    ("m6(9)", "m6(9)", "m6(9)", .hard),
    ("7(b9.6th)", "7(b9.13)", "7(b9.13)", .extreme),
    ("7(#9.b6th)", "7(#9.b13)", "7(#9.b13)", .extreme),
    ("m7(b5)(11)", "m7(b5)(11)", "m7(b5)(11)", .extreme),
    ("dim(M7)", "dim(M7)", "dim(M7)", .extreme),
]

private let rootPatterns: [(ja: String, en: String)] = [
    ("CDE", "CDE"),
    ("FGAB", "FGAB"),
    ("#系のみ", "Sharps"),
    ("♭系のみ", "Flats"),
    ("白鍵黒鍵全て", "All Keys"),
]

private func generateAllStages() -> [SurvivalStage] {
    var stages: [SurvivalStage] = []
    var num = 1
    for chord in chordTypes {
        for pattern in rootPatterns {
            stages.append(SurvivalStage(
                stageNumber: num,
                nameJa: "\(num). \(chord.ja) \(pattern.ja)",
                nameEn: "\(num). \(chord.en) \(pattern.en)",
                difficulty: chord.difficulty,
                chordDisplayJa: chord.ja,
                chordDisplayEn: chord.en,
                rootPatternJa: pattern.ja,
                rootPatternEn: pattern.en
            ))
            num += 1
        }
    }
    return stages
}

private let allStages = generateAllStages()

// MARK: - View

struct SurvivalView: View {
    @EnvironmentObject var appState: AppState
    @State private var faiCharacterId: String?
    @State private var clearedStages: Set<Int> = []
    @State private var selectedStage: SurvivalStage?
    @State private var isLoading = true
    @State private var showGame = false

    private var locale: AppLocale { appState.locale }

    private var stagesByDifficulty: [(SurvivalStageDifficulty, [SurvivalStage])] {
        SurvivalStageDifficulty.allCases.compactMap { diff in
            let stages = allStages.filter { $0.difficulty == diff }
            return stages.isEmpty ? nil : (diff, stages)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "0f172a").ignoresSafeArea()

                if isLoading {
                    ProgressView()
                        .tint(.purple)
                } else if !appState.isPremium {
                    lockedView
                } else {
                    stageList
                }
            }
            .navigationTitle(locale == .ja ? "サバイバル" : "Survival")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .task { await loadData() }
            .refreshable { await loadData() }
            .fullScreenCover(isPresented: $showGame) {
                if let stage = selectedStage, let charId = faiCharacterId {
                    GameWebView(
                        mode: .survivalStage(stageNumber: stage.stageNumber, characterId: charId),
                        locale: locale
                    )
                } else {
                    ZStack {
                        Color.black.ignoresSafeArea()
                        ProgressView()
                            .tint(.purple)
                    }
                    .onAppear { showGame = false }
                }
            }
        }
    }

    // MARK: - Locked

    private var lockedView: some View {
        VStack(spacing: 16) {
            Image(systemName: "lock.fill")
                .font(.system(size: 48))
                .foregroundStyle(.gray)
            Text(locale == .ja
                 ? "サバイバルモードはプレミアムプランで利用できます"
                 : "Survival mode is available with the Premium plan")
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)
        }
        .padding()
    }

    // MARK: - Stage List

    private var stageList: some View {
        ScrollView {
            VStack(spacing: 8) {
                progressHeader

                ForEach(stagesByDifficulty, id: \.0) { difficulty, stages in
                    difficultySection(difficulty: difficulty, stages: stages)
                }
            }
            .padding()
        }
    }

    private var progressHeader: some View {
        let total = allStages.count
        let cleared = clearedStages.count
        let progress = total > 0 ? Double(cleared) / Double(total) : 0

        return VStack(spacing: 8) {
            HStack {
                Text(locale == .ja ? "クリア進捗" : "Progress")
                    .font(.subheadline)
                    .foregroundStyle(.gray)
                Spacer()
                Text("\(cleared) / \(total)")
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
            }
            ProgressView(value: progress)
                .tint(.purple)
        }
        .padding(16)
        .background(Color(hex: "1e293b"))
        .cornerRadius(12)
    }

    private func difficultySection(difficulty: SurvivalStageDifficulty, stages: [SurvivalStage]) -> some View {
        let clearedCount = stages.filter { clearedStages.contains($0.stageNumber) }.count

        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: difficulty.icon)
                    .foregroundStyle(difficulty.color)
                Text(difficulty.label)
                    .font(.headline)
                    .foregroundStyle(.white)
                Spacer()
                Text("\(clearedCount)/\(stages.count)")
                    .font(.caption)
                    .foregroundStyle(.gray)
            }
            .padding(.top, 8)

            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: 8),
                GridItem(.flexible(), spacing: 8),
                GridItem(.flexible(), spacing: 8)
            ], spacing: 8) {
                ForEach(stages) { stage in
                    stageCard(stage)
                }
            }
        }
    }

    private func stageCard(_ stage: SurvivalStage) -> some View {
        let isCleared = clearedStages.contains(stage.stageNumber)
        let chordText = locale == .en ? stage.chordDisplayEn : stage.chordDisplayJa
        let rootText = locale == .en ? stage.rootPatternEn : stage.rootPatternJa

        return Button {
            selectedStage = stage
            showGame = true
        } label: {
            VStack(spacing: 4) {
                HStack(spacing: 4) {
                    Text("\(stage.stageNumber)")
                        .font(.caption2.bold())
                        .foregroundStyle(stage.difficulty.color)
                    if isCleared {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.caption2)
                            .foregroundStyle(.green)
                    }
                }

                Text(chordText)
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)

                Text(rootText)
                    .font(.system(size: 9))
                    .foregroundStyle(.gray)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .padding(.horizontal, 4)
            .background(isCleared ? stage.difficulty.color.opacity(0.15) : Color(hex: "1e293b"))
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(isCleared ? stage.difficulty.color.opacity(0.5) : Color.clear, lineWidth: 1)
            )
        }
        .disabled(faiCharacterId == nil)
    }

    // MARK: - Data

    private func loadData() async {
        isLoading = true
        defer { isLoading = false }

        guard let userId = appState.profile?.id else { return }

        async let charsTask = SupabaseService.shared.fetchSurvivalCharacters()
        async let clearsTask = SupabaseService.shared.fetchSurvivalStageClears(userId: userId)

        do {
            let characters = try await charsTask
            let fai = characters.first(where: { $0.name == "ファイ" })
                ?? characters.first(where: { $0.id.lowercased() == "fai" })
                ?? characters.first
            faiCharacterId = fai?.id

            let clears = try await clearsTask
            clearedStages = Set(clears.map(\.stageNumber))
        } catch {
            faiCharacterId = nil
            clearedStages = []
        }
    }
}
