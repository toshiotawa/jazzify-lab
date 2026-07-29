import SwiftUI

struct CourseListView: View {
    @EnvironmentObject var appState: AppState
    @State private var courses: [Course] = []
    @State private var lessonsMap: [UUID: [Lesson]] = [:]
    @State private var progressMap: [UUID: Set<UUID>] = [:]
    @State private var isLoading = true
    @State private var showCourseInfo = false
    @State private var showSubscription = false
    @State private var subscriptionEntry: SubscriptionEntry = .default
    @State private var journeyCourse: JourneyCourseLaunch?
    @State private var lastJourneyCourseId: UUID?
    @State private var isSoundMuted: Bool = LessonMapAudio.shared.isMuted

    private var locale: AppLocale { appState.locale }

    private struct JourneyCourseLaunch: Identifiable {
        let id: UUID
        let course: Course
    }

    private func resumeCourseBgmIfEligible() {
        guard journeyCourse == nil else { return }
        guard !LessonMapAudio.shared.isMuted else { return }
        LessonMapAudio.shared.play()
    }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                Color(hex: "0f172a").ignoresSafeArea()

                if isLoading {
                    ProgressView()
                        .tint(.purple)
                } else if courses.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "square.grid.2x2")
                            .font(.system(size: 48))
                            .foregroundStyle(.gray)
                        Text(locale == .ja ? "コースがありません" : "No courses available")
                            .foregroundStyle(.gray)
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            if let bannerKind = appState.paymentIssueBannerKind {
                                PaymentIssueBannerView(kind: bannerKind, locale: locale)
                            }

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
                        .padding()
                    }
                }
            }
            .navigationTitle(locale == .ja ? "コース" : "Courses")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .task { await loadCourses() }
            .onAppear {
                Task { await appState.ensureFreshBilling() }
                isSoundMuted = LessonMapAudio.shared.isMuted
                resumeCourseBgmIfEligible()
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
            .onChange(of: journeyCourse == nil) { isNil in
                guard isNil, let courseId = lastJourneyCourseId else { return }
                lastJourneyCourseId = nil
                Task { await reloadProgressForCourse(courseId: courseId) }
            }
            .onChange(of: journeyCourse?.id) { _ in
                resumeCourseBgmIfEligible()
            }
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        let muted = LessonMapAudio.shared.toggleMuted()
                        isSoundMuted = muted
                        if !muted {
                            resumeCourseBgmIfEligible()
                        }
                    } label: {
                        Image(systemName: isSoundMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                            .foregroundStyle(.white)
                    }
                    Button { showCourseInfo = true } label: {
                        Image(systemName: "info.circle")
                            .foregroundStyle(.gray)
                    }
                }
            }
            .sheet(isPresented: $showSubscription) {
                SubscriptionView(entry: subscriptionEntry)
            }
            .sheet(isPresented: $showCourseInfo) {
                FeatureInfoModal(
                    icon: "square.grid.2x2.fill",
                    iconColor: .purple,
                    title: locale == .ja ? "コース" : "Courses",
                    description: locale == .ja
                        ? "目的別のコースで、テーマやレベルに合わせてジャズを学べます。各コースには複数のクエストがあり、マップ形式で進捗を確認しながら進められます。"
                        : "Learn jazz through focused courses tailored to themes and skill levels. Each course contains multiple quests, and you can track your progress on an interactive map.",
                    locale: locale
                )
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
            }
        }
    }

    private func courseRow(_ course: Course) -> some View {
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
            .padding(16)
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
                    subscriptionEntry = .lessonList
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

    private func loadCourses() async {
        isLoading = true
        do {
            let allCourses = try await SupabaseService.shared.fetchCourses()
            let audienceFilter = locale == .en ? "global" : "japan"
            let filtered = allCourses.filter { course in
                let a = course.audience ?? "both"
                return a == "both" || a == audienceFilter
            }
            courses = filtered.filter { $0.isMainCourse != true }.sorted { a, b in
                let ta = a.resolvedDifficultyTier.sortIndex
                let tb = b.resolvedDifficultyTier.sortIndex
                if ta != tb { return ta < tb }
                return a.orderIndex < b.orderIndex
            }
        } catch {
            courses = []
        }
        isLoading = false
        await prefetchAllCourseProgress()
    }

    private func prefetchAllCourseProgress() async {
        let userId = appState.profile?.id
        let targetCourses = courses

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
