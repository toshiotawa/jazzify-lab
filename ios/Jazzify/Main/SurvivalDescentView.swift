import SwiftUI

/// 魔王城降下マップ ネイティブ版
/// - Web 版 `SurvivalDescentMap.tsx` の座標系を `SurvivalDescentLayoutBuilder` で再現する
/// - `.position()` 配置のコンテンツに対する `ScrollViewReader.scrollTo` の不安定さを避けるため、
///   `UIKitVerticalScrollView`（UIScrollView + UIHostingController）でラップし、
///   フロンティア位置へ contentOffset を直接指定してスクロールする
struct SurvivalDescentView: View {
    @EnvironmentObject var appState: AppState

    let currentStageNumber: Int
    let clearedStages: Set<Int>
    @Binding var selectedStageNumber: Int?

    let freeStageNumbers: Set<Int>
    let playLockedForUpsell: Bool
    /// 表示対象マップ。Web 版 `SurvivalDescentMap` の `mapCategory` と同義。
    let mapCategory: SurvivalMapCategory

    let onStageSelect: (SurvivalStageDefinition) -> Void

    @State private var scrollTargetY: CGFloat?
    @State private var scrollAnimated: Bool = false
    @State private var didInitialScroll: Bool = false
    @State private var viewport: UIKitVerticalViewport = .zero

    private let logicalCullMargin: CGFloat = 640

    private var blocks: [SurvivalBlockMeta] { SurvivalStageCatalog.blocks(in: mapCategory) }

    /// カタログ再構築後も常に最新座標を参照する（`SurvivalDescentLayoutBuilder` 内キャッシュで build は軽量）。
    private var layout: SurvivalDescentLayout {
        SurvivalDescentLayoutBuilder.build(blocks: blocks)
    }

    private var catalogSignature: String {
        SurvivalDescentLayoutBuilder.blocksSignature(for: blocks)
    }

    private var locale: AppLocale { appState.locale }

    private var frontierStageNumber: Int {
        let total = SurvivalStageCatalog.totalStages(in: mapCategory)
        let upper = Swift.max(1, total)
        for n in 1...upper {
            if isStageUnlocked(n) && !clearedStages.contains(n) {
                return n
            }
        }
        return upper
    }

    private var accessibleBlockIndex: Int {
        SurvivalDescentAccess.accessibleBlockIndex(
            blocks: blocks,
            currentStageNumber: frontierStageNumber,
            clearedStages: clearedStages
        )
    }

    private func isStageUnlocked(_ stageNumber: Int) -> Bool {
        if stageNumber == 1 { return true }
        return clearedStages.contains(stageNumber - 1)
    }

    private func block(forBlockIndex index: Int) -> SurvivalBlockMeta? {
        blocks.first { $0.blockIndex == index }
    }

    private func isMixed(_ stageNumber: Int) -> Bool {
        SurvivalStageCatalog.stage(byNumber: stageNumber, in: mapCategory)?.isMixedStage ?? false
    }

    private func blockAllCleared(_ meta: SurvivalBlockMeta) -> Bool {
        !meta.stageNumbers.isEmpty && meta.stageNumbers.allSatisfy { clearedStages.contains($0) }
    }

    private func visibleBlockLayouts(scale: CGFloat, fallbackViewportHeight: CGFloat) -> [SurvivalDescentBlockLayout] {
        let safeScale = max(scale, 0.001)
        let viewportHeight = max(1, viewport.height > 0 ? viewport.height : fallbackViewportHeight)

        let logicalMinY = max(0, viewport.offsetY / safeScale - logicalCullMargin)
        let logicalMaxY = viewport.offsetY / safeScale + viewportHeight / safeScale + logicalCullMargin

        var visible = layout.blocks.filter {
            $0.endY >= logicalMinY && $0.startY <= logicalMaxY
        }

        var seen = Set(visible.map(\.blockKey))
        for stageNumber in [frontierStageNumber, selectedStageNumber].compactMap({ $0 }) {
            if let block = layout.blockLayout(for: stageNumber),
               seen.insert(block.blockKey).inserted {
                visible.append(block)
            }
        }

        visible.sort { $0.blockIndex < $1.blockIndex }
        return visible
    }

