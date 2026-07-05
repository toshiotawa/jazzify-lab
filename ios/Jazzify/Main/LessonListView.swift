import AVKit
import SwiftUI
import UIKit
import WebKit

struct LessonListView: View {
    @EnvironmentObject var appState: AppState
    @State private var courses: [Course] = []
    @State private var mainQuestCourse: Course?
    @State private var lessonsMap: [UUID: [Lesson]] = [:]
    @State private var progressMap: [UUID: Set<UUID>] = [:]
    @State private var isLoading = true
    @State private var showLessonInfo = false
    @State private var showSubscription = false
    @State private var showingAllCourses = false
    @State private var selectedMainQuestBlockNumber: Int?
    @State private var journeyCourse: JourneyCourseLaunch?
    @State private var lessonToOpen: Lesson?
    /// マップを閉じたあと進捗を同期する対象（一覧で再 fetch するコース）
    @State private var lastJourneyCourseId: UUID?
    @State private var isSoundMuted: Bool = LessonMapAudio.shared.isMuted
    @State private var chapterScrollTargetY: CGFloat?
    @State private var chapterScrollAnimated = false
    @State private var chapterDetailScrollTargetY: CGFloat?
    @State private var chapterDetailScrollAnimated = false
    /// iPad のチャプター列が伸びたときのビューポート高さ（スクロール中央合わせに使用）
    @State private var chapterListViewportHeight: CGFloat = 140
    @State private var lessonTabVisibleTick = 0

    private var locale: AppLocale { appState.locale }

    /// クエスト一覧・マップ画面でのみ BGM を再開（詳細・マップ push 中は鳴らさない）。
    private func resumeQuestBgmIfEligible() {
        guard journeyCourse == nil, lessonToOpen == nil else { return }
        guard !LessonMapAudio.shared.isMuted else { return }
        LessonMapAudio.shared.play()
    }

    private struct JourneyCourseLaunch: Identifiable {
        let id: UUID
        let course: Course
    }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                Color(hex: "0f172a").ignoresSafeArea()

                if isLoading {
                    ProgressView()
                        .tint(.purple)
                } else if courses.isEmpty && mainQuestCourse == nil {
                    VStack(spacing: 12) {
                        Image(systemName: "book.closed")
                            .font(.system(size: 48))
                            .foregroundStyle(.gray)
                        Text(locale == .ja ? "クエストがありません" : "No quests available")
                            .foregroundStyle(.gray)
                    }
                } else {
                    ScrollViewReader { pageProxy in
                        ScrollView {
                            LazyVStack(spacing: 12) {
                                if let bannerKind = appState.paymentIssueBannerKind {
                                    PaymentIssueBannerView(kind: bannerKind, locale: locale)
                                }

                                if showingAllCourses {
                                    allSpecificCoursesContent
                                } else {
                                    if let mainQuest = mainQuestState {
                                        mainQuestDashboard(
                                            mainQuest,
                                            onContinue: {
                                                continueMainQuest(mainQuest)
                                                if UIDevice.current.userInterfaceIdiom != .pad {
                                                    withAnimation(.easeInOut(duration: 0.24)) {
                                                        pageProxy.scrollTo("mainQuestDetail", anchor: .top)
                                                    }
                                                }
                                            }
                                        )
                                    }
                                    specificCoursesPreview
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
            .navigationTitle(locale == .ja ? "クエスト" : "Quests")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .task { await loadCourses() }
            .onAppear {
                lessonTabVisibleTick += 1
                Task { await appState.ensureFreshBilling() }
                isSoundMuted = LessonMapAudio.shared.isMuted
                resumeQuestBgmIfEligible()
            }
            .navigationDestination(
                isPresented: Binding(
                    get: { journeyCourse != nil },
                    set: { if !$0 { journeyCourse = nil } }
                )
            ) {
                if let launch = journeyCourse {
                    LessonJourneyView(
                        course: launch.course,
                        lessons: lessonsMap[launch.course.id] ?? [],
                        completedLessonIds: progressMap[launch.course.id] ?? [],
                        onCompletedIdsChanged: { ids in
                            progressMap[launch.course.id] = ids
                        },
                        onLessonsUpdated: { lessons in
                            lessonsMap[launch.course.id] = lessons
                        }
                    )
                    .id(launch.course.id)
                }
            }
            .navigationDestination(
                isPresented: Binding(
                    get: { lessonToOpen != nil },
                    set: { if !$0 { lessonToOpen = nil } }
                )
            ) {
                if let lesson = lessonToOpen {
                    LessonDetailView(lesson: lesson)
                }
            }
            .onChange(of: journeyCourse == nil) { isNil in
                guard isNil, let courseId = lastJourneyCourseId else { return }
                lastJourneyCourseId = nil
                Task { await reloadProgressForCourse(courseId: courseId) }
            }
            .onChange(of: lessonToOpen?.id) { _ in
                resumeQuestBgmIfEligible()
            }
            .onChange(of: journeyCourse?.id) { _ in
                resumeQuestBgmIfEligible()
            }
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        let muted = LessonMapAudio.shared.toggleMuted()
                        isSoundMuted = muted
                        if !muted {
                            resumeQuestBgmIfEligible()
                        }
                    } label: {
                        Image(systemName: isSoundMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                            .foregroundStyle(.white)
                    }
                    Button { showLessonInfo = true } label: {
                        Image(systemName: "info.circle")
                            .foregroundStyle(.gray)
                    }
                }
            }
            .sheet(isPresented: $showSubscription) {
                SubscriptionView()
            }
            .sheet(isPresented: $showLessonInfo) {
                FeatureInfoModal(
                    icon: "book.fill",
                    iconColor: .purple,
                    title: locale == .ja ? "クエスト" : "Quests",
                    description: locale == .ja
                        ? "コース形式のクエストで体系的にジャズを学べます。各クエストには動画解説と実習課題があり、課題をクリアすると次のクエストがアンロックされます。ブロックごとに進捗を管理し、段階的にスキルアップできます。"
                        : "Learn jazz systematically through structured course quests. Each quest includes video explanations and practice tasks. Complete tasks to unlock the next quest. Progress is tracked by blocks, allowing you to level up step by step.",
                    locale: locale
                )
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
            }
        }
    }

    private struct MainQuestBlockState: Identifiable {
        let id: Int
        let blockNumber: Int
        let title: String
        let description: String?
        let lessons: [Lesson]
        let completedCount: Int
        let totalCount: Int
        let isUnlocked: Bool
        let isCompleted: Bool
        let isCurrent: Bool
        let stageNumber: Int
    }

    private struct MainQuestViewState {
        let course: Course
        let lessons: [Lesson]
        let accessGraph: LessonJourneyAccessGraph
        let blocks: [MainQuestBlockState]
        let currentBlock: MainQuestBlockState
        let frontierLesson: Lesson?
        let continueLesson: Lesson?
        let completedLessons: Int
        let totalLessons: Int
    }

    /// チャプター一覧の行高さ・ビューポート計算（固定行高スクロールと実表示を一致させる）
    private enum MainQuestChapterListLayout {
        static let rowHeight: CGFloat = 66
        static let rowSpacing: CGFloat = 8
        static var scrollViewportHeight: CGFloat { 2 * rowHeight + rowSpacing }
    }

    /// Current 章レッスン一覧の行高さ・ビューポート計算（固定行高スクロールと実表示を一致させる）
    private enum MainQuestLessonListLayout {
        static let rowHeight: CGFloat = 58
        static let rowSpacing: CGFloat = 6
        static var scrollViewportHeight: CGFloat { 3 * rowHeight + 2 * rowSpacing }
    }

    private var mainQuestState: MainQuestViewState? {
        guard let course = mainQuestCourse else { return nil }
        let lessons = sortedLessons(lessonsMap[course.id] ?? [])
        guard !lessons.isEmpty else { return nil }

        let completedIds = progressMap[course.id] ?? []
        let graphBuilt = LessonJourneyAccessGraph.build(
            lessons: lessons,
            completedIds: completedIds,
            enforceSequentialWithinBlocks: true
        )
        let accessGraph = MainQuestFreeTier.applyLocks(
            graph: graphBuilt,
            lessons: lessons,
            isPremium: appState.isPremium
        )

        let frontierLesson = lessons.first { lesson in
            let state = accessGraph.lessonStates[lesson.id]
            return state?.isUnlocked == true && state?.isCompleted != true
        }

        let unlockedInOrder = lessons.filter { lesson in
            accessGraph.lessonStates[lesson.id]?.isUnlocked == true
        }
        let currentLesson =
            frontierLesson
                ?? unlockedInOrder.last
                ?? lessons.first
        let currentBlockNumber = currentLesson?.blockNumber ?? lessons.first?.blockNumber ?? 1

        var groups: [Int: [Lesson]] = [:]
        var order: [Int] = []
        for lesson in lessons {
            let blockNumber = lesson.blockNumber ?? 1
            if groups[blockNumber] == nil { order.append(blockNumber) }
            groups[blockNumber, default: []].append(lesson)
        }

        let blocks: [MainQuestBlockState] = order.enumerated().map { index, blockNumber in
            let blockLessons = groups[blockNumber] ?? []
            let first = blockLessons.first
            let completed = blockLessons.filter { completedIds.contains($0.id) }.count
            let blockState = accessGraph.blockStates[blockNumber]
            return MainQuestBlockState(
                id: blockNumber,
                blockNumber: blockNumber,
                title: blockTitle(first, blockNumber: blockNumber),
                description: blockDescription(first),
                lessons: blockLessons,
                completedCount: completed,
                totalCount: blockLessons.count,
                isUnlocked: (blockState?.isUnlocked) ?? (index == 0),
                isCompleted: blockState?.isCompleted ?? false,
                isCurrent: blockNumber == currentBlockNumber,
                stageNumber: index + 1
            )
        }
        guard let currentBlock = blocks.first(where: { $0.isCurrent }) ?? blocks.first else { return nil }
        let continueLesson = frontierLesson ?? currentBlock.lessons.last ?? lessons.last

        return MainQuestViewState(
            course: course,
            lessons: lessons,
            accessGraph: accessGraph,
            blocks: blocks,
            currentBlock: currentBlock,
            frontierLesson: frontierLesson,
            continueLesson: continueLesson,
            completedLessons: completedIds.intersection(Set(lessons.map(\.id))).count,
            totalLessons: lessons.count
        )
    }

    private var allSpecificCoursesContent: some View {
        VStack(spacing: 12) {
            HStack(spacing: 10) {
                Button {
                    showingAllCourses = false
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.subheadline.bold())
                        .foregroundStyle(Color(hex: "c4b5fd"))
                        .frame(width: 34, height: 34)
                        .background(Color.black.opacity(0.25), in: Circle())
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(locale == .ja ? "目的別コース" : "Specific Courses")
                        .font(.title3.bold())
                        .foregroundStyle(.white)
                    Text(locale == .ja ? "メインクエスト以外のコース" : "Focused courses outside the main quest")
                        .font(.caption)
                        .foregroundStyle(Color(hex: "c4b5fd").opacity(0.8))
                }
                Spacer()
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            ForEach(CourseDifficultyTier.displayOrder, id: \.rawValue) { tier in
                let tierCourses = courses.filter { $0.resolvedDifficultyTier == tier }
                if !tierCourses.isEmpty {
                    Text(tier.sectionTitle(locale: locale))
                        .font(.subheadline.bold())
                        .foregroundStyle(Color.purple.opacity(0.9))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 4)
                        .padding(.top, 4)
                    ForEach(tierCourses) { course in
                        courseRow(course)
                    }
                }
            }
        }
    }

