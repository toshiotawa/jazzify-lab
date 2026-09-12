import SwiftUI

struct TrainingListView: View {
    private let forcedTrainingId: UUID?
    private let forcedPracticeMode: Bool
    private let lessonContext: TrainingLessonContext?
    private let onLessonExit: (() -> Void)?

    @EnvironmentObject var appState: AppState
    @State private var categories: [TrainingCategoryWithTrainings] = []
    @State private var summaryById: [UUID: TrainingScoreSummary] = [:]
    @State private var isLoading = true
    @State private var screen: TrainingScreen = .list
    @State private var activeTraining: TrainingRow?
    @State private var practiceMode = false
    @State private var finalScore = 0
    @State private var showSubscription = false
    @State private var playSession: TrainingPlaySession?
    @State private var didLaunchForcedTraining = false

    init(
        forcedTrainingId: UUID? = nil,
        forcedPracticeMode: Bool = false,
        lessonContext: TrainingLessonContext? = nil,
        onLessonExit: (() -> Void)? = nil
    ) {
        self.forcedTrainingId = forcedTrainingId
        self.forcedPracticeMode = forcedPracticeMode
        self.lessonContext = lessonContext
        self.onLessonExit = onLessonExit
    }

    private var locale: AppLocale { appState.locale }
    private var isLessonLaunch: Bool { lessonContext != nil }

    var body: some View {
        Group {
            switch screen {
            case .list:
                listBody
            case .ranking:
                TrainingRankingView(categories: categories) {
                    screen = .list
                }
            case .result:
                if let training = activeTraining {
                    TrainingResultView(
                        training: training,
                        score: finalScore,
                        practiceMode: practiceMode,
                        lessonContext: lessonContext,
                        locale: locale,
                        onRetry: {
                            presentGame(training: training, practice: practiceMode)
                        },
                        onRanking: {
                            activeTraining = nil
                            screen = .ranking
                        },
                        onExit: {
                            if isLessonLaunch {
                                onLessonExit?()
                            } else {
                                activeTraining = nil
                                screen = .list
                                Task { await reload() }
                            }
                        }
                    )
                }
            }
        }
        .toolbar(playSession == nil ? .visible : .hidden, for: .tabBar)
        .fullScreenCover(item: $playSession) { session in
            TrainingGameView(
                training: session.training,
                practiceMode: session.practiceMode,
                lessonContext: lessonContext,
                locale: locale,
                onClose: {
                    playSession = nil
                    if isLessonLaunch {
                        onLessonExit?()
                    } else {
                        screen = .list
                    }
                },
                onFinished: { score in
                    finalScore = score
                    activeTraining = session.training
                    practiceMode = session.practiceMode
                    screen = .result
                    playSession = nil
                }
            )
            .id(session.id)
        }
        .task { await reload() }
    }

    private var listBody: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    VStack(alignment: .leading) {
                        Text(locale == .ja ? "トレーニング" : "Training")
                            .font(.title2.bold())
                        Text(locale == .ja ? "1分間ドリル（本番でスコア記録）" : "1-minute drills (production records score)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button(locale == .ja ? "ランキング" : "Ranking") { screen = .ranking }
                        .buttonStyle(.borderedProminent)
                }
                .padding(.horizontal)

                if isLoading {
                    ProgressView().padding()
                } else {
                    ForEach(categories) { category in
                        section(category)
                    }
                }
            }
            .padding(.vertical)
        }
        .sheet(isPresented: $showSubscription) {
            SubscriptionView()
        }
    }

    @ViewBuilder
    private func section(_ category: TrainingCategoryWithTrainings) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(category.category.localizedTitle(locale))
                    .font(.headline)
                if !category.category.isFree, !appState.isPremium {
                    Text("Premium").font(.caption2).foregroundStyle(.orange)
                }
            }
            .padding(.horizontal)

            ForEach(category.trainings) { training in
                trainingRow(training, category: category.category)
            }
        }
    }

    private func trainingRow(_ training: TrainingRow, category: TrainingCategoryRow) -> some View {
        let locked = !category.isFree && !appState.isPremium
        let summary = summaryById[training.id]
        return VStack(alignment: .leading, spacing: 8) {
            Text(training.localizedTitle(locale))
                .font(.subheadline.weight(.semibold))
            if let summary {
                Text(locale == .ja
                     ? "最高 \(summary.bestScore) / \(summary.bestRank.rawValue)\(summary.rankPosition.map { " / \($0)位" } ?? "")"
                     : "Best \(summary.bestScore) / \(summary.bestRank.rawValue)\(summary.rankPosition.map { " / #\($0)" } ?? "")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            HStack {
                Button(locale == .ja ? "練習" : "Practice") {
                    launch(training, practice: true, locked: locked)
                }
                .buttonStyle(.bordered)
                Button(locale == .ja ? "本番" : "Production") {
                    launch(training, practice: false, locked: locked)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
        .opacity(locked ? 0.65 : 1)
    }

    private func launch(_ training: TrainingRow, practice: Bool, locked: Bool) {
        if locked {
            showSubscription = true
            return
        }
        presentGame(training: training, practice: practice)
    }

    private func presentGame(training: TrainingRow, practice: Bool) {
        activeTraining = training
        practiceMode = practice
        playSession = TrainingPlaySession(training: training, practiceMode: practice)
    }

    private func reload() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let catalog = SupabaseService.shared.fetchTrainingCatalog()
            async let summary = SupabaseService.shared.fetchMyTrainingSummary()
            categories = try await catalog
            var nextSummaryById: [UUID: TrainingScoreSummary] = [:]
            for row in try await summary {
                nextSummaryById[row.trainingId] = row
            }
            summaryById = nextSummaryById
            launchForcedTrainingIfNeeded()
        } catch {
            categories = []
            summaryById = [:]
        }
    }

    private func launchForcedTrainingIfNeeded() {
        guard !didLaunchForcedTraining, let forcedTrainingId else { return }
        guard let training = categories.flatMap(\.trainings).first(where: { $0.id == forcedTrainingId }) else {
            return
        }
        didLaunchForcedTraining = true
        presentGame(training: training, practice: forcedPracticeMode)
    }
}

private struct TrainingPlaySession: Identifiable {
    let id = UUID()
    let training: TrainingRow
    let practiceMode: Bool
}
