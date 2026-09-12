import SwiftUI

/// フレーズディフェンスのプレイマップ（Web `DefenseMapMain` 相当）。
struct DefenseDescentView: View {
    @EnvironmentObject var appState: AppState

    @State private var blocks: [PlayMapBlock] = []
    @State private var nodes: [PlayMapNode] = []
    @State private var clears: [PlayMapNodeClear] = []
    @State private var isLoading = true
    @State private var showSubscription = false

    @State private var stageLaunchSession: StageLaunchSession?
    @State private var isStarting = false
    @State private var lessonToOpen: LessonPlayMapLaunch?
    @State private var alertMessage: String?

    private var locale: AppLocale { appState.locale }

    private struct StageLaunchSession: Identifiable {
        let id = UUID()
        let node: PlayMapNode
        let stage: DefenseStageDefinition
        let difficulty: DefenseDifficultyDefinition
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
                    blocks: blocks,
                    nodes: nodes,
                    clears: clears,
                    onSelectNode: { node in
                        Task { await startStageNode(node) }
                    },
                    onSelectQuestNode: { node in
                        Task { await startQuestNode(node) }
                    },
                    onRequestUpgrade: { showSubscription = true }
                )
            }

            if isStarting {
                Color.black.opacity(0.35).ignoresSafeArea()
                ProgressView()
                    .tint(.green)
            }
        }
        .navigationTitle(locale == .ja ? "フレーズディフェンス" : "Phrase Defense")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task { await reloadMap() }
        .fullScreenCover(item: $stageLaunchSession) { session in
            DefenseGameView(
                stage: session.stage,
                difficulty: session.difficulty,
                practiceMode: false,
                lessonContext: nil,
                locale: locale,
                playMapNodeId: session.node.id,
                onClose: {
                    stageLaunchSession = nil
                    Task { await reloadMap() }
                },
                onPlayMapCleared: {
                    Task { await handlePlayMapClear(session: session) }
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
        guard !isStarting else { return }
        isStarting = true
        defer { isStarting = false }

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
        guard let difficulty = try? await SupabaseService.shared.fetchDefenseDifficultyLevel(level: stage.difficultyLevel)
        else {
            alertMessage = locale == .ja
                ? "難易度設定の読み込みに失敗しました。"
                : "Failed to load difficulty settings."
            return
        }
        stageLaunchSession = StageLaunchSession(node: node, stage: stage, difficulty: difficulty)
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
        } catch {
            /* non-fatal */
        }
    }
}