    private var specificCoursesPreview: some View {
        Group {
            if !courses.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    sectionHeader(
                        icon: "sparkles",
                        title: locale == .ja ? "目的別コース" : "Specific Courses"
                    )

                    Button {
                        showingAllCourses = true
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack(alignment: .center, spacing: 8) {
                                Text(locale == .ja ? "すべてのコースを見る" : "Browse all courses")
                                    .font(.headline.weight(.bold))
                                    .foregroundStyle(.white)
                                    .multilineTextAlignment(.leading)
                                Spacer(minLength: 8)
                                Image(systemName: "chevron.right.circle.fill")
                                    .font(.title3)
                                    .foregroundStyle(Color(hex: "fde68a"))
                            }
                            Text(locale == .ja
                                 ? "レベル別・テーマ別のコース一覧へ進みます。"
                                 : "Open the full catalog of topic-based quests by level.")
                                .font(.subheadline)
                                .foregroundStyle(Color(hex: "e9d5ff").opacity(0.9))
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            Color(hex: "5b21b6").opacity(0.45),
                                            Color(hex: "86198f").opacity(0.35),
                                            Color(hex: "b45309").opacity(0.22),
                                        ],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color(hex: "fde68a").opacity(0.42), lineWidth: 2)
                                )
                        )
                        .shadow(color: .black.opacity(0.35), radius: 14, y: 6)
                    }
                    .buttonStyle(.plain)

                    ForEach(MainQuestPreviewCourses.pick(from: courses)) { course in
                        courseRow(course, compact: true)
                    }
                }
                .padding(12)
                .background(questPanelBackground)
            }
        }
    }

    private func mainQuestDashboard(
        _ state: MainQuestViewState,
        onContinue: @escaping () -> Void
    ) -> some View {
        VStack(spacing: 12) {
            continueCard(state, onContinue: onContinue)

            if !appState.isPremium {
                mainQuestFreeTierUpsellBanner()
            }

            if UIDevice.current.userInterfaceIdiom == .pad {
                HStack(alignment: .top, spacing: 12) {
                    journeyPanel(state)
                        .frame(maxHeight: .infinity, alignment: .top)
                    currentChapterDetailPanel(state)
                        .frame(maxHeight: .infinity, alignment: .top)
                        .id("mainQuestDetail")
                }
            } else {
                VStack(spacing: 12) {
                    journeyPanel(state)
                    currentChapterDetailPanel(state)
                        .id("mainQuestDetail")
                }
            }
        }
    }

    private func continueCard(_ state: MainQuestViewState, onContinue: @escaping () -> Void) -> some View {
        Button {
            onContinue()
        } label: {
            ZStack(alignment: .leading) {
                QuestStageArtwork(stageNumber: state.currentBlock.stageNumber, rectangular: true)
                LinearGradient(
                    colors: [.black.opacity(0.86), .black.opacity(0.52), .black.opacity(0.12)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 8) {
                        Image(systemName: "play.fill")
                            .font(.caption)
                            .foregroundStyle(Color(hex: "c4b5fd"))
                        Text(locale == .ja ? "続きから始める" : "Continue")
                            .font(.title3.bold())
                            .foregroundStyle(.white)
                    }
                    Text("\(locale == .ja ? "チャプター" : "Chapter") \(state.currentBlock.blockNumber): \(state.currentBlock.title)")
                        .font(.subheadline)
                        .foregroundStyle(Color(hex: "e9d5ff"))
                    Text(locale == .ja
                         ? "クエスト \(state.currentBlock.completedCount) / \(state.currentBlock.totalCount)"
                         : "Quest \(state.currentBlock.completedCount) / \(state.currentBlock.totalCount)")
                        .font(.caption)
                        .foregroundStyle(Color(hex: "c4b5fd"))
                    progressBar(done: state.currentBlock.completedCount, total: state.currentBlock.totalCount)
                        .frame(maxWidth: 320)
                    if let next = state.continueLesson {
                        Text("Next: \(next.localizedTitle(locale))")
                            .font(.caption)
                            .foregroundStyle(Color(hex: "fde68a"))
                            .lineLimit(1)
                    }
                }
                .padding(18)
                .frame(maxWidth: 560, alignment: .leading)
            }
            .frame(minHeight: 138)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.purple.opacity(0.55), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func mainQuestFreeTierUpsellBanner() -> some View {
        Button {
            showSubscription = true
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "lock.fill")
                    .foregroundStyle(.yellow)
                VStack(alignment: .leading, spacing: 2) {
                    Text(locale == .ja
                         ? "フリープランはメインクエスト第1チャプターまでプレイできます"
                         : "Free plan: Main Quest chapter 1 only")
                        .font(.caption.bold())
                        .foregroundStyle(.white)
                    Text(locale == .ja
                         ? "プレミアムですべてのチャプターと目的別コースを解放 →"
                         : "Subscribe for all chapters and topic courses →")
                        .font(.caption2)
                        .foregroundStyle(Color(hex: "fde68a"))
                }
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Color.yellow.opacity(0.08))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.yellow.opacity(0.4), lineWidth: 1)
            )
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func mainQuestChapterScrollContent(
        state: MainQuestViewState,
        totalH: CGFloat,
        geo: GeometryProxy
    ) -> some View {
        let spacing = MainQuestChapterListLayout.rowSpacing
        let isPadColumn = UIDevice.current.userInterfaceIdiom == .pad
        let viewportH = geo.size.height
        let contentH = isPadColumn ? max(totalH, viewportH) : totalH
        let padCentered = isPadColumn && contentH > totalH

        UIKitVerticalScrollView(
            contentSize: CGSize(width: max(1, geo.size.width), height: contentH),
            scrollTargetY: $chapterScrollTargetY,
            animated: chapterScrollAnimated,
            delaysContentTouches: true
        ) {
            Group {
                if padCentered {
                    VStack(spacing: spacing) {
                        Spacer(minLength: 0)
                        ForEach(state.blocks) { block in
                            chapterRow(block, state: state)
                        }
                        Spacer(minLength: 0)
                    }
                    .frame(minHeight: contentH)
                } else {
                    VStack(spacing: spacing) {
                        ForEach(state.blocks) { block in
                            chapterRow(block, state: state)
                        }
                    }
                }
            }
        }
        // SwiftUI の `onChange` ハンドラはクロージャ生成時の `state` をキャプチャするため、
        // 進捗反映で `mainQuestState` が新しい値に再計算されても古い `state` が使われてしまう。
        // ここでは常に最新の `mainQuestState` を再参照してスクロール要求を行う。
        .onAppear {
            chapterListViewportHeight = geo.size.height
            if let latest = mainQuestState {
                requestChapterListScroll(for: latest, animated: false)
            }
        }
        .onChange(of: lessonTabVisibleTick) { _ in
            guard let latest = mainQuestState else { return }
            requestChapterListScroll(for: latest, animated: false)
        }
        .onChange(of: geo.size.height) { _ in
            chapterListViewportHeight = geo.size.height
            guard let latest = mainQuestState else { return }
            requestChapterListScroll(for: latest, animated: false)
        }
        .onChange(of: state.blocks.count) { _ in
            guard let latest = mainQuestState else { return }
            requestChapterListScroll(for: latest, animated: false)
        }
        .onChange(of: state.currentBlock.blockNumber) { _ in
            guard let latest = mainQuestState else { return }
            requestChapterListScroll(for: latest, animated: false)
        }
        .onChange(of: selectedMainQuestBlockNumber) { _ in
            guard let latest = mainQuestState else { return }
            requestChapterListScroll(for: latest, animated: false)
        }
    }

    private func journeyPanel(_ state: MainQuestViewState) -> some View {
        let rowH = MainQuestChapterListLayout.rowHeight
        let count = state.blocks.count
        let totalH =
            CGFloat(count) * rowH
                + CGFloat(max(0, count - 1)) * MainQuestChapterListLayout.rowSpacing
        let isPadColumn = UIDevice.current.userInterfaceIdiom == .pad

        return VStack(alignment: .leading, spacing: 10) {
            sectionHeader(
                icon: "book",
                title: locale == .ja ? "チャプター" : "Chapters"
            )

            Group {
                if isPadColumn {
                    GeometryReader { geo in
                        mainQuestChapterScrollContent(state: state, totalH: totalH, geo: geo)
                    }
                    .frame(maxHeight: .infinity)
                } else {
                    GeometryReader { geo in
                        mainQuestChapterScrollContent(state: state, totalH: totalH, geo: geo)
                    }
                    .frame(height: MainQuestChapterListLayout.scrollViewportHeight)
                }
            }
        }
        .frame(maxHeight: isPadColumn ? .infinity : nil, alignment: .top)
        .padding(12)
        .background(questPanelBackground)
    }

    private func chapterRow(
        _ block: MainQuestBlockState,
        state: MainQuestViewState
    ) -> some View {
        let isSelected = selectedBlock(in: state).blockNumber == block.blockNumber
        return DragCancellableTapRow(isEnabled: true) {
            if !appState.isPremium && block.blockNumber > MainQuestFreeTier.maxFreeBlockNumber {
                Task {
                    let premium = await appState.ensureFreshBilling()
                    if !premium {
                        await MainActor.run { showSubscription = true }
                    }
                }
                return
            }
            guard block.isUnlocked else { return }
            selectedMainQuestBlockNumber = block.blockNumber
        } label: {
            HStack(spacing: 10) {
                QuestStageArtwork(stageNumber: block.stageNumber, rectangular: false)
                    .frame(width: 46, height: 46)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                VStack(alignment: .leading, spacing: 2) {
                    Text("\(locale == .ja ? "チャプター" : "Chapter") \(block.blockNumber)")
                        .font(.caption2)
                        .foregroundStyle(Color(hex: "c4b5fd").opacity(0.8))
                    Text(block.title)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                        .lineLimit(1)
                }
                Spacer()
                if block.isCompleted {
                    Text("Cleared")
                        .font(.caption2.bold())
                        .foregroundStyle(Color(hex: "86efac"))
                } else if block.isCurrent {
                    Text("Current")
                        .font(.caption2.bold())
                        .foregroundStyle(Color(hex: "c4b5fd"))
                } else if !block.isUnlocked {
                    Image(systemName: "lock.fill")
                        .font(.caption)
                        .foregroundStyle(.gray)
                } else {
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(Color(hex: "c4b5fd"))
                }
            }
            .padding(10)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.green.opacity(0.10) : Color.white.opacity(0.04))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isSelected ? Color.green.opacity(0.65) : Color.purple.opacity(0.18), lineWidth: 1)
                    )
            )
            .frame(height: MainQuestChapterListLayout.rowHeight, alignment: .center)
        }
        .opacity(block.isUnlocked ? 1 : 0.58)
    }

    private func currentChapterDetailPanel(_ state: MainQuestViewState) -> some View {
        let block = selectedBlock(in: state)
        let startLesson = chapterDetailTargetLesson(in: block, state: state)
        return VStack(alignment: .leading, spacing: 10) {
            sectionHeader(
                icon: "flag.checkered",
                title: locale == .ja ? "現在の章の詳細" : "Current Chapter Detail"
            )
            ZStack(alignment: .leading) {
                QuestStageArtwork(stageNumber: block.stageNumber, rectangular: true)
                LinearGradient(
                    colors: [.black.opacity(0.84), .black.opacity(0.5), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                VStack(alignment: .leading, spacing: 6) {
                    Text("\(locale == .ja ? "チャプター" : "Chapter") \(block.blockNumber)")
                        .font(.caption)
                        .foregroundStyle(Color(hex: "c4b5fd"))
                    Text(block.title)
                        .font(.headline)
                        .foregroundStyle(.white)
                    if let description = block.description, !description.isEmpty {
                        Text(description)
                            .font(.caption)
                            .foregroundStyle(Color(hex: "e9d5ff").opacity(0.86))
                            .lineLimit(2)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text(locale == .ja
                             ? "クリア済みクエスト \(block.completedCount) / \(block.totalCount)"
                             : "Quests cleared \(block.completedCount) / \(block.totalCount)")
                            .font(.caption2.bold())
                            .foregroundStyle(Color(hex: "bbf7d0"))
                        progressBar(done: block.completedCount, total: block.totalCount)
                    }
                    .frame(maxWidth: 260, alignment: .leading)
                }
                .padding(14)
                .frame(maxWidth: 520, alignment: .leading)
            }
            .frame(minHeight: 120)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.purple.opacity(0.35), lineWidth: 1)
            )

            chapterDetailLessonScroll(state: state, block: block, startLesson: startLesson)
                .id("chapter-detail-\(block.blockNumber)")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(questPanelBackground)
    }

    /// Current Chapter のレッスン一覧: 固定行高に基づき `UIKitVerticalScrollView` でスクロール位置を制御。
    private func chapterDetailLessonScroll(
        state: MainQuestViewState,
        block: MainQuestBlockState,
        startLesson: Lesson?
    ) -> some View {
        let spacing = MainQuestLessonListLayout.rowSpacing
        let count = block.lessons.count
        let totalH =
            CGFloat(count) * MainQuestLessonListLayout.rowHeight
            + CGFloat(max(0, count - 1)) * spacing

        return GeometryReader { geo in
            UIKitVerticalScrollView(
                contentSize: CGSize(width: max(1, geo.size.width), height: totalH),
                scrollTargetY: $chapterDetailScrollTargetY,
                animated: chapterDetailScrollAnimated,
                delaysContentTouches: true
            ) {
                VStack(spacing: spacing) {
                    ForEach(Array(block.lessons.enumerated()), id: \.element.id) { index, lesson in
                        lessonRow(
                            lesson,
                            index: index,
                            count: count,
                            state: state,
                            startLessonId: startLesson?.id
                        )
                            .id(lesson.id)
                    }
                }
            }
            .onAppear {
                requestChapterDetailScroll(for: block, startLesson: startLesson, animated: false)
            }
            .onChange(of: lessonTabVisibleTick) { _ in
                requestChapterDetailScroll(for: block, startLesson: startLesson, animated: false)
            }
            .onChange(of: geo.size.height) { _ in
                requestChapterDetailScroll(for: block, startLesson: startLesson, animated: false)
            }
            .onChange(of: block.blockNumber) { _ in
                requestChapterDetailScroll(for: block, startLesson: startLesson, animated: true)
            }
            .onChange(of: startLesson?.id) { _ in
                requestChapterDetailScroll(for: block, startLesson: startLesson, animated: true)
            }
        }
        .frame(height: MainQuestLessonListLayout.scrollViewportHeight)
    }

    private func lessonRow(
        _ lesson: Lesson,
        index: Int,
        count: Int,
        state: MainQuestViewState,
        startLessonId: UUID?
    ) -> some View {
        let accessState = state.accessGraph.lessonStates[lesson.id]
        let isUnlocked = accessState?.isUnlocked ?? false
        let isCompleted = accessState?.isCompleted ?? false
        let isStartTarget = startLessonId == lesson.id
        let isFirst = index == 0
        let isLast = index == count - 1
        let nodeColumnWidth: CGFloat = 42
        let nodeDiameter: CGFloat = 32
        let lineColor = Color(hex: "c4b5fd").opacity(0.32)
        let nodeFill: Color = {
            if !isUnlocked { return Color(hex: "1e293b").opacity(0.88) }
            if isCompleted { return Color.green.opacity(0.78) }
            if isStartTarget { return Color(hex: "fbbf24").opacity(0.90) }
            return Color(hex: "a78bfa").opacity(0.82)
        }()
        let nodeStroke: Color = {
            if !isUnlocked { return Color.gray.opacity(0.42) }
            if isCompleted { return Color(hex: "bbf7d0").opacity(0.82) }
            if isStartTarget { return Color(hex: "fef3c7").opacity(0.95) }
            return Color(hex: "ddd6fe").opacity(0.72)
        }()
        let nodeTextColor: Color = {
            if !isUnlocked { return .gray }
            if isCompleted || isStartTarget { return Color(hex: "1f2937") }
            return Color(hex: "1f1147")
        }()

        return DragCancellableTapRow(isEnabled: isUnlocked) {
            let bn = lesson.blockNumber ?? 1
            if let mqId = mainQuestCourse?.id,
               lesson.courseId == mqId,
               !appState.isPremium,
               bn > MainQuestFreeTier.maxFreeBlockNumber {
                Task {
                    let premium = await appState.ensureFreshBilling()
                    if !premium {
                        await MainActor.run { showSubscription = true }
                    }
                }
                return
            }
            lessonToOpen = lesson
        } label: {
            HStack(spacing: 10) {
                ZStack {
                    if count > 1 {
                        VStack(spacing: 0) {
                            if isFirst {
                                Color.clear
                                    .frame(height: MainQuestLessonListLayout.rowHeight / 2)
                            }
                            Rectangle()
                                .fill(lineColor)
                                .frame(width: 1.5)
                                .frame(maxHeight: .infinity)
                            if isLast {
                                Color.clear
                                    .frame(height: MainQuestLessonListLayout.rowHeight / 2)
                            }
                        }
                        .frame(width: nodeColumnWidth, height: MainQuestLessonListLayout.rowHeight)
                    }

                    if isStartTarget {
                        Image("survival_muki_shita")
                            .resizable()
                            .interpolation(.medium)
                            .scaledToFit()
                            .frame(width: 32, height: 32)
                            .offset(y: -18)
                            .shadow(color: .black.opacity(0.5), radius: 6, y: 4)
                            .zIndex(3)
                    }

                    Circle()
                        .fill(nodeFill)
                        .frame(width: nodeDiameter, height: nodeDiameter)
                        .overlay(
                            Circle()
                                .stroke(nodeStroke, lineWidth: 2)
                        )
                        .shadow(
                            color: isStartTarget ? Color(hex: "fbbf24").opacity(0.35) : Color.black.opacity(0.18),
                            radius: isStartTarget ? 8 : 4,
                            y: isStartTarget ? 2 : 1
                        )
                        .zIndex(1)

                    if isUnlocked {
                        Text("\(index + 1)")
                            .font(.caption.bold())
                            .foregroundStyle(nodeTextColor)
                            .zIndex(2)
                        if isCompleted {
                            Image(systemName: "checkmark")
                                .font(.system(size: 8, weight: .black))
                                .foregroundStyle(Color(hex: "064e3b"))
                                .frame(width: 13, height: 13)
                                .background(
                                    Circle()
                                        .fill(Color(hex: "bbf7d0"))
                                )
                                .overlay(
                                    Circle()
                                        .stroke(Color.white.opacity(0.72), lineWidth: 0.8)
                                )
                                .offset(x: 11, y: -11)
                                .zIndex(2.5)
                        }
                    } else {
                        Image(systemName: "lock.fill")
                            .font(.caption2)
                            .foregroundStyle(nodeTextColor)
                            .zIndex(2)
                    }
                }
                .frame(width: nodeColumnWidth, height: MainQuestLessonListLayout.rowHeight)

                Text(lesson.localizedTitle(locale))
                    .font(.subheadline.bold())
                    .foregroundStyle(isUnlocked ? .white : .gray)
                    .lineLimit(1)
                Spacer()
            }
            .padding(.horizontal, 8)
            .background(
                RoundedRectangle(cornerRadius: 11)
                    .fill(isStartTarget ? Color.green.opacity(0.10) : Color.purple.opacity(0.08))
                    .overlay(
                        RoundedRectangle(cornerRadius: 11)
                            .stroke(isStartTarget ? Color.green.opacity(0.85) : Color.purple.opacity(0.20), lineWidth: isStartTarget ? 1.5 : 1)
                    )
            )
            .frame(height: MainQuestLessonListLayout.rowHeight, alignment: .center)
        }
        .opacity(isUnlocked ? 1 : 0.58)
    }

    private var questPanelBackground: some View {
        RoundedRectangle(cornerRadius: 14)
            .fill(Color(hex: "0a061c").opacity(0.86))
            .shadow(color: .black.opacity(0.25), radius: 12, y: 6)
    }

    private func sectionHeader(icon: String, title: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(Color(hex: "fde68a"))
            Text(title)
                .font(.caption.bold())
                .foregroundStyle(Color(hex: "fde68a"))
        }
    }

    private func progressBar(done: Int, total: Int) -> some View {
        GeometryReader { geometry in
            let percent = total > 0 ? CGFloat(done) / CGFloat(total) : 0
            ZStack(alignment: .leading) {
                Capsule().fill(Color.black.opacity(0.48))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "c4b5fd"), Color(hex: "a855f7")],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geometry.size.width * min(max(percent, 0), 1))
            }
        }
        .frame(height: 5)
    }

    private func continueMainQuest(_ state: MainQuestViewState) {
        selectedMainQuestBlockNumber = state.currentBlock.blockNumber
    }

    private func rowCenterY(index: Int, rowHeight: CGFloat, rowSpacing: CGFloat) -> CGFloat {
        CGFloat(index) * (rowHeight + rowSpacing) + rowHeight / 2
    }

    private func chapterListTargetY(for state: MainQuestViewState) -> CGFloat {
        let rowH = MainQuestChapterListLayout.rowHeight
        let spacing = MainQuestChapterListLayout.rowSpacing
        let count = state.blocks.count
        let totalH = CGFloat(count) * rowH + CGFloat(max(0, count - 1)) * spacing

        let inset: CGFloat
        if UIDevice.current.userInterfaceIdiom == .pad {
            let vp = chapterListViewportHeight
            let contentH = max(totalH, vp)
            inset = contentH > totalH ? (contentH - totalH) / 2 : 0
        } else {
            inset = 0
        }

        let block = selectedBlock(in: state)
        let index = state.blocks.firstIndex { $0.blockNumber == block.blockNumber } ?? 0
        return inset + rowCenterY(
            index: index,
            rowHeight: rowH,
            rowSpacing: spacing
        )
    }

    private func requestChapterListScroll(for state: MainQuestViewState, animated: Bool) {
        chapterScrollAnimated = animated
        chapterScrollTargetY = chapterListTargetY(for: state)
    }

    private func chapterDetailTargetY(
        for block: MainQuestBlockState,
        startLesson: Lesson?
    ) -> CGFloat? {
        guard let targetId = startLesson?.id,
              let index = block.lessons.firstIndex(where: { $0.id == targetId })
        else {
            return nil
        }

        return rowCenterY(
            index: index,
            rowHeight: MainQuestLessonListLayout.rowHeight,
            rowSpacing: MainQuestLessonListLayout.rowSpacing
        )
    }

    private func requestChapterDetailScroll(
        for block: MainQuestBlockState,
        startLesson: Lesson?,
        animated: Bool
    ) {
        guard let targetY = chapterDetailTargetY(for: block, startLesson: startLesson) else { return }
        chapterDetailScrollAnimated = animated
        chapterDetailScrollTargetY = targetY
    }

    private func selectedBlock(in state: MainQuestViewState) -> MainQuestBlockState {
        if let selectedMainQuestBlockNumber,
           let block = state.blocks.first(where: { $0.blockNumber == selectedMainQuestBlockNumber && $0.isUnlocked }) {
            return block
        }
        return state.currentBlock
    }

    private func chapterDetailTargetLesson(
        in block: MainQuestBlockState,
        state: MainQuestViewState
    ) -> Lesson? {
        if block.isCompleted {
            return block.lessons.last
        }

        if let next = block.lessons.first(where: { lesson in
            let lessonState = state.accessGraph.lessonStates[lesson.id]
            return lessonState?.isUnlocked == true && lessonState?.isCompleted != true
        }) {
            return next
        }

        return block.lessons.last(where: { lesson in
            state.accessGraph.lessonStates[lesson.id]?.isUnlocked == true
        }) ?? block.lessons.first
    }

    private func sortedLessons(_ lessons: [Lesson]) -> [Lesson] {
        lessons.sorted { lhs, rhs in
            let leftBlock = lhs.blockNumber ?? 1
            let rightBlock = rhs.blockNumber ?? 1
            if leftBlock != rightBlock { return leftBlock < rightBlock }
            return lhs.orderIndex < rhs.orderIndex
        }
    }

    private func blockTitle(_ lesson: Lesson?, blockNumber: Int) -> String {
        if locale == .en, let en = lesson?.blockNameEn, !en.isEmpty { return en }
        if let name = lesson?.blockName, !name.isEmpty { return name }
        return locale == .ja ? "チャプター \(blockNumber)" : "Chapter \(blockNumber)"
    }

    private func blockDescription(_ lesson: Lesson?) -> String? {
        guard let lesson else { return nil }
        let primary = locale == .en ? lesson.blockDescriptionEn : lesson.blockDescription
        let fallback = locale == .en ? lesson.blockDescription : lesson.blockDescriptionEn
        let value = primary ?? fallback ?? lesson.localizedDescription(locale)
        return value?.replacingOccurrences(of: "\n", with: " ")
    }

    // MARK: - Course Row

    private func courseRow(_ course: Course, compact: Bool = false) -> some View {
        Button {
            handleCourseTap(course)
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(course.localizedTitle(locale))
                        .font(.headline)
                        .foregroundStyle(.white)

                    if let desc = course.localizedDescription(locale) {
                        Text(desc)
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .lineLimit(2)
                    }
                }

                Spacer()

                if let lessons = lessonsMap[course.id],
                   let completed = progressMap[course.id],
                   lessons.count > 0 {
                    let total = lessons.count
                    let done = min(completed.count, total)
                    let percent = Int((Double(done) / Double(total) * 100).rounded())
                    Text("\(percent)%")
                        .font(.caption.bold())
                        .foregroundStyle(progressColor(percent: percent))
                        .padding(.trailing, 4)
                }

                if !appState.isPremium && course.premiumOnly == true && course.isTutorial != true {
                    Image(systemName: "lock.fill")
                        .foregroundStyle(.purple)
                } else {
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.gray)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(compact ? 12 : 16)
            .background(Color(hex: "1e293b"), in: RoundedRectangle(cornerRadius: 12))
            .contentShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }

    private func handleCourseTap(_ course: Course) {
        let courseLocksForNonPremium = course.premiumOnly == true && course.isTutorial != true
        if courseLocksForNonPremium {
            Task {
                let premium = await appState.ensureFreshBilling()
                if !premium {
                    showSubscription = true
                    return
                }
                openJourney(for: course)
            }
            return
        }
        openJourney(for: course)
    }

    private func openJourney(for course: Course) {
        lastJourneyCourseId = course.id
        journeyCourse = JourneyCourseLaunch(id: course.id, course: course)
    }

    // MARK: - Data

    private func loadCourses() async {
        isLoading = true
        do {
            let allCourses = try await SupabaseService.shared.fetchCourses()
            let audienceFilter = locale == .en ? "global" : "japan"
            let filtered = allCourses.filter { course in
                let a = course.audience ?? "both"
                return a == "both" || a == audienceFilter
            }
            mainQuestCourse = allCourses.first(where: { $0.isMainCourse == true })
            courses = filtered.filter { $0.isMainCourse != true }.sorted { a, b in
                let ta = a.resolvedDifficultyTier.sortIndex
                let tb = b.resolvedDifficultyTier.sortIndex
                if ta != tb { return ta < tb }
                return a.orderIndex < b.orderIndex
            }
        } catch {
            courses = []
            mainQuestCourse = nil
        }
        isLoading = false
        await prefetchAllCourseProgress()
    }

    private func prefetchAllCourseProgress() async {
        let userId = appState.profile?.id
        let targetCourses = ([mainQuestCourse].compactMap { $0 } + courses)

        await withTaskGroup(of: (UUID, [Lesson]).self) { group in
            for course in targetCourses {
                group.addTask {
                    let lessons = (try? await SupabaseService.shared.fetchLessons(courseId: course.id)) ?? []
                    return (course.id, lessons)
                }
            }

            for await (courseId, lessons) in group {
                let sorted = lessons.sorted { lhs, rhs in
                    let leftBlock = lhs.blockNumber ?? 1
                    let rightBlock = rhs.blockNumber ?? 1
                    if leftBlock != rightBlock {
                        return leftBlock < rightBlock
                    }
                    return lhs.orderIndex < rhs.orderIndex
                }
                lessonsMap[courseId] = sorted
            }
        }

        guard let userId else { return }

        let priorityCount = min(8, targetCourses.count)
        let prioritySlice = Array(targetCourses.prefix(priorityCount))
        let restSlice = Array(targetCourses.dropFirst(priorityCount))

        for course in prioritySlice {
            if let progress = try? await SupabaseService.shared.fetchLessonProgress(
                courseId: course.id,
                userId: userId
            ) {
                progressMap[course.id] = Set(progress.filter(\.completed).map(\.lessonId))
            }
        }

        let rest = restSlice
        let backgroundUserId = userId
        Task(priority: .background) {
            for course in rest {
                if let progress = try? await SupabaseService.shared.fetchLessonProgress(
                    courseId: course.id,
                    userId: backgroundUserId
                ) {
                    let completed = Set(progress.filter(\.completed).map(\.lessonId))
                    await MainActor.run {
                        progressMap[course.id] = completed
                    }
                }
            }
        }
    }

    private func progressColor(percent: Int) -> Color {
        if percent >= 100 { return .green }
        if percent > 0 { return .purple }
        return .gray
    }

    private func reloadProgressForCourse(courseId: UUID) async {
        guard let userId = appState.profile?.id else { return }
        do {
            let progress = try await SupabaseService.shared.fetchLessonProgress(courseId: courseId, userId: userId)
            let completedIds = Set(progress.filter(\.completed).map(\.lessonId))
            progressMap[courseId] = completedIds
        } catch {
            // keep existing progress on failure
        }
    }
}

