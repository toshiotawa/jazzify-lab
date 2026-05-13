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

    private func visibleBlockLayouts(scale: CGFloat, fallbackViewportHeight: CGFloat) -> [SurvivalDescentBlockLayout] {
        let safeScale = max(scale, 0.001)
        let viewportHeight = max(1, viewport.height > 0 ? viewport.height : fallbackViewportHeight)

        let logicalMinY = max(0, viewport.offsetY / safeScale - logicalCullMargin)
        let logicalMaxY = viewport.offsetY / safeScale + viewportHeight / safeScale + logicalCullMargin

        var visible = layout.blocks.filter {
            $0.endY >= logicalMinY && $0.startY <= logicalMaxY
        }

        // 初回ジャンプ時に空白にならないよう、現在地ブロック/選択ブロックは強制で残す
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

    /// `SurvivalStageCatalog.load(rows:blockLabelRows:)` 完了後の最新値を反映できるよう computed property にする。
    private var layout: SurvivalDescentLayout {
        SurvivalDescentLayoutBuilder.build(blocks: blocks)
    }
    private var blocks: [SurvivalBlockMeta] { SurvivalStageCatalog.blocks(in: mapCategory) }

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
        SurvivalStageCatalog.stage(byNumber: stageNumber, in: mapCategory)?.isMixedStage ?? false
    }

    private func blockAllCleared(_ meta: SurvivalBlockMeta) -> Bool {
        !meta.stageNumbers.isEmpty && meta.stageNumbers.allSatisfy { clearedStages.contains($0) }
    }

    /// フロンティアキャラクターの向き (次に進むステージの方向を見る)
    private var frontierFacing: SurvivalDescentCharacterView.Facing {
        let current = frontierStageNumber
        guard let currentPos = layout.position(for: current) else { return .right }
        if let nextPos = layout.position(for: current + 1) {
            // 大踊り場 (stage 5) は中央
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
                mapBody(
                    worldWidth: worldWidth,
                    worldHeight: worldHeight,
                    scale: mapScale,
                    visibleBlocks: visibleBlocks
                )
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
                requestScrollToFrontier(scale: mapScale, animated: false)
            }
            .onChange(of: selectedStageNumber) { target in
                guard let target,
                      let pos = layout.position(for: target) else { return }
                scrollAnimated = false
                scrollTargetY = pos.y * mapScale
            }
            .onChange(of: mapCategory) { _ in
                // カテゴリ切替時はマップが別構造になるため、初回スクロールフラグを下ろして
                // 新マップのフロンティアまでアニメ無しで再ジャンプする。
                didInitialScroll = false
                requestScrollToFrontier(scale: mapScale, animated: false)
            }
        }
    }

    @ViewBuilder
    private func mapBody(
        worldWidth: CGFloat,
        worldHeight: CGFloat,
        scale: CGFloat,
        visibleBlocks: [SurvivalDescentBlockLayout]
    ) -> some View {
        // 論理座標 0..logicalWidth を worldWidth の中央に寄せるための横オフセット
        let horizontalOffset = (worldWidth - SurvivalDescentLayoutConstants.logicalWidth * scale) / 2

        ZStack(alignment: .topLeading) {
            SurvivalDescentBackgroundView(
                widthPx: worldWidth,
                heightPx: worldHeight,
                scale: scale,
                blocks: layout.blocks,
                accessibleBlockIndex: accessibleBlockIndex
            )

            // 装飾＋踊り場＋階段＋ステージノード
            ForEach(visibleBlocks) { blockLayout in
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

            // フロンティアブロックに漂う火の粉
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

            // フロンティア位置のキャラクター
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
        let filter = SurvivalDescentThemeCatalog.filter(for: blockLayout.blockIndex)
        let locked = blockLayout.blockIndex > accessibleBlockIndex
        let cleared = blockAllCleared(meta)
        // フロンティアブロックかどうか。炎/六芒星/ボスの `repeatForever` は
        // 同時に 40〜80 個走らせると累積負荷が大きいため、現挑戦中ブロックのみ発火させる。
        let isFrontierBlock = blockLayout.blockIndex == accessibleBlockIndex

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
                filter: filter,
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
                dim: locked,
                animated: isFrontierBlock
            )
        }

        // ブロック末尾の扉 (次ブロックが存在する時のみ) + 扉前のボス
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
                    if let def = SurvivalStageCatalog.stage(byNumber: stage.stageNumber, in: mapCategory) {
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