    /// フロンティアキャラクターの向き (次に進むステージの方向を見る)
    private var frontierFacing: SurvivalDescentCharacterView.Facing {
        let current = frontierStageNumber
        guard let currentPos = layout.position(for: current) else { return .right }
        if let nextPos = layout.position(for: current + 1) {
            if abs(nextPos.x - SurvivalDescentLayoutConstants.laneCenterX) < 0.5 {
                return .center
            }
            if nextPos.x > currentPos.x + 0.5 { return .right }
            if nextPos.x < currentPos.x - 0.5 { return .left }
        }
        if abs(currentPos.x - SurvivalDescentLayoutConstants.laneCenterX) < 0.5 {
            return .center
        }
        return .right
    }

    private func refreshScrollIfLayoutReady(scale: CGFloat, animated: Bool) {
        guard layout.totalHeight > 0, layout.position(for: frontierStageNumber) != nil else { return }
        requestScrollToFrontier(scale: scale, animated: animated)
    }

    // MARK: - Body

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let mapScale = min(max(0.6, width / SurvivalDescentLayoutConstants.logicalWidth), 2.2)
            let worldWidth = max(width, SurvivalDescentLayoutConstants.logicalWidth * mapScale)
            let worldHeight = layout.totalHeight * mapScale

            let visibleBlocks = visibleBlockLayouts(
                scale: mapScale,
                fallbackViewportHeight: proxy.size.height
            )

            UIKitVerticalScrollView(
                contentSize: CGSize(width: worldWidth, height: worldHeight),
                scrollTargetY: $scrollTargetY,
                viewport: $viewport,
                animated: scrollAnimated
            ) {
                SurvivalDescentMapContent(
                    layout: layout,
                    blocks: blocks,
                    mapCategory: mapCategory,
                    locale: locale,
                    clearedStages: clearedStages,
                    freeStageNumbers: freeStageNumbers,
                    playLockedForUpsell: playLockedForUpsell,
                    accessibleBlockIndex: accessibleBlockIndex,
                    frontierStageNumber: frontierStageNumber,
                    frontierFacing: frontierFacing,
                    selectedStageNumber: $selectedStageNumber,
                    visibleBlocks: visibleBlocks,
                    worldWidth: worldWidth,
                    worldHeight: worldHeight,
                    scale: mapScale,
                    isStageUnlocked: isStageUnlocked,
                    isMixed: isMixed,
                    blockAllCleared: blockAllCleared,
                    blockLabel: blockLabel,
                    depthLabel: depthLabel,
                    block: block(forBlockIndex:),
                    onStageSelect: onStageSelect
                )
            }
            .onAppear {
                refreshScrollIfLayoutReady(scale: mapScale, animated: false)
            }
            .onChange(of: catalogSignature) { _ in
                didInitialScroll = false
                refreshScrollIfLayoutReady(scale: mapScale, animated: false)
            }
            .onChange(of: clearedStages) { _ in
                refreshScrollIfLayoutReady(scale: mapScale, animated: false)
            }
            .onChange(of: worldHeight) { _ in
                if !didInitialScroll {
                    refreshScrollIfLayoutReady(scale: mapScale, animated: false)
                }
            }
            .onChange(of: frontierStageNumber) { _ in
                requestScrollToFrontier(scale: mapScale, animated: false)
            }
            .onChange(of: selectedStageNumber) { target in
                guard let target,
                      let pos = layout.position(for: target) else { return }
                scrollAnimated = false
                scrollTargetY = pos.y * mapScale
            }
            .onChange(of: mapCategory) { _ in
                didInitialScroll = false
                refreshScrollIfLayoutReady(scale: mapScale, animated: false)
            }
        }
    }

    private func blockLabel(for block: SurvivalBlockMeta) -> String {
        block.localizedLabel(locale)
    }

    private func depthLabel(for blockIndex: Int) -> String {
        locale == .en ? "FLOOR \(blockIndex + 1)" : "第\(blockIndex + 1)階層"
    }

    // MARK: - Scroll

    private func requestScrollToFrontier(scale: CGFloat, animated: Bool) {
        let target = frontierStageNumber
        let targetY: CGFloat = {
            if let pos = layout.position(for: target) {
                return pos.y * scale
            }
            return 0
        }()
        scrollAnimated = animated
        scrollTargetY = targetY
        didInitialScroll = true
    }
}

// MARK: - Map content

