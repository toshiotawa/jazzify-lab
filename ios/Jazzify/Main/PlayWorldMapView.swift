import SwiftUI

struct PlayWorldMapView: View {
    let mode: PlayMapMode
    let locale: AppLocale
    let isPremium: Bool
    let blocks: [PlayMapBlock]
    let nodes: [PlayMapNode]
    let clears: [PlayMapNodeClear]
    let rankThresholds: [CodeRunRankThreshold]
    let onSelectNode: (PlayMapNode) -> Void
    let onSelectQuestNode: (PlayMapNode) -> Void
    let onRequestUpgrade: () -> Void

    @State private var tier: PlayMapTier = .basic
    @State private var selectedNode: PlayMapNode?
    @State private var pendingLaunchNode: PlayMapNode?
    @State private var scrollOffset: CGFloat = 0

    private var isEnglishCopy: Bool { locale == .en }

    private var clearByNodeId: [UUID: PlayMapNodeClear] {
        Dictionary(uniqueKeysWithValues: clears.map { ($0.nodeId, $0) })
    }

    // RPC はクリア時のみ行を作るため「行がある = クリア済み」（quest ノードはメトリクス無し）
    private var clearedNodeIds: Set<UUID> {
        Set(clears.map(\.nodeId))
    }

    private var layout: PlayMapWorldLayout.Layout {
        PlayMapWorldLayout.build(blocks: blocks, nodes: nodes, tier: tier)
    }

    var body: some View {
        VStack(spacing: 0) {
            tierPicker
            GeometryReader { proxy in
                ScrollView {
                    ZStack(alignment: .topLeading) {
                        ForEach(layout.blocks) { blockLayout in
                            blockSection(blockLayout, viewportWidth: proxy.size.width)
                        }
                    }
                    .frame(
                        width: proxy.size.width,
                        height: layout.totalHeight * scale(for: proxy.size.width)
                    )
                    .offset(y: -scrollOffset)
                }
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            let maxY = max(0, layout.totalHeight * scale(for: proxy.size.width) - proxy.size.height)
                            scrollOffset = min(max(0, scrollOffset - value.translation.height), maxY)
                        }
                )
            }
        }
        .sheet(item: $selectedNode, onDismiss: launchPendingNodeIfNeeded) { node in
            nodeDetailSheet(node)
        }
    }

    private var tierPicker: some View {
        HStack(spacing: 8) {
            ForEach(PlayMapTier.allCases, id: \.rawValue) { tab in
                Button {
                    tier = tab
                } label: {
                    Text(tab == .basic ? "Basic" : "Advanced")
                        .font(.subheadline.bold())
                        .foregroundStyle(tier == tab ? Color(hex: "0f172a") : .white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(tier == tab ? Color.white : Color.white.opacity(0.12))
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    private func scale(for viewportWidth: CGFloat) -> CGFloat {
        max(0.45, min(1, viewportWidth / layout.logicalWidth))
    }

    @ViewBuilder
    private func blockSection(_ blockLayout: PlayMapWorldLayout.BlockLayout, viewportWidth: CGFloat) -> some View {
        let s = scale(for: viewportWidth)
        let unlocked = PlayMapWorldLayout.isBlockUnlocked(
            blockIndex: blockLayout.blockIndex,
            blockLayouts: layout.blocks,
            clearedNodeIds: clearedNodeIds,
            isPremium: isPremium
        )

        VStack(alignment: .leading, spacing: 8) {
            Text(blockLayout.block.localizedLabel(locale))
                .font(.headline)
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.top, 8)

            ForEach(blockLayout.nodes) { nodeLayout in
                let cleared = clearedNodeIds.contains(nodeLayout.node.id)
                Button {
                    handleNodeTap(nodeLayout.node, blockIndex: blockLayout.blockIndex)
                } label: {
                    HStack {
                        Image(systemName: nodeLayout.node.nodeKind == .quest ? "book.fill" : "flag.fill")
                            .foregroundStyle(cleared ? .green : .yellow)
                        Text(nodeLayout.node.localizedTitle(locale))
                            .font(.subheadline.bold())
                            .foregroundStyle(.white)
                        Spacer()
                        if cleared {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                        } else if !unlocked {
                            Image(systemName: "lock.fill")
                                .foregroundStyle(.gray)
                        }
                    }
                    .padding(12)
                    .background(Color.white.opacity(unlocked ? 0.08 : 0.04))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .buttonStyle(.plain)
                .disabled(!unlocked)
                .opacity(unlocked ? 1 : 0.55)
                .position(
                    x: viewportWidth / 2,
                    y: nodeLayout.y * s
                )
            }
        }
        .frame(width: viewportWidth, height: blockLayout.height * s, alignment: .topLeading)
        .offset(y: blockLayout.y * s)
    }

    private func handleNodeTap(_ node: PlayMapNode, blockIndex: Int) {
        let unlocked = PlayMapWorldLayout.isBlockUnlocked(
            blockIndex: blockIndex,
            blockLayouts: layout.blocks,
            clearedNodeIds: clearedNodeIds,
            isPremium: isPremium
        )
        if !unlocked {
            onRequestUpgrade()
            return
        }
        selectedNode = node
    }

    @ViewBuilder
    private func nodeDetailSheet(_ node: PlayMapNode) -> some View {
        let clear = clearByNodeId[node.id]
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text(node.localizedTitle(locale))
                    .font(.title2.bold())
                if mode == .codeRun, let rank = clear?.bestRank {
                    Text(isEnglishCopy ? "Best rank: \(rank.rawValue)" : "ベストランク: \(rank.rawValue)")
                        .foregroundStyle(.gray)
                } else if mode == .defense, let sec = clear?.bestSurviveSec {
                    Text(isEnglishCopy ? "Best survive: \(sec)s" : "ベスト生存: \(sec)秒")
                        .foregroundStyle(.gray)
                }
                Button(isEnglishCopy ? "Start" : "開始") {
                    pendingLaunchNode = node
                    selectedNode = nil
                }
                .buttonStyle(.borderedProminent)
                .tint(.purple)
                Spacer()
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(hex: "0f172a"))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(isEnglishCopy ? "Close" : "閉じる") { selectedNode = nil }
                }
            }
        }
        .presentationDetents([.medium])
    }

    private func launchPendingNodeIfNeeded() {
        guard let node = pendingLaunchNode else { return }
        pendingLaunchNode = nil
        if node.nodeKind == .quest {
            onSelectQuestNode(node)
        } else {
            onSelectNode(node)
        }
    }
}
