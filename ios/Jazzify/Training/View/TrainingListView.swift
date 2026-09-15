import SwiftUI

struct TrainingListView: View {
    private let forcedTrainingId: UUID?
    private let forcedPracticeMode: Bool
    private let lessonContext: TrainingLessonContext?
    private let onLessonExit: (() -> Void)?

    @EnvironmentObject var appState: AppState
    @State private var categories: [TrainingCategoryWithTrainings] = []
    @State private var trainingById: [UUID: TrainingRow] = [:]
    @State private var summaryById: [UUID: TrainingScoreSummary] = [:]
    @State private var goalSets: [TrainingGoalSet] = []
    @State private var activeGoalSetId: UUID?
    @State private var activeDays: Set<String> = []
    @State private var todayKey = ""
    @State private var isLoading = true
    @State private var screen: TrainingScreen = .list
    @State private var activeTraining: TrainingRow?
    @State private var practiceMode = false
    @State private var finalScore = 0
    @State private var showSubscription = false
    @State private var infoCategory: TrainingCategoryRow?
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
    private var timezone: String { TrainingActivity.resolveUserTimezone(profile: appState.profile) }
    private var activeGoalSet: TrainingGoalSet? {
        TrainingGoalProgress.resolveActiveGoalSet(goalSets: goalSets, selectedGoalSetId: activeGoalSetId)
    }
    private var allTrainings: [TrainingRow] {
        categories.flatMap(\.trainings)
    }

    var body: some View {
        Group {
            switch screen {
            case .list:
                listBody
            case .goal:
                if let goalSet = activeGoalSet {
                    TrainingGoalView(
                        goalSet: goalSet,
                        summaryById: summaryById,
                        trainingById: trainingById,
                        locale: locale,
                        isTrainingLocked: isTrainingLocked,
                        onBack: { screen = .list },
                        onOpenGoals: { screen = .goals },
                        onPlay: { training, practice in presentGame(training: training, practice: practice) },
                        onOpenRecords: { trainingId in screen = .records(trainingId: trainingId) },
                        onLocked: { showSubscription = true }
                    )
                } else {
                    listBody
                }
            case .goals:
                TrainingGoalListView(
                    goalSets: goalSets,
                    activeGoalSetId: activeGoalSet?.id,
                    summaryById: summaryById,
                    locale: locale,
                    onBack: { screen = .goal },
                    onSelectGoal: { goalSetId in
                        Task { await selectGoal(goalSetId) }
                    }
                )
            case .records(let trainingId):
                TrainingRecordsView(
                    trainings: allTrainings,
                    initialTrainingId: trainingId,
                    timezone: timezone,
                    locale: locale,
                    onBack: { screen = .list }
                )
            case .calendar(let dateKey):
                TrainingCalendarView(
                    trainingById: trainingById,
                    activeDays: activeDays,
                    timezone: timezone,
                    initialDateKey: dateKey,
                    locale: locale,
                    onBack: { screen = .list }
                )
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
        .sheet(isPresented: $showSubscription) {
            SubscriptionView()
        }
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
                    if !isLessonLaunch {
                        if let goalSet = activeGoalSet {
                            let progress = TrainingGoalProgress.compute(goalSet: goalSet, summaryByTrainingId: summaryById)
                            TrainingGoalBannerView(
                                title: goalSet.localizedTitle(locale),
                                cleared: progress.cleared,
                                total: progress.total,
                                locale: locale,
                                onTap: { screen = .goal }
                            )
                        }
                        if !todayKey.isEmpty {
                            TrainingHabitSectionView(
                                todayKey: todayKey,
                                activeDays: activeDays,
                                locale: locale,
                                onOpenCalendar: { dateKey in screen = .calendar(dateKey: dateKey) }
                            )
                        }
                    }
                    ForEach(categories) { category in
                        section(category)
                    }
                }
            }
            .padding(.vertical)
        }
        .sheet(item: $infoCategory) { category in
            TrainingCategoryInfoSheet(
                title: category.localizedTitle(locale),
                description: category.localizedDescription(locale),
                locale: locale
            )
        }
    }

    @ViewBuilder
    private func section(_ category: TrainingCategoryWithTrainings) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(category.category.localizedTitle(locale))
                    .font(.headline)
                if !category.category.localizedDescription(locale).isEmpty {
                    Button {
                        infoCategory = category.category
                    } label: {
                        Image(systemName: "info.circle")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(locale == .ja ? "カテゴリ説明" : "Category info")
                }
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
                if !isLessonLaunch {
                    Button(locale == .ja ? "記録" : "Records") {
                        screen = .records(trainingId: training.id)
                    }
                    .buttonStyle(.bordered)
                    .tint(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
        .opacity(locked ? 0.65 : 1)
    }

    private func isTrainingLocked(_ training: TrainingRow) -> Bool {
        guard let category = categories.first(where: { $0.category.id == training.categoryId })?.category else {
            return false
        }
        return !category.isFree && !appState.isPremium
    }

    private func launch(_ training: TrainingRow, practice: Bool, locked: Bool) {
        if locked {
            showSubscription = true
            return
        }
        presentGame(training: training, practice: practice)
    }

    private func selectGoal(_ goalSetId: UUID) async {
        let previous = activeGoalSetId
        activeGoalSetId = goalSetId
        screen = .goal
        do {
            try await SupabaseService.shared.setMyTrainingGoal(goalSetId: goalSetId)
        } catch {
            activeGoalSetId = previous
        }
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
            let loadedCategories = try await catalog
            categories = loadedCategories
            var nextTrainingById: [UUID: TrainingRow] = [:]
            for category in loadedCategories {
                for training in category.trainings {
                    nextTrainingById[training.id] = training
                }
            }
            trainingById = nextTrainingById
            var nextSummaryById: [UUID: TrainingScoreSummary] = [:]
            for row in try await summary {
                nextSummaryById[row.trainingId] = row
            }
            summaryById = nextSummaryById
            launchForcedTrainingIfNeeded()
        } catch {
            categories = []
            trainingById = [:]
            summaryById = [:]
        }
        if !isLessonLaunch {
            await reloadGoalsAndActivity()
        }
    }

    /// 目標・本番活動日は失敗しても一覧表示を妨げない
    private func reloadGoalsAndActivity() async {
        let tz = timezone
        todayKey = TrainingActivity.localDateKey(Date(), timezone: tz)
        async let goalSetsTask = SupabaseService.shared.fetchTrainingGoalSets()
        async let goalIdTask = SupabaseService.shared.fetchMyTrainingGoalId()
        async let activityTask = SupabaseService.shared.fetchTrainingActivityDays(timezone: tz)
        goalSets = (try? await goalSetsTask) ?? []
        activeGoalSetId = (try? await goalIdTask) ?? nil
        activeDays = Set((try? await activityTask) ?? [])
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

private struct TrainingCategoryInfoSheet: View {
    let title: String
    let description: String
    let locale: AppLocale

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                Text(description)
                    .font(.body)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(locale == .ja ? "閉じる" : "Close") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
