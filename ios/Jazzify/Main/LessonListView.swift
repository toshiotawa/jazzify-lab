import SwiftUI

struct LessonListView: View {
    @EnvironmentObject var appState: AppState
    @State private var courses: [Course] = []
    @State private var expandedCourseId: UUID?
    @State private var lessonsMap: [UUID: [Lesson]] = [:]
    @State private var progressMap: [UUID: Set<UUID>] = [:]
    @State private var isLoading = true
    @State private var showGame = false
    @State private var selectedLessonHash: String?

    private var locale: AppLocale { appState.locale }

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
            .task { await loadCourses() }
            .fullScreenCover(isPresented: $showGame) {
                if let hash = selectedLessonHash {
                    GameWebView(
                        mode: .webPage(hash: hash),
                        locale: locale
                    )
                }
            }
        }
    }

    // MARK: - Course Row

    private func courseRow(_ course: Course) -> some View {
        VStack(spacing: 0) {
            Button {
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

                    Image(systemName: expandedCourseId == course.id ? "chevron.up" : "chevron.down")
                        .foregroundStyle(.gray)
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

        return VStack(spacing: 0) {
            ForEach(grouped, id: \.blockNumber) { block in
                if let name = block.blockName, !name.isEmpty {
                    HStack {
                        Text(name)
                            .font(.caption.bold())
                            .foregroundStyle(.purple)
                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
                    .padding(.bottom, 4)
                }

                ForEach(block.lessons) { lesson in
                    lessonRow(lesson, courseId: courseId)
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
        var map: [Int: BlockGroup] = [:]
        var order: [Int] = []

        for lesson in lessons {
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

    // MARK: - Lesson Row

    private func lessonRow(_ lesson: Lesson, courseId: UUID) -> some View {
        let isLocked = !appState.isPremium && (lesson.premiumOnly ?? false)
        let isCompleted = progressMap[courseId]?.contains(lesson.id) ?? false

        return Button {
            guard !isLocked else { return }
            selectedLessonHash = "lesson-detail?id=\(lesson.id.uuidString)"
            showGame = true
        } label: {
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

                    if let desc = lesson.localizedDescription(locale) {
                        Text(desc)
                            .font(.caption2)
                            .foregroundStyle(.gray)
                            .lineLimit(1)
                    }
                }

                Spacer()

                if isLocked {
                    Text("Premium")
                        .font(.caption2)
                        .foregroundStyle(.purple)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.purple.opacity(0.2))
                        .cornerRadius(4)
                } else if isCompleted {
                    Text(locale == .ja ? "完了" : "Done")
                        .font(.caption2)
                        .foregroundStyle(.green)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.green.opacity(0.2))
                        .cornerRadius(4)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .disabled(isLocked)
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

    private func loadLessons(for courseId: UUID) async {
        do {
            let lessons = try await SupabaseService.shared.fetchLessons(courseId: courseId)
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
