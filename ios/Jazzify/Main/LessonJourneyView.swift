import SwiftUI
import UIKit

/// レッスンモード「学びの旅マップ」(コース詳細画面・iOS)
/// サバイバルの降下マップと対になる上昇型マップ。
/// - iPhone: マップ全面 + ノード選択で下からシート
/// - iPad regular: 左リストパネル + 右マップ 二分割
struct LessonJourneyView: View {
    @EnvironmentObject var appState: AppState

    let course: Course
    let initialLessons: [Lesson]
    let initialCompletedLessonIds: Set<UUID>

    @State private var lessons: [Lesson]
    @State private var completedLessonIds: Set<UUID>
    @State private var selectedLesson: Lesson?
    @State private var launchLesson: Lesson?
    @State private var showSheet = false
    @State private var isSoundMuted: Bool = LessonMapAudio.shared.isMuted
    @State private var scrollTargetLessonId: UUID?
    @State private var scrollTargetY: CGFloat?
    @State private var scrollAnimated: Bool = false
    @State private var didInitialScroll: Bool = false

    private var locale: AppLocale { appState.locale }

    init(course: Course, lessons: [Lesson], completedLessonIds: Set<UUID>) {
        self.course = course
        self.initialLessons = lessons
        self.initialCompletedLessonIds = completedLessonIds
        self._lessons = State(initialValue: lessons)
        self._completedLessonIds = State(initialValue: completedLessonIds)
    }

    // MARK: - Derived

    private var journeyInputs: [LessonJourneyInput] {
        lessons.map {
            LessonJourneyInput(
                id: $0.id,
                blockNumber: $0.blockNumber ?? 1,
                blockName: $0.blockName,
                blockNameEn: $0.blockNameEn,
                orderIndex: $0.orderIndex
            )
        }
    }

    private var layout: LessonJourneyLayout {
        LessonJourneyLayoutBuilder.build(lessons: journeyInputs, locale: locale)
    }

    private var accessGraph: LessonJourneyAccessGraph {
        LessonJourneyAccessGraph.build(lessons: lessons, completedIds: completedLessonIds)
    }

    private var frontierLessonId: UUID? {
        LessonJourneyFrontier.compute(
            lessons: journeyInputs,
            isUnlocked: { id in accessGraph.lessonStates[id]?.isUnlocked ?? false },
            isCompleted: { id in accessGraph.lessonStates[id]?.isCompleted ?? false }
        )
    }

    private var completedCount: Int {
        lessons.filter { completedLessonIds.contains($0.id) }.count
    }

    private var progressPercent: Int {
        lessons.isEmpty ? 0 : Int((Double(completedCount) / Double(lessons.count)) * 100.0)
    }

