import SwiftUI

/// フレーズディフェンスのプレイマップ（Web `DefenseMapMain` 相当）。
struct DefenseDescentView: View {
    @EnvironmentObject var appState: AppState

    @State private var blocks: [PlayMapBlock] = []
    @State private var nodes: [PlayMapNode] = []
    @State private var clears: [PlayMapNodeClear] = []
    @State private var isLoading = true
    @State private var showSubscription = false

    @State private var mapTier: PlayMapTier = .basic
    @State private var stagePrep: StagePrepContext?
    @State private var stageLaunchSession: StageLaunchSession?
    @State private var mapResultContext: MapResultContext?
    @State private var isStarting = false
    @State private var isFetchingStage = false
    @State private var lessonToOpen: LessonPlayMapLaunch?
    @State private var tutorialLaunch: TutorialLaunchContext?
    @State private var alertMessage: String?
    @State private var nextStepGuidance: DefenseTrainingGuidance?
    @State private var resultNextStepLabel: String?
    @State private var showNextStepSheet = false

    private var locale: AppLocale { appState.locale }

    private struct StagePrepContext: Identifiable {
        let id = UUID()
        let node: PlayMapNode
        let stage: DefenseStageDefinition
        let difficulty: DefenseDifficultyDefinition
    }

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
                    onSelectNode: { node in
                        if node.nodeKind == .tutorial {
                            tutorialLaunch = TutorialLaunchContext(id: node.id)
                        } else {
                            Task { await startStageNode(node) }
                        }
                    },
                    onSelectQuestNode: { node in
                        Task { await startQuestNode(node) }
                    },
                    onRequestUpgrade: { showSubscription = true }
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
        .confirmationDialog(
            locale == .ja ? "フレーズディフェンス" : "Phrase Defense",
            isPresented: Binding(
                get: { stagePrep != nil },
                set: { if !$0 { stagePrep = nil } }
            ),
            titleVisibility: .visible,
            presenting: stagePrep
        ) { prep in
            Button(locale == .ja ? "練習（記録なし）" : "Practice (not recorded)") {
                stagePrep = nil
                isStarting = true
                stageLaunchSession = StageLaunchSession(
                    node: prep.node,
                    stage: prep.stage,
                    difficulty: prep.difficulty,
                    practiceMode: true
                )
            }
            Button(locale == .ja ? "本番" : "Performance") {
                stagePrep = nil
                isStarting = true
                stageLaunchSession = StageLaunchSession(
                    node: prep.node,
                    stage: prep.stage,
                    difficulty: prep.difficulty,
                    practiceMode: false
                )
            }
            Button(locale == .ja ? "キャンセル" : "Cancel", role: .cancel) {
                stagePrep = nil
            }
        } message: { prep in
            Text(locale == .ja
                 ? "\(prep.stage.title) — Lv.\(prep.difficulty.level) / \(prep.stage.surviveSeconds)秒生存でクリア"
                 : "\(prep.stage.titleEn.isEmpty ? prep.stage.title : prep.stage.titleEn) — Lv.\(prep.difficulty.level) / survive \(prep.stage.surviveSeconds)s")
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
        .sheet(isPresented: $showNextStepSheet) {
            DefenseTrainingResumeSheet(
                locale: locale,
                guidance: nextStepGuidance ?? .none,
                onContinue: {
                    showNextStepSheet = false
                    if let guidance = nextStepGuidance {
                        applyDefenseTrainingGuidance(guidance)
                    }
                    nextStepGuidance = nil
                },
                onLater: {
                    showNextStepSheet = false
                    nextStepGuidance = nil
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
                    Task { await reloadMap() }
                }
            )
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
        .sheet(isPresented: $showSubscription) {
            SubscriptionView(entry: .lessonList)
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
        case .openTraining:
            appState.requestedTab = .training
        case .none:
            break
        }
    }

    private func handleTutorialExit() async {
        await reloadMap()
        let guidance = resolveGuidance()
        guard guidance != .none else { return }
        nextStepGuidance = guidance
        showNextStepSheet = true
    }

    private func handlePerformanceNextStep() async {
        await reloadMap()
        let guidance = resolveGuidance()
        guard guidance != .none else { return }
        applyDefenseTrainingGuidance(guidance)
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
            await startStageNode(node)
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

    private func startStageNode(_ node: PlayMapNode) async {
        guard !isFetchingStage, !isStarting else { return }
        isFetchingStage = true
        defer { isFetchingStage = false }

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
        stagePrep = StagePrepContext(node: node, stage: stage, difficulty: difficulty)
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
                let guidance = resolveGuidance()
                resultNextStepLabel = DefenseTrainingGuidanceResolver.primaryLabel(
                    for: guidance,
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