/// `UIKitVerticalScrollView`（UIKit `UIScrollView`）内に配置するタップ行。
///
/// SwiftUI `Button` や SwiftUI の `DragGesture` をそのまま使うと、UIScrollView の pan が
/// 始まってもジェスチャーが残り、`touchesEnded` で誤発火することがあるため、UIKit の生の
/// `touchesBegan/Moved/Ended/Cancelled` で判定する透明オーバーレイを重ねる。
///
/// `UIScrollView.canCancelContentTouches` と `touchesShouldCancel(in:)` が有効な場合、
/// パン開始で `touchesCancelled` が来るため、`action()` は発火しない（Specific Courses と同体感）。
///
/// 8pt を超える移動でドラッグ扱いにし、その間は押下表示を終える。
private struct DragCancellableTapRow<Label: View>: View {
    let isEnabled: Bool
    let action: () -> Void
    let label: Label

    @State private var isPressing = false
    @State private var dragExceededWhilePressing = false

    private static var cancelThreshold: CGFloat { 8 }
    private static var pressedOpacity: Double { 0.55 }

    init(
        isEnabled: Bool = true,
        action: @escaping () -> Void,
        @ViewBuilder label: () -> Label
    ) {
        self.isEnabled = isEnabled
        self.action = action
        self.label = label()
    }

    private var isVisuallyPressed: Bool {
        isEnabled && isPressing && !dragExceededWhilePressing
    }

    var body: some View {
        ZStack {
            label
                .opacity(isVisuallyPressed ? Self.pressedOpacity : 1.0)
                .animation(.easeOut(duration: 0.12), value: isVisuallyPressed)
                .allowsHitTesting(false)

            DragCancellableTapTouchOverlay(
                cancelThreshold: Self.cancelThreshold,
                onPressBegin: {
                    dragExceededWhilePressing = false
                    isPressing = true
                },
                onDragExceededThreshold: {
                    dragExceededWhilePressing = true
                },
                onPressEnd: { shouldPerform in
                    isPressing = false
                    dragExceededWhilePressing = false
                    guard shouldPerform, isEnabled else { return }
                    action()
                },
                onPressCancel: {
                    isPressing = false
                    dragExceededWhilePressing = false
                }
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .allowsHitTesting(isEnabled)
        }
        .contentShape(Rectangle())
        .accessibilityAddTraits(.isButton)
        .accessibilityAction {
            if isEnabled {
                action()
            }
        }
    }
}

/// 行サイズ全体を覆い、ヒット判定のみ UIKit が担う透明ビュー。
private struct DragCancellableTapTouchOverlay: UIViewRepresentable {
    let cancelThreshold: CGFloat
    let onPressBegin: () -> Void
    let onDragExceededThreshold: () -> Void
    let onPressEnd: (_ shouldPerformAction: Bool) -> Void
    let onPressCancel: () -> Void

    func makeUIView(context _: Context) -> TapTouchTrackingView {
        let view = TapTouchTrackingView()
        view.backgroundColor = .clear
        view.isMultipleTouchEnabled = false
        return view
    }

    func updateUIView(_ uiView: TapTouchTrackingView, context _: Context) {
        uiView.cancelThresholdPoints = cancelThreshold
        uiView.onBegin = onPressBegin
        uiView.onDragExceeded = onDragExceededThreshold
        uiView.onEnded = onPressEnd
        uiView.onCancelled = onPressCancel
    }
}

private final class TapTouchTrackingView: UIView {
    var cancelThresholdPoints: CGFloat = 8
    var onBegin: () -> Void = {}
    var onDragExceeded: () -> Void = {}
    var onEnded: (_ shouldPerformAction: Bool) -> Void = { _ in }
    var onCancelled: () -> Void = {}

