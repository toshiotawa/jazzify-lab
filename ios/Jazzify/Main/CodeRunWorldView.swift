import SwiftUI

struct CodeRunWorldView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var blocks: [PlayMapBlock] = []
    @State private var nodes: [PlayMapNode] = []
    @State private var clears: [PlayMapNodeClear] = []
    @State private var rankThresholds: [CodeRunRankThreshold] = CodeRunRankCalculator.defaultThresholds
    @State private var isLoading = true
    @State private var showSubscription = false

    @State private var activeNode: PlayMapNode?
    @State private var activeStage: SurvivalStageDefinition?
    @State private var stageLaunchSession: StageLaunchSession?
    @State private var lessonToOpen: LessonPlayMapLaunch?

    private var locale: AppLocale { appState.locale }

    private struct StageLaunchSession: Identifiable {
        let id = UUID()
        let node: PlayMapNode
        let stage: SurvivalStageDefinition
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
            Color(hex: "020617").ignoresSafeArea()

            if isLoading {
                ProgressView().tint(.purple)
            } else {
                PlayWorldMapView(
                    mode: .codeRun,
                    locale: locale,
                    isPremium: appState.isPremium,
                    blocks: blocks,
                    nodes: nodes,
                    clears: clears,
                    rankThresholds: rankThresholds,
                    onSelectNode: { node in
                        startStageNode(node)
                    },
                    onSelectQuestNode: { node in
                        Task { await startQuestNode(node) }
                    },
                    onRequestUpgrade: { showSubscription = true }
                )
            }
        }
        .navigationTitle(locale == .ja ? "コードラン" : "Code Run")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task { await reloadMap() }
        .fullScreenCover(item: $stageLaunchSession) { session in
            SurvivalGameView(
                stage: session.stage,
                hintMode: false,
                autoRun: true,
                characterId: "fai",
                locale: locale,
                onClose: {
                    stageLaunchSession = nil
                    activeNode = nil
                    activeStage = nil
                    Task { await reloadMap() }
                },
                playMapNodeId: session.node.id,
                playMapMode: .codeRun,
                rankThresholds: rankThresholds,
                onPlayMapCleared: { elapsed in
                    Task { await handlePlayMapClear(nodeId: session.node.id, elapsedSec: elapsed) }
                },
                onPlayMapNextNode: {
                    stageLaunchSession = nil
                    Task { await goToNextNode(from: session.node) }
                }
            )
        }
        .navigationDestination(
            isPresented: Binding(
                get: { lessonToOpen != nil },
                set: { if !$0 { lessonToOpen = nil } }
            )
        ) {
            if let launch = lessonToOpen {
                LessonDetailView(
                    lesson: launch.lesson,
                    playMapNodeId: launch.playMapNodeId,
                    playMapMode: .codeRun
                )
            }
        }
        .sheet(isPresented: $showSubscription) {
            SubscriptionView(entry: .lessonList)
        }
    }

    private func reloadMap() async {
        isLoading = true
        do {
            async let blocksTask = SupabaseService.shared.fetchPlayMapBlocks(mode: .codeRun)
            async let nodesTask = SupabaseService.shared.fetchPlayMapNodes(mode: .codeRun)
            async let clearsTask = SupabaseService.shared.fetchPlayMapNodeClears(mode: .codeRun)
            async let thresholdsTask = SupabaseService.shared.fetchCodeRunRankThresholds()
            let (loadedBlocks, loadedNodes, loadedClears, loadedThresholds) = try await (
                blocksTask, nodesTask, clearsTask, thresholdsTask
            )
            blocks = loadedBlocks
            nodes = loadedNodes
            clears = loadedClears
            if !loadedThresholds.isEmpty {
                rankThresholds = loadedThresholds
            }
        } catch {
            blocks = []
            nodes = []
            clears = []
        }
        isLoading = false
    }

    private func startStageNode(_ node: PlayMapNode) {
        guard let stageNumber = node.survivalStageNumber else { return }
        let category = SurvivalMapCategory(rawValue: node.survivalMapCategory ?? "basic") ?? .basic
        guard let stage = SurvivalStageCatalog.stage(byNumber: stageNumber, in: category) else { return }
        activeNode = node
        activeStage = stage
        stageLaunchSession = StageLaunchSession(node: node, stage: stage)
    }

    private func startQuestNode(_ node: PlayMapNode) async {
        guard let lessonId = node.lessonId else { return }
        do {
            if let lesson = try await SupabaseService.shared.fetchLesson(lessonId: lessonId) {
                lessonToOpen = LessonPlayMapLaunch(lesson: lesson, playMapNodeId: node.id)
            }
        } catch {
            /* ignore */
        }
    }

    private func handlePlayMapClear(nodeId: UUID, elapsedSec: Double) async {
        let rank = CodeRunRankCalculator.scoreToRank(elapsedSec: elapsedSec, thresholds: rankThresholds)
        guard let node = activeNode,
              CodeRunRankCalculator.meetsRequirement(achieved: rank, required: node.requiredRank, thresholds: rankThresholds)
        else { return }

        do {
            let result = try await SupabaseService.shared.recordPlayMapNodeClear(
                nodeId: nodeId,
                timeSec: elapsedSec,
                rank: rank
            )
            if result.isFirstClear {
                let award = try await SupabaseService.shared.awardPlayerXp(
                    reason: "code_run_node_first_clear",
                    sourceId: nodeId.uuidString,
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

    private func goToNextNode(from node: PlayMapNode) async {
        let sameBlock = nodes
            .filter { $0.blockId == node.blockId && $0.nodeKind == .stage }
            .sorted { $0.sortOrder < $1.sortOrder }
        guard let index = sameBlock.firstIndex(where: { $0.id == node.id }),
              let next = sameBlock[safe: index + 1]
        else {
            await reloadMap()
            return
        }
        startStageNode(next)
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
