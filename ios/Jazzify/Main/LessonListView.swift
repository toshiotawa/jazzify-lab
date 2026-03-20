import AVKit
import SwiftUI
import WebKit

struct LessonListView: View {
    @EnvironmentObject var appState: AppState
    @State private var courses: [Course] = []
    @State private var expandedCourseId: UUID?
    @State private var lessonsMap: [UUID: [Lesson]] = [:]
    @State private var progressMap: [UUID: Set<UUID>] = [:]
    @State private var selectedLesson: Lesson?
    @State private var isLoading = true
    @State private var showLessonInfo = false
    @State private var showSubscription = false

    private var locale: AppLocale { appState.locale }

    private struct LessonAccessState {
        let isUnlocked: Bool
        let isCompleted: Bool
    }

    private struct BlockAccessState {
        let blockNumber: Int
        let isUnlocked: Bool
        let isCompleted: Bool
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "0f172a").ignoresSafeArea()

                if isLoading {
                    ProgressView()
                        .tint(.purple)
                } else if courses.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "book.closed")
                            .font(.system(size: 48))
                            .foregroundStyle(.gray)
                        Text(locale == .ja ? "レッスンがありません" : "No lessons available")
                            .foregroundStyle(.gray)
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(courses) { course in
                                courseRow(course)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle(locale == .ja ? "レッスン" : "Lessons")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .task { await loadCourses() }
            .navigationDestination(
                isPresented: Binding(
                    get: { selectedLesson != nil },
                    set: { if !$0 { selectedLesson = nil } }
                )
            ) {
                if let selectedLesson {
                    LessonDetailView(lesson: selectedLesson)
                }
            }
            .onChange(of: selectedLesson == nil) { isNil in
                if isNil {
                    Task { await reloadAllProgress() }
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
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
                    title: locale == .ja ? "レッスン" : "Lessons",
                    description: locale == .ja
                        ? "コース形式のレッスンで体系的にジャズを学べます。各レッスンには動画解説と実習課題があり、課題をクリアすると次のレッスンがアンロックされます。ブロックごとに進捗を管理し、段階的にスキルアップできます。"
                        : "Learn jazz systematically through structured course lessons. Each lesson includes video explanations and practice tasks. Complete tasks to unlock the next lesson. Progress is tracked by blocks, allowing you to level up step by step.",
                    locale: locale
                )
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
            }
        }
    }

    // MARK: - Course Row

    private func courseRow(_ course: Course) -> some View {
        VStack(spacing: 0) {
            Button {
                if !appState.isPremium && course.premiumOnly == true {
                    showSubscription = true
                    return
                }
                withAnimation(.easeInOut(duration: 0.2)) {
                    if expandedCourseId == course.id {
                        expandedCourseId = nil
                    } else {
                        expandedCourseId = course.id
                        if lessonsMap[course.id] == nil {
                            Task { await loadLessons(for: course.id) }
                        }
                    }
                }
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
                       let completed = progressMap[course.id] {
                        let total = lessons.count
                        let done = completed.count
                        if total > 0 {
                            Text("\(done)/\(total)")
                                .font(.caption.bold())
                                .foregroundStyle(done == total ? .green : .gray)
                                .padding(.trailing, 4)
                        }
                    }

                    if !appState.isPremium && course.premiumOnly == true {
                        Image(systemName: "lock.fill")
                            .foregroundStyle(.purple)
                    } else {
                        Image(systemName: expandedCourseId == course.id ? "chevron.up" : "chevron.down")
                            .foregroundStyle(.gray)
                    }
                }
                .padding(16)
            }

            if expandedCourseId == course.id {
                if let lessons = lessonsMap[course.id] {
                    blockGroupedLessons(lessons, courseId: course.id)
                } else {
                    ProgressView()
                        .tint(.purple)
                        .padding()
                }
            }
        }
        .background(Color(hex: "1e293b"))
        .cornerRadius(12)
    }

    // MARK: - Block Grouped Lessons

    private func blockGroupedLessons(_ lessons: [Lesson], courseId: UUID) -> some View {
        let grouped = groupByBlock(lessons)
        let completedIds = progressMap[courseId] ?? []
        let accessGraph = buildLessonAccessGraph(lessons, completedIds: completedIds)

        return VStack(spacing: 0) {
            ForEach(grouped, id: \.blockNumber) { block in
                HStack {
                    Text(blockDisplayName(block))
                        .font(.caption.bold())
                        .foregroundStyle(.purple)
                    Spacer()
                    if let blockState = accessGraph.blockStates[block.blockNumber] {
                        Text(blockStatusLabel(blockState))
                            .font(.caption2.bold())
                            .foregroundStyle(blockStatusColor(blockState))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(blockStatusColor(blockState).opacity(0.18))
                            .cornerRadius(999)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 10)
                .padding(.bottom, 4)

                ForEach(block.lessons) { lesson in
                    lessonRow(
                        lesson,
                        courseId: courseId,
                        accessState: accessGraph.lessonStates[lesson.id]
                    )
                }
            }
        }
    }

    private struct BlockGroup {
        let blockNumber: Int
        let blockName: String?
        var lessons: [Lesson]
    }

    private func groupByBlock(_ lessons: [Lesson]) -> [BlockGroup] {
        let sortedLessons = lessons.sorted { lhs, rhs in
            let leftBlock = lhs.blockNumber ?? 1
            let rightBlock = rhs.blockNumber ?? 1
            if leftBlock != rightBlock {
                return leftBlock < rightBlock
            }
            return lhs.orderIndex < rhs.orderIndex
        }
        var map: [Int: BlockGroup] = [:]
        var order: [Int] = []

        for lesson in sortedLessons {
            let bn = lesson.blockNumber ?? 1
            if map[bn] == nil {
                let name: String? = {
                    if locale == .en, let en = lesson.blockNameEn, !en.isEmpty { return en }
                    return lesson.blockName
                }()
                map[bn] = BlockGroup(blockNumber: bn, blockName: name, lessons: [])
                order.append(bn)
            }
            map[bn]?.lessons.append(lesson)
        }

        return order.compactMap { map[$0] }
    }

    private func buildLessonAccessGraph(
        _ lessons: [Lesson],
        completedIds: Set<UUID>
    ) -> (
        lessonStates: [UUID: LessonAccessState],
        blockStates: [Int: BlockAccessState]
    ) {
        let grouped = groupByBlock(lessons)
        var lessonStates: [UUID: LessonAccessState] = [:]
        var blockStates: [Int: BlockAccessState] = [:]

        for (index, block) in grouped.enumerated() {
            let previousBlockNumber = index > 0 ? grouped[index - 1].blockNumber : nil
            let previousCompleted = previousBlockNumber == nil || blockStates[previousBlockNumber!]?.isCompleted == true
            let isUnlocked = index == 0 || previousCompleted
            let isCompleted = !block.lessons.isEmpty && block.lessons.allSatisfy { completedIds.contains($0.id) }

            blockStates[block.blockNumber] = BlockAccessState(
                blockNumber: block.blockNumber,
                isUnlocked: isUnlocked,
                isCompleted: isCompleted
            )

            for lesson in block.lessons {
                lessonStates[lesson.id] = LessonAccessState(
                    isUnlocked: isUnlocked,
                    isCompleted: completedIds.contains(lesson.id)
                )
            }
        }

        return (lessonStates, blockStates)
    }

    // MARK: - Lesson Row

    @ViewBuilder
    private func lessonRow(_ lesson: Lesson, courseId: UUID, accessState: LessonAccessState?) -> some View {
        let isMembershipLocked = !appState.isPremium && (lesson.premiumOnly ?? false)
        let isUnlocked = accessState?.isUnlocked ?? false
        let isCompleted = accessState?.isCompleted ?? (progressMap[courseId]?.contains(lesson.id) ?? false)
        let isLocked = isMembershipLocked || !isUnlocked

        if isLocked {
            lessonRowContent(
                lesson,
                isLocked: true,
                isCompleted: isCompleted,
                isMembershipLocked: isMembershipLocked
            )
        } else {
            Button {
                selectedLesson = lesson
            } label: {
                lessonRowContent(
                    lesson,
                    isLocked: false,
                    isCompleted: isCompleted,
                    isMembershipLocked: false
                )
            }
            .buttonStyle(.plain)
        }
    }

    @ViewBuilder
    private func lessonRowContent(
        _ lesson: Lesson,
        isLocked: Bool,
        isCompleted: Bool,
        isMembershipLocked: Bool
    ) -> some View {
        HStack {
            if isCompleted {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            } else if isLocked {
                Image(systemName: "lock.fill")
                    .foregroundStyle(.gray)
            } else {
                Image(systemName: "play.circle.fill")
                    .foregroundStyle(.purple)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(lesson.localizedTitle(locale))
                    .font(.subheadline)
                    .foregroundStyle(isLocked ? .gray : .white)

                Text(lessonDisplayText(lesson))
                    .font(.caption2)
                    .foregroundStyle(.gray)

                if let desc = lesson.localizedDescription(locale), !desc.isEmpty {
                    Text(desc)
                        .font(.caption2)
                        .foregroundStyle(.gray)
                        .lineLimit(1)
                }
            }

            Spacer()

            if isMembershipLocked {
                Text("Premium")
                    .font(.caption2)
                    .foregroundStyle(.purple)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.purple.opacity(0.2))
                    .cornerRadius(4)
            } else if isLocked {
                Text(locale == .ja ? "未解放" : "Locked")
                    .font(.caption2)
                    .foregroundStyle(.gray)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.gray.opacity(0.18))
                    .cornerRadius(4)
            } else if isCompleted {
                Text(locale == .ja ? "完了" : "Done")
                    .font(.caption2)
                    .foregroundStyle(.green)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.green.opacity(0.2))
                    .cornerRadius(4)
            } else {
                Text(locale == .ja ? "進行中" : "In Progress")
                    .font(.caption2)
                    .foregroundStyle(.blue)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.blue.opacity(0.18))
                    .cornerRadius(4)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .opacity(isLocked ? 0.6 : 1)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(isCompleted ? Color.green.opacity(0.08) : Color.clear)
        )
    }

    private func blockDisplayName(_ block: BlockGroup) -> String {
        if let name = block.blockName, !name.isEmpty {
            return name
        }
        return locale == .ja ? "ブロック \(block.blockNumber)" : "Block \(block.blockNumber)"
    }

    private func blockStatusLabel(_ state: BlockAccessState) -> String {
        if state.isCompleted {
            return locale == .ja ? "完了" : "Completed"
        }
        if state.isUnlocked {
            return locale == .ja ? "進行中" : "In Progress"
        }
        return locale == .ja ? "未解放" : "Locked"
    }

    private func blockStatusColor(_ state: BlockAccessState) -> Color {
        if state.isCompleted {
            return .green
        }
        if state.isUnlocked {
            return .blue
        }
        return .gray
    }

    private func lessonDisplayText(_ lesson: Lesson) -> String {
        let lessonNumber = lesson.orderIndex + 1
        return locale == .ja ? "レッスン \(lessonNumber)" : "Lesson \(lessonNumber)"
    }

    // MARK: - Data

    private func loadCourses() async {
        isLoading = true
        do {
            let allCourses = try await SupabaseService.shared.fetchCourses()
            let audienceFilter = locale == .en ? "global" : "japan"
            courses = allCourses.filter { course in
                let a = course.audience ?? "both"
                return a == "both" || a == audienceFilter
            }
        } catch {
            courses = []
        }
        isLoading = false
    }

    private func reloadAllProgress() async {
        guard let userId = appState.profile?.id else { return }
        for courseId in lessonsMap.keys {
            do {
                let progress = try await SupabaseService.shared.fetchLessonProgress(courseId: courseId, userId: userId)
                let completedIds = Set(progress.filter(\.completed).map(\.lessonId))
                progressMap[courseId] = completedIds
            } catch {
                // keep existing progress on failure
            }
        }
    }

    private func loadLessons(for courseId: UUID) async {
        do {
            let lessons = try await SupabaseService.shared.fetchLessons(courseId: courseId)
                .sorted { lhs, rhs in
                    let leftBlock = lhs.blockNumber ?? 1
                    let rightBlock = rhs.blockNumber ?? 1
                    if leftBlock != rightBlock {
                        return leftBlock < rightBlock
                    }
                    return lhs.orderIndex < rhs.orderIndex
                }
            lessonsMap[courseId] = lessons

            if let userId = appState.profile?.id {
                let progress = try await SupabaseService.shared.fetchLessonProgress(courseId: courseId, userId: userId)
                let completedIds = Set(progress.filter(\.completed).map(\.lessonId))
                progressMap[courseId] = completedIds
            }
        } catch {
            lessonsMap[courseId] = []
        }
    }
}

