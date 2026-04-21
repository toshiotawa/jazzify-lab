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

    private func block(at index: Int) -> SurvivalBlockMeta? {
        guard index >= 0, index < blocks.count else { return nil }
        return blocks[index]
    }

    private func isMixed(_ stageNumber: Int) -> Bool {
        SurvivalStageCatalog.stage(byNumber: stageNumber)?.isMixedStage ?? false
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
        ZStack(alignment: .topLeading) {
            SurvivalDescentBackgroundView(widthPx: worldWidth, heightPx: worldHeight)

            ForEach(Array(layout.blocks.enumerated()), id: \.element.blockKey) { idx, blockLayout in
                if let meta = block(at: blockLayout.blockIndex) {
                    blockContent(
                        meta: meta,
                        layout: blockLayout,
                        index: idx,
                        scale: scale,
                        worldWidth: worldWidth
                    )
                }
            }

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

            if let frontierPos = layout.position(for: frontierStageNumber) {
                SurvivalDescentCharacterView(
                    xPx: frontierPos.x * scale + (worldWidth - SurvivalDescentLayoutConstants.logicalWidth * scale) / 2,
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
        index _: Int,
        scale: CGFloat,
        worldWidth: CGFloat
    ) -> some View {
        let horizontalOffset = (worldWidth - SurvivalDescentLayoutConstants.logicalWidth * scale) / 2
        let locked = blockLayout.blockIndex > accessibleBlockIndex

        SurvivalDescentBlockHeaderPlate(
            label: blockLabel(for: meta),
            difficulty: meta.difficulty,
            blockIndex: blockLayout.blockIndex,
            locked: locked,
            widthPx: worldWidth,
            yPx: blockLayout.headerY * scale
        )

        ForEach(blockLayout.stages) { stage in
            let unlocked = isStageUnlocked(stage.stageNumber)
            let cleared = clearedStages.contains(stage.stageNumber)
            let freeAllowed = freeStageNumbers.contains(stage.stageNumber)
            let requiresPremium = playLockedForUpsell && !freeAllowed

            SurvivalDescentStageNode(
                stage: SurvivalDescentStagePosition(
                    stageNumber: stage.stageNumber,
                    x: stage.x * scale + horizontalOffset,
                    y: stage.y * scale,
                    lane: stage.lane,
                    landingType: stage.landingType,
                    blockKey: stage.blockKey
                ),
                isCurrent: stage.stageNumber == frontierStageNumber,
                isCleared: cleared,
                isUnlocked: unlocked,
                isSelected: selectedStageNumber == stage.stageNumber,
                requiresPremium: requiresPremium,
                isMixed: isMixed(stage.stageNumber),
                dim: locked,
                scale: scale,
                onTap: {
                    if let def = SurvivalStageCatalog.stage(byNumber: stage.stageNumber) {
                        selectedStageNumber = stage.stageNumber
                        onStageSelect(def)
                    }
                }
            )
        }

        if blockLayout.blockIndex + 1 < blocks.count {
            let doorLocked = (blockLayout.blockIndex + 1) > accessibleBlockIndex
            SurvivalDescentDoorView(
                widthPx: worldWidth,
                yPx: blockLayout.doorY,
                scale: scale,
                locked: doorLocked
            )
        }
    }

    // MARK: - Scroll

    /// フロンティア (現在のステージ) を中央に合わせるスクロールを要求する。
    /// 進行が深くなるほど大きな Y へスクロールする必要がある (下方降下マップ)。
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