private struct SurvivalDescentMapContent: View {
    let layout: SurvivalDescentLayout
    let blocks: [SurvivalBlockMeta]
    let mapCategory: SurvivalMapCategory
    let locale: AppLocale
    let clearedStages: Set<Int>
    let freeStageNumbers: Set<Int>
    let playLockedForUpsell: Bool
    let accessibleBlockIndex: Int
    let frontierStageNumber: Int
    let frontierFacing: SurvivalDescentCharacterView.Facing
    @Binding var selectedStageNumber: Int?
    let visibleBlocks: [SurvivalDescentBlockLayout]
    let worldWidth: CGFloat
    let worldHeight: CGFloat
    let scale: CGFloat
    let isStageUnlocked: (Int) -> Bool
    let isMixed: (Int) -> Bool
    let blockAllCleared: (SurvivalBlockMeta) -> Bool
    let blockLabel: (SurvivalBlockMeta) -> String
    let depthLabel: (Int) -> String
    let block: (Int) -> SurvivalBlockMeta?
    let onStageSelect: (SurvivalStageDefinition) -> Void

    var body: some View {
        let horizontalOffset = (worldWidth - SurvivalDescentLayoutConstants.logicalWidth * scale) / 2

        ZStack(alignment: .topLeading) {
            SurvivalDescentBackgroundView(
                widthPx: worldWidth,
                heightPx: worldHeight,
                scale: scale,
                tintBlocks: visibleBlocks,
                accessibleBlockIndex: accessibleBlockIndex
            )

            ForEach(visibleBlocks) { blockLayout in
                if let meta = block(blockLayout.blockIndex) {
                    SurvivalDescentMapBlockContent(
                        meta: meta,
                        blockLayout: blockLayout,
                        blocks: blocks,
                        mapCategory: mapCategory,
                        clearedStages: clearedStages,
                        freeStageNumbers: freeStageNumbers,
                        playLockedForUpsell: playLockedForUpsell,
                        accessibleBlockIndex: accessibleBlockIndex,
                        frontierStageNumber: frontierStageNumber,
                        selectedStageNumber: $selectedStageNumber,
                        scale: scale,
                        horizontalOffset: horizontalOffset,
                        worldWidth: worldWidth,
                        isStageUnlocked: isStageUnlocked,
                        isMixed: isMixed,
                        blockAllCleared: blockAllCleared,
                        blockLabel: blockLabel,
                        depthLabel: depthLabel,
                        onStageSelect: onStageSelect
                    )
                }
            }

            ForEach(visibleBlocks) { blockLayout in
                if blockLayout.blockIndex > accessibleBlockIndex {
                    SurvivalDescentDimVeil(
                        startY: blockLayout.startY,
                        endY: blockLayout.endY,
                        widthPx: worldWidth,
                        scale: scale
                    )
                }
            }

            if let frontierBlock = visibleBlocks.first(where: { $0.blockIndex == accessibleBlockIndex }) {
                let theme = SurvivalDescentThemeCatalog.theme(for: frontierBlock.blockIndex)
                SurvivalDescentFloatingEmber(
                    startY: frontierBlock.startY,
                    endY: frontierBlock.endY,
                    widthPx: worldWidth,
                    scale: scale,
                    color: theme.lanternCore,
                    count: 6
                )
            }

            if let frontierPos = layout.position(for: frontierStageNumber) {
                SurvivalDescentCharacterView(
                    xPx: frontierPos.x * scale + horizontalOffset,
                    yPx: frontierPos.y * scale,
                    scale: scale,
                    facing: frontierFacing
                )
            }
        }
        .frame(width: worldWidth, height: worldHeight)
    }
}

private struct SurvivalDescentMapBlockContent: View {
    let meta: SurvivalBlockMeta
    let blockLayout: SurvivalDescentBlockLayout
    let blocks: [SurvivalBlockMeta]
    let mapCategory: SurvivalMapCategory
    let clearedStages: Set<Int>
    let freeStageNumbers: Set<Int>
    let playLockedForUpsell: Bool
    let accessibleBlockIndex: Int
    let frontierStageNumber: Int
    @Binding var selectedStageNumber: Int?
    let scale: CGFloat
    let horizontalOffset: CGFloat
    let worldWidth: CGFloat
    let isStageUnlocked: (Int) -> Bool
    let isMixed: (Int) -> Bool
    let blockAllCleared: (SurvivalBlockMeta) -> Bool
    let blockLabel: (SurvivalBlockMeta) -> String
    let depthLabel: (Int) -> String
    let onStageSelect: (SurvivalStageDefinition) -> Void

