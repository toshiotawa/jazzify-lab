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
                    flowType: .pkce,
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

    func fetchProfileIfExists(userId: UUID) async throws -> Profile? {
        let response: [Profile] = try await client
            .from("profiles")
            .select()
            .eq("id", value: userId.uuidString)
            .limit(1)
            .execute()
            .value
        return response.first
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

    /// Web の `profiles.update({ nickname })` と同じ経路
    func updateProfileNickname(userId: UUID, nickname: String) async throws {
        let trimmed = nickname.trimmingCharacters(in: .whitespacesAndNewlines)
        struct NicknameUpdate: Encodable {
            let nickname: String
        }

        try await client
            .from("profiles")
            .update(NicknameUpdate(nickname: trimmed))
            .eq("id", value: userId.uuidString)
            .execute()
    }

    /// Web の `supabase.auth.updateUser({ email })` と同じ経路（確認コード送信。テンプレートに `{{ .Token }}` が必要）
    func requestEmailChange(newEmail: String) async throws {
        let trimmed = newEmail.trimmingCharacters(in: .whitespacesAndNewlines)
        _ = try await client.auth.update(user: .init(email: trimmed))
    }

    /// メール変更の OTP 検証（`verifyOtp` type `email_change`）
    func verifyEmailChangeOtp(newEmail: String, token: String) async throws {
        let trimmedEmail = newEmail.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedToken = token.trimmingCharacters(in: .whitespacesAndNewlines)
            .filter { $0.isNumber }
        _ = try await client.auth.verifyOTP(
            email: trimmedEmail,
            token: trimmedToken,
            type: .emailChange
        )
    }

    /// ウェブの `USER_UPDATED` 後と同じ Netlify 関数で Stripe / Lemon / profiles を同期
    func syncBillingEmailAfterChange(newEmail: String) async throws {
        let trimmed = newEmail.trimmingCharacters(in: .whitespacesAndNewlines)
        let token = try await accessToken()
        let base = Config.webAppBaseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: base + "/.netlify/functions/updateCustomerEmail") else {
            throw SupabaseServiceError.invalidResponse
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        struct Body: Encodable {
            let email: String
        }
        request.httpBody = try JSONEncoder().encode(Body(email: trimmed))

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseServiceError.invalidResponse
        }
        if httpResponse.statusCode != 200 {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw SupabaseServiceError.serverError(statusCode: httpResponse.statusCode, message: body)
        }
    }

    // MARK: - Lessons

    func fetchCourses() async throws -> [Course] {
        if Config.includeDeveloperLessonCourses {
            return try await client
                .from("courses")
                .select()
                .eq("is_visible", value: true)
                .order("order_index")
                .execute()
                .value
        }
        return try await client
            .from("courses")
            .select()
            .eq("is_visible", value: true)
            .eq("is_developer_only", value: false)
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
                ear_training_stage_id,
                is_fantasy,
                is_survival,
                is_ear_training,
                survival_stage_number,
                clear_conditions,
                order_index,
                title,
                title_en,
                songs (id, title, artist),
                fantasyStage:fantasy_stages (
                    id,
                    stage_number,
                    name,
                    name_en,
                    description,
                    description_en,
                    stage_tier
                ),
                earTrainingStage:ear_training_stages (
                    id,
                    slug,
                    title,
                    title_en,
                    description,
                    description_en,
                    bpm,
                    time_limit_sec,
                    mode,
                    quiz_required_correct_count
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

    func fetchTutorialProgress(userId: UUID) async throws -> TutorialProgressResult? {
        let courses: [Course] = try await client
            .from("courses")
            .select()
            .eq("is_tutorial", value: true)
            .eq("is_visible", value: true)
            .eq("is_developer_only", value: false)
            .order("order_index")
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

    // MARK: - App Release Versions

    func fetchActiveAppReleaseVersion(platform: String) async throws -> AppReleaseVersionRow? {
        let rows: [AppReleaseVersionRow] = try await client
            .from("app_release_versions")
            .select()
            .eq("platform", value: platform)
            .eq("is_active", value: true)
            .limit(1)
            .execute()
            .value
        return rows.first
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

    /// `survival_stages` テーブル全件を Web 版 `fetchAllStages()` と同様に取得する。
    /// `map_category` → `stage_number` で並べ、`stage_number` だけの ORDER だと行の欠落順序になるのを避ける。
    func fetchSurvivalStages() async throws -> [SurvivalStageRow] {
        try await client
            .from("survival_stages")
            .select()
            .order("map_category")
            .order("stage_number")
            .execute()
            .value
    }

    /// 降下マップのブロック表示名（ja/en）。RLS: 全員 SELECT 可。
    func fetchSurvivalStageBlocks() async throws -> [SurvivalStageBlockRow] {
        try await client
            .from("survival_stage_blocks")
            .select()
            .order("map_category")
            .order("sort_order")
            .execute()
            .value
    }

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

    /// 全カラムを取得して `SurvivalStageConfig` を構築する。
    /// ステージモードでは倍率系は難易度、BGM はステージ種別 (`random` / `progression`) を参照する。
    func fetchSurvivalStageConfigs() async throws -> [SurvivalStageConfig] {
        let rows: [SurvivalDifficultyDetailRow] = try await client
            .from("survival_difficulty_settings")
            .select("*")
            .order("difficulty")
            .execute()
            .value
        let bgmUrl = try? await fetchSurvivalBgmUrl(stageType: .random)
        return rows.map { $0.toConfig(stageType: .random, bgmUrl: bgmUrl) }
    }

    /// 指定難易度 + ステージ種別の `SurvivalStageConfig` を取得。見つからなければ `nil`。
    func fetchSurvivalStageConfig(difficulty: String, stageType: SurvivalStageType) async throws -> SurvivalStageConfig? {
        async let difficultyRowsTask: [SurvivalDifficultyDetailRow] = client
            .from("survival_difficulty_settings")
            .select("*")
            .eq("difficulty", value: difficulty)
            .limit(1)
            .execute()
            .value
        async let bgmUrlTask: URL? = fetchSurvivalBgmUrl(stageType: stageType)

        let difficultyRows = try await difficultyRowsTask
        let bgmUrl = try? await bgmUrlTask
        return difficultyRows.first?.toConfig(stageType: stageType, bgmUrl: bgmUrl)
    }

    private func fetchSurvivalBgmUrl(stageType: SurvivalStageType) async throws -> URL? {
        let rows: [SurvivalBgmSettingRow] = try await client
            .from("survival_bgm_settings")
            .select("stage_type, bgm_url")
            .eq("stage_type", value: stageType.rawValue)
            .limit(1)
            .execute()
            .value
        return rows.first?.url()
    }

    /// 全カラムを取得して `SurvivalCharacterProfile` を構築する。
    func fetchSurvivalCharacterProfiles() async throws -> [SurvivalCharacterProfile] {
        let rows: [SurvivalCharacterDetailRow] = try await client
            .from("survival_characters")
            .select("*")
            .order("sort_order")
            .execute()
            .value
        return rows.map { $0.toProfile() }
    }

    /// 主人公ファイのプロフィールを取得 (見つからない場合は `defaultFai`)
    func fetchFaiProfile() async throws -> SurvivalCharacterProfile {
        let rows: [SurvivalCharacterDetailRow] = try await client
            .from("survival_characters")
            .select("*")
            .eq("id", value: "fai")
            .limit(1)
            .execute()
            .value
        return rows.first?.toProfile() ?? SurvivalCharacterProfile.defaultFai
    }

    // MARK: - Survival Stage Clears

    func fetchSurvivalStageClears(
        userId: UUID,
        mapCategory: SurvivalMapCategory = .basic
    ) async throws -> [SurvivalStageClearRow] {
        try await client
            .from("survival_stage_clears")
            .select("map_category, stage_number, character_id, cleared_at, clear_count")
            .eq("user_id", value: userId.uuidString)
            .eq("map_category", value: mapCategory.rawValue)
            .execute()
            .value
    }

    /// Web 版 `fetchSurvivalStageProgress` と同じデータを返す。行が無い場合は `(current: 1, cleared: 0)` を使用するよう呼び出し側で扱う。
    func fetchSurvivalStageProgress(
        userId: UUID,
        mapCategory: SurvivalMapCategory = .basic
    ) async throws -> SurvivalStageProgressRow? {
        let rows: [SurvivalStageProgressRow] = try await client
            .from("survival_stage_progress")
            .select("current_stage_number, total_cleared_stages")
            .eq("user_id", value: userId.uuidString)
            .eq("map_category", value: mapCategory.rawValue)
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    // MARK: - Survival Stage Clear Upsert

    /// Web 版 `upsertSurvivalStageClear` (`src/platform/supabaseSurvival.ts` L444-503) を移植。
    /// - 既存行の有無を確認して初回クリアかどうかを判定
    /// - `survival_stage_clears` に upsert (user_id + stage_number の複合ユニーク)
    /// - 初回クリア時のみ `survival_stage_progress` を進行させる
    func upsertSurvivalStageClear(
        userId: UUID,
        stageNumber: Int,
        survivalTimeSeconds: Int,
        finalLevel: Int,
        enemiesDefeated: Int,
        characterId: String?,
        totalStages: Int,
        mapCategory: SurvivalMapCategory = .basic
    ) async throws {
        struct ExistingClearRow: Decodable {
            let id: UUID
            let clear_count: Int?
        }
        struct ClearUpsert: Encodable {
            let user_id: UUID
            let map_category: String
            let stage_number: Int
            let character_id: String?
            let survival_time_seconds: Int
            let final_level: Int
            let enemies_defeated: Int
            let cleared_at: String
            let clear_count: Int
        }
        struct ProgressRow: Decodable {
            let current_stage_number: Int
            let total_cleared_stages: Int
        }
        struct ProgressUpsert: Encodable {
            let user_id: UUID
            let map_category: String
            let current_stage_number: Int
            let total_cleared_stages: Int
            let updated_at: String
        }

        let existing: [ExistingClearRow] = try await client
            .from("survival_stage_clears")
            .select("id, clear_count")
            .eq("user_id", value: userId.uuidString)
            .eq("map_category", value: mapCategory.rawValue)
            .eq("stage_number", value: stageNumber)
            .limit(1)
            .execute()
            .value
        let isFirstClear = existing.isEmpty
        let priorClearCount: Int = {
            guard let row = existing.first, let c = row.clear_count, c >= 1 else { return 1 }
            return c
        }()
        let nextClearCount = isFirstClear ? 1 : priorClearCount + 1
        let nowIso = ISO8601DateFormatter().string(from: Date())

        try await client
            .from("survival_stage_clears")
            .upsert(
                ClearUpsert(
                    user_id: userId,
                    map_category: mapCategory.rawValue,
                    stage_number: stageNumber,
                    character_id: characterId,
                    survival_time_seconds: survivalTimeSeconds,
                    final_level: finalLevel,
                    enemies_defeated: enemiesDefeated,
                    cleared_at: nowIso,
                    clear_count: nextClearCount
                ),
                onConflict: "user_id,map_category,stage_number"
            )
            .execute()

        guard isFirstClear else { return }

        let progressRows: [ProgressRow] = try await client
            .from("survival_stage_progress")
            .select("current_stage_number, total_cleared_stages")
            .eq("user_id", value: userId.uuidString)
            .eq("map_category", value: mapCategory.rawValue)
            .limit(1)
            .execute()
            .value
        let currentMax = progressRows.first?.current_stage_number ?? 1
        let currentTotal = progressRows.first?.total_cleared_stages ?? 0
        let nextStage = stageNumber + 1
        let newTotal = max(stageNumber, 0)
        let updatedCurrent = min(max(nextStage, currentMax), totalStages)
        let updatedTotal = max(newTotal, currentTotal)

        try await client
            .from("survival_stage_progress")
            .upsert(
                ProgressUpsert(
                    user_id: userId,
                    map_category: mapCategory.rawValue,
                    current_stage_number: updatedCurrent,
                    total_cleared_stages: updatedTotal,
                    updated_at: nowIso
                ),
                onConflict: "user_id,map_category"
            )
            .execute()
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

    // MARK: - Ear Training

    /// 耳コピバトル ステージの詳細 (フレーズ + ノート + コード + デモループ) を取得する。
    /// Web 版 [supabaseEarTraining.ts:fetchEarTrainingStageById](src/platform/supabaseEarTraining.ts) と同等。
    func fetchEarTrainingStageDetail(stageId: UUID) async throws -> EarTrainingStageDetail {
        let raw: EarTrainingStageDetail = try await client
            .from("ear_training_stages")
            .select(Self.earTrainingStageDetailSelect)
            .eq("id", value: stageId.uuidString)
            .single()
            .execute()
            .value
        return Self.normalizeStageDetail(raw)
    }

    /// 耳コピバトル ステージの詳細を slug で取得する (ログイン画面のデモ起動用)。
    func fetchEarTrainingStageDetailBySlug(slug: String) async throws -> EarTrainingStageDetail {
        let raw: EarTrainingStageDetail = try await client
            .from("ear_training_stages")
            .select(Self.earTrainingStageDetailSelect)
            .eq("slug", value: slug)
            .single()
            .execute()
            .value
        return Self.normalizeStageDetail(raw)
    }

    private static let earTrainingStageDetailSelect = """
    *,
    phrases:ear_training_phrases (
        *,
        notes:ear_training_phrase_notes (*),
        chords:ear_training_phrase_chords (
            *,
            quote:ear_training_phrase_chord_quotes (*)
        ),
        demo_loops:ear_training_phrase_demo_loops (*)
    ),
    chord_quiz_items:ear_training_chord_quiz_items (*)
    """

    private static func normalizeStageDetail(_ raw: EarTrainingStageDetail) -> EarTrainingStageDetail {
        EarTrainingStageDetail(
            id: raw.id,
            slug: raw.slug,
            title: raw.title,
            titleEn: raw.titleEn,
            description: raw.description,
            descriptionEn: raw.descriptionEn,
            bpm: raw.bpm,
            beatsPerMeasure: raw.beatsPerMeasure,
            beatType: raw.beatType,
            loopMeasures: raw.loopMeasures,
            maxLoopsPerPhrase: raw.maxLoopsPerPhrase,
            countInBeats: raw.countInBeats,
            timeLimitSec: raw.timeLimitSec,
            playerHp: raw.playerHp,
            enemyHp: raw.enemyHp,
            perCorrectNoteDamage: raw.perCorrectNoteDamage,
            goodCompletionDamage: raw.goodCompletionDamage,
            greatCompletionDamage: raw.greatCompletionDamage,
            perfectCompletionDamage: raw.perfectCompletionDamage,
            missDamage: raw.missDamage,
            failDamage: raw.failDamage,
            perfectMaxMisses: raw.perfectMaxMisses,
            greatMaxMisses: raw.greatMaxMisses,
            backgroundTheme: raw.backgroundTheme,
            isActive: raw.isActive,
            mode: raw.mode,
            keyFifths: raw.keyFifths,
            phrases: raw.sortedPhrases(),
            chordVoicingSelfPaced: raw.chordVoicingSelfPaced,
            quizDurationSeconds: raw.quizDurationSeconds,
            quizQuestionOrder: raw.quizQuestionOrder,
            quizShowNotationInBattle: raw.quizShowNotationInBattle,
            quizRequiredCorrectCount: raw.quizRequiredCorrectCount,
            chordQuizItems: raw.sortedChordQuizItems()
        )
    }

    /// 耳コピバトルでクリアした際にレッスン要件進捗を更新する。
    /// Web 版 [supabaseLessonRequirements.ts:updateLessonRequirementProgress](src/platform/supabaseLessonRequirements.ts) の
    /// `sourceType: 'ear_training'` パスと等価。`p_song_id` には `lesson_songs.id` (= lessonSongId) を渡す。
    @discardableResult
    func recordEarTrainingLessonProgress(
        lessonId: UUID,
        lessonSongId: UUID,
        rank: String,
        clearConditions: LessonClearConditions?
    ) async throws -> Bool {
        let userId = try await currentUserId()

        struct RpcParams: Encodable {
            let p_user_id: UUID
            let p_lesson_id: UUID
            let p_song_id: UUID
            let p_rank: String
            let p_clear_conditions: LessonClearConditions
        }

        let conditions = clearConditions ?? LessonClearConditions(
            key: nil, speed: nil, rank: rank, count: 1,
            notationSetting: nil, requiresDays: false, dailyCount: nil
        )

        let params = RpcParams(
            p_user_id: userId,
            p_lesson_id: lessonId,
            p_song_id: lessonSongId,
            p_rank: rank,
            p_clear_conditions: conditions
        )

        let result: Bool = try await client
            .rpc("update_lesson_requirement_progress", params: params)
            .execute()
            .value
        return result
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
        request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
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
