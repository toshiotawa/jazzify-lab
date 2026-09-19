import SwiftUI

/// フレーズディフェンスのプレイマップ（Web `DefenseMapMain` 相当）。
struct DefenseDescentView: View {
    @EnvironmentObject var appState: AppState

    @State private var blocks: [PlayMapBlock] = []
    @State private var nodes: [PlayMapNode] = []
    @State private var clears: [PlayMapNodeClear] = []
    @State private var isLoading = true
    @State private var showSubscription = false
    @State private var subscriptionEntry: SubscriptionEntry = .phraseDefense
    @State private var paywallEntryAtOpen: SubscriptionEntry = .phraseDefense
    @State private var skipSoftLandingOfferOnPaywallDismiss = false
    @State private var showSoftLandingOffer = false
    @State private var softLandingOfferCandidate: SoftLandingCandidate?
    @State private var softLandingOfferEntry: SoftLandingOfferEntry = .chapterComplete
    @State private var showBlockCompleteSheet = false

    @State private var mapTier: PlayMapTier = .basic
    @State private var pendingSelectNodeId: UUID?
    @State private var stageLaunchSession: StageLaunchSession?
    @State private var mapResultContext: MapResultContext?
    @State private var isStarting = false
    @State private var isFetchingStage = false
    @State private var lessonToOpen: LessonPlayMapLaunch?
    @State private var tutorialLaunch: TutorialLaunchContext?
    @State private var alertMessage: String?
    @State private var nextStepPrompt: NextStepPrompt?
    @State private var resultNextStepLabel: String?
    @State private var todayStreakUpdated = false

    private var locale: AppLocale { appState.locale }

    private struct StageLaunchSession: Identifiable {
        let id = UUID()
        let node: PlayMapNode
        let stage: DefenseStageDefinition
        let difficulty: DefenseDifficultyDefinition
        let practiceMode: Bool
    }

    private struct MapResultContext: Identifiable {
        let id = UUID()
        let node: PlayMapNode
        let stage: DefenseStageDefinition
        let difficulty: DefenseDifficultyDefinition
        let practiceMode: Bool
        let summary: DefenseFinishSummary
    }

    private struct TutorialLaunchContext: Identifiable {
        let id: UUID
    }

    private struct LessonPlayMapLaunch: Identifiable, Hashable {
        let id = UUID()
        let lesson: Lesson
        let playMapNodeId: UUID

        static func == (lhs: LessonPlayMapLaunch, rhs: LessonPlayMapLaunch) -> Bool {
            lhs.id == rhs.id
        }

        func hash(into hasher: inout Hasher) {
            hasher.combine(id)
        }
    }

    private struct NextStepPrompt: Identifiable {
        let id = UUID()
        let guidance: DefenseTrainingGuidance
    }

    private struct SoftLandingLessonLaunch: Identifiable, Hashable {
        let id = UUID()
        let lesson: Lesson

        static func == (lhs: SoftLandingLessonLaunch, rhs: SoftLandingLessonLaunch) -> Bool {
            lhs.id == rhs.id
        }

        func hash(into hasher: inout Hasher) {
            hasher.combine(id)
        }
    }

    @State private var softLandingLessonLaunch: SoftLandingLessonLaunch?