    var body: some View {
        let theme = SurvivalDescentThemeCatalog.theme(for: blockLayout.blockIndex)
        let filter = SurvivalDescentThemeCatalog.filter(for: blockLayout.blockIndex)
        let locked = blockLayout.blockIndex > accessibleBlockIndex
        let cleared = blockAllCleared(meta)
        let isFrontierBlock = blockLayout.blockIndex == accessibleBlockIndex

        ForEach(Array(stairConnectors.enumerated()), id: \.offset) { _, pair in
            SurvivalDescentStairConnector(
                from: CGPoint(
                    x: pair.from.x + horizontalOffset / scale,
                    y: pair.from.y
                ),
                to: CGPoint(
                    x: pair.to.x + horizontalOffset / scale,
                    y: pair.to.y
                ),
                scale: scale,
                theme: theme,
                highlighted: pair.highlighted,
                dim: locked
            )
        }

        ForEach(blockLayout.stages) { stage in
            SurvivalDescentLandingPlatform(
                type: stage.landingType == .big ? .big : .small,
                xPx: stage.x * scale + horizontalOffset,
                yPx: stage.y * scale,
                scale: scale,
                theme: theme,
                filter: filter,
                dim: locked
            )
        }

        let headerCenterX = SurvivalDescentLayoutConstants.laneCenterX * scale + horizontalOffset
        let lanternY = blockLayout.headerY * scale + 6 * scale
        let lanternOffsetX = max(110, 150 * scale)
        SurvivalDescentBlockLantern(
            xPx: headerCenterX - lanternOffsetX,
            yPx: lanternY,
            scale: scale,
            theme: theme,
            lit: !locked && (cleared || blockLayout.blockIndex == accessibleBlockIndex),
            dim: locked,
            side: .left,
            animated: isFrontierBlock
        )
        SurvivalDescentBlockLantern(
            xPx: headerCenterX + lanternOffsetX,
            yPx: lanternY,
            scale: scale,
            theme: theme,
            lit: !locked && (cleared || blockLayout.blockIndex == accessibleBlockIndex),
            dim: locked,
            side: .right,
            animated: isFrontierBlock
        )

        SurvivalDescentBlockHeaderPlate(
            label: blockLabel(meta),
            depthLabel: depthLabel(blockLayout.blockIndex),
            theme: theme,
            locked: locked,
            cleared: cleared,
            xPx: headerCenterX,
            yPx: blockLayout.headerY * scale,
            scale: scale
        )

        if let bigStage = blockLayout.stages.last {
            SurvivalDescentBlockSeal(
                xPx: bigStage.x * scale + horizontalOffset,
                yPx: (bigStage.y - 70) * scale,
                scale: scale,
                theme: theme,
                opened: cleared,
                dim: locked,
                animated: isFrontierBlock
            )
        }

        if blockLayout.blockIndex + 1 < blocks.count, let bigStage = blockLayout.stages.last {
            let doorLocked = !cleared
            SurvivalDescentDoorView(
                xPx: bigStage.x * scale + horizontalOffset,
                yPx: (bigStage.y - 10) * scale,
                scale: scale,
                theme: theme,
                filter: filter,
                opened: !doorLocked,
                dim: locked
            )

            SurvivalDescentBossFigure(
                xPx: bigStage.x * scale + horizontalOffset,
                yPx: (bigStage.y - 14) * scale,
                scale: scale,
                bossIndex: blockLayout.blockIndex,
                opened: !doorLocked,
                dim: locked,
                animated: isFrontierBlock
            )
        }

        ForEach(blockLayout.stages) { stage in
            let unlocked = isStageUnlocked(stage.stageNumber)
            let stageCleared = clearedStages.contains(stage.stageNumber)
            let freeAllowed = freeStageNumbers.contains(stage.stageNumber)
            let requiresPremium = playLockedForUpsell && !freeAllowed

            SurvivalDescentStageNode(
                stageNumber: stage.stageNumber,
                xPx: stage.x * scale + horizontalOffset,
                yPx: stage.y * scale,
                scale: scale,
                theme: theme,
                isCurrent: stage.stageNumber == frontierStageNumber,
                isCleared: stageCleared,
                isUnlocked: unlocked,
                isSelected: selectedStageNumber == stage.stageNumber,
                requiresPremium: requiresPremium,
                isMixed: isMixed(stage.stageNumber),
                dim: locked,
                onTap: {
                    if let def = SurvivalStageCatalog.stage(byNumber: stage.stageNumber, in: mapCategory) {
                        selectedStageNumber = stage.stageNumber
                        onStageSelect(def)
                    }
                }
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
        let stages = blockLayout.stages
        for i in 0..<max(0, stages.count - 1) {
            let a = stages[i]
            let b = stages[i + 1]
            let highlighted = clearedStages.contains(a.stageNumber)
                && !clearedStages.contains(b.stageNumber)
                && isStageUnlocked(b.stageNumber)
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