    private var trackingStartLocation: CGPoint?
    private var localDragExceeded = false

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        guard let touch = touches.first else { return }
        trackingStartLocation = touch.location(in: self)
        localDragExceeded = false
        onBegin()
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesMoved(touches, with: event)
        guard localDragExceeded == false,
              let start = trackingStartLocation,
              let touch = touches.first
        else {
            return
        }
        let current = touch.location(in: self)
        let dx = abs(current.x - start.x)
        let dy = abs(current.y - start.y)
        if max(dx, dy) > cancelThresholdPoints {
            localDragExceeded = true
            onDragExceeded()
        }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesEnded(touches, with: event)
        trackingStartLocation = nil
        let shouldPerformAction = !localDragExceeded
        localDragExceeded = false
        onEnded(shouldPerformAction)
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesCancelled(touches, with: event)
        trackingStartLocation = nil
        localDragExceeded = false
        onCancelled()
    }
}

private struct QuestStageArtwork: View {
    let stageNumber: Int
    let rectangular: Bool

    @State private var loadedImage: UIImage?

    private var assetName: String {
        QuestStageCardAssetNames.imageName(stageNumber: stageNumber, rectangular: rectangular)
    }

    var body: some View {
        ZStack {
            if let loadedImage {
                Image(uiImage: loadedImage)
                    .resizable()
                    .scaledToFill()
            } else {
                fallbackArtwork
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped()
        .id(assetName)
        .onAppear { reloadImage() }
        .onChange(of: stageNumber) { _ in reloadImage() }
        .onChange(of: rectangular) { _ in reloadImage() }
    }

    @ViewBuilder
    private var fallbackArtwork: some View {
        LinearGradient(
            colors: [
                Color(hex: "171033"),
                Color(hex: "2f145a"),
                Color(hex: "050315")
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        Image(systemName: rectangular ? "door.left.hand.open" : "sparkles")
            .font(.system(size: rectangular ? 42 : 20, weight: .bold))
            .foregroundStyle(Color(hex: "c4b5fd").opacity(0.65))
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: rectangular ? .trailing : .center)
            .padding(rectangular ? 20 : 0)
    }

    private func reloadImage() {
        loadedImage = QuestStageCardAssetNames.uiImage(stageNumber: stageNumber, rectangular: rectangular)
    }
}

private struct LessonLaunchDestination: Identifiable {
    let id = UUID()
    let hash: String
}

/// 耳コピバトル モード（ネイティブ実装）の fullScreenCover 起動コンテキスト。
/// レッスン経由起動時に必要となる lessonId / lessonSongId / clearConditions を保持する。
private struct EarTrainingLaunch: Identifiable {
    let id = UUID()
    let stageId: UUID
    let lessonId: UUID
    let lessonSongId: UUID
    let clearConditions: LessonClearConditions?
    /// レッスン課題の `survival_lesson_overrides.bgmUrl`（コードクイズ BGM 上書き）。
    let bgmUrl: String?
    /// Web `#ear-training-lesson?practice=1` 相当。
    var initialPracticeMode: Bool = false
}

/// 耳コピバトルチュートリアル（DB 駆動 `EarTrainingTutorialView`）の fullScreenCover 起動コンテキスト。
private struct EarTrainingTutorialLaunch: Identifiable {
    let id = UUID()
    let lessonId: UUID
    let lessonSongId: UUID
    let scriptId: String
    let clearConditions: LessonClearConditions?
}

/// サバイバルチュートリアル（DB 駆動 `SurvivalTutorialView`）の fullScreenCover 起動コンテキスト。
private struct SurvivalTutorialLaunch: Identifiable {
    let id = UUID()
    let lessonId: UUID
    let lessonSongId: UUID
    let scriptId: String
    let clearConditions: LessonClearConditions?
}

/// 風船ラッシュ（ネイティブ `BalloonRushGameView`）の起動コンテキスト。
private struct BalloonRushLessonLaunch: Identifiable {
    let id = UUID()
    let stage: BalloonRushStageDefinition
    let hintMode: Bool
    let productionHintModes: ResolvedProductionHintModes
    let appliedRandomChords: AppliedSurvivalLessonRandomChords?
    let lessonId: UUID
    let lessonSongId: UUID
    let clearConditions: LessonClearConditions?
}

/// 風船ラッシュ開始前の準備シート用。
private struct BalloonRushPrepContext: Identifiable {
    let id = UUID()
    let stage: BalloonRushStageDefinition
    let productionHintModes: ResolvedProductionHintModes
    let appliedRandomChords: AppliedSurvivalLessonRandomChords?
    let lessonId: UUID
    let lessonSongId: UUID
    let clearConditions: LessonClearConditions?
}

/// レッスン課題のサバイバル（ネイティブ `SurvivalGameView`）の fullScreenCover 起動コンテキスト。
private struct SurvivalLessonLaunch: Identifiable {
    let id = UUID()
    let stage: SurvivalStageDefinition
    let hintMode: Bool
    let configOverride: SurvivalStageConfig?
    let inlineCompositePhrases: [SurvivalPhraseDefinition]?
    let lessonRuntime: ResolvedSurvivalLessonRuntime?
    let productionHintModes: ResolvedProductionHintModes
    let randomChordOverrides: [String: SurvivalResolvedChord]
    let lessonId: UUID
    let lessonSongId: UUID
    let clearConditions: LessonClearConditions?
}

struct LessonDetailView: View {
    private struct QuickLookDocument: Identifiable {
        let id = UUID()
        let fileURL: URL
        let title: String
    }

    private struct AttachmentSharePayload: Identifiable {
        let id = UUID()
        let fileURL: URL
    }

    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var activeLesson: Lesson
    @State private var loadGeneration = 0

    @State private var detail: LessonDetail?
    @State private var videos: [LessonVideoResource] = []
    @State private var attachments: [LessonAttachmentResource] = []
    @State private var requirementProgress: [LessonRequirementProgressRow] = []
    @State private var isLessonCompleted = false
    @State private var isLoading = true
    @State private var isCompleting = false
    @State private var currentVideoIndex = 0
    @State private var alertMessage: String?
    @State private var launchDestination: LessonLaunchDestination?
    @State private var earTrainingLaunch: EarTrainingLaunch?
    @State private var earTrainingTutorialLaunch: EarTrainingTutorialLaunch?
    @State private var survivalTutorialLaunch: SurvivalTutorialLaunch?
    @State private var survivalLessonPrep: SurvivalLessonLaunch?
    @State private var survivalLessonLaunch: SurvivalLessonLaunch?
    @State private var balloonRushPrep: BalloonRushPrepContext?
    @State private var balloonRushLessonLaunch: BalloonRushLessonLaunch?
    @State private var quickLookDocument: QuickLookDocument?
    @State private var attachmentSharePayload: AttachmentSharePayload?
    @State private var attachmentActionBusyId: UUID?
    @State private var courseIsMainQuest = false
    @State private var navigationState: LessonNavigationState?
    @State private var isNavigating = false
    @State private var showSubscriptionSheet = false
    @State private var survivalCatalogPrefetchTick = 0
    @State private var questCompletionSheet: QuestCompletionSheetModel?
    @State private var showReadyToCompletePrompt = false
    @State private var pendingClearCheck: PendingRequirementClearCheck?
    @State private var taskClearNextStepTarget: LessonSong?
    @State private var pendingAutoStartFirstRequirement: Bool

    private struct PendingRequirementClearCheck {
        let lessonSongId: UUID
        let wasCompletedBefore: Bool
    }

    init(lesson: Lesson, autoStartFirstRequirement: Bool = false) {
        _activeLesson = State(initialValue: lesson)
        _pendingAutoStartFirstRequirement = State(initialValue: autoStartFirstRequirement)
    }

    private var locale: AppLocale { appState.locale }
    private var isPlatinumTier: Bool {
        guard let rank = appState.profile?.rank else { return false }
        return rank == .platinum || rank == .black
    }

    private var visibleAttachments: [LessonAttachmentResource] {
        attachments.filter { attachment in
            !attachment.platinumOnly || isPlatinumTier
        }
    }

    private var hiddenAttachmentCount: Int {
        attachments.filter(\.platinumOnly).count - visibleAttachments.filter(\.platinumOnly).count
    }

    private var allRequirementsCompleted: Bool {
        guard !sortedRequirements.isEmpty else {
            return true
        }

        return sortedRequirements.allSatisfy { requirement in
            progress(for: requirement)?.isCompleted == true
        }
    }

    private var sortedRequirements: [LessonSong] {
        (detail?.lessonSongs ?? [])
            .filter { !isLegendOnlyLessonRequirement($0) }
            .sorted { lhs, rhs in
            let leftOrder = lhs.orderIndex ?? .max
            let rightOrder = rhs.orderIndex ?? .max
            if leftOrder != rightOrder {
                return leftOrder < rightOrder
            }
            return requirementSortKey(lhs) < requirementSortKey(rhs)
        }
    }

    /// Web `isLegendOnlyLessonRequirement` と同等 — レジェンド（曲）課題は非表示。
    private func isLegendOnlyLessonRequirement(_ requirement: LessonSong) -> Bool {
        guard requirement.songId != nil else { return false }
        return requirement.isFantasy == false
            && requirement.isSurvival != true
            && requirement.isSurvivalTutorial != true
            && requirement.isEarTraining != true
            && requirement.isEarTrainingTutorial != true
            && requirement.isBalloonRush != true
    }

    private var currentVideo: LessonVideoResource? {
        guard videos.indices.contains(currentVideoIndex) else { return videos.first }
        return videos[currentVideoIndex]
    }

    var body: some View {
        lessonDetailWithDialogs
    }

    @ViewBuilder
    private var lessonDetailWithDialogs: some View {
        lessonDetailWithQuestSheets
            .fullScreenCover(item: $quickLookDocument) { doc in
                ZStack(alignment: .topTrailing) {
                    LessonAttachmentQuickLookView(fileURL: doc.fileURL, title: doc.title)
                        .ignoresSafeArea()
                    Button {
                        quickLookDocument = nil
                    } label: {
                        Text(locale == .ja ? "閉じる" : "Close")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.primary)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(.ultraThinMaterial, in: Capsule())
                    }
                    .padding()
                }
                .background(Color.black)
                .onDisappear {
                    removeTempAttachmentFile(at: doc.fileURL)
                }
            }
            .sheet(item: $attachmentSharePayload) { payload in
                LessonAttachmentShareSheet(items: [payload.fileURL])
                    .presentationDetents([.medium, .large])
                    .onDisappear {
                        removeTempAttachmentFile(at: payload.fileURL)
                    }
            }
            .sheet(isPresented: $showSubscriptionSheet) {
                SubscriptionView()
            }
    }

    @ViewBuilder
    private var lessonDetailWithQuestSheets: some View {
        lessonDetailWithReloadHooks
            .alert(
                locale == .ja ? "お知らせ" : "Notice",
                isPresented: Binding(
                    get: { alertMessage != nil },
                    set: { if !$0 { alertMessage = nil } }
                )
            ) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(alertMessage ?? "")
            }
            .sheet(item: $questCompletionSheet) { sheetModel in
                QuestCompletionSheet(
                    model: sheetModel,
                    locale: locale,
                    onStay: { questCompletionSheet = nil },
                    onContinue: sheetModel.nextLesson.map { next in
                        {
                            questCompletionSheet = nil
                            activeLesson = next
                        }
                    },
                    onPremium: sheetModel.kind == .chapterCompletePremiumUpsell
                        ? {
                            questCompletionSheet = nil
                            showSubscriptionSheet = true
                        }
                        : nil
                )
            }
            .sheet(isPresented: $showReadyToCompletePrompt) {
                QuestReadyToCompleteSheet(
                    locale: locale,
                    onComplete: {
                        showReadyToCompletePrompt = false
                        Task { await completeLesson() }
                    },
                    onLater: { showReadyToCompletePrompt = false }
                )
            }
            .sheet(item: $taskClearNextStepTarget) { target in
                TaskClearNextStepSheet(
                    nextTaskTitle: target.localizedTitle(locale) ?? (locale == .ja ? "次の課題" : "Next task"),
                    locale: locale,
                    onNext: {
                        let next = target
                        taskClearNextStepTarget = nil
                        launchRequirement(next)
                    },
                    onQuestList: {
                        taskClearNextStepTarget = nil
                        dismiss()
                    },
                    onStopForToday: {
                        taskClearNextStepTarget = nil
                    }
                )
            }
    }

    @ViewBuilder
    private var lessonDetailWithReloadHooks: some View {
        lessonDetailWithGameLaunchers
            .onChange(of: launchDestination == nil) { isNil in
                if isNil {
                    reloadLessonDetailAfterGame()
                }
            }
            .onChange(of: earTrainingLaunch == nil) { isNil in
                if isNil {
                    reloadLessonDetailAfterGame()
                }
            }
            .onChange(of: earTrainingTutorialLaunch == nil) { isNil in
                if isNil {
                    reloadLessonDetailAfterGame()
                }
            }
            .onChange(of: survivalTutorialLaunch == nil) { isNil in
                if isNil {
                    reloadLessonDetailAfterGame()
                }
            }
            .onChange(of: survivalLessonLaunch == nil) { isNil in
                if isNil {
                    reloadLessonDetailAfterGame()
                }
            }
            .onChange(of: balloonRushLessonLaunch == nil) { isNil in
                if isNil {
                    reloadLessonDetailAfterGame()
                }
            }
    }

    @ViewBuilder
    private var lessonDetailWithGameLaunchers: some View {
        lessonDetailWithNavigation
            .fullScreenCover(item: $launchDestination) { destination in
                GameWebView(
                    mode: .webPage(hash: destination.hash),
                    locale: locale,
                    onClose: { launchDestination = nil }
                )
            }
            .fullScreenCover(item: $earTrainingLaunch) { launch in
                EarTrainingGameView(
                    stageId: launch.stageId,
                    lessonContext: EarTrainingLessonContext(
                        lessonId: launch.lessonId,
                        lessonSongId: launch.lessonSongId,
                        clearConditions: launch.clearConditions,
                        bgmUrl: launch.bgmUrl
                    ),
                    locale: locale,
                    initialPracticeMode: launch.initialPracticeMode,
                    onClose: { earTrainingLaunch = nil }
                )
            }
            .fullScreenCover(item: $earTrainingTutorialLaunch) { launch in
                EarTrainingTutorialView(
                    scriptId: launch.scriptId,
                    locale: locale,
                    onClose: { earTrainingTutorialLaunch = nil },
                    onComplete: {
                        do {
                            _ = try await SupabaseService.shared.recordEarTrainingLessonProgress(
                                lessonId: launch.lessonId,
                                lessonSongId: launch.lessonSongId,
                                rank: launch.clearConditions?.rank ?? "S",
                                clearConditions: launch.clearConditions
                            )
                        } catch {
                            await MainActor.run {
                                alertMessage = locale == .ja
                                    ? "進捗の保存に失敗しました。"
                                    : "Failed to save progress."
                            }
                        }
                    }
                )
            }
            .fullScreenCover(item: $survivalTutorialLaunch) { launch in
                SurvivalTutorialView(
                    scriptId: launch.scriptId,
                    locale: locale,
                    showSkip: false,
                    onClose: { survivalTutorialLaunch = nil },
                    onComplete: {
                        do {
                            _ = try await SupabaseService.shared.recordEarTrainingLessonProgress(
                                lessonId: launch.lessonId,
                                lessonSongId: launch.lessonSongId,
                                rank: launch.clearConditions?.rank ?? "S",
                                clearConditions: launch.clearConditions
                            )
                        } catch {
                            await MainActor.run {
                                alertMessage = locale == .ja
                                    ? "進捗の保存に失敗しました。"
                                    : "Failed to save progress."
                            }
                        }
                    }
                )
            }
            .fullScreenCover(item: $survivalLessonLaunch) { launch in
                SurvivalGameView(
                    stage: launch.stage,
                    hintMode: launch.hintMode,
                    characterId: "fai",
                    locale: locale,
                    onClose: { survivalLessonLaunch = nil },
                    configOverride: launch.configOverride,
                    inlineCompositePhrases: launch.inlineCompositePhrases,
                    lessonRuntime: launch.lessonRuntime,
                    productionHintModes: launch.productionHintModes,
                    randomChordOverrides: launch.randomChordOverrides,
                    lessonContext: SurvivalLessonContext(
                        lessonId: launch.lessonId,
                        lessonSongId: launch.lessonSongId,
                        clearConditions: launch.clearConditions
                    )
                )
            }
            .sheet(item: $survivalLessonPrep) { prep in
                SurvivalRunPrepSheet(
                    stage: prep.stage,
                    locale: locale,
                    variant: .lesson,
                    initialHintMode: prep.hintMode,
                    lessonRuntime: prep.lessonRuntime,
                    onCancel: { survivalLessonPrep = nil },
                    onConfirm: { hintMode in
                        survivalLessonPrep = nil
                        survivalLessonLaunch = SurvivalLessonLaunch(
                            stage: prep.stage,
                            hintMode: hintMode,
                            configOverride: prep.configOverride,
                            inlineCompositePhrases: prep.inlineCompositePhrases,
                            lessonRuntime: prep.lessonRuntime,
                            productionHintModes: prep.productionHintModes,
                            randomChordOverrides: prep.randomChordOverrides,
                            lessonId: prep.lessonId,
                            lessonSongId: prep.lessonSongId,
                            clearConditions: prep.clearConditions
                        )
                    }
                )
            }
            .sheet(item: $balloonRushPrep) { prep in
                SurvivalRunPrepSheet(
                    balloonStage: prep.stage,
                    locale: locale,
                    initialHintMode: false,
                    onCancel: { balloonRushPrep = nil },
                    onConfirm: { hintMode in
                        balloonRushPrep = nil
                        balloonRushLessonLaunch = BalloonRushLessonLaunch(
                            stage: prep.stage,
                            hintMode: hintMode,
                            productionHintModes: prep.productionHintModes,
                            appliedRandomChords: prep.appliedRandomChords,
                            lessonId: prep.lessonId,
                            lessonSongId: prep.lessonSongId,
                            clearConditions: prep.clearConditions
                        )
                    }
                )
            }
            .fullScreenCover(item: $balloonRushLessonLaunch) { launch in
                BalloonRushGameView(
                    stage: launch.stage,
                    hintMode: launch.hintMode,
                    locale: locale,
                    lessonContext: BalloonRushLessonContext(
                        lessonId: launch.lessonId,
                        lessonSongId: launch.lessonSongId,
                        clearConditions: launch.clearConditions
                    ),
                    productionHintModes: launch.productionHintModes,
                    appliedRandomChords: launch.appliedRandomChords,
                    onClose: { balloonRushLessonLaunch = nil }
                )
            }
    }

    @ViewBuilder
    private var lessonDetailWithNavigation: some View {
        lessonDetailMainContent
            .navigationTitle(activeLesson.localizedTitle(locale))
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .onAppear {
                LessonMapAudio.shared.stop()
            }
            .task(id: activeLesson.id) {
                isNavigating = false
                await loadLessonDetail()
                if pendingAutoStartFirstRequirement {
                    pendingAutoStartFirstRequirement = false
                    if let firstIncomplete = sortedRequirements.first(where: { progress(for: $0)?.isCompleted != true }) {
                        launchRequirement(firstIncomplete)
                    }
                }
            }
            .onChange(of: appState.locale) { _ in
                Task { await loadLessonDetail() }
            }
    }

    @ViewBuilder
    private var lessonDetailMainContent: some View {
        ZStack {
            Color(hex: "0f172a").ignoresSafeArea()

            if isLoading {
                ProgressView()
                    .tint(.purple)
            } else if let detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        if let navigationState {
                            lessonNavigationBar(navigationState)
                        }
                        summaryCard(detail)
                        if let assignment = detail.localizedAssignmentDescription(locale), !assignment.isEmpty {
                            assignmentCard(assignment)
                        }
                        requirementsCard
                        if !videos.isEmpty {
                            videosCard
                        }
                        if !visibleAttachments.isEmpty || hiddenAttachmentCount > 0 {
                            attachmentsCard
                        }
                        completionCard
                    }
                    .padding()
                }
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 42))
                        .foregroundStyle(.orange)
                    Text(locale == .ja ? "クエスト詳細の読み込みに失敗しました" : "Failed to load quest details")
                        .foregroundStyle(.white)
                    Button(locale == .ja ? "再読み込み" : "Retry") {
                        Task { await loadLessonDetail() }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)
                }
                .padding()
            }
        }
    }

    private func removeTempAttachmentFile(at url: URL) {
        if FileManager.default.fileExists(atPath: url.path) {
            try? FileManager.default.removeItem(at: url)
        }
    }

    private func openAttachmentInQuickLook(_ attachment: LessonAttachmentResource, remoteURL: URL) async {
        await MainActor.run { attachmentActionBusyId = attachment.id }
        do {
            let local = try await LessonAttachmentDownload.copyToTemporaryFile(
                from: remoteURL,
                suggestedFileName: attachment.fileName
            )
            await MainActor.run {
                attachmentActionBusyId = nil
                quickLookDocument = QuickLookDocument(fileURL: local, title: attachment.fileName)
            }
        } catch {
            await MainActor.run {
                attachmentActionBusyId = nil
                alertMessage = locale == .ja ? "ファイルを開けませんでした。" : "Could not open the file."
            }
        }
    }

    private func prepareAttachmentForSharing(_ attachment: LessonAttachmentResource, remoteURL: URL) async {
        await MainActor.run { attachmentActionBusyId = attachment.id }
        do {
            let local = try await LessonAttachmentDownload.copyToTemporaryFile(
                from: remoteURL,
                suggestedFileName: attachment.fileName
            )
            await MainActor.run {
                attachmentActionBusyId = nil
                attachmentSharePayload = AttachmentSharePayload(fileURL: local)
            }
        } catch {
            await MainActor.run {
                attachmentActionBusyId = nil
                alertMessage = locale == .ja
                    ? "ファイルを読み込めませんでした。"
                    : "Could not prepare the file to save or share."
            }
        }
    }

    private func summaryCard(_ detail: LessonDetail) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(detail.localizedTitle(locale))
                        .font(.title3.bold())
                        .foregroundStyle(.white)

                    if let description = detail.localizedDescription(locale), !description.isEmpty {
                        Text(description)
                            .font(.subheadline)
                            .foregroundStyle(Color(hex: "d1d5db"))
                    }
                }

                Spacer()

                if isLessonCompleted {
                    Text(locale == .ja ? "完了" : "Done")
                        .font(.caption.bold())
                        .foregroundStyle(.green)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Color.green.opacity(0.2))
                        .cornerRadius(999)
                }
            }

            HStack(spacing: 8) {
                let total = sortedRequirements.count
                let done = sortedRequirements.filter { progress(for: $0)?.isCompleted == true }.count
                Label("\(done)/\(total)", systemImage: "checkmark.circle")
                    .font(.caption)
                    .foregroundStyle(.gray)
                if let blockNumber = activeLesson.blockNumber {
                    Label(
                        locale == .ja ? "ブロック \(blockNumber)" : "Block \(blockNumber)",
                        systemImage: "square.grid.2x2"
                    )
                    .font(.caption)
                    .foregroundStyle(.gray)
                }
            }
        }
        .padding(18)
        .background(Color(hex: "1e293b"))
        .cornerRadius(16)
    }

    private func assignmentCard(_ assignment: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(locale == .ja ? "課題説明" : "Assignment")
                .font(.headline)
                .foregroundStyle(.white)
            Text(assignment)
                .font(.subheadline)
                .foregroundStyle(Color(hex: "d1d5db"))
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(18)
        .background(Color(hex: "1e293b"))
        .cornerRadius(16)
    }

    private var requirementsCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(locale == .ja ? "実習課題" : "Tasks")
                .font(.headline)
                .foregroundStyle(.white)

            if sortedRequirements.isEmpty {
                Text(locale == .ja ? "実習課題がありません" : "No tasks")
                    .foregroundStyle(.gray)
            } else {
                ForEach(Array(sortedRequirements.enumerated()), id: \.element.id) { index, requirement in
                    requirementRow(requirement, index: index)
                        .id("\(requirement.id.uuidString)-\(survivalCatalogPrefetchTick)")
                }
            }
        }
        .padding(18)
        .background(Color(hex: "1e293b"))
        .cornerRadius(16)
    }

    private func requirementRow(_ requirement: LessonSong, index: Int) -> some View {
        let progressRow = progress(for: requirement)
        let isCompleted = progressRow?.isCompleted ?? false
        let isClearRequired = requirement.isClearRequired != false
        let title = requirementTitle(requirement, index: index)
        let requiredCount = isClearRequired
            ? max(requirement.clearConditions?.count ?? 1, 1)
            : 0
        let displayProgress: String

        if requirement.clearConditions?.requiresDays == true {
            let clearedDays = progressRow?.clearDates.count ?? 0
            let dailyCount = requirement.clearConditions?.dailyCount ?? 1
            if dailyCount > 1 {
                displayProgress = locale == .ja
                    ? "\(clearedDays)日クリア / 必要\(requiredCount)日（1日\(dailyCount)回）"
                    : "\(clearedDays) of \(requiredCount) days cleared (\(dailyCount) per day)"
            } else {
                displayProgress = locale == .ja
                    ? "\(clearedDays)日クリア / 必要\(requiredCount)日"
                    : "\(clearedDays) of \(requiredCount) days cleared"
            }
        } else {
            let clearedCount = progressRow?.clearCount ?? 0
            displayProgress = locale == .ja
                ? "\(clearedCount)回クリア / 必要\(requiredCount)回"
                : "\(clearedCount) of \(requiredCount) clears"
        }

        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                    if !isClearRequired {
                        Text(locale == .ja
                             ? "この課題はクリア必須ではありません。"
                             : "This task is not required to clear.")
                            .font(.caption)
                            .foregroundStyle(Color(hex: "fde68a"))
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(hex: "f59e0b").opacity(0.12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color(hex: "fde68a").opacity(0.3), lineWidth: 1)
                            )
                            .cornerRadius(8)
                    }
                }

                Spacer()

                if isCompleted {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                }
            }

            if isClearRequired {
                HStack {
                    Text(locale == .ja ? "進捗" : "Progress")
                        .font(.caption)
                        .foregroundStyle(.gray)
                    Spacer()
                    Text(displayProgress)
                        .font(.caption.bold())
                        .foregroundStyle(isCompleted ? .green : .white)
                        .multilineTextAlignment(.trailing)
                }
            }

            if requirement.isSurvivalTutorial == true || requirement.isEarTrainingTutorial == true {
                Text(locale == .ja
                     ? "ガイド体験を最後まで進めるとクリアになります。"
                     : "Complete the guided experience to clear this task.")
                    .font(.caption2)
                    .foregroundStyle(.gray)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let survivalInfo = survivalRequirementDisplayInfo(for: requirement) {
                survivalRequirementInfoView(survivalInfo)
            }

            if requirement.isEarTraining == true, requirement.isEarTrainingTutorial != true,
               let et = requirement.earTrainingStage {
                earTrainingRequirementInfoView(stage: et)
            }

            if requirement.isBalloonRush == true, let bs = requirement.balloonRushStage {
                let tl = bs.timeLimitSec ?? 0
                let pq = bs.popQuota ?? 0
                if tl > 0 && pq > 0 {
                    let taskPrefix = locale == .ja ? "課題タイプ" : "Task type"
                    let clearPrefix = locale == .ja ? "クリア条件" : "Clear"
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(taskPrefix): \(bs.lessonRequirementModeLabel(locale: locale))")
                            .font(.caption2)
                            .foregroundStyle(.gray)
                        Text("\(clearPrefix): \(bs.lessonClearConditionBody(locale: locale, timeLimit: tl, popQuota: pq))")
                            .font(.caption2)
                            .foregroundStyle(.gray)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 2)
                }
            }

            // 本日の進捗表示（日数課題の場合）
            if !isCompleted,
               requirement.clearConditions?.requiresDays == true,
               let dailyCount = requirement.clearConditions?.dailyCount, dailyCount >= 1 {
                let today = todayDateString()
                let todayProgress = progressRow?.dailyProgress?[today]
                let todayCount = todayProgress?.count ?? 0
                let todayDone = todayProgress?.completed ?? false

                if todayDone {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                                .font(.caption)
                            Text(locale == .ja ? "本日の課題: クリア済み" : "Today: Complete")
                                .font(.caption)
                                .foregroundStyle(.green)
                        }
                        TimelineView(.periodic(from: .now, by: 60)) { _ in
                            Text(utcResetCountdownText())
                                .font(.caption2)
                                .foregroundStyle(.gray)
                        }
                    }
                    .padding(.vertical, 4)
                } else {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 4) {
                            Image(systemName: "calendar")
                                .foregroundStyle(.yellow)
                                .font(.caption)
                            Text(locale == .ja
                                 ? "本日の進捗: \(todayCount)/\(dailyCount)回"
                                 : "Today: \(todayCount)/\(dailyCount)")
                                .font(.caption)
                                .foregroundStyle(.yellow)
                            if todayCount > 0 {
                                Text(locale == .ja
                                     ? "(あと\(dailyCount - todayCount)回)"
                                     : "(\(dailyCount - todayCount) left)")
                                    .font(.caption2)
                                    .foregroundStyle(.gray)
                            }
                        }
                        TimelineView(.periodic(from: .now, by: 60)) { _ in
                            Text(utcResetCountdownText())
                                .font(.caption2)
                                .foregroundStyle(.gray)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }

            Button {
                launchRequirement(requirement)
            } label: {
                HStack {
                    Image(systemName: isCompleted ? "arrow.clockwise" : "play.fill")
                    Text(isCompleted
                         ? (locale == .ja ? "再挑戦" : "Retry")
                         : (locale == .ja ? "練習開始" : "Start"))
                    Spacer()
                }
                .font(.subheadline.bold())
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Color.purple)
                .cornerRadius(12)
            }
            .buttonStyle(.plain)
        }
        .padding(14)
        .background(isCompleted ? Color.green.opacity(0.12) : Color(hex: "334155"))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(isCompleted ? Color.green.opacity(0.5) : Color.clear, lineWidth: 1)
        )
        .cornerRadius(14)
    }

    @ViewBuilder
    private func attachmentActionsRow(_ attachment: LessonAttachmentResource, remoteURL: URL) -> some View {
        let busy = attachmentActionBusyId == attachment.id
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "paperclip.circle.fill")
                    .foregroundStyle(.purple)
                VStack(alignment: .leading, spacing: 4) {
                    Text(attachment.fileName)
                        .foregroundStyle(.white)
                    if let contentType = attachment.contentType {
                        Text(contentType)
                            .font(.caption2)
                            .foregroundStyle(.gray)
                    }
                }
                Spacer(minLength: 0)
            }
            HStack(spacing: 10) {
                Button {
                    Task { await openAttachmentInQuickLook(attachment, remoteURL: remoteURL) }
                } label: {
                    Label(
                        locale == .ja ? "開く" : "Open",
                        systemImage: "doc.text.magnifyingglass"
                    )
                    .font(.subheadline.weight(.medium))
                }
                .buttonStyle(.bordered)
                .tint(.purple)
                .disabled(busy)

                Button {
                    Task { await prepareAttachmentForSharing(attachment, remoteURL: remoteURL) }
                } label: {
                    Label(
                        locale == .ja ? "保存・共有" : "Save / Share",
                        systemImage: "square.and.arrow.up"
                    )
                    .font(.subheadline.weight(.medium))
                }
                .buttonStyle(.borderedProminent)
                .tint(.blue)
                .disabled(busy)

                if busy {
                    ProgressView()
                        .tint(.white)
                }
            }
        }
        .padding(14)
        .background(Color(hex: "334155"))
        .cornerRadius(12)
    }

    private var videosCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(locale == .ja ? "動画" : "Videos")
                .font(.headline)
                .foregroundStyle(.white)

            if let currentVideo {
                LessonEmbeddedVideoPlayer(video: currentVideo)
                    .frame(height: 220)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }

            if videos.count > 1 {
                ForEach(Array(videos.enumerated()), id: \.element.id) { index, video in
                    Button {
                        currentVideoIndex = index
                    } label: {
                        HStack {
                            Image(systemName: index == currentVideoIndex ? "play.circle.fill" : "play.rectangle.fill")
                                .foregroundStyle(index == currentVideoIndex ? .white : .purple)
                            Text(videoTitle(video))
                                .foregroundStyle(.white)
                            Spacer()
                            if index == currentVideoIndex {
                                Text(locale == .ja ? "再生中" : "Playing")
                                    .font(.caption2.bold())
                                    .foregroundStyle(.white)
                            }
                        }
                        .padding(14)
                        .background(index == currentVideoIndex ? Color.purple.opacity(0.55) : Color(hex: "334155"))
                        .cornerRadius(12)
                    }
                    .buttonStyle(.plain)
                }
            } else if let currentVideo {
                HStack {
                    Image(systemName: "play.circle.fill")
                        .foregroundStyle(.purple)
                    Text(videoTitle(currentVideo))
                        .foregroundStyle(.white)
                    Spacer()
                }
                .padding(14)
                .background(Color(hex: "334155"))
                .cornerRadius(12)
            }
        }
        .padding(18)
        .background(Color(hex: "1e293b"))
        .cornerRadius(16)
    }

    private var attachmentsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(locale == .ja ? "添付ファイル" : "Attachments")
                .font(.headline)
                .foregroundStyle(.white)

            ForEach(visibleAttachments) { attachment in
                if let remoteURL = URL(string: attachment.url) {
                    attachmentActionsRow(attachment, remoteURL: remoteURL)
                }
            }

            if hiddenAttachmentCount > 0 {
                Text(
                    locale == .ja
                    ? "プラチナ/ブラック会員限定の添付ファイルが \(hiddenAttachmentCount) 件あります。"
                    : "\(hiddenAttachmentCount) attachment(s) require Platinum or Black membership."
                )
                .font(.caption)
                .foregroundStyle(.purple)
            }
        }
        .padding(18)
        .background(Color(hex: "1e293b"))
        .cornerRadius(16)
    }

    private enum LessonCompletionUiState {
        case ready
        case blocked
        case completed
        case submitting
    }

    private var completionUiState: LessonCompletionUiState {
        if isLessonCompleted { return .completed }
        if isCompleting { return .submitting }
        if allRequirementsCompleted { return .ready }
        return .blocked
    }

    private var completionCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 8) {
                Image(systemName: "flag.checkered")
                    .foregroundStyle(Color(hex: "fbbf24"))
                Text(locale == .ja ? "最後のステップ" : "Final step")
                    .font(.headline)
                    .foregroundStyle(.white)
            }

            Text(completionCalloutText)
                .font(.subheadline)
                .foregroundStyle(completionCalloutForeground)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(completionCalloutBackground)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(completionCalloutBorder, lineWidth: 1)
                )
                .cornerRadius(10)

            Button {
                Task { await completeLesson() }
            } label: {
                HStack(spacing: 12) {
                    if isCompleting {
                        ProgressView()
                            .tint(.white)
                    } else if isLessonCompleted {
                        Image(systemName: "checkmark.circle.fill")
                    } else {
                        Image(systemName: "flag.checkered")
                    }

                    VStack(spacing: 2) {
                        Text(completionButtonPrimaryText)
                            .font(.subheadline.bold())
                        if let secondary = completionButtonSecondaryText {
                            Text(secondary)
                                .font(.caption)
                                .opacity(0.9)
                        }
                    }
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(completionButtonBackground)
                .cornerRadius(12)
                .overlay {
                    if completionUiState == .ready {
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color(hex: "34d399").opacity(0.5), lineWidth: 2)
                    }
                }
            }
            .buttonStyle(.plain)
            .disabled(isCompleting || isLessonCompleted)
        }
        .padding(18)
        .background(Color(hex: "1e293b"))
        .cornerRadius(16)
    }

    private var completionCalloutText: String {
        switch completionUiState {
        case .ready:
            return locale == .ja
                ? "課題のクリアや動画の視聴だけでは完了になりません。ここを押して初めてクエスト完了となり、次に進めます。"
                : "Clearing tasks or watching videos alone does not finish the quest. Tap here to mark it complete and move on."
        case .blocked:
            return locale == .ja
                ? "すべての実習課題をクリアしてから、下のボタンで完了してください。"
                : "Clear all practice tasks first, then tap the button below to finish."
        case .completed:
            return locale == .ja
                ? "このクエストは完了済みです。"
                : "This quest is already complete."
        case .submitting:
            return locale == .ja
                ? "進捗を保存しています…"
                : "Saving your progress…"
        }
    }

    private var completionButtonPrimaryText: String {
        switch completionUiState {
        case .completed:
            return locale == .ja ? "クエスト完了済み" : "Quest completed"
        case .submitting:
            return locale == .ja ? "完了処理中…" : "Completing…"
        case .ready, .blocked:
            return locale == .ja ? "クエストを完了する" : "Complete this quest"
        }
    }

    private var completionButtonSecondaryText: String? {
        completionUiState == .ready
            ? (locale == .ja ? "次のクエストを解放" : "Unlock the next quest")
            : nil
    }

    private var completionCalloutForeground: Color {
        switch completionUiState {
        case .ready: Color(hex: "fde68a")
        case .completed: Color(hex: "a7f3d0")
        default: Color(hex: "d1d5db")
        }
    }

    private var completionCalloutBackground: Color {
        switch completionUiState {
        case .ready: Color(hex: "451a03").opacity(0.35)
        case .completed: Color(hex: "064e3b").opacity(0.35)
        default: Color(hex: "0f172a").opacity(0.5)
        }
    }

    private var completionCalloutBorder: Color {
        switch completionUiState {
        case .ready: Color(hex: "f59e0b").opacity(0.6)
        case .completed: Color(hex: "10b981").opacity(0.5)
        default: Color(hex: "475569")
        }
    }

    @ViewBuilder
    private var completionButtonBackground: some View {
        switch completionUiState {
        case .ready:
            LinearGradient(
                colors: [Color(hex: "059669"), Color(hex: "16a34a")],
                startPoint: .leading,
                endPoint: .trailing
            )
        case .completed:
            Color.gray
        case .submitting, .blocked:
            Color(hex: "475569")
        }
    }

    private func reloadLessonDetailAfterGame() {
        Task {
            await loadLessonDetail()
            await evaluateTaskClearNextStepAfterGame()
        }
    }

    @MainActor
    private func evaluateTaskClearNextStepAfterGame() async {
        guard courseIsMainQuest,
              (activeLesson.blockNumber ?? 1) == 1,
              let check = pendingClearCheck else {
            pendingClearCheck = nil
            return
        }
        pendingClearCheck = nil

        guard !check.wasCompletedBefore else { return }

        func isPlayedRequirementCompleted() -> Bool {
            guard let played = sortedRequirements.first(where: { $0.id == check.lessonSongId }) else {
                return false
            }
            return progress(for: played)?.isCompleted == true
        }

        if !isPlayedRequirementCompleted(),
           let userId = appState.profile?.id {
            requirementProgress = (try? await SupabaseService.shared.fetchLessonRequirementProgress(
                lessonId: activeLesson.id,
                userId: userId
            )) ?? requirementProgress
        }

        guard isPlayedRequirementCompleted() else { return }

        if let next = sortedRequirements.first(where: { progress(for: $0)?.isCompleted != true }) {
            showReadyToCompletePrompt = false
            taskClearNextStepTarget = next
        }
    }

    private func loadLessonDetail() async {
        loadGeneration += 1
        let generation = loadGeneration
        let targetId = activeLesson.id
        let targetCourseId = activeLesson.courseId

        isLoading = true
        currentVideoIndex = 0
        showReadyToCompletePrompt = false
        defer {
            if generation == loadGeneration {
                isLoading = false
            }
        }

        do {
            courseIsMainQuest = false
            async let detailTask = SupabaseService.shared.fetchLessonDetail(lessonId: targetId)
            async let courseMetaTask: Course? = {
                guard let cid = targetCourseId else { return nil }
                return try? await SupabaseService.shared.fetchCourseVisible(id: cid)
            }()
            async let videosTask: [LessonVideoResource] = {
                (try? await SupabaseService.shared.fetchLessonVideos(lessonId: targetId)) ?? []
            }()
            async let attachmentsTask: [LessonAttachmentResource] = {
                (try? await SupabaseService.shared.fetchLessonAttachments(lessonId: targetId)) ?? []
            }()

            let fetchedDetail = try await detailTask
            let courseMeta = await courseMetaTask
            let rawVideos = await videosTask
            let rawAttachments = await attachmentsTask

            guard generation == loadGeneration, activeLesson.id == targetId else { return }

            courseIsMainQuest = courseMeta?.isMainCourse == true
            detail = fetchedDetail
            prefetchEarTrainingStageDetails(from: fetchedDetail)
            prefetchSurvivalCatalogIfNeeded(from: fetchedDetail)
            videos = rawVideos.filter { $0.isVisible(for: appState.locale) }
            attachments = rawAttachments.filter { $0.isVisible(for: appState.locale) }

            if let userId = appState.profile?.id {
                requirementProgress = (try? await SupabaseService.shared.fetchLessonRequirementProgress(
                    lessonId: targetId,
                    userId: userId
                )) ?? []

                if let courseId = activeLesson.courseId {
                    let progressRows = try? await SupabaseService.shared.fetchLessonProgress(
                        courseId: courseId,
                        userId: userId
                    )

                    guard generation == loadGeneration, activeLesson.id == targetId else { return }

                    isLessonCompleted = progressRows?.first(where: { $0.lessonId == targetId })?.completed ?? false

                    if let lessons = try? await SupabaseService.shared.fetchLessons(courseId: courseId) {
                        navigationState = LessonNavigationHelpers.computeNavigationState(
                            currentLesson: activeLesson,
                            lessons: lessons,
                            completedIds: Set((progressRows ?? []).filter(\.completed).map(\.lessonId)),
                            isMainQuest: courseIsMainQuest,
                            isPremium: appState.isPremium
                        )
                    }

                    showReadyToCompletePrompt = LessonNavigationHelpers.shouldShowQuestReadyToCompletePrompt(
                        hasRequirements: !sortedRequirements.isEmpty,
                        allRequirementsCompleted: allRequirementsCompleted,
                        isLessonCompleted: isLessonCompleted
                    )
                }
            } else {
                requirementProgress = []
                isLessonCompleted = false
                navigationState = nil
            }
        } catch {
            guard generation == loadGeneration, activeLesson.id == targetId else { return }
            detail = nil
            alertMessage = error.localizedDescription
        }
    }

    private func prefetchEarTrainingStageDetails(from lessonDetail: LessonDetail) {
        let stageIds = lessonDetail.lessonSongs.compactMap { requirement -> UUID? in
            guard requirement.isEarTraining == true else { return nil }
            return requirement.earTrainingStage?.id ?? requirement.earTrainingStageId
        }
        guard !stageIds.isEmpty else { return }

        Task {
            await EarTrainingStageDetailCache.shared.preload(stageIds: stageIds)
        }
    }

    /// サバイバル課題のステージ行・ブロック DB バランスを詳細表示前に読み込む。
    private func prefetchSurvivalCatalogIfNeeded(from lessonDetail: LessonDetail) {
        let survivalRequirements = lessonDetail.lessonSongs.filter { song in
            song.isSurvival == true && song.isSurvivalTutorial != true
        }
        guard !survivalRequirements.isEmpty else { return }

        Task {
            for requirement in survivalRequirements {
                if SurvivalLessonConfig.lessonSongHasInlineComposite(requirement.survivalCompositeConfig) {
                    continue
                }
                guard let stageNumber = requirement.survivalStageNumber else { continue }
                let mapCategory = SurvivalMapCategory.resolveLessonMapCategory(requirement.survivalMapCategory)
                await ensureSurvivalCatalogLoadedIfNeeded(for: mapCategory, stageNumber: stageNumber)
            }
            await MainActor.run {
                survivalCatalogPrefetchTick &+= 1
            }
        }
    }

    private struct SurvivalRequirementDisplayInfo {
        let modeEncounterLine: String
        let clearCondition: String
        let isConfigured: Bool
    }

    private func survivalRequirementDisplayInfo(for requirement: LessonSong) -> SurvivalRequirementDisplayInfo? {
        guard requirement.isSurvival == true, requirement.isSurvivalTutorial != true else { return nil }

        let hasInlineComposite = SurvivalLessonConfig.lessonSongHasInlineComposite(requirement.survivalCompositeConfig)

        let stage: SurvivalStageDefinition?
        if hasInlineComposite, let compositeConfig = requirement.survivalCompositeConfig {
            stage = SurvivalLessonConfig.buildLessonCompositeStageDefinition(
                title: requirement.title ?? (locale == .ja ? "複合フレーズ課題" : "Composite phrase lesson"),
                titleEn: requirement.titleEn ?? "Composite phrase lesson",
                config: compositeConfig
            )
        } else if let stageNumber = requirement.survivalStageNumber {
            let mapCategory = SurvivalMapCategory.resolveLessonMapCategory(requirement.survivalMapCategory)
            stage = SurvivalStageCatalog.stage(byNumber: stageNumber, in: mapCategory)
        } else {
            stage = nil
        }

        guard let stage else {
            return SurvivalRequirementDisplayInfo(
                modeEncounterLine: "",
                clearCondition: locale == .ja
                    ? "ステージ未設定（マップと番号、または複合フレーズ設定を確認してください）"
                    : "Stage not configured (check map/stage number or composite config).",
                isConfigured: false
            )
        }

        let isBossEncounter = stage.survivalUsesCompositePhrasePattern
            || stage.blockKey.rawValue == "lesson_composite"
            || SurvivalBossEngine.isBlockLastStage(stageNumber: stage.stageNumber, in: stage.mapCategory)

        let killQuota = requirement.survivalLessonOverrides?.killQuota
            ?? stage.stageKillQuota

        let clearCondition: String
        if stage.playMode == .codeRun {
            clearCondition = locale == .ja
                ? "クリア条件: ゴールに到達"
                : "Clear: reach the goal"
        } else if isBossEncounter {
            clearCondition = locale == .ja ? "クリア条件: ボス撃破" : "Clear: defeat the boss"
        } else {
            let timeLimitSec = requirement.survivalLessonOverrides?.timeLimitSec
                ?? stage.runTimeLimitSec
                ?? Int(SurvivalConstants.stageTimeLimitSec)
            clearCondition = locale == .ja
                ? "クリア条件: \(timeLimitSec)秒生存 + \(killQuota)体撃破"
                : "Clear: survive \(timeLimitSec)s and defeat \(killQuota) enemies"
        }

        let encounterLabel: String
        if isBossEncounter {
            encounterLabel = locale == .ja ? "ボス" : "Boss"
        } else {
            encounterLabel = stage.runPrepEncounterLabel(locale: locale)
        }

        let modeEncounterLine = (locale == .ja ? "出題" : "Mode") + ": \(stage.runPrepModeLabel(locale: locale)) · "
            + (locale == .ja ? "戦闘" : "Encounter") + ": \(encounterLabel)"

        return SurvivalRequirementDisplayInfo(
            modeEncounterLine: modeEncounterLine,
            clearCondition: clearCondition,
            isConfigured: true
        )
    }

    @ViewBuilder
    private func survivalRequirementInfoView(_ info: SurvivalRequirementDisplayInfo) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            if info.isConfigured {
                Text(info.modeEncounterLine)
                    .font(.caption2)
                    .foregroundStyle(.gray)
            }
            Text(info.clearCondition)
                .font(.caption2)
                .foregroundStyle(.gray)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 2)
    }

    @ViewBuilder
    private func earTrainingRequirementInfoView(stage: EarTrainingStage) -> some View {
        let mode = stage.mode ?? .phrase
        let taskPrefix = locale == .ja ? "課題タイプ" : "Task type"
        let clearPrefix = locale == .ja ? "クリア条件" : "Clear"
        VStack(alignment: .leading, spacing: 4) {
            Text("\(taskPrefix): \(mode.lessonDisplayLabel(locale: locale))")
                .font(.caption2)
                .foregroundStyle(.gray)
            Text("\(clearPrefix): \(stage.battleClearConditionText(locale: locale))")
                .font(.caption2)
                .foregroundStyle(.gray)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 2)
    }

    private func completeLesson() async {
        guard !isCompleting, !isLessonCompleted else { return }
        isCompleting = true
        defer { isCompleting = false }

        guard let userId = appState.profile?.id, let courseId = activeLesson.courseId else {
            alertMessage = locale == .ja ? "ログイン情報を確認できません。" : "Unable to confirm login state."
            return
        }
        guard allRequirementsCompleted else {
            alertMessage = locale == .ja
                ? "すべての実習課題を完了してからクエストを完了してください。"
                : "Complete all practice tasks before marking this quest complete."
            return
        }

        let bn = activeLesson.blockNumber ?? 1
        if courseIsMainQuest && !appState.isPremium && bn > MainQuestFreeTier.maxFreeBlockNumber {
            alertMessage = locale == .ja
                ? "メインクエスト第2チャプター以降はプレミアムが必要です。7日間無料トライアルで続きをプレイできます。"
                : "Main Quest chapters after Chapter 1 require Premium. Continue with a 7-day free trial."
            Task {
                let premium = await appState.ensureFreshBilling()
                if !premium {
                    await MainActor.run { showSubscriptionSheet = true }
                }
            }
            return
        }

        do {
            QuestJinglePlayer.playPreComplete()

            try await SupabaseService.shared.updateLessonProgress(
                lessonId: activeLesson.id,
                courseId: courseId,
                userId: userId,
                completed: true
            )
            isLessonCompleted = true

            do {
                let badges = try await SupabaseService.shared.grantUserBadgesForEvent(event: "quest_clear")
                PlayerLevelHub.shared.ingestAchievementBadges(badges, usesEnglishUi: locale == .en)
            } catch {
                /* 称号付与失敗はクエスト完了を妨げない */
            }

            do {
                let award = try await SupabaseService.shared.awardPlayerXp(
                    reason: "lesson_first_clear",
                    sourceId: activeLesson.id.uuidString,
                    amount: 100
                )
                await MainActor.run {
                    PlayerLevelHub.shared.ingestAwardResponse(award, usesEnglishUi: locale == .en)
                }
                if award.gainedXp > 0 {
                    do {
                        let badges = try await SupabaseService.shared.grantUserBadgesForEvent(
                            event: "level_reached",
                            playerLevel: award.newLevel
                        )
                        PlayerLevelHub.shared.ingestAchievementBadges(badges, usesEnglishUi: locale == .en)
                    } catch {
                        /* レベル称号は次回同期でも付与できる */
                    }
                }
            } catch {
                /* XP は初回のみ。RPC 失敗や重複は非致命的 */
            }

            await presentQuestCompletionSheet(courseId: courseId, userId: userId)
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    private func presentQuestCompletionSheet(courseId: UUID, userId: UUID) async {
        do {
            let lessons = try await SupabaseService.shared.fetchLessons(courseId: courseId)
            let sorted = LessonNavigationHelpers.sortLessonsByOrder(lessons)
            let progressRows = try await SupabaseService.shared.fetchLessonProgress(
                courseId: courseId,
                userId: userId
            )
            let completedIds = Set(progressRows.filter(\.completed).map(\.lessonId))
            let navState = LessonNavigationHelpers.computeNavigationState(
                currentLesson: activeLesson,
                lessons: lessons,
                completedIds: completedIds,
                isMainQuest: courseIsMainQuest,
                isPremium: appState.isPremium
            )
            let kind = LessonNavigationHelpers.modalKind(
                currentLesson: activeLesson,
                sortedLessons: sorted,
                nextLesson: navState.nextLesson,
                canGoNext: navState.canGoNext,
                nextBlockedReason: navState.nextBlockedReason
            )
            guard kind != .none else { return }
            if activeLesson.orderIndex == 0, let userId = appState.profile?.id {
                AnalyticsTracker.trackTutorialComplete(userId: userId, tutorialName: "first_quest")
            }
            await MainActor.run {
                navigationState = navState
                questCompletionSheet = QuestCompletionSheetModel(
                    kind: kind,
                    chapterNumber: activeLesson.blockNumber ?? 1,
                    nextLesson: navState.nextLesson
                )
            }
        } catch {
            /* モーダル表示失敗は非致命的 */
        }
    }

    @ViewBuilder
    private func lessonNavigationBar(_ navigationState: LessonNavigationState) -> some View {
        HStack(spacing: 12) {
            Button {
                navigateToPrevious(from: navigationState)
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "chevron.left")
                    Text(locale == .ja ? "前へ" : "Back")
                        .lineLimit(1)
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    navigationState.canGoPrevious && !isNavigating
                        ? Color(hex: "2563eb")
                        : Color(hex: "475569")
                )
                .cornerRadius(10)
            }
            .disabled(!navigationState.canGoPrevious || isNavigating)

            Button {
                dismiss()
            } label: {
                Image(systemName: "house.fill")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 40)
                    .background(Color(hex: "475569"))
                    .cornerRadius(10)
            }
            .accessibilityLabel(locale == .ja ? "クエスト一覧に戻る" : "Back to quest list")

            Button {
                navigateToNext(from: navigationState)
            } label: {
                HStack(spacing: 6) {
                    Text(locale == .ja ? "次へ" : "Next")
                        .lineLimit(1)
                    Image(systemName: "chevron.right")
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    navigationState.canGoNext && !isNavigating
                        ? Color(hex: "16a34a")
                        : Color(hex: "475569")
                )
                .cornerRadius(10)
            }
            .disabled(!navigationState.canGoNext || isNavigating)
        }
    }

    private func navigateToPrevious(from navigationState: LessonNavigationState) {
        guard !isNavigating else { return }
        guard navigationState.canGoPrevious, let previous = navigationState.previousLesson else {
            alertMessage = LessonNavigationHelpers.navigationBlockedMessage(
                direction: .previous,
                reason: navigationState.previousBlockedReason,
                locale: locale,
                nextLesson: navigationState.nextLesson
            )
            return
        }
        isNavigating = true
        activeLesson = previous
    }

    private func navigateToNext(from navigationState: LessonNavigationState) {
        guard !isNavigating else { return }
        guard navigationState.canGoNext, let next = navigationState.nextLesson else {
            if navigationState.nextBlockedReason == .premiumRequired {
                Task {
                    let premium = await appState.ensureFreshBilling()
                    if !premium {
                        await MainActor.run { showSubscriptionSheet = true }
                    }
                }
            }
            alertMessage = LessonNavigationHelpers.navigationBlockedMessage(
                direction: .next,
                reason: navigationState.nextBlockedReason,
                locale: locale,
                nextLesson: navigationState.nextLesson
            )
            return
        }
        isNavigating = true
        activeLesson = next
    }

    private func progress(for requirement: LessonSong) -> LessonRequirementProgressRow? {
        requirementProgress.first { progress in
            progress.lessonSongId == requirement.id
        }
    }

    private func localizedLessonSongTitle(_ requirement: LessonSong) -> String? {
        requirement.localizedTitle(locale)
    }

    private func requirementTitle(_ requirement: LessonSong, index: Int) -> String {
        if let t = localizedLessonSongTitle(requirement) {
            return "\(index + 1). \(t)"
        }
        if requirement.isSurvivalTutorial == true {
            return "\(index + 1). \(locale == .ja ? "サバイバルチュートリアル" : "Survival Tutorial")"
        }
        if requirement.isEarTrainingTutorial == true {
            return "\(index + 1). \(locale == .ja ? "耳コピバトルチュートリアル" : "Ear Training Tutorial")"
        }
        if requirement.isSurvival == true, let stageNumber = requirement.survivalStageNumber {
            let mapCategory = SurvivalMapCategory.resolveLessonMapCategory(requirement.survivalMapCategory)
            if let stage = SurvivalStageCatalog.stage(byNumber: stageNumber, in: mapCategory) {
                let stageName = stage.localizedName(locale)
                if !stageName.isEmpty {
                    return "\(index + 1). \(stageName)"
                }
            }
            return "\(index + 1). \(locale == .ja ? "サバイバル ステージ" : "Survival Stage") \(stageNumber)"
        }
        if requirement.isFantasy, let fantasyStage = requirement.fantasyStage {
            return "\(index + 1). \(fantasyStage.localizedName(locale))"
        }
        if requirement.isEarTraining == true, let earTrainingStage = requirement.earTrainingStage {
            return "\(index + 1). \(earTrainingStage.localizedTitle(locale))"
        }
        if requirement.isBalloonRush == true, let br = requirement.balloonRushStage {
            return "\(index + 1). \(br.localizedTitle(locale))"
        }
        return "\(index + 1). \(locale == .ja ? "課題" : "Task")"
    }

    private func videoTitle(_ video: LessonVideoResource) -> String {
        locale == .ja ? "動画 \(video.orderIndex + 1)" : "Video \(video.orderIndex + 1)"
    }

    private func todayDateString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter.string(from: Date())
    }

    private func utcResetCountdownText(from date: Date = Date()) -> String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0) ?? .gmt

        let startOfToday = calendar.startOfDay(for: date)
        guard let nextReset = calendar.date(byAdding: .day, value: 1, to: startOfToday) else {
            return locale == .ja ? "UTC日付リセットまであと0時間0分" : "UTC reset in 0h 0m"
        }

        let components = calendar.dateComponents([.hour, .minute], from: date, to: nextReset)
        let hours = max(components.hour ?? 0, 0)
        let minutes = max(components.minute ?? 0, 0)

        if locale == .ja {
            return "UTC日付リセットまであと\(hours)時間\(minutes)分"
        }
        return "UTC reset in \(hours)h \(minutes)m"
    }

    private func requirementSortKey(_ requirement: LessonSong) -> String {
        if let t = localizedLessonSongTitle(requirement) {
            return t
        }
        if let stageNumber = requirement.survivalStageNumber {
            let mapCategory = SurvivalMapCategory.resolveLessonMapCategory(requirement.survivalMapCategory)
            if let stage = SurvivalStageCatalog.stage(byNumber: stageNumber, in: mapCategory) {
                let stageName = stage.localizedName(locale)
                if !stageName.isEmpty {
                    return stageName
                }
            }
            return String(stageNumber)
        }
        if let fantasyStage = requirement.fantasyStage?.stageNumber {
            return fantasyStage
        }
        if let earTrainingStageTitle = requirement.earTrainingStage?.localizedTitle(locale) {
            return earTrainingStageTitle
        }
        if requirement.isBalloonRush == true, let slug = requirement.balloonRushStage?.slug, !slug.isEmpty {
            return slug
        }
        return requirement.id.uuidString
    }

    private func lessonVideoURL(_ video: LessonVideoResource) -> URL? {
        if let videoUrl = video.videoUrl, let url = URL(string: videoUrl) {
            return url
        }
        guard !video.vimeoUrl.isEmpty else { return nil }
        return URL(string: "https://iframe.mediadelivery.net/embed/295659/\(video.vimeoUrl)?autoplay=false")
    }

    private static func appliedLessonRandomChords(
        for requirement: LessonSong,
        stage: SurvivalStageDefinition
    ) -> AppliedSurvivalLessonRandomChords {
        SurvivalLessonRandomChords.applyLessonRandomChords(
            stageAllowedChordIds: stage.allowedChords,
            entries: requirement.survivalRandomChords,
            stageType: stage.stageType
        )
    }

    private static func appliedLessonRandomChords(
        for requirement: LessonSong,
        balloonStage: BalloonRushStageDefinition
    ) -> AppliedSurvivalLessonRandomChords {
        SurvivalLessonRandomChords.applyLessonRandomChords(
            stageAllowedChordIds: balloonStage.resolvedAllowedChordIds(),
            entries: requirement.survivalRandomChords,
            stageType: balloonStage.stageType
        )
    }

    private func launchRequirement(_ requirement: LessonSong) {
        pendingClearCheck = PendingRequirementClearCheck(
            lessonSongId: requirement.id,
            wasCompletedBefore: progress(for: requirement)?.isCompleted == true
        )

        let bn = activeLesson.blockNumber ?? 1
        if courseIsMainQuest && !appState.isPremium && bn > MainQuestFreeTier.maxFreeBlockNumber {
            alertMessage = locale == .ja
                ? "メインクエスト第2チャプター以降はプレミアムが必要です。7日間無料トライアルで続きをプレイできます。"
                : "Main Quest chapters after Chapter 1 require Premium. Continue with a 7-day free trial."
            Task {
                let premium = await appState.ensureFreshBilling()
                if !premium {
                    await MainActor.run { showSubscriptionSheet = true }
                }
            }
            return
        }

        if requirement.isSurvivalTutorial == true {
            survivalTutorialLaunch = SurvivalTutorialLaunch(
                lessonId: activeLesson.id,
                lessonSongId: requirement.id,
                scriptId: requirement.survivalTutorialScriptId ?? "onboarding-v1",
                clearConditions: requirement.clearConditions
            )
            return
        }

        if requirement.isSurvival == true {
            if SurvivalLessonConfig.lessonSongHasInlineComposite(requirement.survivalCompositeConfig) {
                guard let compositeConfig = requirement.survivalCompositeConfig else {
                    alertMessage = locale == .ja
                        ? "複合フレーズ設定がありません。"
                        : "Missing composite phrase configuration."
                    return
                }
                Task {
                    let phrases: [SurvivalPhraseDefinition]
                    do {
                        phrases = try SurvivalLessonConfig.buildSurvivalPhrasesFromLessonCompositeConfig(
                            compositeConfig,
                            lessonSongId: requirement.id
                        )
                    } catch {
                        await MainActor.run {
                            alertMessage = locale == .ja
                                ? "複合フレーズ設定が不正です。"
                                : "Invalid composite phrase configuration."
                        }
                        return
                    }
                    let stage = SurvivalLessonConfig.buildLessonCompositeStageDefinition(
                        title: requirement.title ?? (locale == .ja ? "複合フレーズ課題" : "Composite phrase lesson"),
                        titleEn: requirement.titleEn ?? "Composite phrase lesson",
                        config: compositeConfig
                    )
                    let supabase = SupabaseService.shared
                    let baseConfig = (try? await supabase.fetchSurvivalStageConfig(
                        difficulty: stage.difficulty.rawValue,
                        stageType: stage.survivalBgmConfigStageType
                    )) ?? SurvivalStageConfig.default
                    let runtime = SurvivalLessonConfig.resolveSurvivalLessonRuntime(
                        overrides: requirement.survivalLessonOverrides,
                        stage: stage,
                        baseConfig: baseConfig,
                        isBossStage: true,
                        isCompositeBoss: true
                    )
                    let hintModes = SurvivalLessonConfig.resolveProductionHintModes(
                        stage: stage,
                        overrideStaffRaw: requirement.overrideProductionStaffHintMode,
                        overrideKeyboardRaw: requirement.overrideProductionKeyboardHintMode
                    )
                    let lessonConfig = SurvivalLessonConfig.configWithLessonRuntime(
                        base: baseConfig,
                        runtime: runtime,
                        stageType: stage.survivalBgmConfigStageType
                    )
                    let appliedRandom = Self.appliedLessonRandomChords(for: requirement, stage: stage)
                    let lessonStage = SurvivalLessonRandomChords.survivalStage(stage, applied: appliedRandom)
                    await MainActor.run {
                        LessonMapAudio.shared.stopImmediately()
                        survivalLessonPrep = SurvivalLessonLaunch(
                            stage: lessonStage,
                            hintMode: false,
                            configOverride: lessonConfig,
                            inlineCompositePhrases: phrases,
                            lessonRuntime: runtime,
                            productionHintModes: hintModes,
                            randomChordOverrides: appliedRandom.overrides,
                            lessonId: activeLesson.id,
                            lessonSongId: requirement.id,
                            clearConditions: requirement.clearConditions
                        )
                    }
                }
                return
            }

            guard let stageNumber = requirement.survivalStageNumber else {
                alertMessage = locale == .ja ? "サバイバルステージ設定がありません。" : "Missing survival stage setting."
                return
            }
            let mapCategory = SurvivalMapCategory.resolveLessonMapCategory(requirement.survivalMapCategory)
            Task {
                await ensureSurvivalCatalogLoadedIfNeeded(for: mapCategory, stageNumber: stageNumber)
                guard let stage = SurvivalStageCatalog.stage(byNumber: stageNumber, in: mapCategory) else {
                    await MainActor.run {
                        alertMessage = locale == .ja
                            ? "サバイバルステージを読み込めませんでした。"
                            : "Could not load the survival stage."
                    }
                    return
                }
                let supabase = SupabaseService.shared
                let baseConfig = (try? await supabase.fetchSurvivalStageConfig(
                    difficulty: stage.difficulty.rawValue,
                    stageType: stage.survivalBgmConfigStageType
                )) ?? SurvivalStageConfig.default
                let isBossStage = SurvivalBossEngine.isBlockLastStage(
                    stageNumber: stage.stageNumber,
                    in: stage.mapCategory
                )
                let runtime = SurvivalLessonConfig.resolveSurvivalLessonRuntime(
                    overrides: requirement.survivalLessonOverrides,
                    stage: stage,
                    baseConfig: baseConfig,
                    isBossStage: isBossStage,
                    isCompositeBoss: stage.isCompositePhraseBossStage
                )
                let hintModes = SurvivalLessonConfig.resolveProductionHintModes(
                    stage: stage,
                    overrideStaffRaw: requirement.overrideProductionStaffHintMode,
                    overrideKeyboardRaw: requirement.overrideProductionKeyboardHintMode
                )
                let lessonConfig = SurvivalLessonConfig.configWithLessonRuntime(
                    base: baseConfig,
                    runtime: runtime,
                    stageType: stage.survivalBgmConfigStageType
                )
                let appliedRandom = Self.appliedLessonRandomChords(for: requirement, stage: stage)
                let lessonStage = SurvivalLessonRandomChords.survivalStage(stage, applied: appliedRandom)
                await MainActor.run {
                    LessonMapAudio.shared.stopImmediately()
                    survivalLessonPrep = SurvivalLessonLaunch(
                        stage: lessonStage,
                        hintMode: false,
                        configOverride: lessonConfig,
                        inlineCompositePhrases: nil,
                        lessonRuntime: runtime,
                        productionHintModes: hintModes,
                        randomChordOverrides: appliedRandom.overrides,
                        lessonId: activeLesson.id,
                        lessonSongId: requirement.id,
                        clearConditions: requirement.clearConditions
                    )
                }
            }
            return
        }

        if requirement.isBalloonRush == true {
            guard let stageId = requirement.balloonRushStage?.id ?? requirement.balloonRushStageId else {
                alertMessage = locale == .ja ? "風船ラッシュステージがありません。" : "Missing balloon rush stage."
                return
            }
            Task {
                do {
                    guard let stage = try await SupabaseService.shared.fetchBalloonRushStageById(stageId) else {
                        await MainActor.run {
                            alertMessage = locale == .ja
                                ? "風船ラッシュステージを読み込めませんでした。"
                                : "Could not load the balloon rush stage."
                        }
                        return
                    }
                    await MainActor.run {
                        LessonMapAudio.shared.stopImmediately()
                        let appliedRandom = Self.appliedLessonRandomChords(for: requirement, balloonStage: stage)
                        let presentation = BalloonRushSurvivalBridge.presentationStage(
                            from: stage,
                            allowedChordIds: appliedRandom.allowedChordIds
                        )
                        let hintModes = SurvivalLessonConfig.resolveProductionHintModes(
                            stage: presentation,
                            overrideStaffRaw: requirement.overrideProductionStaffHintMode,
                            overrideKeyboardRaw: requirement.overrideProductionKeyboardHintMode
                        )
                        let appliedForLaunch: AppliedSurvivalLessonRandomChords? = {
                            guard let entries = requirement.survivalRandomChords, !entries.isEmpty else { return nil }
                            return appliedRandom
                        }()
                        balloonRushPrep = BalloonRushPrepContext(
                            stage: stage,
                            productionHintModes: hintModes,
                            appliedRandomChords: appliedForLaunch,
                            lessonId: activeLesson.id,
                            lessonSongId: requirement.id,
                            clearConditions: requirement.clearConditions
                        )
                    }
                } catch {
                    await MainActor.run {
                        alertMessage = locale == .ja
                            ? "風船ラッシュステージの読み込みに失敗しました。"
                            : "Failed to load balloon rush stage."
                    }
                }
            }
            return
        }


        if requirement.isFantasy {
            guard let stageId = requirement.fantasyStage?.id ?? requirement.fantasyStageId else {
                alertMessage = locale == .ja ? "ファンタジーステージ設定がありません。" : "Missing fantasy stage setting."
                return
            }
            var fantasyParams: [String: String] = [
                "lessonId": activeLesson.id.uuidString,
                "lessonSongId": requirement.id.uuidString,
                "stageId": stageId.uuidString,
            ]
            if let cc = encodeClearConditions(requirement.clearConditions) {
                fantasyParams["clearConditions"] = cc
            }
            launchDestination = LessonLaunchDestination(
                hash: buildHash(base: "fantasy", params: fantasyParams)
            )
            return
        }

        if requirement.isEarTrainingTutorial == true {
            earTrainingTutorialLaunch = EarTrainingTutorialLaunch(
                lessonId: activeLesson.id,
                lessonSongId: requirement.id,
                scriptId: requirement.earTrainingTutorialScriptId ?? "developer-full-v1",
                clearConditions: requirement.clearConditions
            )
            return
        }

            if requirement.isEarTraining == true {
                guard let stageId = requirement.earTrainingStage?.id ?? requirement.earTrainingStageId else {
                    alertMessage = locale == .ja ? "バトルモードステージ設定がありません。" : "Missing battle mode stage setting."
                    return
                }
                let overrideBgm = requirement.survivalLessonOverrides?.bgmUrl?
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                earTrainingLaunch = EarTrainingLaunch(
                    stageId: stageId,
                    lessonId: activeLesson.id,
                    lessonSongId: requirement.id,
                    clearConditions: requirement.clearConditions,
                    bgmUrl: (overrideBgm?.isEmpty == false) ? overrideBgm : nil
                )
                return
            }

        alertMessage = locale == .ja ? "この課題は現在プレイできません。" : "This task is not available to play."
    }

    /// 指定ステージがカタログに無いとき Supabase から再構築する（`SurvivalView.loadProgress` と同様）。
    private func ensureSurvivalCatalogLoadedIfNeeded(for category: SurvivalMapCategory, stageNumber: Int) async {
        if SurvivalStageCatalog.stage(byNumber: stageNumber, in: category) != nil {
            return
        }
        async let fetchedStages = SupabaseService.shared.fetchSurvivalStages()
        async let fetchedBlocks = SupabaseService.shared.fetchSurvivalStageBlocks()
        async let fetchedCompositeStages = SupabaseService.shared.fetchSurvivalCompositePhraseStages()
        async let fetchedCompositeSources = SupabaseService.shared.fetchSurvivalCompositePhraseSources()
        let rows = try? await fetchedStages
        let blockRows = (try? await fetchedBlocks) ?? []
        let compositeStages = (try? await fetchedCompositeStages) ?? []
        let compositeSources = (try? await fetchedCompositeSources) ?? []
        if let rows, !rows.isEmpty {
            SurvivalStageCatalog.load(
                rows: rows,
                blockLabelRows: blockRows,
                compositeStageRows: compositeStages,
                compositeSourceRows: compositeSources
            )
        }
    }

    private func buildHash(base: String, params: [String: String]) -> String {
        var components = URLComponents()
        var items = [URLQueryItem(name: "platform", value: "ios")]
        items.append(contentsOf: params.map { URLQueryItem(name: $0.key, value: $0.value) })
        components.queryItems = items
        let query = components.percentEncodedQuery ?? ""
        return query.isEmpty ? base : "\(base)?\(query)"
    }

    private func encodeClearConditions(_ conditions: LessonClearConditions?) -> String? {
        guard let conditions else { return nil }
        let encoder = JSONEncoder()
        guard let data = try? encoder.encode(conditions) else { return nil }
        return String(data: data, encoding: .utf8)
    }
}