    var body: some View {
        ZStack {
            Color(hex: "09070f").ignoresSafeArea()

            if isLoading {
                ProgressView().tint(.green)
            } else {
                DefenseDescentMapView(
                    locale: locale,
                    isPremium: appState.isPremium,
                    mode: .defense,
                    blocks: blocks,
                    nodes: nodes,
                    clears: clears,
                    tier: $mapTier,
                    pendingSelectNodeId: $pendingSelectNodeId,
                    onSelectNode: { node, practiceMode in
                        if node.nodeKind == .tutorial {
                            tutorialLaunch = TutorialLaunchContext(id: node.id)
                        } else {
                            Task { await startStageNode(node, practiceMode: practiceMode) }
                        }
                    },
                    onSelectQuestNode: { node in
                        Task { await startQuestNode(node) }
                    },
                    onRequestUpgrade: {
                        subscriptionEntry = .phraseDefense
                        paywallEntryAtOpen = .phraseDefense
                        showSubscription = true
                    }
                )
            }

            if isStarting {
                GameLaunchLoadingOverlay(locale: locale, tint: .green, backgroundOpacity: 0.85)
            }
        }
        .navigationTitle(locale == .ja ? "フレーズディフェンス" : "Phrase Defense")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task { await reloadMap() }
        .onChange(of: appState.pendingDefenseNodeId) { nodeId in
            guard nodeId != nil else { return }
            Task { await consumePendingDefenseNodeIfNeeded() }
        }
        .onChange(of: isLoading) { loading in
            guard !loading else { return }
            Task { await consumePendingDefenseNodeIfNeeded() }
        }
        .onChange(of: stageLaunchSession?.id) { sessionId in
            if sessionId == nil {
                isStarting = false
            }
        }
        .fullScreenCover(item: $tutorialLaunch) { launch in
            DefenseTutorialView(
                playMapNodeId: launch.id,
                onExit: {
                    tutorialLaunch = nil
                    Task { await handleTutorialExit() }
                }
            )
            .environmentObject(appState)
        }
        .sheet(item: $nextStepPrompt) { prompt in
            DefenseTrainingResumeSheet(
                locale: locale,
                guidance: prompt.guidance,
                kind: .nextStep,
                todayStreakUpdated: todayStreakUpdated,
                onContinue: {
                    nextStepPrompt = nil
                    applyDefenseTrainingGuidance(prompt.guidance)
                },
                onLater: {
                    nextStepPrompt = nil
                }
            )
        }
        .fullScreenCover(item: $stageLaunchSession) { session in
            DefenseGameView(
                stage: session.stage,
                difficulty: session.difficulty,
                practiceMode: session.practiceMode,
                lessonContext: nil,
                locale: locale,
                playMapNodeId: session.node.id,
                onClose: {
                    stageLaunchSession = nil
                    Task { await reloadMap() }
                },
                onApplyPracticeModeAndRestart: { nextPracticeMode in
                    stageLaunchSession = StageLaunchSession(
                        node: session.node,
                        stage: session.stage,
                        difficulty: session.difficulty,
                        practiceMode: nextPracticeMode
                    )
                },
                onPlayMapCleared: {
                    Task { await handlePlayMapClear(session: session) }
                },
                onFinished: { summary in
                    if let block = blocks.first(where: { $0.id == session.node.blockId }) {
                        mapTier = block.tier
                    }
                    stageLaunchSession = nil
                    mapResultContext = MapResultContext(
                        node: session.node,
                        stage: session.stage,
                        difficulty: session.difficulty,
                        practiceMode: session.practiceMode,
                        summary: summary
                    )
                }
            )
            .id(session.id)
            .onAppear {
                isStarting = false
            }
        }
        .fullScreenCover(item: $mapResultContext) { context in
            DefenseResultView(
                stageTitle: context.stage.title,
                summary: context.summary,
                locale: locale,
                nextStepLabel: resultNextStepLabel,
                onNextStep: resultNextStepLabel == nil ? nil : {
                    mapResultContext = nil
                    resultNextStepLabel = nil
                    Task { await handlePerformanceNextStep() }
                },
                onRetry: {
                    mapResultContext = nil
                    resultNextStepLabel = nil
                    stageLaunchSession = StageLaunchSession(
                        node: context.node,
                        stage: context.stage,
                        difficulty: context.difficulty,
                        practiceMode: context.practiceMode
                    )
                },
                onBackToMap: {
                    mapResultContext = nil
                    resultNextStepLabel = nil
                    Task {
                        await reloadMap()
                        await maybeShowBlockCompleteSheet()
                    }
                }
            )
        }
        .fullScreenCover(item: $softLandingLessonLaunch) { launch in
            LessonDetailView(
                lesson: launch.lesson,
                autoStartFirstRequirement: true
            )
            .environmentObject(appState)
        }
        .navigationDestination(
            isPresented: Binding(
                get: { lessonToOpen != nil },
                set: { isPresented in
                    if !isPresented {
                        lessonToOpen = nil
                        Task { await reloadMap() }
                    }
                }
            )
        ) {
            if let launch = lessonToOpen {
                LessonDetailView(
                    lesson: launch.lesson,
                    playMapNodeId: launch.playMapNodeId,
                    playMapMode: .defense
                )
            }
        }
        .sheet(isPresented: $showSubscription, onDismiss: handleSubscriptionSheetDismiss) {
            SubscriptionView(
                entry: subscriptionEntry,
                onContinueFree: SoftLandingFreeTier.isSoftLandingPaywallSource(subscriptionEntry)
                    ? { handlePaywallContinueFree() }
                    : nil
            )
            .environmentObject(appState)
        }
        .sheet(isPresented: $showBlockCompleteSheet) {
            DefenseBlockCompleteSheet(
                locale: locale,
                onPremium: {
                    showBlockCompleteSheet = false
                    subscriptionEntry = .phraseDefense
                    paywallEntryAtOpen = .phraseDefense
                    showSubscription = true
                },
                onTraining: {
                    showBlockCompleteSheet = false
                    appState.requestedTab = .training
                },
                onDismiss: {
                    showBlockCompleteSheet = false
                }
            )
        }
        .sheet(isPresented: $showSoftLandingOffer) {
            if let candidate = softLandingOfferCandidate {
                SoftLandingOfferSheet(
                    locale: locale,
                    course: candidate.course,
                    onAccept: { handleSoftLandingOfferAccept(candidate) },
                    onDismiss: { handleSoftLandingOfferDismiss(candidate) }
                )
            }
        }
        .alert(
            locale == .ja ? "ステージを開始できません" : "Cannot start stage",
            isPresented: Binding(
                get: { alertMessage != nil },
                set: { if !$0 { alertMessage = nil } }
            )
        ) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(alertMessage ?? "")
        }
    }

    private func refreshTodayStreakUpdated() async {
        todayStreakUpdated = await DefenseTrainingGuidanceResolver.loadTodayStreakUpdated(
            profile: appState.profile
        )
    }

    private func resolveGuidance() -> DefenseTrainingGuidance {
        let clearedNodeIds = Set(clears.map(\.nodeId))
        return DefenseTrainingGuidanceResolver.resolve(
            isPremium: appState.isPremium,
            blocks: blocks,
            nodes: nodes,
            clearedNodeIds: clearedNodeIds,
            locale: locale
        )
    }

    private func applyDefenseTrainingGuidance(_ guidance: DefenseTrainingGuidance) {
        switch guidance {
        case .openDefense(_, let nodeId, _, _):
            appState.pendingDefenseNodeId = nodeId
            Task { await consumePendingDefenseNodeIfNeeded() }
        case .defenseBlockComplete:
            showBlockCompleteSheet = true
        case .openTraining:
            appState.requestedTab = .training
        case .none:
            break
        }
    }

    private func maybeShowBlockCompleteSheet() async {
        guard !appState.isPremium else { return }
        let guidance = resolveGuidance()
        if guidance == .defenseBlockComplete {
            showBlockCompleteSheet = true
        }
    }

    private func handleTutorialExit() async {
        await reloadMap()
        await refreshTodayStreakUpdated()
        let guidance = DefenseTrainingGuidanceResolver.resolveAfterTutorial(
            isPremium: appState.isPremium,
            blocks: blocks,
            nodes: nodes,
            clearedNodeIds: Set(clears.map(\.nodeId)),
            locale: locale
        )
        if guidance == .defenseBlockComplete {
            showBlockCompleteSheet = true
            return
        }
        guard guidance != .none else { return }
        nextStepPrompt = NextStepPrompt(guidance: guidance)
    }

    private func handlePerformanceNextStep() async {
        await reloadMap()
        let guidance = resolveGuidance()
        if case .openDefense(_, _, _, .nextStage) = guidance {
            applyDefenseTrainingGuidance(guidance)
            return
        }
        await maybeShowBlockCompleteSheet()
    }

    private func handleSubscriptionSheetDismiss() {
        let entry = paywallEntryAtOpen
        if skipSoftLandingOfferOnPaywallDismiss {
            skipSoftLandingOfferOnPaywallDismiss = false
            return
        }
        guard !appState.isPremium, SoftLandingFreeTier.isSoftLandingPaywallSource(entry) else { return }
        Task {
            guard let next = await SoftLandingOfferLoader.resolveNext(userId: appState.profile?.id) else {
                return
            }
            await MainActor.run {
                softLandingOfferCandidate = next
                softLandingOfferEntry = SoftLandingFreeTier.offerEntry(for: entry)
                if let userId = appState.profile?.id {
                    AnalyticsTracker.trackSoftLandingOfferViewed(
                        userId: userId,
                        courseId: next.course.id,
                        entry: softLandingOfferEntry.rawValue,
                        sequenceIndex: next.course.softLandingOrder ?? 0
                    )
                }
                showSoftLandingOffer = true
            }
        }
    }

    private func handlePaywallContinueFree() {
        skipSoftLandingOfferOnPaywallDismiss = true
        showSubscription = false
        startSoftLandingFromBlockComplete()
    }

    private func startSoftLandingFromBlockComplete() {
        let entry = SoftLandingOfferEntry.chapterComplete
        Task {
            guard let next = await SoftLandingOfferLoader.resolveNext(userId: appState.profile?.id) else {
                return
            }
            await MainActor.run {
                if let userId = appState.profile?.id {
                    AnalyticsTracker.trackSoftLandingOfferViewed(
                        userId: userId,
                        courseId: next.course.id,
                        entry: entry.rawValue,
                        sequenceIndex: next.course.softLandingOrder ?? 0
                    )
                    AnalyticsTracker.trackSoftLandingOfferAccepted(
                        userId: userId,
                        courseId: next.course.id,
                        entry: entry.rawValue,
                        sequenceIndex: next.course.softLandingOrder ?? 0
                    )
                }
                guard let lessonId = SoftLandingFreeTier.nextBlock1LessonId(
                    lessons: next.lessons,
                    completedIds: next.completedLessonIds
                ),
                      let lesson = next.lessons.first(where: { $0.id == lessonId }) else {
                    return
                }
                softLandingLessonLaunch = SoftLandingLessonLaunch(lesson: lesson)
            }
        }
    }

    private func handleSoftLandingOfferAccept(_ candidate: SoftLandingCandidate) {
        if let userId = appState.profile?.id {
            AnalyticsTracker.trackSoftLandingOfferAccepted(
                userId: userId,
                courseId: candidate.course.id,
                entry: softLandingOfferEntry.rawValue,
                sequenceIndex: candidate.course.softLandingOrder ?? 0
            )
        }
        showSoftLandingOffer = false
        guard let lessonId = SoftLandingFreeTier.nextBlock1LessonId(
            lessons: candidate.lessons,
            completedIds: candidate.completedLessonIds
        ),
              let lesson = candidate.lessons.first(where: { $0.id == lessonId }) else {
            return
        }
        softLandingLessonLaunch = SoftLandingLessonLaunch(lesson: lesson)
    }

    private func handleSoftLandingOfferDismiss(_ candidate: SoftLandingCandidate) {
        if let userId = appState.profile?.id {
            AnalyticsTracker.trackSoftLandingOfferDismissed(
                userId: userId,
                courseId: candidate.course.id,
                entry: softLandingOfferEntry.rawValue,
                sequenceIndex: candidate.course.softLandingOrder ?? 0
            )
        }
        GuidedSoftLandingPreferences.markSessionDismissed()
        showSoftLandingOffer = false
    }

    private func consumePendingDefenseNodeIfNeeded() async {
        guard let nodeId = appState.pendingDefenseNodeId else { return }
        guard let node = nodes.first(where: { $0.id == nodeId }) else { return }
        appState.pendingDefenseNodeId = nil
        if let block = blocks.first(where: { $0.id == node.blockId }) {
            mapTier = block.tier
        }
        switch node.nodeKind {
        case .tutorial:
            tutorialLaunch = TutorialLaunchContext(id: node.id)
        case .stage:
            pendingSelectNodeId = node.id
        case .quest:
            await startQuestNode(node)
        }
    }

    private func reloadMap() async {
        let showLoading = blocks.isEmpty
        if showLoading {
            isLoading = true
        }
        do {
            async let blocksTask = SupabaseService.shared.fetchPlayMapBlocks(mode: .defense)
            async let nodesTask = SupabaseService.shared.fetchPlayMapNodes(mode: .defense)
            async let clearsTask = SupabaseService.shared.fetchPlayMapNodeClears(mode: .defense)
            let (loadedBlocks, loadedNodes, loadedClears) = try await (blocksTask, nodesTask, clearsTask)
            blocks = loadedBlocks
            nodes = loadedNodes
            clears = loadedClears
        } catch {
            blocks = []
            nodes = []
            clears = []
        }
        isLoading = false
    }

    private func startStageNode(_ node: PlayMapNode, practiceMode: Bool) async {
        guard !isFetchingStage, !isStarting else { return }
        isFetchingStage = true
        isStarting = true
        defer {
            isFetchingStage = false
            if stageLaunchSession == nil {
                isStarting = false
            }
        }

        guard let stageId = node.defenseStageId else {
            alertMessage = locale == .ja
                ? "ステージ情報が見つかりません。"
                : "Stage information is missing."
            return
        }
        let stage: DefenseStageDefinition
        do {
            guard let fetched = try await SupabaseService.shared.fetchDefenseStageDetail(stageId: stageId),
                  !fetched.phrases.isEmpty
            else {
                alertMessage = locale == .ja
                    ? "ステージの譜面データが見つかりません。"
                    : "Stage phrase data is missing."
                return
            }
            stage = fetched
        } catch {
            alertMessage = locale == .ja
                ? "ステージ情報の読み込みに失敗しました。"
                : "Failed to load stage data."
            return
        }
        guard let difficulty = try? await SupabaseService.shared.fetchDefenseDifficultyLevel(
            level: node.resolvedDefenseDifficultyLevel(stageLevel: stage.difficultyLevel),
            attackTrigger: stage.attackTrigger
        )
        else {
            alertMessage = locale == .ja
                ? "難易度設定の読み込みに失敗しました。"
                : "Failed to load difficulty settings."
            return
        }
        if let block = blocks.first(where: { $0.id == node.blockId }) {
            mapTier = block.tier
        }
        stageLaunchSession = StageLaunchSession(
            node: node,
            stage: stage,
            difficulty: difficulty,
            practiceMode: practiceMode
        )
    }

    private func startQuestNode(_ node: PlayMapNode) async {
        guard let lessonId = node.lessonId else { return }
        if let lesson = try? await SupabaseService.shared.fetchLesson(lessonId: lessonId) {
            lessonToOpen = LessonPlayMapLaunch(lesson: lesson, playMapNodeId: node.id)
        }
    }

    private func handlePlayMapClear(session: StageLaunchSession) async {
        let node = session.node
        let stage = session.stage
        do {
            let result = try await SupabaseService.shared.recordPlayMapNodeClear(
                nodeId: node.id,
                surviveSec: stage.surviveSeconds
            )
            if result.isFirstClear {
                let award = try await SupabaseService.shared.awardPlayerXp(
                    reason: "defense_node_first_clear",
                    sourceId: node.id.uuidString,
                    amount: 80
                )
                await MainActor.run {
                    PlayerLevelHub.shared.ingestAwardResponse(award, usesEnglishUi: locale == .en)
                }
                let badges = try await SupabaseService.shared.grantUserBadgesForEvent(event: "play_map_node_clear")
                await MainActor.run {
                    PlayerLevelHub.shared.ingestAchievementBadges(badges, usesEnglishUi: locale == .en)
                }
            }
            await reloadMap()
            if !session.practiceMode {
                await refreshTodayStreakUpdated()
                resultNextStepLabel = DefenseTrainingGuidanceResolver.resultNextStepLabel(
                    for: resolveGuidance(),
                    locale: locale
                )
            } else {
                resultNextStepLabel = nil
            }
        } catch {
            /* non-fatal */
        }
    }
}
