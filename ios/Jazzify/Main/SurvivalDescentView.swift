import SwiftUI

/// 魔王城降下マップ ネイティブ版
/// - `LessonJourneyView` と同じ `ScrollView` + `ScrollViewReader` の縦スクロール構成
/// - Web 版 `SurvivalDescentMap.tsx` の座標系を `SurvivalDescentLayoutBuilder` で再現する
/// - 仮想カメラは持たず SwiftUI ネイティブのスクロールに任せる
/// - 画面端でも `scrollTo(anchor: .center)` が中央に寄るよう、上下に viewport/2 の透明スペーサーを置く
struct SurvivalDescentView: View {
    @EnvironmentObject var appState: AppState

    /// 親から注入する進捗・選択 state
    let currentStageNumber: Int
    let clearedStages: Set<Int>
    @Binding var selectedStageNumber: Int?

    let freeStageNumbers: Set<Int>
    let playLockedForUpsell: Bool

    /// ステージがタップされた時の通知 (親側で詳細表示を行う)
    let onStageSelect: (SurvivalStageDefinition) -> Void

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
            let height = proxy.size.height
            let mapScale = min(max(0.6, width / SurvivalDescentLayoutConstants.logicalWidth), 2.2)
            let worldWidth = max(width, SurvivalDescentLayoutConstants.logicalWidth * mapScale)
            let worldHeight = layout.totalHeight * mapScale

            ScrollViewReader { scrollProxy in
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 0) {
                        Color.clear.frame(height: height / 2)

                        ZStack(alignment: .topLeading) {
                            SurvivalDescentBackgroundView(widthPx: worldWidth, heightPx: worldHeight)

                            ForEach(Array(layout.blocks.enumerated()), id: \.element.blockKey) { idx, blockLayout in
                                if let meta = block(at: blockLayout.blockIndex) {
                                    blockContent(
                                        meta: meta,
                                        layout: blockLayout,
                                        index: idx,
                                        scale: mapScale,
                                        worldWidth: worldWidth
                                    )
                                }
                            }

                            // 未開放ブロックの暗幕
                            ForEach(layout.blocks) { blockLayout in
                                if blockLayout.blockIndex > accessibleBlockIndex {
                                    SurvivalDescentDimVeil(
                                        startY: blockLayout.startY,
                                        endY: blockLayout.endY,
                                        widthPx: worldWidth,
                                        scale: mapScale
                                    )
                                }
                            }

                            if let frontierPos = layout.position(for: frontierStageNumber) {
                                SurvivalDescentCharacterView(
                                    xPx: frontierPos.x * mapScale + (worldWidth - SurvivalDescentLayoutConstants.logicalWidth * mapScale) / 2,
                                    yPx: frontierPos.y * mapScale,
                                    scale: mapScale
                                )
                            }
                        }
                        .frame(width: worldWidth, height: worldHeight)

                        Color.clear.frame(height: height / 2)
                    }
                }
                .onAppear {
                    scrollToFrontier(scrollProxy: scrollProxy)
                }
                .onChange(of: frontierStageNumber) { _ in
                    scrollToFrontier(scrollProxy: scrollProxy)
                }
                .onChange(of: selectedStageNumber) { target in
                    guard let target else { return }
                    withAnimation(.easeInOut(duration: 0.35)) {
                        scrollProxy.scrollTo("stage-\(target)", anchor: .center)
                    }
                }
            }
        }
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

        // ブロックヘッダー (タイトルプレート)
        SurvivalDescentBlockHeaderPlate(
            label: blockLabel(for: meta),
            difficulty: meta.difficulty,
            blockIndex: blockLayout.blockIndex,
            locked: locked,
            widthPx: worldWidth,
            yPx: blockLayout.headerY * scale
        )

        // ステージノード
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
            .id("stage-\(stage.stageNumber)")
        }

        // 扉 (次のブロックがあれば)
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

    private func scrollToFrontier(scrollProxy: ScrollViewProxy) {
        let target = frontierStageNumber
        let perform: () -> Void = {
            scrollProxy.scrollTo("stage-\(target)", anchor: .center)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05, execute: perform)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3, execute: perform)
    }
}
