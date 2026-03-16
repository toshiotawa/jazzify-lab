import SwiftUI

struct LessonListView: View {
    @EnvironmentObject var appState: AppState
    @State private var courses: [Course] = []
    @State private var expandedCourseId: UUID?
    @State private var lessonsMap: [UUID: [Lesson]] = [:]
    @State private var isLoading = true
    @State private var showGame = false
    @State private var selectedLessonId: UUID?

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
                if let lessonId = selectedLessonId {
                    GameWebView(
                        mode: .lesson(lessonId: lessonId),
                        locale: locale,
                        authToken: nil
                    )
                }
            }
        }
    }

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

                    Image(systemName: expandedCourseId == course.id ? "chevron.up" : "chevron.down")
                        .foregroundStyle(.gray)
                }
                .padding(16)
            }

            if expandedCourseId == course.id {
                if let lessons = lessonsMap[course.id] {
                    VStack(spacing: 0) {
                        ForEach(lessons) { lesson in
                            lessonRow(lesson)
                        }
                    }
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

    private func lessonRow(_ lesson: Lesson) -> some View {
        let isLocked = !appState.isPremium && lesson.requiredRank != nil && lesson.requiredRank != "free"

        return Button {
            guard !isLocked else { return }
            selectedLessonId = lesson.id
            showGame = true
        } label: {
            HStack {
                Image(systemName: isLocked ? "lock.fill" : "play.circle.fill")
                    .foregroundStyle(isLocked ? .gray : .purple)

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
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .disabled(isLocked)
    }

    private func loadCourses() async {
        isLoading = true
        do {
            courses = try await SupabaseService.shared.fetchCourses()
        } catch {
            courses = []
        }
        isLoading = false
    }

    private func loadLessons(for courseId: UUID) async {
        do {
            let lessons = try await SupabaseService.shared.fetchLessons(courseId: courseId)
            lessonsMap[courseId] = lessons
        } catch {
            lessonsMap[courseId] = []
        }
    }
}