    /// iPad のみ 2 カラム (リスト + マップ) にする。
    /// iPhone は Max 系の横向き (hSize == .regular) でも 1 カラムで固定。
    private var useSplitLayout: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    // MARK: - Body

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "050315"), Color(hex: "0b0624"), Color(hex: "150a32")],
                startPoint: .bottom,
                endPoint: .top
            )
            .ignoresSafeArea()

            if useSplitLayout {
                HStack(spacing: 0) {
                    LessonJourneyListPanel(
                        locale: locale,
                        lessons: lessons,
                        accessGraph: accessGraph,
                        frontierLessonId: frontierLessonId,
                        selectedLessonId: selectedLesson?.id,
                        completedCount: completedCount,
                        totalCount: lessons.count,
                        onSelect: handleSelect
                    )
                    .frame(width: 320)
                    .padding(12)

                    ZStack(alignment: .bottom) {
                        mapContent
                            .padding(.trailing, 8)
                            .padding(.vertical, 8)

                        if let lesson = selectedLesson {
                            LessonJourneyDetailSheet(
                                locale: locale,
                                lesson: lesson,
                                accessState: accessGraph.lessonStates[lesson.id],
                                isFrontier: lesson.id == frontierLessonId,
                                blockLabel: blockLabel(for: lesson),
                                onStart: {
                                    LessonMapAudio.shared.stop()
                                    launchLesson = lesson
                                },
                                onClose: { selectedLesson = nil }
                            )
                            .frame(maxWidth: 520)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.purple.opacity(0.4), lineWidth: 1)
                            )
                            .shadow(color: .black.opacity(0.5), radius: 16)
                            .padding(.horizontal, 24)
                            .padding(.bottom, 16)
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                        }
                    }
                }
            } else {
                mapContent
            }
        }
        .navigationTitle(course.localizedTitle(locale))
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(Color(hex: "0b0624"), for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    let muted = LessonMapAudio.shared.toggleMuted()
                    isSoundMuted = muted
                    if !muted {
                        LessonMapAudio.shared.play()
                    }
                } label: {
                    Image(systemName: isSoundMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                        .foregroundStyle(.white)
                }
            }
        }
        .onAppear {
            if !LessonMapAudio.shared.isMuted {
                LessonMapAudio.shared.play()
            }
        }
        .onDisappear {
            LessonMapAudio.shared.stop()
        }
        .sheet(isPresented: $showSheet) {
            if let lesson = selectedLesson {
                LessonJourneyDetailSheet(
                    locale: locale,
                    lesson: lesson,
                    accessState: accessGraph.lessonStates[lesson.id],
                    isFrontier: lesson.id == frontierLessonId,
                    blockLabel: blockLabel(for: lesson),
                    onStart: {
                        LessonMapAudio.shared.stop()
                        showSheet = false
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
                            launchLesson = lesson
                        }
                    },
                    onClose: { showSheet = false }
                )
                .presentationDetents([.fraction(0.4), .medium])
                .presentationDragIndicator(.visible)
            }
        }
        .navigationDestination(
            isPresented: Binding(
                get: { launchLesson != nil },
                set: { if !$0 { launchLesson = nil } }
            )
        ) {
            if let lesson = launchLesson {
                LessonDetailView(lesson: lesson)
            }
        }
        .onChange(of: launchLesson == nil) { isNil in
            if isNil {
                Task { await reloadProgress() }
                if !LessonMapAudio.shared.isMuted {
                    LessonMapAudio.shared.play()
                }
            }
        }
    }

    // MARK: - Map Content

    @ViewBuilder
    private var mapContent: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let height = proxy.size.height
            let scale = min(max(0.7, width / LessonJourneyLayoutConstants.logicalWidth), 2.2)
            let contentHeight = layout.totalHeight * scale

            ZStack {
                // 背景 (星空 + ネビュラ) は viewport 固定。
                // contentHeight は数千 pt になりうるため、巨大な背景を
                // スクロール内に置くと描画破綻 (星が出ない) と負荷増に直結する。
                LessonJourneyBackgroundView(widthPx: width, heightPx: height)
                    .allowsHitTesting(false)

                UIKitVerticalScrollView(
                    contentSize: CGSize(width: width, height: contentHeight),
                    scrollTargetY: $scrollTargetY,
                    animated: scrollAnimated
                ) {
                    mapContentBody(width: width, scale: scale, contentHeight: contentHeight)
                }
                .onAppear {
                    requestScrollToFrontier(scale: scale, animated: false)
                }
                .onChange(of: contentHeight) { _ in
                    if !didInitialScroll {
                        requestScrollToFrontier(scale: scale, animated: false)
                    }
                }
                .onChange(of: scrollTargetLessonId) { target in
                    guard let target,
                          let node = layout.allNodes.first(where: { $0.lessonId == target })
                    else { return }
                    scrollAnimated = true
                    scrollTargetY = node.y * scale
                }
            }
        }
    }

    @ViewBuilder
    private func mapContentBody(width: CGFloat, scale: CGFloat, contentHeight: CGFloat) -> some View {
        // 背景はスクロールの外 (viewport サイズ固定) に置いているため、
        // ここではマップ本体 (経路・ブロック・ノード・キャラ等) のみを描く。
        ZStack(alignment: .topLeading) {
            // 中央カラム
            ZStack(alignment: .topLeading) {
                LessonJourneyPathCanvas(
                    layout: layout,
                    scale: scale,
                    accessGraph: accessGraph,
                    frontierLessonId: frontierLessonId
                )
                .frame(
                    width: layout.logicalWidth * scale,
                    height: contentHeight
                )

                ForEach(layout.blocks) { block in
                    LessonJourneyBlockThemeOverlay(
                        topY: block.topY,
                        bottomY: block.bottomY,
                        widthPx: layout.logicalWidth * scale,
                        scale: scale,
                        theme: block.theme,
                        dim: block.blockIndex > accessibleBlockIndex
                    )
                }

                ForEach(layout.blocks) { block in
                    let labels = bandLabels(for: block)
                    LessonJourneyBandView(
                        widthPx: layout.logicalWidth * scale,
                        yPx: bandYPx(for: block, scale: scale),
                        label: labels.main,
                        sublabel: labels.sub,
                        theme: block.theme,
                        dim: block.blockIndex > accessibleBlockIndex
                    )
                }

                ForEach(layout.blocks) { block in
                    if block.blockIndex > accessibleBlockIndex {
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [
                                        Color.black.opacity(0.82),
                                        Color.black.opacity(0.62),
                                        Color.black.opacity(0.78),
                                    ],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .frame(
                                width: layout.logicalWidth * scale,
                                height: (block.bottomY - block.topY) * scale
                            )
                            .position(
                                x: layout.logicalWidth * scale / 2,
                                y: (block.topY + block.bottomY) / 2 * scale
                            )
                            .allowsHitTesting(false)
                    }
                }

                LessonJourneyGoalView(
                    xPx: layout.goal.x * scale,
                    yPx: layout.goal.y * scale,
                    scale: scale,
                    cleared: allCleared,
                    label: course.localizedTitle(locale)
                )

                ForEach(layout.blocks) { block in
                    ForEach(block.lessonNodes) { node in
                        LessonJourneyNodeView(
                            node: node,
                            scale: scale,
                            accessState: accessState(for: node),
                            isFrontier: node.lessonId == frontierLessonId && block.blockIndex <= accessibleBlockIndex,
                            selected: selectedLesson?.id == node.lessonId,
                            dim: block.blockIndex > accessibleBlockIndex,
                            onSelect: {
                                if let lessonId = node.lessonId,
                                   let lesson = lessons.first(where: { $0.id == lessonId }) {
                                    handleSelect(lesson)
                                }
                            }
                        )
                    }
                }

                if let frontierNode = layout.allNodes.first(where: { $0.lessonId == frontierLessonId }) {
                    LessonJourneyCharacterView(
                        xPx: frontierNode.x * scale,
                        yPx: frontierNode.y * scale,
                        scale: scale
                    )
                }
            }
            .frame(width: layout.logicalWidth * scale, height: contentHeight)
            .offset(x: max(0, (width - layout.logicalWidth * scale) / 2))
        }
        .frame(width: width, height: contentHeight)
    }

    // MARK: - Helpers

    private var accessibleBlockIndex: Int {
        var idx = 0
        for block in layout.blocks {
            if let bs = accessGraph.blockStates[block.blockNumber], bs.isUnlocked {
                idx = max(idx, block.blockIndex)
            }
        }
        return idx
    }

    private var allCleared: Bool {
        !lessons.isEmpty && lessons.allSatisfy { completedLessonIds.contains($0.id) }
    }

    private func isBlockCleared(block: LessonJourneyBlockLayout) -> Bool {
        accessGraph.blockStates[block.blockNumber]?.isCompleted ?? false
    }

    private func accessState(for node: LessonJourneyNode) -> LessonJourneyAccessGraph.LessonState {
        guard let id = node.lessonId else {
            return LessonJourneyAccessGraph.LessonState(isUnlocked: false, isCompleted: false)
        }
        return accessGraph.lessonStates[id] ?? LessonJourneyAccessGraph.LessonState(isUnlocked: false, isCompleted: false)
    }

    private func blockLabel(for lesson: Lesson) -> String {
        if locale == .en, let en = lesson.blockNameEn, !en.isEmpty { return en }
        if let name = lesson.blockName, !name.isEmpty { return name }
        let bn = lesson.blockNumber ?? 1
        return locale == .ja ? "ブロック \(bn)" : "Block \(bn)"
    }

    /// 帯ラベル: 表示言語に応じて主・副を入れ替える。
    /// - 英語UI: EN を主、JA を副 (EN が無ければ JA のみ)
    /// - 日本語UI: JA を主、EN を副
    private func bandLabels(for block: LessonJourneyBlockLayout) -> (main: String, sub: String?) {
        let en = block.blockNameEn?.isEmpty == false ? block.blockNameEn : nil
        if locale == .en {
            if let en {
                let sub: String? = (block.blockName != en) ? block.blockName : nil
                return (main: en, sub: sub)
            }
            return (main: block.blockName, sub: nil)
        }
        return (main: block.blockName, sub: en)
    }

    private func handleSelect(_ lesson: Lesson) {
        selectedLesson = lesson
        scrollTargetLessonId = lesson.id
        if !useSplitLayout {
            showSheet = true
        }
    }

    /// フロンティア (今取り組むべきレッスン) を画面中央に合わせるスクロールを要求する。
    /// フロンティアが特定できない場合は以下の優先順でフォールバックする:
    /// 1. 最終ブロックの先頭レッスン (コース最奥)
    /// 2. いずれかのレッスンノード
    /// 3. マップ最下端 (スタート地点)
    private func requestScrollToFrontier(scale: CGFloat, animated: Bool) {
        let nodes = layout.allNodes
        let targetNode: LessonJourneyNode? = {
            if let frontierId = frontierLessonId,
               let node = nodes.first(where: { $0.lessonId == frontierId }) {
                return node
            }
            if let last = layout.blocks.last?.lessonNodes.first {
                return last
            }
            return nodes.first(where: { $0.kind == .lesson })
        }()
        scrollAnimated = animated
        if let node = targetNode {
            scrollTargetY = node.y * scale
        } else {
            // ノードが一つも無い → マップ最下端へ
            scrollTargetY = layout.totalHeight * scale
        }
        didInitialScroll = true
    }

    private func bandYPx(for block: LessonJourneyBlockLayout, scale: CGFloat) -> CGFloat {
        // 最終ブロックはコース名 (GoalView) との被りを避けて
        // 帯を下方向へオフセットする
        let isLast = block.blockIndex == layout.blocks.count - 1
        let offset: CGFloat = isLast ? 64 : 28
        return block.topY * scale + offset
    }

    private func reloadProgress() async {
        guard let userId = appState.profile?.id else { return }
        do {
            let progress = try await SupabaseService.shared.fetchLessonProgress(courseId: course.id, userId: userId)
            let done = Set(progress.filter(\.completed).map(\.lessonId))
            completedLessonIds = done
        } catch {
            // keep existing
        }
    }
}

