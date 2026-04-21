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

    let onStageSelect: (SurvivalStageDefinition) -> Void

    @State private var scrollTargetY: CGFloat?
    @State private var scrollAnimated: Bool = false
    @State private var didInitialScroll: Bool = false

    private let layout: SurvivalDescentLayout = SurvivalDescentLayoutBuilder.build()
    private let blocks: [SurvivalBlockMeta] = SurvivalStageCatalog.blocks

    private var locale: AppLocale { appState.locale }

    private var frontierStageNumber: Int {
        max(1, min(SurvivalStageCatalog.totalStages, currentStageNumber))
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

    private func blockLabel(for block: SurvivalBlockMeta) -> String {
        block.localizedLabel(locale)
    }

    private func depthLabel(for blockIndex: Int) -> String {
        locale == .en ? "FLOOR \(blockIndex + 1)" : "第\(blockIndex + 1)階層"
    }

    private func block(at index: Int) -> SurvivalBlockMeta? {
        guard index >= 0, index < blocks.count else { return nil }
        return blocks[index]
    }

    private func isMixed(_ stageNumber: Int) -> Bool {
        SurvivalStageCatalog.stage(byNumber: stageNumber)?.isMixedStage ?? false
    }

    private func blockAllCleared(_ meta: SurvivalBlockMeta) -> Bool {
        !meta.stageNumbers.isEmpty && meta.stageNumbers.allSatisfy { clearedStages.contains($0) }
    }

    // MARK: - Body

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let mapScale = min(max(0.6, width / SurvivalDescentLayoutConstants.logicalWidth), 2.2)
            let worldWidth = max(width, SurvivalDescentLayoutConstants.logicalWidth * mapScale)
            let worldHeight = layout.totalHeight * mapScale

            UIKitVerticalScrollView(
                contentSize: CGSize(width: worldWidth, height: worldHeight),
                scrollTargetY: $scrollTargetY,
                animated: scrollAnimated
            ) {
                mapBody(worldWidth: worldWidth, worldHeight: worldHeight, scale: mapScale)
            }
            .onAppear {
                requestScrollToFrontier(scale: mapScale, animated: false)
            }
            .onChange(of: worldHeight) { _ in
                if !didInitialScroll {
                    requestScrollToFrontier(scale: mapScale, animated: false)
                }
            }
            .onChange(of: frontierStageNumber) { _ in
                requestScrollToFrontier(scale: mapScale, animated: true)
            }
            .onChange(of: selectedStageNumber) { target in
                guard let target,
                      let pos = layout.position(for: target) else { return }
                scrollAnimated = true
                scrollTargetY = pos.y * mapScale
            }
        }
    }

    @ViewBuilder
    private func mapBody(worldWidth: CGFloat, worldHeight: CGFloat, scale: CGFloat) -> some View {
        // 論理座標 0..logicalWidth を worldWidth の中央に寄せるための横オフセット
        let horizontalOffset = (worldWidth - SurvivalDescentLayoutConstants.logicalWidth * scale) / 2

        ZStack(alignment: .topLeading) {
            SurvivalDescentBackgroundView(widthPx: worldWidth, heightPx: worldHeight)

            // ブロック区間のテーマ色オーバーレイ (全ブロック)
            ForEach(Array(layout.blocks.enumerated()), id: \.element.blockKey) { idx, blockLayout in
                let theme = SurvivalDescentThemeCatalog.theme(for: blockLayout.blockIndex)
                let locked = blockLayout.blockIndex > accessibleBlockIndex
                SurvivalDescentBlockTintOverlay(
                    startY: blockLayout.startY,
                    endY: blockLayout.endY,
                    widthPx: worldWidth,
                    scale: scale,
                    theme: theme,
                    dim: locked
                )
                .id("tint-\(idx)")
            }

            // 装飾＋踊り場＋階段＋ステージノード
            ForEach(Array(layout.blocks.enumerated()), id: \.element.blockKey) { _, blockLayout in
                if let meta = block(at: blockLayout.blockIndex) {
                    blockContent(
                        meta: meta,
                        layout: blockLayout,
                        scale: scale,
                        horizontalOffset: horizontalOffset,
                        worldWidth: worldWidth
                    )
                }
            }

            // 未解放ブロックの暗幕
            ForEach(layout.blocks) { blockLayout in
                if blockLayout.blockIndex > accessibleBlockIndex {
                    SurvivalDescentDimVeil(
                        startY: blockLayout.startY,
                        endY: blockLayout.endY,
                        widthPx: worldWidth,
                        scale: scale
                    )
                }
            }

            // フロンティア位置のキャラクター
            if let frontierPos = layout.position(for: frontierStageNumber) {
                SurvivalDescentCharacterView(
                    xPx: frontierPos.x * scale + horizontalOffset,
                    yPx: frontierPos.y * scale,
                    scale: scale
                )
            }
        }
        .frame(width: worldWidth, height: worldHeight)
    }

    // MARK: - Block content

    @ViewBuilder
    private func blockContent(
        meta: SurvivalBlockMeta,
        layout blockLayout: SurvivalDescentBlockLayout,
        scale: CGFloat,
        horizontalOffset: CGFloat,
        worldWidth: CGFloat
    ) -> some View {
        let theme = SurvivalDescentThemeCatalog.theme(for: blockLayout.blockIndex)
        let locked = blockLayout.blockIndex > accessibleBlockIndex
        let cleared = blockAllCleared(meta)

        // 階段コネクタ (踊り場間)
        ForEach(Array(stairConnectors(in: blockLayout).enumerated()), id: \.offset) { _, pair in
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

        // 踊り場
        ForEach(blockLayout.stages) { stage in
            SurvivalDescentLandingPlatform(
                type: stage.landingType == .big ? .big : .small,
                xPx: stage.x * scale + horizontalOffset,
                yPx: stage.y * scale,
                scale: scale,
                theme: theme,
                dim: locked
            )
        }

        // 両脇の篝火 (ヘッダーの左右)
        let headerCenterX = SurvivalDescentLayoutConstants.laneCenterX * scale + horizontalOffset
        let lanternY = blockLayout.headerY * scale + 6 * scale
        let lanternOffsetX = max(110, 150 * scale)
        SurvivalDescentBlockLantern(
            xPx: headerCenterX - lanternOffsetX,
            yPx: lanternY,
            scale: scale,
            theme: theme,
            lit: !locked && (cleared || blockLayout.blockIndex == accessibleBlockIndex),
            dim: locked
        )
        SurvivalDescentBlockLantern(
            xPx: headerCenterX + lanternOffsetX,
            yPx: lanternY,
            scale: scale,
            theme: theme,
            lit: !locked && (cleared || blockLayout.blockIndex == accessibleBlockIndex),
            dim: locked
        )

        // ヘッダープレート
        SurvivalDescentBlockHeaderPlate(
            label: blockLabel(for: meta),
            depthLabel: depthLabel(for: blockLayout.blockIndex),
            theme: theme,
            locked: locked,
            cleared: cleared,
            xPx: headerCenterX,
            yPx: blockLayout.headerY * scale,
            scale: scale
        )

        // 大踊り場 (ブロック末尾) の上に封印魔法陣
        if let bigStage = blockLayout.stages.last {
            SurvivalDescentBlockSeal(
                xPx: bigStage.x * scale + horizontalOffset,
                yPx: (bigStage.y - 70) * scale,
                scale: scale,
                theme: theme,
                opened: cleared,
                dim: locked
            )
        }

        // ブロック末尾の扉 (次ブロックが存在する時のみ)
        if blockLayout.blockIndex + 1 < blocks.count, let bigStage = blockLayout.stages.last {
            let doorLocked = !cleared
            SurvivalDescentDoorView(
                xPx: bigStage.x * scale + horizontalOffset,
                yPx: (bigStage.y - 60) * scale,
                scale: scale,
                theme: theme,
                opened: !doorLocked,
                dim: locked
            )
        }

        // ステージノード (最前面)
        ForEach(blockLayout.stages) { stage in
            let unlocked = isStageUnlocked(stage.stageNumber)
            let cleared = clearedStages.contains(stage.stageNumber)
            let freeAllowed = freeStageNumbers.contains(stage.stageNumber)
            let requiresPremium = playLockedForUpsell && !freeAllowed

            SurvivalDescentStageNode(
                stageNumber: stage.stageNumber,
                xPx: stage.x * scale + horizontalOffset,
                yPx: stage.y * scale,
                scale: scale,
                theme: theme,
                isCurrent: stage.stageNumber == frontierStageNumber,
                isCleared: cleared,
                isUnlocked: unlocked,
                isSelected: selectedStageNumber == stage.stageNumber,
                requiresPremium: requiresPremium,
                isMixed: isMixed(stage.stageNumber),
                dim: locked,
                onTap: {
                    if let def = SurvivalStageCatalog.stage(byNumber: stage.stageNumber) {
                        selectedStageNumber = stage.stageNumber
                        onStageSelect(def)
                    }
                }
            )
        }
    }

    // MARK: - Helpers

    private struct StairPair {
        let from: CGPoint
        let to: CGPoint
        let highlighted: Bool
    }

    /// ブロック内の踊り場間コネクタのペアを列挙 (論理座標のまま返す)
    private func stairConnectors(in blockLayout: SurvivalDescentBlockLayout) -> [StairPair] {
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

    // MARK: - Scroll

    /// フロンティア (現在のステージ) を中央に合わせるスクロールを要求する。
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
