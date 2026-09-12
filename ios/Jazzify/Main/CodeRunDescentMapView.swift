import SwiftUI

/// コードラン草原ワールドマップ（Web `CodeRunDescentMap` 相当）。
struct CodeRunDescentMapView: View {
    let locale: AppLocale
    let isPremium: Bool
    let blocks: [PlayMapBlock]
    let nodes: [PlayMapNode]
    let clears: [PlayMapNodeClear]
    let rankThresholds: [CodeRunRankThreshold]
    let onSelectNode: (PlayMapNode) -> Void
    let onSelectQuestNode: (PlayMapNode) -> Void
    let onRequestUpgrade: () -> Void

    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    @State private var tier: PlayMapTier = .basic
    @State private var selectedNodeId: UUID?
    @State private var scrollTargetY: CGFloat?
    @State private var scrollAnimated = false
    @State private var showMobileSheet = false

    private var isEnglishCopy: Bool { locale == .en }

    private var clearedNodeIds: Set<UUID> {
        Set(clears.map(\.nodeId))
    }

    private var clearByNodeId: [UUID: PlayMapNodeClear] {
        Dictionary(uniqueKeysWithValues: clears.map { ($0.nodeId, $0) })
    }

    private var layout: DefenseDescentLayout {
        DefenseDescentLayoutBuilder.build(blocks: blocks, nodes: nodes, tier: tier)
    }

    private var frontierNodeId: UUID? {
        DefenseDescentAccess.findFrontierNodeId(
            blockLayouts: layout.blocks,
            clearedNodeIds: clearedNodeIds,
            isPremium: isPremium
        )
    }

    private var accessibleBlockIndex: Int {
        DefenseDescentAccess.accessibleBlockIndex(
            blockLayouts: layout.blocks,
            clearedNodeIds: clearedNodeIds,
            isPremium: isPremium
        )
    }

    private var selectedNode: PlayMapNode? {
        guard let selectedNodeId else { return nil }
        return nodes.first { $0.id == selectedNodeId }
    }

    private var selectedBlockIndex: Int {
        guard let selectedNodeId else { return accessibleBlockIndex }
        return layout.blocks.first(where: { block in
            block.nodes.contains(where: { $0.nodeId == selectedNodeId })
        })?.blockIndex ?? accessibleBlockIndex
    }

    private var panelBlock: DefenseDescentBlockLayout? {
        layout.blocks[safe: selectedBlockIndex] ?? layout.blocks.first
    }

    private var panelBlockClearedCount: Int {
        guard let panelBlock else { return 0 }
        return panelBlock.nodes.filter {
            $0.node.nodeKind == .stage && clearedNodeIds.contains($0.nodeId)
        }.count
    }

    private var selectedNodeUnlocked: Bool {
        guard let selectedNode else { return false }
        let blockIndex = layout.blocks.firstIndex(where: { $0.blockId == selectedNode.blockId }) ?? 0
        return DefenseDescentAccess.isBlockUnlocked(
            blockIndex: blockIndex,
            blockLayouts: layout.blocks,
            clearedNodeIds: clearedNodeIds,
            isPremium: isPremium
        )
    }

    private var startLocked: Bool {
        !isPremium && selectedBlockIndex >= 1 && !selectedNodeUnlocked
    }

    private var showSidePanelInline: Bool {
        horizontalSizeClass == .regular
    }