// MARK: - Access Graph

struct LessonJourneyAccessGraph {
    struct LessonState {
        let isUnlocked: Bool
        let isCompleted: Bool
    }

    struct BlockState {
        let blockNumber: Int
        let isUnlocked: Bool
        let isCompleted: Bool
    }

    let lessonStates: [UUID: LessonState]
    let blockStates: [Int: BlockState]

    static func build(lessons: [Lesson], completedIds: Set<UUID>) -> LessonJourneyAccessGraph {
        let sorted = lessons.sorted { lhs, rhs in
            let lb = lhs.blockNumber ?? 1
            let rb = rhs.blockNumber ?? 1
            if lb != rb { return lb < rb }
            return lhs.orderIndex < rhs.orderIndex
        }
        var groups: [Int: [Lesson]] = [:]
        var order: [Int] = []
        for lesson in sorted {
            let bn = lesson.blockNumber ?? 1
            if groups[bn] == nil { order.append(bn) }
            groups[bn, default: []].append(lesson)
        }

        var blockStates: [Int: BlockState] = [:]
        var lessonStates: [UUID: LessonState] = [:]
        for (index, bn) in order.enumerated() {
            let previous = index > 0 ? order[index - 1] : nil
            let previousCompleted = previous == nil || blockStates[previous!]?.isCompleted == true
            let unlocked = index == 0 || previousCompleted
            let blockLessons = groups[bn] ?? []
            let completed = !blockLessons.isEmpty && blockLessons.allSatisfy { completedIds.contains($0.id) }
            blockStates[bn] = BlockState(blockNumber: bn, isUnlocked: unlocked, isCompleted: completed)
            for lesson in blockLessons {
                lessonStates[lesson.id] = LessonState(
                    isUnlocked: unlocked,
                    isCompleted: completedIds.contains(lesson.id)
                )
            }
        }
        return LessonJourneyAccessGraph(lessonStates: lessonStates, blockStates: blockStates)
    }
}