private struct LessonEmbeddedVideoPlayer: View {
    let video: LessonVideoResource

    var body: some View {
        Group {
            if let directURL = directVideoURL {
                FullScreenAVPlayerView(url: directURL)
                    .background(Color.black)
            } else if let embedURL = bunnyEmbedURL {
                LessonVideoWebView(url: embedURL)
                    .background(Color.black)
            } else {
                ZStack {
                    Color.black
                    Text("Video unavailable")
                        .foregroundStyle(.gray)
                }
            }
        }
    }

    private var directVideoURL: URL? {
        guard let value = video.videoUrl else { return nil }
        return URL(string: value)
    }

    private var bunnyEmbedURL: URL? {
        guard !video.vimeoUrl.isEmpty else { return nil }
        return URL(string: "https://iframe.mediadelivery.net/embed/295659/\(video.vimeoUrl)?autoplay=false")
    }
}

private struct FullScreenAVPlayerView: UIViewControllerRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIViewController(context: Context) -> AVPlayerViewController {
        let controller = AVPlayerViewController()
        controller.player = AVPlayer(url: url)
        controller.allowsPictureInPicturePlayback = true
        controller.delegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ controller: AVPlayerViewController, context: Context) {}

    @MainActor
    class Coordinator: NSObject, AVPlayerViewControllerDelegate {
        nonisolated func playerViewController(
            _ playerViewController: AVPlayerViewController,
            willBeginFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
        ) {
            Task { @MainActor in
                OrientationManager.shared.lock(.allButUpsideDown)
            }
        }

        nonisolated func playerViewController(
            _ playerViewController: AVPlayerViewController,
            willEndFullScreenPresentationWithAnimationCoordinator coordinator: UIViewControllerTransitionCoordinator
        ) {
            Task { @MainActor in
                coordinator.animate(alongsideTransition: nil) { _ in
                    OrientationManager.shared.lock(.portrait)
                }
            }
        }
    }
}

private struct LessonVideoWebView: UIViewRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.isElementFullscreenEnabled = true

        let userContent = config.userContentController
        userContent.add(context.coordinator, name: "fullscreenChange")

        let script = WKUserScript(
            source: """
            (function(){
                function notify(fs){
                    window.webkit.messageHandlers.fullscreenChange.postMessage(!!fs);
                }
                document.addEventListener('fullscreenchange', function(){
                    notify(document.fullscreenElement);
                });
                document.addEventListener('webkitfullscreenchange', function(){
                    notify(document.webkitFullscreenElement);
                });
            })();
            """,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: false
        )
        userContent.addUserScript(script)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.isScrollEnabled = false
        webView.backgroundColor = .black
        webView.isOpaque = false
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if webView.url != url {
            webView.load(URLRequest(url: url))
        }
    }

    class Coordinator: NSObject, WKScriptMessageHandler {
        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard message.name == "fullscreenChange",
                  let isFullscreen = message.body as? Bool else { return }
            Task { @MainActor in
                if isFullscreen {
                    OrientationManager.shared.lock(.allButUpsideDown)
                } else {
                    OrientationManager.shared.lock(.portrait)
                }
            }
        }
    }
}