private struct LessonLaunchDestination: Identifiable {
    let id = UUID()
    let hash: String
}

struct LessonDetailView: View {
    @EnvironmentObject var appState: AppState

    let lesson: Lesson

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
        (detail?.lessonSongs ?? []).sorted { lhs, rhs in
            let leftOrder = lhs.orderIndex ?? .max
            let rightOrder = rhs.orderIndex ?? .max
            if leftOrder != rightOrder {
                return leftOrder < rightOrder
            }
            return requirementSortKey(lhs) < requirementSortKey(rhs)
        }
    }

    private var currentVideo: LessonVideoResource? {
        guard videos.indices.contains(currentVideoIndex) else { return videos.first }
        return videos[currentVideoIndex]
    }

    var body: some View {
        ZStack {
            Color(hex: "0f172a").ignoresSafeArea()

            if isLoading {
                ProgressView()
                    .tint(.purple)
            } else if let detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        summaryCard(detail)
                        if let assignment = detail.assignmentDescription, !assignment.isEmpty {
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
                    Text(locale == .ja ? "レッスン詳細の読み込みに失敗しました" : "Failed to load lesson details")
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
        .navigationTitle(lesson.localizedTitle(locale))
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .task { await loadLessonDetail() }
        .onChange(of: appState.locale) { _ in
            Task { await loadLessonDetail() }
        }
        .fullScreenCover(item: $launchDestination) { destination in
            GameWebView(
                mode: .webPage(hash: destination.hash),
                locale: locale,
                onClose: { launchDestination = nil }
            )
        }
        .onChange(of: launchDestination == nil) { isNil in
            if isNil {
                Task { await loadLessonDetail() }
            }
        }
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
                let total = detail.lessonSongs.count
                let done = detail.lessonSongs.filter { progress(for: $0)?.isCompleted == true }.count
                Label("\(done)/\(total)", systemImage: "checkmark.circle")
                    .font(.caption)
                    .foregroundStyle(.gray)
                if let blockNumber = lesson.blockNumber {
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
        let title = requirementTitle(requirement, index: index)
        let requiredCount = max(requirement.clearConditions?.count ?? 1, 1)
        let displayProgress: String

        if requirement.clearConditions?.requiresDays == true {
            displayProgress = "\(progressRow?.clearDates.count ?? 0)/\(requiredCount)\(locale == .ja ? "日" : " days")"
        } else {
            displayProgress = "\(progressRow?.clearCount ?? 0)/\(requiredCount)"
        }

        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)

                    Text(requirementSubtitle(requirement))
                        .font(.caption)
                        .foregroundStyle(.gray)
                }

                Spacer()

                if isCompleted {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                }
            }

            HStack(spacing: 10) {
                if let rank = requirement.clearConditions?.rank {
                    badge(rank, color: .orange)
                }
                badge(displayProgress, color: isCompleted ? .green : .blue)
                if let notation = requirement.clearConditions?.notationSetting {
                    badge(notationLabel(notation), color: .purple)
                }
            }

            clearConditionsGrid(requirement)

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
    private func clearConditionsGrid(_ requirement: LessonSong) -> some View {
        if let cc = requirement.clearConditions {
            let isFantasy = requirement.isFantasy
            let isSurvival = requirement.isSurvival ?? false
            let requiresDays = cc.requiresDays ?? false
            let count = cc.count ?? 1

            VStack(alignment: .leading, spacing: 6) {
                Text(locale == .ja ? "クリア条件" : "Clear Conditions")
                    .font(.caption2.bold())
                    .foregroundStyle(.gray)

                let columns = [GridItem(.flexible()), GridItem(.flexible())]
                LazyVGrid(columns: columns, alignment: .leading, spacing: 4) {
                    if !isFantasy && !isSurvival {
                        conditionItem(
                            locale == .ja ? "キー" : "Key",
                            value: {
                                let k = cc.key ?? 0
                                return k > 0 ? "+\(k)" : "\(k)"
                            }()
                        )
                        conditionItem(
                            locale == .ja ? "速度" : "Speed",
                            value: "\(cc.speed ?? 1.0)x"
                        )
                    }
                    if !isSurvival {
                        conditionItem(
                            locale == .ja ? "ランク" : "Rank",
                            value: "\(cc.rank ?? "B")\(locale == .ja ? "以上" : "+")"
                        )
                    }
                    conditionItem(
                        locale == .ja ? "回数" : "Count",
                        value: requiresDays
                            ? "\(count)\(locale == .ja ? "日間" : " days")"
                            : "\(count)\(locale == .ja ? "回" : "x")"
                    )
                }
            }
            .padding(10)
            .background(Color(hex: "0f172a").opacity(0.5))
            .cornerRadius(8)
        }
    }

    private func conditionItem(_ label: String, value: String) -> some View {
        HStack(spacing: 4) {
            Text(label + ":")
                .font(.caption2)
                .foregroundStyle(.gray)
            Text(value)
                .font(.caption2.bold())
                .foregroundStyle(.white)
        }
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
                if let url = URL(string: attachment.url) {
                    Link(destination: url) {
                        HStack {
                            Image(systemName: "paperclip.circle.fill")
                                .foregroundStyle(.purple)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(attachment.fileName)
                                    .foregroundStyle(.white)
                                if let contentType = attachment.contentType {
                                    Text(contentType)
                                        .font(.caption2)
                                        .foregroundStyle(.gray)
                                }
                            }
                            Spacer()
                            Image(systemName: "arrow.down.circle")
                                .foregroundStyle(.gray)
                        }
                        .padding(14)
                        .background(Color(hex: "334155"))
                        .cornerRadius(12)
                    }
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

    private var completionCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button {
                Task { await completeLesson() }
            } label: {
                HStack {
                    if isCompleting {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: isLessonCompleted ? "checkmark.circle.fill" : "flag.checkered")
                    }
                    Text(
                        isLessonCompleted
                        ? (locale == .ja ? "レッスン完了済み" : "Lesson completed")
                        : (locale == .ja ? "レッスン完了" : "Complete lesson")
                    )
                    Spacer()
                }
                .font(.subheadline.bold())
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(isLessonCompleted ? Color.gray : Color.blue)
                .cornerRadius(12)
            }
            .buttonStyle(.plain)
            .disabled(isCompleting || isLessonCompleted)

            Text(
                allRequirementsCompleted
                ? (locale == .ja ? "すべての課題を完了済みです。" : "All lesson tasks are complete.")
                : (locale == .ja ? "すべての実習課題を完了してから押してください。" : "Complete all lesson tasks before marking this lesson complete.")
            )
            .font(.caption)
            .foregroundStyle(allRequirementsCompleted ? .green : .gray)
        }
        .padding(18)
        .background(Color(hex: "1e293b"))
        .cornerRadius(16)
    }

    private func loadLessonDetail() async {
        isLoading = true
        defer { isLoading = false }

        do {
            async let detailTask = SupabaseService.shared.fetchLessonDetail(lessonId: lesson.id)
            async let videosTask: [LessonVideoResource] = {
                (try? await SupabaseService.shared.fetchLessonVideos(lessonId: lesson.id)) ?? []
            }()
            async let attachmentsTask: [LessonAttachmentResource] = {
                (try? await SupabaseService.shared.fetchLessonAttachments(lessonId: lesson.id)) ?? []
            }()

            let fetchedDetail = try await detailTask
            detail = fetchedDetail
            let rawVideos = await videosTask
            let rawAttachments = await attachmentsTask
            videos = rawVideos.filter { $0.isVisible(for: appState.locale) }
            attachments = rawAttachments.filter { $0.isVisible(for: appState.locale) }
            currentVideoIndex = 0

            if let userId = appState.profile?.id {
                requirementProgress = (try? await SupabaseService.shared.fetchLessonRequirementProgress(
                    lessonId: lesson.id,
                    userId: userId
                )) ?? []

                if let courseId = lesson.courseId {
                    let progressRows = try? await SupabaseService.shared.fetchLessonProgress(
                        courseId: courseId,
                        userId: userId
                    )
                    isLessonCompleted = progressRows?.first(where: { $0.lessonId == lesson.id })?.completed ?? false
                }
            } else {
                requirementProgress = []
                isLessonCompleted = false
            }
        } catch {
            detail = nil
            alertMessage = error.localizedDescription
        }
    }

    private func completeLesson() async {
        guard let userId = appState.profile?.id, let courseId = lesson.courseId else {
            alertMessage = locale == .ja ? "ログイン情報を確認できません。" : "Unable to confirm login state."
            return
        }
        guard allRequirementsCompleted else {
            alertMessage = locale == .ja
                ? "すべての実習課題を完了してからレッスンを完了してください。"
                : "Complete all tasks before marking this lesson complete."
            return
        }

        isCompleting = true
        defer { isCompleting = false }

        do {
            try await SupabaseService.shared.updateLessonProgress(
                lessonId: lesson.id,
                courseId: courseId,
                userId: userId,
                completed: true
            )
            isLessonCompleted = true
            alertMessage = locale == .ja ? "レッスンを完了しました。" : "Lesson completed."
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    private func progress(for requirement: LessonSong) -> LessonRequirementProgressRow? {
        requirementProgress.first { progress in
            if requirement.isFantasy || requirement.isSurvival == true {
                return progress.lessonSongId == requirement.id
            }
            return progress.songId == requirement.songId
        }
    }

    private func requirementTitle(_ requirement: LessonSong, index: Int) -> String {
        if let title = requirement.title, !title.isEmpty {
            return "\(index + 1). \(title)"
        }
        if let songTitle = requirement.songs?.title {
            return "\(index + 1). \(songTitle)"
        }
        if requirement.isSurvival == true, let stageNumber = requirement.survivalStageNumber {
            return "\(index + 1). \(locale == .ja ? "サバイバル ステージ" : "Survival Stage") \(stageNumber)"
        }
        if requirement.isFantasy, let fantasyStage = requirement.fantasyStage {
            return "\(index + 1). \(fantasyStage.localizedName(locale))"
        }
        return "\(index + 1). \(locale == .ja ? "課題" : "Task")"
    }

    private func requirementSubtitle(_ requirement: LessonSong) -> String {
        if requirement.isSurvival == true {
            if let stageNumber = requirement.survivalStageNumber {
                return locale == .ja ? "サバイバル課題 / Stage \(stageNumber)" : "Survival task / Stage \(stageNumber)"
            }
            return locale == .ja ? "サバイバル課題" : "Survival task"
        }

        if requirement.isFantasy {
            if let fantasyStage = requirement.fantasyStage {
                let stageLabel = fantasyStage.stageNumber ?? "-"
                return locale == .ja
                    ? "ファンタジー課題 / \(stageLabel)"
                    : "Fantasy task / \(stageLabel)"
            }
            return locale == .ja ? "ファンタジー課題" : "Fantasy task"
        }

        if let artist = requirement.songs?.artist, !artist.isEmpty {
            return artist
        }

        return locale == .ja ? "通常課題" : "Standard task"
    }

    private func badge(_ text: String, color: Color) -> some View {
        Text(text)
            .font(.caption2.bold())
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.18))
            .cornerRadius(999)
    }

    private func notationLabel(_ notation: String) -> String {
        switch notation {
        case "notes_chords":
            return locale == .ja ? "ノート&コード" : "Notes + Chords"
        case "chords_only":
            return locale == .ja ? "コードのみ" : "Chords only"
        default:
            return locale == .ja ? "両方" : "Both"
        }
    }

    private func videoTitle(_ video: LessonVideoResource) -> String {
        locale == .ja ? "動画 \(video.orderIndex + 1)" : "Video \(video.orderIndex + 1)"
    }

    private func requirementSortKey(_ requirement: LessonSong) -> String {
        if let title = requirement.title, !title.isEmpty {
            return title
        }
        if let songTitle = requirement.songs?.title {
            return songTitle
        }
        if let stageNumber = requirement.survivalStageNumber {
            return String(stageNumber)
        }
        if let fantasyStage = requirement.fantasyStage?.stageNumber {
            return fantasyStage
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

    private func launchRequirement(_ requirement: LessonSong) {
        if requirement.isSurvival == true {
            guard let stageNumber = requirement.survivalStageNumber else {
                alertMessage = locale == .ja ? "サバイバルステージ設定がありません。" : "Missing survival stage setting."
                return
            }
            launchDestination = LessonLaunchDestination(
                hash: buildHash(
                    base: "survival-lesson",
                    params: [
                        "lessonId": lesson.id.uuidString,
                        "lessonSongId": requirement.id.uuidString,
                        "stageNumber": String(stageNumber),
                        "clearConditions": encodeClearConditions(requirement.clearConditions) ?? ""
                    ]
                )
            )
            return
        }

        if requirement.isFantasy {
            guard let stageId = requirement.fantasyStage?.id ?? requirement.fantasyStageId else {
                alertMessage = locale == .ja ? "ファンタジーステージ設定がありません。" : "Missing fantasy stage setting."
                return
            }
            var fantasyParams: [String: String] = [
                "lessonId": lesson.id.uuidString,
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

        guard let songId = requirement.songId else {
            alertMessage = locale == .ja ? "通常課題の曲設定がありません。" : "Missing song setting for this task."
            return
        }

        launchDestination = LessonLaunchDestination(
            hash: buildHash(
                base: "play-lesson",
                params: [
                    "id": songId.uuidString,
                    "lessonId": lesson.id.uuidString,
                    "key": String(requirement.clearConditions?.key ?? 0),
                    "speed": String(requirement.clearConditions?.speed ?? 1.0),
                    "rank": requirement.clearConditions?.rank ?? "B",
                    "count": String(requirement.clearConditions?.count ?? 1),
                    "notation": requirement.clearConditions?.notationSetting ?? "both",
                    "requiresDays": String(requirement.clearConditions?.requiresDays ?? false),
                    "dailyCount": String(requirement.clearConditions?.dailyCount ?? 1)
                ]
            )
        )
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
                VideoPlayer(player: AVPlayer(url: directURL))
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

private struct LessonVideoWebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

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
}
