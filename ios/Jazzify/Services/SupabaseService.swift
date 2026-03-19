import Foundation
import Supabase

final class SupabaseService: Sendable {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: Config.supabaseURL,
            supabaseKey: Config.supabaseAnonKey,
            options: .init(
                auth: .init(
                    emitLocalSessionAsInitialSession: true
                )
            )
        )
    }

    // MARK: - Auth

    func sendOTP(email: String, shouldCreateUser: Bool) async throws {
        try await client.auth.signInWithOTP(
            email: email,
            shouldCreateUser: shouldCreateUser
        )
    }

    func verifyOTP(email: String, token: String) async throws {
        try await client.auth.verifyOTP(
            email: email,
            token: token,
            type: .email
        )
    }

    func signInWithPassword(email: String, password: String) async throws {
        try await client.auth.signIn(
            email: email,
            password: password
        )
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    func currentUserId() async throws -> UUID {
        let session = try await client.auth.session
        return session.user.id
    }

    func accessToken() async throws -> String {
        let session = try await client.auth.session
        return session.accessToken
    }

    // MARK: - Profile

    func fetchProfile(userId: UUID) async throws -> Profile {
        let response: Profile = try await client
            .from("profiles")
            .select()
            .eq("id", value: userId.uuidString)
            .single()
            .execute()
            .value
        return response
    }

    func createProfile(userId: UUID, email: String, nickname: String, locale: AppLocale) async throws {
        struct NewProfile: Encodable {
            let id: UUID
            let email: String
            let nickname: String
            let rank: String = "free"
            let xp: Int = 0
            let level: Int = 1
            let preferred_locale: String
            let is_admin: Bool = false
        }

        try await client
            .from("profiles")
            .insert(NewProfile(
                id: userId,
                email: email,
                nickname: nickname,
                preferred_locale: locale.rawValue
            ))
            .execute()
    }

    func updatePreferredLocale(userId: UUID, locale: AppLocale) async throws {
        struct LocaleUpdate: Encodable {
            let preferred_locale: String
        }

        try await client
            .from("profiles")
            .update(LocaleUpdate(preferred_locale: locale.rawValue))
            .eq("id", value: userId.uuidString)
            .execute()
    }

    // MARK: - Lessons

    func fetchCourses() async throws -> [Course] {
        try await client
            .from("courses")
            .select()
            .order("order_index")
            .execute()
            .value
    }

    func fetchLessons(courseId: UUID) async throws -> [Lesson] {
        try await client
            .from("lessons")
            .select()
            .eq("course_id", value: courseId.uuidString)
            .order("order_index")
            .execute()
            .value
    }

    func fetchLessonDetail(lessonId: UUID) async throws -> LessonDetail {
        try await client
            .from("lessons")
            .select("""
            *,
            lesson_songs (
                id,
                lesson_id,
                song_id,
                fantasy_stage_id,
                is_fantasy,
                is_survival,
                survival_stage_number,
                clear_conditions,
                order_index,
                title,
                songs (id, title, artist),
                fantasyStage:fantasy_stages (
                    id,
                    stage_number,
                    name,
                    name_en,
                    description,
                    description_en,
                    stage_tier
                )
            )
            """)
            .eq("id", value: lessonId.uuidString)
            .single()
            .execute()
            .value
    }

    func fetchLessonVideos(lessonId: UUID) async throws -> [LessonVideoResource] {
        try await client
            .from("lesson_videos")
            .select()
            .eq("lesson_id", value: lessonId.uuidString)
            .order("order_index")
            .execute()
            .value
    }

    func fetchLessonAttachments(lessonId: UUID) async throws -> [LessonAttachmentResource] {
        try await client
            .from("lesson_attachments")
            .select()
            .eq("lesson_id", value: lessonId.uuidString)
            .order("order_index")
            .execute()
            .value
    }

    func fetchLessonRequirementProgress(lessonId: UUID, userId: UUID) async throws -> [LessonRequirementProgressRow] {
        try await client
            .from("user_lesson_requirements_progress")
            .select()
            .eq("lesson_id", value: lessonId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
    }

    func updateLessonProgress(
        lessonId: UUID,
        courseId: UUID,
        userId: UUID,
        completed: Bool
    ) async throws {
        struct Payload: Encodable {
            let user_id: UUID
            let lesson_id: UUID
            let course_id: UUID
            let completed: Bool
            let completion_date: String?
            let updated_at: String
        }

        let timestamp = ISO8601DateFormatter().string(from: Date())

        try await client
            .from("user_lesson_progress")
            .upsert(
                Payload(
                    user_id: userId,
                    lesson_id: lessonId,
                    course_id: courseId,
                    completed: completed,
                    completion_date: completed ? timestamp : nil,
                    updated_at: timestamp
                ),
                onConflict: "user_id,lesson_id"
            )
            .execute()
    }

    // MARK: - Tutorial Progress

    struct TutorialProgressResult: Sendable {
        let courseId: UUID
        let totalLessons: Int
        let completedLessons: Int
        let nextLesson: Lesson?
    }

    func fetchTutorialProgress(userId: UUID, locale: AppLocale) async throws -> TutorialProgressResult? {
        let audienceFilter = locale == .en ? "global" : "japan"

        let courses: [Course] = try await client
            .from("courses")
            .select()
            .eq("is_tutorial", value: true)
            .eq("audience", value: audienceFilter)
            .limit(1)
            .execute()
            .value

        guard let course = courses.first else { return nil }

        let lessons: [Lesson] = try await client
            .from("lessons")
            .select()
            .eq("course_id", value: course.id.uuidString)
            .order("order_index")
            .execute()
            .value

        let progressRows: [LessonProgressRow] = try await client
            .from("user_lesson_progress")
            .select()
            .eq("user_id", value: userId.uuidString)
            .eq("course_id", value: course.id.uuidString)
            .eq("completed", value: true)
            .execute()
            .value

        let completedIds = Set(progressRows.map(\.lessonId))
        let nextLesson = lessons.first { !completedIds.contains($0.id) }

        return TutorialProgressResult(
            courseId: course.id,
            totalLessons: lessons.count,
            completedLessons: completedIds.count,
            nextLesson: nextLesson
        )
    }

    // MARK: - Announcements

    func fetchActiveAnnouncements(locale: AppLocale) async throws -> [AnnouncementRow] {
        let publishColumn = locale == .ja ? "publish_ja" : "publish_en"
        let rows: [AnnouncementRow] = try await client
            .from("announcements")
            .select()
            .eq("is_active", value: true)
            .eq(publishColumn, value: true)
            .order("priority")
            .order("created_at", ascending: false)
            .limit(5)
            .execute()
            .value
        return rows
    }

    func fetchAllActiveAnnouncements(locale: AppLocale) async throws -> [AnnouncementRow] {
        let publishColumn = locale == .ja ? "publish_ja" : "publish_en"
        let rows: [AnnouncementRow] = try await client
            .from("announcements")
            .select()
            .eq("is_active", value: true)
            .eq(publishColumn, value: true)
            .order("priority")
            .order("created_at", ascending: false)
            .execute()
            .value
        return rows
    }

    // MARK: - User Stats

    func fetchUserStats(userId: UUID) async throws -> UserStats {
        let lessonCount: Int = try await {
            let response = try await client
                .from("user_lesson_progress")
                .select("id", head: false, count: .exact)
                .eq("user_id", value: userId.uuidString)
                .eq("completed", value: true)
                .execute()
            return response.count ?? 0
        }()

        let challengeDays: Int = try await {
            let response = try await client
                .from("daily_challenge_records")
                .select("played_on", head: false, count: .exact)
                .eq("user_id", value: userId.uuidString)
                .execute()
            return response.count ?? 0
        }()

        let survivalClears: Int = try await {
            let response = try await client
                .from("survival_stage_clears")
                .select("stage_number", head: false, count: .exact)
                .eq("user_id", value: userId.uuidString)
                .execute()
            return response.count ?? 0
        }()

        return UserStats(
            lessonCompletedCount: lessonCount,
            dailyChallengeParticipationDays: challengeDays,
            survivalClearCount: survivalClears
        )
    }

    // MARK: - Lesson Progress

    func fetchLessonProgress(courseId: UUID, userId: UUID) async throws -> [LessonProgressRow] {
        try await client
            .from("user_lesson_progress")
            .select()
            .eq("course_id", value: courseId.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
    }

    // MARK: - Fantasy Stages

    func fetchFantasyStages() async throws -> [FantasyStage] {
        try await client
            .from("fantasy_stages")
            .select("id, stage_number, name, name_en, description, description_en, stage_tier")
            .order("stage_number")
            .execute()
            .value
    }

    // MARK: - Survival

    func fetchSurvivalCharacters() async throws -> [SurvivalCharacterRow] {
        try await client
            .from("survival_characters")
            .select("id, name, name_en, avatar_url, sort_order, description, description_en")
            .order("sort_order")
            .execute()
            .value
    }

    func fetchSurvivalDifficulties() async throws -> [SurvivalDifficultyRow] {
        try await client
            .from("survival_difficulty_settings")
            .select("id, difficulty, display_name, description, description_en")
            .order("difficulty")
            .execute()
            .value
    }

    // MARK: - Survival Stage Clears

    func fetchSurvivalStageClears(userId: UUID) async throws -> [SurvivalStageClearRow] {
        try await client
            .from("survival_stage_clears")
            .select("stage_number, character_id, cleared_at")
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
    }

    // MARK: - Daily Challenge Records

    func fetchDailyChallengeRecords(userId: UUID, difficulty: String, since: String) async throws -> [DailyChallengeRecordRow] {
        try await client
            .from("daily_challenge_records")
            .select("played_on, score, difficulty")
            .eq("user_id", value: userId.uuidString)
            .eq("difficulty", value: difficulty)
            .gte("played_on", value: since)
            .order("played_on")
            .execute()
            .value
    }

    // MARK: - Account Deletion

    func deleteAccount() async throws {
        let token = try await accessToken()

        let url = Config.supabaseURL
            .appendingPathComponent("functions")
            .appendingPathComponent("v1")
            .appendingPathComponent("delete-account")

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseServiceError.invalidResponse
        }

        if httpResponse.statusCode != 200 {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw SupabaseServiceError.serverError(statusCode: httpResponse.statusCode, message: body)
        }
    }
}

enum SupabaseServiceError: LocalizedError {
    case invalidResponse
    case serverError(statusCode: Int, message: String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid server response"
        case .serverError(let code, let message):
            return "Server error (\(code)): \(message)"
        }
    }
}
