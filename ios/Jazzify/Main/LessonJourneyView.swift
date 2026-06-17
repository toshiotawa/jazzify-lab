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
    let onCompletedIdsChanged: ((Set<UUID>) -> Void)?
    let onLessonsUpdated: (([Lesson]) -> Void)?

    @State private var lessons: [Lesson]
    @State private var completedLessonIds: Set<UUID>
    @State private var layout: LessonJourneyLayout
    @State private var accessGraph: LessonJourneyAccessGraph
    @State private var frontierLessonId: UUID?
    @State private var accessibleBlockIndex: Int
    @State private var allCleared: Bool
    @State private var isLoadingLessons = false
    @State private var selectedLesson: Lesson?
    @State private var launchLesson: Lesson?
    @State private var showSheet = false
    @State private var isSoundMuted: Bool = LessonMapAudio.shared.isMuted
    @State private var scrollTargetLessonId: UUID?
    @State private var scrollTargetY: CGFloat?
    @State private var scrollAnimated: Bool = false
    @State private var didInitialScroll: Bool = false
    @State private var layoutSignature: String = ""

    private var locale: AppLocale { appState.locale }

    init(
        course: Course,
        lessons: [Lesson],
        completedLessonIds: Set<UUID>,
        onCompletedIdsChanged: ((Set<UUID>) -> Void)? = nil,
        onLessonsUpdated: (([Lesson]) -> Void)? = nil
    ) {
        self.course = course
        self.initialLessons = lessons
        self.initialCompletedLessonIds = completedLessonIds
        self.onCompletedIdsChanged = onCompletedIdsChanged
        self.onLessonsUpdated = onLessonsUpdated
        self._lessons = State(initialValue: lessons)
        self._completedLessonIds = State(initialValue: completedLessonIds)
        let derived = Self.computeDerived(
            lessons: lessons,
            completedLessonIds: completedLessonIds,
            locale: .ja,
            enforceSequentialWithinBlocks: course.isMainCourse == true,
            isMainCourse: course.isMainCourse == true,
            isPremium: true
        )
        self._layout = State(initialValue: derived.layout)
        self._accessGraph = State(initialValue: derived.accessGraph)
        self._frontierLessonId = State(initialValue: derived.frontierLessonId)
        self._accessibleBlockIndex = State(initialValue: derived.accessibleBlockIndex)
        self._allCleared = State(initialValue: derived.allCleared)
        self._layoutSignature = State(
            initialValue: Self.makeLayoutSignature(
                lessons: lessons,
                completedLessonIds: completedLessonIds,
                layout: derived.layout,
                locale: .ja,
                isMainCourse: course.isMainCourse == true,
                isPremium: true
            )
        )
    }

    private static func computeDerived(
        lessons: [Lesson],
        completedLessonIds: Set<UUID>,
        locale: AppLocale,
        enforceSequentialWithinBlocks: Bool,
        isMainCourse: Bool,
        isPremium: Bool
    ) -> (
         layout: LessonJourneyLayout,
         accessGraph: LessonJourneyAccessGraph,
         frontierLessonId: UUID?,
         accessibleBlockIndex: Int,
         allCleared: Bool
     ) {
        let inputs: [LessonJourneyInput] = lessons.map {
            LessonJourneyInput(
                id: $0.id,
                blockNumber: $0.blockNumber ?? 1,
                blockName: $0.blockName,
                blockNameEn: $0.blockNameEn,
                orderIndex: $0.orderIndex
            )
        }
        let layout = LessonJourneyLayoutBuilder.build(
            lessons: inputs,
            locale: locale,
            phoneInlineTitles: Self.phoneInlineTitlesPreferred()
        )
        var accessGraph = LessonJourneyAccessGraph.build(
            lessons: lessons,
            completedIds: completedLessonIds,
            enforceSequentialWithinBlocks: enforceSequentialWithinBlocks
        )
        if isMainCourse {
            accessGraph = MainQuestFreeTier.applyLocks(graph: accessGraph, lessons: lessons, isPremium: isPremium)
        }
        let frontierLessonId = LessonJourneyFrontier.compute(
            lessons: inputs,
            isUnlocked: { id in accessGraph.lessonStates[id]?.isUnlocked ?? false },
            isCompleted: { id in accessGraph.lessonStates[id]?.isCompleted ?? false }
        )
        var accessibleBlockIndex = 0
        for block in layout.blocks {
            if let bs = accessGraph.blockStates[block.blockNumber], bs.isUnlocked {
                accessibleBlockIndex = max(accessibleBlockIndex, block.blockIndex)
            }
        }
        let allCleared = !lessons.isEmpty && lessons.allSatisfy { completedLessonIds.contains($0.id) }
        return (layout, accessGraph, frontierLessonId, accessibleBlockIndex, allCleared)
    }

    private func recomputeJourney() {
        let d = Self.computeDerived(
            lessons: lessons,
            completedLessonIds: completedLessonIds,
            locale: locale,
            enforceSequentialWithinBlocks: course.isMainCourse == true,
            isMainCourse: course.isMainCourse == true,
            isPremium: appState.isPremium
        )
        layout = d.layout
        accessGraph = d.accessGraph
        frontierLessonId = d.frontierLessonId
        accessibleBlockIndex = d.accessibleBlockIndex
        allCleared = d.allCleared
        layoutSignature = Self.makeLayoutSignature(
            lessons: lessons,
            completedLessonIds: completedLessonIds,
            layout: d.layout,
            locale: locale,
            isMainCourse: course.isMainCourse == true,
            isPremium: appState.isPremium
        )
    }

    private static func makeLayoutSignature(
        lessons: [Lesson],
        completedLessonIds: Set<UUID>,
        layout: LessonJourneyLayout,
        locale: AppLocale,
        isMainCourse: Bool,
        isPremium: Bool
    ) -> String {
        var hasher = Hasher()
        hasher.combine(lessons.count)
        for lesson in lessons {
            hasher.combine(lesson.id)
            hasher.combine(lesson.blockNumber ?? 1)
            hasher.combine(lesson.orderIndex)
        }
        for id in completedLessonIds.sorted(by: { $0.uuidString < $1.uuidString }) {
            hasher.combine(id)
        }
        hasher.combine(layout.totalHeight)
        hasher.combine(layout.blocks.count)
        hasher.combine(locale.rawValue)
        if isMainCourse {
            hasher.combine(isPremium)
        }
        return String(hasher.finalize())
    }

    private func mapContentToken(useSplitLayout: Bool) -> AnyHashable {
        var hasher = Hasher()
        hasher.combine(layoutSignature)
        hasher.combine(frontierLessonId)
        hasher.combine(accessibleBlockIndex)
        hasher.combine(allCleared)
        hasher.combine(selectedLesson?.id)
        hasher.combine(useSplitLayout)
        return hasher.finalize()
    }

    private var completedCount: Int {
        lessons.filter { completedLessonIds.contains($0.id) }.count
    }

    /// iPad のみ 2 カラム (リスト + マップ) にする。
    /// iPhone は Max 系の横向き (hSize == .regular) でも 1 カラムで固定。
    private var useSplitLayout: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    /// iPhone のみインラインタイトル用レイアウト（iPad は従来の中心波形）。
    private static func phoneInlineTitlesPreferred() -> Bool {
        UIDevice.current.userInterfaceIdiom != .pad
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

            if isLoadingLessons && lessons.isEmpty {
                ProgressView()
                    .tint(.purple)
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
            onCompletedIdsChanged?(completedLessonIds)
        }
        .task {
            let hadLessons = !lessons.isEmpty
            await loadCourseContentIfNeeded()
            if !hadLessons {
                recomputeJourney()
            } else if locale == .en {
                recomputeJourney()
            }
        }
        .onChange(of: appState.locale) { _ in
            recomputeJourney()
        }
        .onChange(of: appState.profile?.rank) { _ in
            guard course.isMainCourse == true else { return }
            recomputeJourney()
        }
        .onChange(of: appState.isPremium) { _ in
            guard course.isMainCourse == true else { return }
            recomputeJourney()
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
            let rawScale = min(max(0.7, width / LessonJourneyLayoutConstants.logicalWidth), 2.2)
            let scale = (rawScale * 100).rounded() / 100
            let contentHeight = ceil(layout.totalHeight * scale)
            let splitLayout = useSplitLayout
            let contentToken = mapContentToken(useSplitLayout: splitLayout)

            ZStack {
                LessonJourneyBackgroundView(widthPx: width, heightPx: height)
                    .allowsHitTesting(false)

                UIKitVerticalScrollView(
                    contentSize: CGSize(width: width, height: contentHeight),
                    scrollTargetY: $scrollTargetY,
                    animated: scrollAnimated,
                    contentToken: contentToken
                ) {
                    LessonJourneyMapContent(
                        layout: layout,
                        lessons: lessons,
                        locale: locale,
                        courseTitle: course.localizedTitle(locale),
                        accessGraph: accessGraph,
                        frontierLessonId: frontierLessonId,
                        accessibleBlockIndex: accessibleBlockIndex,
                        allCleared: allCleared,
                        selectedLessonId: selectedLesson?.id,
                        useSplitLayout: splitLayout,
                        width: width,
                        scale: scale,
                        contentHeight: contentHeight,
                        bandYPx: bandYPx(for:scale:),
                        onSelect: handleSelect
                    )
                }
                .onAppear {
                    requestScrollToFrontier(scale: scale, animated: false)
                }
                .onChange(of: layoutSignature) { _ in
                    didInitialScroll = false
                    requestScrollToFrontier(scale: scale, animated: false)
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

    // MARK: - Helpers

    private func blockLabel(for lesson: Lesson) -> String {
        if locale == .en, let en = lesson.blockNameEn, !en.isEmpty { return en }
        if let name = lesson.blockName, !name.isEmpty { return name }
        let bn = lesson.blockNumber ?? 1
        return locale == .ja ? "ブロック \(bn)" : "Block \(bn)"
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
            scrollTargetY = ceil(node.y * scale)
        } else {
            scrollTargetY = ceil(layout.totalHeight * scale)
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
            recomputeJourney()
            onCompletedIdsChanged?(done)
        } catch {
            // keep existing
        }
    }

    private func loadCourseContentIfNeeded() async {
        guard lessons.isEmpty else { return }
        isLoadingLessons = true
        defer { isLoadingLessons = false }
        do {
            let raw = try await SupabaseService.shared.fetchLessons(courseId: course.id)
            let sorted = raw.sorted { lhs, rhs in
                let leftBlock = lhs.blockNumber ?? 1
                let rightBlock = rhs.blockNumber ?? 1
                if leftBlock != rightBlock {
                    return leftBlock < rightBlock
                }
                return lhs.orderIndex < rhs.orderIndex
            }
            var done = Set<UUID>()
            if let userId = appState.profile?.id {
                if let progress = try? await SupabaseService.shared.fetchLessonProgress(
                    courseId: course.id,
                    userId: userId
                ) {
                    done = Set(progress.filter(\.completed).map(\.lessonId))
                }
            }
            lessons = sorted
            completedLessonIds = done
            onLessonsUpdated?(sorted)
        } catch {
            lessons = []
        }
    }
}

// MARK: - Map content

private struct LessonJourneyMapContent: View {
    let layout: LessonJourneyLayout
    let lessons: [Lesson]
    let locale: AppLocale
    let courseTitle: String
    let accessGraph: LessonJourneyAccessGraph
    let frontierLessonId: UUID?
    let accessibleBlockIndex: Int
    let allCleared: Bool
    let selectedLessonId: UUID?
    let useSplitLayout: Bool
    let width: CGFloat
    let scale: CGFloat
    let contentHeight: CGFloat
    let bandYPx: (LessonJourneyBlockLayout, CGFloat) -> CGFloat
    let onSelect: (Lesson) -> Void

    private var lessonsById: [UUID: Lesson] {
        Dictionary(uniqueKeysWithValues: lessons.map { ($0.id, $0) })
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
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
                        yPx: bandYPx(block, scale),
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
                    label: courseTitle
                )

                ForEach(layout.blocks) { block in
                    ForEach(block.lessonNodes) { node in
                        LessonJourneyNodeView(
                            node: node,
                            scale: scale,
                            accessState: accessState(for: node),
                            isFrontier: node.lessonId == frontierLessonId && block.blockIndex <= accessibleBlockIndex,
                            selected: selectedLessonId == node.lessonId,
                            dim: block.blockIndex > accessibleBlockIndex,
                            onSelect: {
                                if let lessonId = node.lessonId,
                                   let lesson = lessonsById[lessonId] {
                                    onSelect(lesson)
                                }
                            }
                        )
                    }
                }

                if !useSplitLayout {
                    ForEach(layout.blocks) { block in
                        ForEach(block.lessonNodes) { node in
                            if let lessonId = node.lessonId,
                               let lesson = lessonsById[lessonId] {
                                let dimBlock = block.blockIndex > accessibleBlockIndex
                                let titleMaxLogical = max(84, layout.logicalWidth - node.x - 8)
                                let titleMaxPx = titleMaxLogical * scale
                                let nodeRadiusPx = 24 * scale
                                let gapPx: CGFloat = 8
                                let titleCenterX = node.x * scale + nodeRadiusPx + gapPx + titleMaxPx / 2
                                Text(lesson.localizedTitle(locale))
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(Color.white.opacity(dimBlock ? 0.38 : 0.92))
                                    .lineLimit(2)
                                    .multilineTextAlignment(.leading)
                                    .frame(width: titleMaxPx, alignment: .leading)
                                    .position(x: titleCenterX, y: node.y * scale)
                                    .allowsHitTesting(false)
                            }
                        }
                    }
                }

                if let frontierNode = layout.allNodes.first(where: { $0.lessonId == frontierLessonId }) {
                    SurvivalDescentCharacterView(
                        xPx: frontierNode.x * scale,
                        yPx: frontierNode.y * scale,
                        scale: scale,
                        facing: frontierFacing(for: frontierNode),
                        animateBreathe: false
                    )
                } else if allCleared {
                    SurvivalDescentCharacterView(
                        xPx: layout.goal.x * scale,
                        yPx: layout.goal.y * scale,
                        scale: scale,
                        facing: .center,
                        animateBreathe: false
                    )
                }
            }
            .frame(width: layout.logicalWidth * scale, height: contentHeight)
            .offset(x: max(0, (width - layout.logicalWidth * scale) / 2))
        }
        .frame(width: width, height: contentHeight)
    }

    private func accessState(for node: LessonJourneyNode) -> LessonJourneyAccessGraph.LessonState {
        guard let id = node.lessonId else {
            return LessonJourneyAccessGraph.LessonState(isUnlocked: false, isCompleted: false)
        }
        return accessGraph.lessonStates[id] ?? LessonJourneyAccessGraph.LessonState(isUnlocked: false, isCompleted: false)
    }

    private func bandLabels(for block: LessonJourneyBlockLayout) -> (main: String, sub: String?) {
        let en = block.blockNameEn?.isEmpty == false ? block.blockNameEn : nil
        if locale == .en {
            if let en {
                return (main: en, sub: nil)
            }
            return (main: block.blockName, sub: nil)
        }
        return (main: block.blockName, sub: en)
    }

    private func frontierFacing(for frontierNode: LessonJourneyNode) -> SurvivalDescentCharacterView.Facing {
        guard frontierNode.blockIndex >= 0, frontierNode.blockIndex < layout.blocks.count else {
            return .center
        }
        let block = layout.blocks[frontierNode.blockIndex]
        guard let indexInBlock = block.lessonNodes.firstIndex(where: { $0.id == frontierNode.id }) else {
            return .center
        }
        let nextInBlock: LessonJourneyNode? = {
            let j = indexInBlock + 1
            guard j < block.lessonNodes.count else { return nil }
            return block.lessonNodes[j]
        }()
        let nextBlockFirst: LessonJourneyNode? = {
            let bi = frontierNode.blockIndex + 1
            guard bi < layout.blocks.count else { return nil }
            return layout.blocks[bi].lessonNodes.first
        }()
        let next = nextInBlock ?? nextBlockFirst ?? layout.goal

        if next.x > frontierNode.x + 1 { return .right }
        if next.x < frontierNode.x - 1 { return .left }
        return .center
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

    static func build(
        lessons: [Lesson],
        completedIds: Set<UUID>,
        enforceSequentialWithinBlocks: Bool = false
    ) -> LessonJourneyAccessGraph {
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
            for (lessonIndex, lesson) in blockLessons.enumerated() {
                let previousLesson = lessonIndex > 0 ? blockLessons[lessonIndex - 1] : nil
                let previousLessonCompleted = previousLesson.map { completedIds.contains($0.id) } ?? true
                let completedLesson = completedIds.contains(lesson.id)
                lessonStates[lesson.id] = LessonState(
                    isUnlocked: unlocked && (!enforceSequentialWithinBlocks || previousLessonCompleted || completedLesson),
                    isCompleted: completedLesson
                )
            }
        }
        return LessonJourneyAccessGraph(lessonStates: lessonStates, blockStates: blockStates)
    }
}