    var body: some View {
        VStack(spacing: 0) {
            tierPicker
            GeometryReader { proxy in
                HStack(spacing: 0) {
                    mapViewport(width: proxy.size.width - (showSidePanelInline ? 320 : 0))
                        .frame(maxWidth: .infinity, maxHeight: .infinity)

                    if showSidePanelInline {
                        sidePanel
                            .frame(width: 320)
                            .padding(.trailing, 8)
                            .padding(.vertical, 8)
                    }
                }
            }
        }
        .background(Color(hex: "120c18"))
        .sheet(isPresented: Binding(
            get: { !showSidePanelInline && showMobileSheet && selectedNode != nil },
            set: { if !$0 { showMobileSheet = false } }
        )) {
            NavigationStack {
                sidePanel
                    .navigationTitle(selectedNode?.localizedTitle(locale) ?? "")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button(isEnglishCopy ? "Close" : "閉じる") {
                                showMobileSheet = false
                            }
                        }
                    }
            }
            .presentationDetents([.medium, .large])
        }
        .onChange(of: tier) { _ in
            selectedNodeId = nil
            showMobileSheet = false
            scrollAnimated = false
            refreshScroll(scale: currentScale(for: UIScreen.main.bounds.width), animated: false)
        }
    }

    private var tierPicker: some View {
        HStack(spacing: 4) {
            ForEach(PlayMapTier.allCases, id: \.rawValue) { tab in
                Button {
                    tier = tab
                } label: {
                    Text(tab == .basic ? "Basic" : "Advanced")
                        .font(.subheadline.bold())
                        .foregroundStyle(tier == tab ? Color(hex: "0f172a") : Color(hex: "fef3c7").opacity(0.85))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                        .background(
                            tier == tab
                                ? Color(hex: "e8a040")
                                : Color.clear
                        )
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
            Spacer()
        }
        .padding(4)
        .background(Color.black.opacity(0.55))
        .overlay(
            Capsule()
                .stroke(Color(hex: "e8a040").opacity(0.25), lineWidth: 1)
        )
        .clipShape(Capsule())
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    private var sidePanel: some View {
        CodeRunDescentSidePanel(
            locale: locale,
            totalClearedCount: DefenseDescentAccess.countClearedStageNodes(
                in: layout,
                clearedNodeIds: clearedNodeIds
            ),
            totalStageNodes: DefenseDescentAccess.countStageNodes(in: layout),
            activeBlock: panelBlock,
            blockClearedCount: panelBlockClearedCount,
            selectedNode: selectedNode,
            selectedNodeCleared: selectedNode.map { clearedNodeIds.contains($0.id) } ?? false,
            selectedNodeUnlocked: selectedNodeUnlocked,
            bestRank: selectedNode.flatMap { clearByNodeId[$0.id]?.bestRank },
            rankThresholds: rankThresholds,
            startLocked: startLocked,
            onStart: handleStart,
            onRequestUpgrade: onRequestUpgrade
        )
    }

    @ViewBuilder
    private func mapViewport(width: CGFloat) -> some View {
        let mapScale = currentScale(for: width)
        let worldWidth = max(width, ceil(SurvivalDescentLayoutConstants.logicalWidth * mapScale))
        let worldHeight = ceil(layout.totalHeight * mapScale)
        let contentToken = mapScrollSignature(selectedNodeId: selectedNodeId)

        UIKitVerticalScrollView(
            contentSize: CGSize(width: worldWidth, height: worldHeight),
            scrollTargetY: $scrollTargetY,
            animated: scrollAnimated,
            contentToken: contentToken
        ) {
            CodeRunDescentMapContent(
                layout: layout,
                locale: locale,
                clearedNodeIds: clearedNodeIds,
                accessibleBlockIndex: accessibleBlockIndex,
                frontierNodeId: frontierNodeId,
                selectedNodeId: $selectedNodeId,
                worldWidth: worldWidth,
                worldHeight: worldHeight,
                scale: mapScale,
                isPremium: isPremium,
                onNodeTap: handleNodeTap
            )
        }
        .onAppear {
            refreshScroll(scale: mapScale, animated: false)
        }
        .onChange(of: contentToken) { _ in
            refreshScroll(scale: mapScale, animated: false)
        }
    }

    private func currentScale(for width: CGFloat) -> CGFloat {
        let raw = min(max(0.6, width / SurvivalDescentLayoutConstants.logicalWidth), 2.2)
        return (raw * 100).rounded() / 100
    }

    private func mapScrollSignature(selectedNodeId: UUID?) -> AnyHashable {
        var hasher = Hasher()
        hasher.combine(tier.rawValue)
        hasher.combine(accessibleBlockIndex)
        hasher.combine(frontierNodeId)
        hasher.combine(selectedNodeId)
        hasher.combine(clearedNodeIds.count)
        for id in clearedNodeIds.sorted(by: { $0.uuidString < $1.uuidString }) {
            hasher.combine(id)
        }
        return hasher.finalize()
    }

    private func refreshScroll(scale: CGFloat, animated: Bool) {
        scrollAnimated = animated
        guard let frontierNodeId,
              let pos = layout.position(for: frontierNodeId) else {
            scrollTargetY = 0
            return
        }
        scrollTargetY = ceil(pos.y * scale)
    }

    private func handleNodeTap(_ nodeId: UUID, blockIndex: Int) {
        let unlocked = DefenseDescentAccess.isBlockUnlocked(
            blockIndex: blockIndex,
            blockLayouts: layout.blocks,
            clearedNodeIds: clearedNodeIds,
            isPremium: isPremium
        )
        if !unlocked {
            if !isPremium && blockIndex >= 1 {
                onRequestUpgrade()
            }
            return
        }
        selectedNodeId = nodeId
        if !showSidePanelInline {
            showMobileSheet = true
        }
        if let pos = layout.position(for: nodeId) {
            scrollAnimated = true
            scrollTargetY = ceil(pos.y * currentScale(for: UIScreen.main.bounds.width))
        }
    }

    private func handleStart() {
        guard let selectedNode, selectedNodeUnlocked else { return }
        showMobileSheet = false
        if selectedNode.nodeKind == .quest {
            onSelectQuestNode(selectedNode)
        } else {
            onSelectNode(selectedNode)
        }
    }
}

private struct CodeRunDescentMapContent: View {
    let layout: DefenseDescentLayout
    let locale: AppLocale
    let clearedNodeIds: Set<UUID>
    let accessibleBlockIndex: Int
    let frontierNodeId: UUID?
    @Binding var selectedNodeId: UUID?
    let worldWidth: CGFloat
    let worldHeight: CGFloat
    let scale: CGFloat
    let isPremium: Bool
    let onNodeTap: (UUID, Int) -> Void

    var body: some View {
        let horizontalOffset = (worldWidth - SurvivalDescentLayoutConstants.logicalWidth * scale) / 2

        ZStack(alignment: .topLeading) {
            CodeRunSkyBackgroundView(
                widthPx: worldWidth,
                heightPx: worldHeight,
                scale: scale,
                tintBlocks: layout.blocks.map {
                    DescentMapTintBand(
                        blockKey: $0.blockKey,
                        blockIndex: $0.blockIndex,
                        startY: $0.startY,
                        endY: $0.endY
                    )
                }
            )

            ForEach(layout.blocks) { blockLayout in
                CodeRunDescentBlockContent(
                    blockLayout: blockLayout,
                    allBlockLayouts: layout.blocks,
                    clearedNodeIds: clearedNodeIds,
                    accessibleBlockIndex: accessibleBlockIndex,
                    frontierNodeId: frontierNodeId,
                    selectedNodeId: $selectedNodeId,
                    scale: scale,
                    horizontalOffset: horizontalOffset,
                    isPremium: isPremium,
                    locale: locale,
                    onNodeTap: onNodeTap
                )
            }

            ForEach(layout.blocks) { blockLayout in
                if blockLayout.blockIndex > accessibleBlockIndex {
                    CodeRunBlockDimVeil(
                        startY: blockLayout.startY,
                        endY: blockLayout.endY,
                        widthPx: worldWidth,
                        scale: scale
                    )
                }
            }

            if let frontierNodeId,
               let frontierPos = layout.position(for: frontierNodeId) {
                SurvivalDescentCharacterView(
                    xPx: frontierPos.x * scale + horizontalOffset,
                    yPx: frontierPos.y * scale,
                    scale: scale,
                    facing: frontierFacing(for: frontierNodeId),
                    animateBreathe: false
                )
            }
        }
        .frame(width: worldWidth, height: worldHeight)
    }

    private func frontierFacing(for nodeId: UUID) -> SurvivalDescentCharacterView.Facing {
        guard let frontierPos = layout.position(for: nodeId) else { return .center }
        guard let block = layout.blocks.first(where: { $0.nodes.contains(where: { $0.nodeId == nodeId }) }),
              let index = block.nodes.firstIndex(where: { $0.nodeId == nodeId }) else {
            return .center
        }
        let next = block.nodes[safe: index + 1]
        guard let next else { return .center }
        if next.x > frontierPos.x { return .right }
        if next.x < frontierPos.x { return .left }
        return .center
    }
}

private struct CodeRunDescentBlockContent: View {
    let blockLayout: DefenseDescentBlockLayout
    let allBlockLayouts: [DefenseDescentBlockLayout]
    let clearedNodeIds: Set<UUID>
    let accessibleBlockIndex: Int
    let frontierNodeId: UUID?
    @Binding var selectedNodeId: UUID?
    let scale: CGFloat
    let horizontalOffset: CGFloat
    let isPremium: Bool
    let locale: AppLocale
    let onNodeTap: (UUID, Int) -> Void

    var body: some View {
        let theme = CodeRunMapThemeCatalog.theme(for: blockLayout.blockIndex)
        let locked = blockLayout.blockIndex > accessibleBlockIndex
        let blockUnlocked = DefenseDescentAccess.isBlockUnlocked(
            blockIndex: blockLayout.blockIndex,
            blockLayouts: allBlockLayouts,
            clearedNodeIds: clearedNodeIds,
            isPremium: isPremium
        )
        let isEnglishCopy = locale == .en
        let worldLabel = "WORLD \(blockLayout.blockIndex + 1)"
        let blockLabel = isEnglishCopy ? blockLayout.labelEn : blockLayout.label

        ForEach(Array(stairConnectors.enumerated()), id: \.offset) { _, pair in
            CodeRunStairConnectorView(
                from: CGPoint(
                    x: pair.from.x + horizontalOffset / scale,
                    y: pair.from.y
                ),
                to: CGPoint(
                    x: pair.to.x + horizontalOffset / scale,
                    y: pair.to.y
                ),
                scale: scale,
                highlighted: pair.highlighted,
                dim: locked
            )
        }

        CodeRunWorldSignView(
            worldLabel: worldLabel,
            blockLabel: blockLabel,
            theme: theme,
            xPx: SurvivalDescentLayoutConstants.laneCenterX * scale + horizontalOffset,
            yPx: blockLayout.headerY * scale,
            scale: scale,
            dim: locked
        )

        ForEach(blockLayout.nodes) { nodePos in
            CodeRunIslandPlatformView(
                type: nodePos.landingType == .big ? .big : .small,
                xPx: nodePos.x * scale + horizontalOffset,
                yPx: nodePos.y * scale,
                scale: scale,
                dim: locked
            )
        }

        ForEach(blockLayout.nodes) { nodePos in
            let cleared = clearedNodeIds.contains(nodePos.nodeId)
            SurvivalDescentStageNode(
                stageNumber: 0,
                xPx: nodePos.x * scale + horizontalOffset,
                yPx: nodePos.y * scale,
                scale: scale,
                theme: SurvivalDescentThemeCatalog.theme(for: blockLayout.blockIndex),
                isCurrent: nodePos.nodeId == frontierNodeId,
                isCleared: cleared,
                isUnlocked: blockUnlocked,
                isSelected: selectedNodeId == nodePos.nodeId,
                requiresPremium: false,
                isMixed: false,
                dim: locked,
                onTap: {
                    selectedNodeId = nodePos.nodeId
                    onNodeTap(nodePos.nodeId, blockLayout.blockIndex)
                },
                displayLabel: nodePos.displayLabel
            )
        }
    }

    private struct StairPair {
        let from: CGPoint
        let to: CGPoint
        let highlighted: Bool
    }

    private var stairConnectors: [StairPair] {
        var pairs: [StairPair] = []
        let nodes = blockLayout.nodes
        for i in 0..<max(0, nodes.count - 1) {
            let a = nodes[i]
            let b = nodes[i + 1]
            let highlighted = clearedNodeIds.contains(a.nodeId)
                && !clearedNodeIds.contains(b.nodeId)
            pairs.append(
                StairPair(
                    from: CGPoint(x: a.x, y: a.y),
                    to: CGPoint(x: b.x, y: b.y),
                    highlighted: highlighted
                )
            )
        }
        return pairs
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
