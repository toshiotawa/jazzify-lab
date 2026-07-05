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
            let signup_platform: String = "ios"
            let country: String?
            let ga_client_id: String
        }

        try await client
            .from("profiles")
            .insert(NewProfile(
                id: userId,
                email: email,
                nickname: nickname,
                preferred_locale: locale.rawValue,
                country: SignupMetadata.resolveSignupCountry(),
                ga_client_id: AnalyticsClientID.current()
            ))
            .execute()
    }

    func recordUserMilestone(userId: UUID, milestone: String, source: String? = nil) async throws {
        struct MilestoneParams: Encodable {
            let p_user_id: UUID
            let p_milestone: String
            let p_source: String?
        }

        try await client
            .rpc("record_user_milestone", params: MilestoneParams(
                p_user_id: userId,
                p_milestone: milestone,
                p_source: source
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

    // MARK: - MIDI Connection Guide

    struct IOSMidiDeviceModelRow: Codable, Sendable {
        let modelIdentifier: String
        let deviceFamily: String
        let marketingName: String
        let connectorType: String
        let isDefault: Bool

        enum CodingKeys: String, CodingKey {
            case modelIdentifier = "model_identifier"
            case deviceFamily = "device_family"
            case marketingName = "marketing_name"
            case connectorType = "connector_type"
            case isDefault = "is_default"
        }
    }

    func fetchIosMidiDeviceModel(
        modelIdentifier: String,
        deviceFamily: String
    ) async throws -> IOSMidiDeviceModelRow? {
        let selectColumns = "model_identifier, device_family, marketing_name, connector_type, is_default"
        let exactRows: [IOSMidiDeviceModelRow] = try await client
            .from("ios_midi_device_models")
            .select(selectColumns)
            .eq("model_identifier", value: modelIdentifier)
            .eq("is_active", value: true)
            .limit(1)
            .execute()
            .value

        if let exact = exactRows.first {
            return exact
        }

        let defaultIdentifier = "__default_\(deviceFamily)__"
        let defaultRows: [IOSMidiDeviceModelRow] = try await client
            .from("ios_midi_device_models")
            .select(selectColumns)
            .eq("model_identifier", value: defaultIdentifier)
            .eq("is_active", value: true)
            .limit(1)
            .execute()
            .value

        return defaultRows.first
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

    /// 単体コース取得（`fetchCourses` と同じ可視性フィルター）
    func fetchCourseVisible(id: UUID) async throws -> Course? {
        if Config.includeDeveloperLessonCourses {
            let rows: [Course] = try await client
                .from("courses")
                .select()
                .eq("id", value: id.uuidString)
                .eq("is_visible", value: true)
                .limit(1)
                .execute()
                .value
            return rows.first
        }
        let rows: [Course] = try await client
            .from("courses")
            .select()
            .eq("id", value: id.uuidString)
            .eq("is_visible", value: true)
            .eq("is_developer_only", value: false)
            .limit(1)
            .execute()
            .value
        return rows.first
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
                *,
                fantasyStage:fantasy_stages (
                    id,
                    stage_number,
                    name,
                    name_en,
                    description,
                    description_en,
                    stage_tier
                ),
                balloonRushStage:balloon_rush_stages (
                    id,
                    slug,
                    title,
                    title_en,
                    stage_type,
                    time_limit_sec,
                    pop_quota,
                    production_staff_hint_mode,
                    production_keyboard_hint_mode,
                    hide_chord_names_in_battle
                ),
                earTrainingStage:ear_training_stages (*)
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

    // MARK: - Main Quest Progress

    struct MainQuestProgressResult: Sendable {
        let courseId: UUID
        let totalLessons: Int
        let completedLessons: Int
        let nextLesson: Lesson?
    }

    func fetchMainQuestProgress(userId: UUID) async throws -> MainQuestProgressResult? {
        let courses: [Course] = try await client
            .from("courses")
            .select()
            .eq("is_main_course", value: true)
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

        return MainQuestProgressResult(
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

    /// サバイバルチュートリアル台本（`survival_tutorial_scripts`）。RLS: 全員 SELECT 可。
    func fetchSurvivalTutorialScript(id: String) async throws -> SurvivalTutorialScriptRow {
        try await client
            .from("survival_tutorial_scripts")
            .select("id, title, title_en, script")
            .eq("id", value: id)
            .eq("is_active", value: true)
            .single()
            .execute()
            .value
    }

    /// 耳コピバトルチュートリアル台本（`ear_training_tutorial_scripts`）。RLS: 全員 SELECT 可。
    func fetchEarTrainingTutorialScript(id: String) async throws -> EarTrainingTutorialScriptRow {
        try await client
            .from("ear_training_tutorial_scripts")
            .select("id, title, title_en, script")
            .eq("id", value: id)
            .eq("is_active", value: true)
            .single()
            .execute()
            .value
    }

    /// 降下マップ ステージ1 のタイムドセリフ（`survival_stage_intro_scripts`）。RLS: 全員 SELECT 可。
    func fetchSurvivalStageIntroScript(mapCategory: SurvivalMapCategory) async -> SurvivalStageIntroScriptPayload {
        struct Row: Decodable {
            let script: SurvivalStageIntroScriptPayload
        }
        guard SurvivalMapCategory.descentDisplayCategories.contains(mapCategory) else {
            return SurvivalStageIntroBundledPayloads.payload(for: mapCategory)
        }
        do {
            let rows: [Row] = try await client
                .from("survival_stage_intro_scripts")
                .select("script")
                .eq("map_category", value: mapCategory.rawValue)
                .eq("is_active", value: true)
                .limit(1)
                .execute()
                .value
            if let first = rows.first {
                return first.script
            }
        } catch {
            /* use bundled fallback */
        }
        return SurvivalStageIntroBundledPayloads.payload(for: mapCategory)
    }

    /// 第一ブロック末尾ボスのタイムドセリフ（`survival_block_boss_intro_scripts`）。RLS: 全員 SELECT 可。
    func fetchSurvivalBlockBossIntroScript(mapCategory: SurvivalMapCategory) async -> SurvivalStageIntroScriptPayload {
        struct Row: Decodable {
            let script: SurvivalStageIntroScriptPayload
        }
        guard SurvivalMapCategory.descentDisplayCategories.contains(mapCategory) else {
            return SurvivalBlockBossIntroBundledPayloads.sharedPayload()
        }
        do {
            let rows: [Row] = try await client
                .from("survival_block_boss_intro_scripts")
                .select("script")
                .eq("map_category", value: mapCategory.rawValue)
                .eq("is_active", value: true)
                .limit(1)
                .execute()
                .value
            if let first = rows.first {
                return first.script
            }
        } catch {
            /* use bundled fallback */
        }
        return SurvivalBlockBossIntroBundledPayloads.sharedPayload()
    }

    /// 任意ステージのタイムドセリフ（`survival_stage_play_dialogues`）。無ければ nil。
    func fetchSurvivalStagePlayDialogue(
        mapCategory: SurvivalMapCategory,
        stageNumber: Int
    ) async -> SurvivalStageIntroScriptPayload? {
        struct Row: Decodable {
            let script: SurvivalStageIntroScriptPayload
        }
        do {
            let rows: [Row] = try await client
                .from("survival_stage_play_dialogues")
                .select("script")
                .eq("map_category", value: mapCategory.rawValue)
                .eq("stage_number", value: stageNumber)
                .eq("is_active", value: true)
                .limit(1)
                .execute()
                .value
            if let first = rows.first {
                return first.script
            }
        } catch {
            /* bundled fallback */
        }
        return SurvivalStagePlayDialogueBundledPayloads.payload(
            mapCategory: mapCategory,
            stageNumber: stageNumber
        )
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

    func fetchSurvivalCompositePhraseStages() async throws -> [SurvivalCompositePhraseStageRow] {
        try await client
            .from("survival_composite_phrase_stages")
            .select("id, map_category, stage_number, boss_type, key_fifths, bgm_url")
            .execute()
            .value
    }

    func fetchSurvivalCompositePhraseSources() async throws -> [SurvivalCompositePhraseSourceRow] {
        try await client
            .from("survival_composite_phrase_sources")
            .select("composite_id, source_stage_number, sort_order")
            .execute()
            .value
    }

    /// Phrases モード用フレーズ定義（ステージ 1 件につき 1 フレーズ）。
    func fetchSurvivalPhrase(mapCategory: SurvivalMapCategory, stageNumber: Int) async throws -> SurvivalPhraseDefinition? {
        struct PhraseRow: Decodable {
            let id: String
            let map_category: String
            let stage_number: Int
            let title: String
            let bgm_url: String?
            let key_fifths: Int
        }
        struct ChordRow: Decodable {
            let id: String
            let phrase_id: String
            let order_index: Int
            let chord_name: String
            let measure_number: Int
        }
        struct NoteRow: Decodable {
            let chord_id: String
            let order_index: Int
            let pitch_midi: Int
            let pitch_class: Int
            let note_name: String
            let staff: Int
        }

        let phrases: [PhraseRow] = try await client
            .from("survival_phrases")
            .select("id, map_category, stage_number, title, bgm_url, key_fifths")
            .eq("map_category", value: mapCategory.rawValue)
            .eq("stage_number", value: stageNumber)
            .limit(1)
            .execute()
            .value
        guard let phrase = phrases.first else { return nil }

        let chords: [ChordRow] = try await client
            .from("survival_phrase_chords")
            .select("id, phrase_id, order_index, chord_name, measure_number")
            .eq("phrase_id", value: phrase.id)
            .order("order_index")
            .execute()
            .value
        guard !chords.isEmpty else { return nil }

        let chordIds = chords.map(\.id)
        let notes: [NoteRow] = try await client
            .from("survival_phrase_chord_notes")
            .select("chord_id, order_index, pitch_midi, pitch_class, note_name, staff")
            .in("chord_id", values: chordIds)
            .order("order_index")
            .execute()
            .value

        var notesByChord: [String: [SurvivalPhraseChordNote]] = [:]
        for row in notes {
            let note = SurvivalPhraseChordNote(
                orderIndex: row.order_index,
                pitchMidi: row.pitch_midi,
                pitchClass: row.pitch_class,
                noteName: row.note_name,
                staff: row.staff
            )
            notesByChord[row.chord_id, default: []].append(note)
        }

        let builtChords = chords.map { chord in
            SurvivalPhraseChord(
                id: chord.id,
                orderIndex: chord.order_index,
                chordName: chord.chord_name,
                measureNumber: chord.measure_number,
                notes: notesByChord[chord.id] ?? []
            )
        }

        return SurvivalPhraseDefinition(
            id: phrase.id,
            mapCategory: phrase.map_category,
            stageNumber: phrase.stage_number,
            title: phrase.title,
            bgmUrl: phrase.bgm_url,
            keyFifths: phrase.key_fifths,
            chords: builtChords
        )
    }

    /// Phrases マップ試聴用: `survival_phrases.bgm_url` のみ取得。
    func fetchSurvivalPhraseBgmUrl(mapCategory: SurvivalMapCategory, stageNumber: Int) async throws -> String? {
        struct Row: Decodable {
            let bgm_url: String?
        }
        let rows: [Row] = try await client
            .from("survival_phrases")
            .select("bgm_url")
            .eq("map_category", value: mapCategory.rawValue)
            .eq("stage_number", value: stageNumber)
            .limit(1)
            .execute()
            .value
        return rows.first?.bgm_url
    }

    /// `survival_bgm_settings` の Phrases 行 URL（試聴のフォールバック 2 段目）。
    func fetchSurvivalPhrasesBgmSettingUrlString() async throws -> String? {
        let rows: [SurvivalBgmSettingRow] = try await client
            .from("survival_bgm_settings")
            .select("stage_type, bgm_url")
            .eq("stage_type", value: SurvivalStageType.phrases.rawValue)
            .limit(1)
            .execute()
            .value
        return rows.first?.bgmUrl
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
    ) async throws -> Bool {
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

        guard isFirstClear else { return false }

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

        return true
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
        let normalized = Self.normalizeStageDetail(raw)
        return try await Self.enrichEarTrainingPhrasePairAdlibIfNeeded(
            try await Self.enrichEarTrainingCompositeIfNeeded(normalized)
        )
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
        let normalized = Self.normalizeStageDetail(raw)
        return try await Self.enrichEarTrainingPhrasePairAdlibIfNeeded(
            try await Self.enrichEarTrainingCompositeIfNeeded(normalized)
        )
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
            hideChordNamesInBattle: raw.hideChordNamesInBattle,
            quizRequiredCorrectCount: raw.quizRequiredCorrectCount,
            showKeyboardHintsInBattle: raw.showKeyboardHintsInBattle,
            osmdTargetsFromScore: raw.osmdTargetsFromScore,
            practiceTranspose: raw.practiceTranspose,
            chordQuizItems: raw.sortedChordQuizItems(),
            chordVoicingCompositePhrase: raw.chordVoicingCompositePhrase,
            compositePhraseBootstrap: raw.compositePhraseBootstrap,
            phrasePairAdlibBootstrap: raw.phrasePairAdlibBootstrap
        )
    }

    private struct EarTrainingCompositePhraseConfigRow: Decodable {
        let id: UUID
        let bgmUrl: String
        let keyFifths: Int

        enum CodingKeys: String, CodingKey {
            case id
            case bgmUrl = "bgm_url"
            case keyFifths = "key_fifths"
        }
    }

    private struct EarTrainingCompositePhraseSourceRow: Decodable {
        let sourcePhraseId: UUID

        enum CodingKeys: String, CodingKey {
            case sourcePhraseId = "source_phrase_id"
        }
    }

    private static func enrichEarTrainingCompositeIfNeeded(_ detail: EarTrainingStageDetail) async throws -> EarTrainingStageDetail {
        guard detail.chordVoicingCompositePhrase == true,
              detail.resolvedMode == .chordVoicing
        else {
            return detail
        }
        guard detail.compositePhraseBootstrap == nil else {
            return detail
        }

        let client = SupabaseService.shared.client

        let cfgRows: [EarTrainingCompositePhraseConfigRow] = try await client
            .from("ear_training_composite_phrase_config")
            .select("id,bgm_url,key_fifths")
            .eq("stage_id", value: detail.id.uuidString)
            .limit(1)
            .execute()
            .value
        guard let cfg = cfgRows.first else {
            return detail
        }

        let sourceRows: [EarTrainingCompositePhraseSourceRow] = try await client
            .from("ear_training_composite_phrase_sources")
            .select("source_phrase_id")
            .eq("config_id", value: cfg.id.uuidString)
            .order("sort_order")
            .execute()
            .value
        guard !sourceRows.isEmpty else {
            return detail
        }

        let orderedPhraseIds = sourceRows.map(\.sourcePhraseId)
        let bootstrap = EarTrainingCompositePhraseAdapter.buildBootstrap(
            stagePhrases: detail.sortedPhrases(),
            bgmUrl: cfg.bgmUrl,
            keyFifths: cfg.keyFifths,
            sourcePhraseIdsOrdered: orderedPhraseIds
        )

        return EarTrainingStageDetail(
            id: detail.id,
            slug: detail.slug,
            title: detail.title,
            titleEn: detail.titleEn,
            description: detail.description,
            descriptionEn: detail.descriptionEn,
            bpm: detail.bpm,
            beatsPerMeasure: detail.beatsPerMeasure,
            beatType: detail.beatType,
            loopMeasures: detail.loopMeasures,
            maxLoopsPerPhrase: detail.maxLoopsPerPhrase,
            countInBeats: detail.countInBeats,
            timeLimitSec: detail.timeLimitSec,
            playerHp: detail.playerHp,
            enemyHp: detail.enemyHp,
            perCorrectNoteDamage: detail.perCorrectNoteDamage,
            goodCompletionDamage: detail.goodCompletionDamage,
            greatCompletionDamage: detail.greatCompletionDamage,
            perfectCompletionDamage: detail.perfectCompletionDamage,
            missDamage: detail.missDamage,
            failDamage: detail.failDamage,
            perfectMaxMisses: detail.perfectMaxMisses,
            greatMaxMisses: detail.greatMaxMisses,
            backgroundTheme: detail.backgroundTheme,
            isActive: detail.isActive,
            mode: detail.mode,
            keyFifths: detail.keyFifths,
            phrases: detail.phrases,
            chordVoicingSelfPaced: detail.chordVoicingSelfPaced,
            quizDurationSeconds: detail.quizDurationSeconds,
            quizQuestionOrder: detail.quizQuestionOrder,
            quizShowNotationInBattle: detail.quizShowNotationInBattle,
            hideChordNamesInBattle: detail.hideChordNamesInBattle,
            quizRequiredCorrectCount: detail.quizRequiredCorrectCount,
            showKeyboardHintsInBattle: detail.showKeyboardHintsInBattle,
            osmdTargetsFromScore: detail.osmdTargetsFromScore,
            practiceTranspose: detail.practiceTranspose,
            chordQuizItems: detail.chordQuizItems,
            chordVoicingCompositePhrase: detail.chordVoicingCompositePhrase,
            compositePhraseBootstrap: bootstrap,
            phrasePairAdlibBootstrap: detail.phrasePairAdlibBootstrap
        )
    }

    private struct EarTrainingPhrasePairAdlibConfigRow: Decodable {
        let id: UUID
        let bgmUrl: String
        let keyFifths: Int
        let loopDurationSec: Double

        enum CodingKeys: String, CodingKey {
            case id
            case bgmUrl = "bgm_url"
            case keyFifths = "key_fifths"
            case loopDurationSec = "loop_duration_sec"
        }
    }

    private struct EarTrainingPhrasePairAdlibStepRow: Decodable {
        let id: UUID
        let orderIndex: Int
        let chordName: String
        let patternGroupId: UUID
        let measureNumber: Int?
        let startTimeSec: Double
        let endTimeSec: Double
        let quote: String?
        let inputDisabled: Bool

        enum CodingKeys: String, CodingKey {
            case id
            case orderIndex = "order_index"
            case chordName = "chord_name"
            case patternGroupId = "pattern_group_id"
            case measureNumber = "measure_number"
            case startTimeSec = "start_time_sec"
            case endTimeSec = "end_time_sec"
            case quote
            case inputDisabled = "input_disabled"
        }

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            id = try c.decode(UUID.self, forKey: .id)
            orderIndex = try c.decode(Int.self, forKey: .orderIndex)
            chordName = try c.decode(String.self, forKey: .chordName)
            patternGroupId = try c.decode(UUID.self, forKey: .patternGroupId)
            measureNumber = try c.decodeIfPresent(Int.self, forKey: .measureNumber)
            startTimeSec = try c.decode(Double.self, forKey: .startTimeSec)
            endTimeSec = try c.decode(Double.self, forKey: .endTimeSec)
            quote = try c.decodeIfPresent(String.self, forKey: .quote)
            inputDisabled = try c.decodeIfPresent(Bool.self, forKey: .inputDisabled) ?? false
        }
    }

    private struct EarTrainingAdlibPatternRow: Decodable {
        let id: UUID
        let groupId: UUID
        let label: String
        let pcs: [Int]
        let familyId: String
        let carryTailLength: Int
        let priority: Int
        let sortOrder: Int

        enum CodingKeys: String, CodingKey {
            case id
            case groupId = "group_id"
            case label
            case pcs
            case familyId = "family_id"
            case carryTailLength = "carry_tail_length"
            case priority
            case sortOrder = "sort_order"
        }
    }

    private static func enrichEarTrainingPhrasePairAdlibIfNeeded(_ detail: EarTrainingStageDetail) async throws -> EarTrainingStageDetail {
        guard detail.resolvedMode == .phrasePairAdlib else {
            return detail
        }
        guard detail.phrasePairAdlibBootstrap == nil else {
            return detail
        }

        let client = SupabaseService.shared.client

        let cfgRows: [EarTrainingPhrasePairAdlibConfigRow] = try await client
            .from("ear_training_phrase_pair_adlib_config")
            .select("id,bgm_url,key_fifths,loop_duration_sec")
            .eq("stage_id", value: detail.id.uuidString)
            .limit(1)
            .execute()
            .value
        guard let cfg = cfgRows.first else {
            return detail
        }

        let stepRows: [EarTrainingPhrasePairAdlibStepRow] = try await client
            .from("ear_training_phrase_pair_adlib_steps")
            .select("id,order_index,chord_name,pattern_group_id,measure_number,start_time_sec,end_time_sec,quote,input_disabled")
            .eq("config_id", value: cfg.id.uuidString)
            .order("order_index")
            .execute()
            .value
        guard !stepRows.isEmpty else {
            return detail
        }

        let groupIds = Array(Set(stepRows.map(\.patternGroupId)))
        let patternRows: [EarTrainingAdlibPatternRow] = try await client
            .from("ear_training_adlib_patterns")
            .select("id,group_id,label,pcs,family_id,carry_tail_length,priority,sort_order")
            .in("group_id", values: groupIds.map(\.uuidString))
            .order("sort_order")
            .execute()
            .value
        guard !patternRows.isEmpty else {
            return detail
        }

        var patternsByGroupId: [UUID: [EarTrainingPhrasePairEngine.Pattern]] = [:]
        for row in patternRows.sorted(by: { $0.sortOrder < $1.sortOrder }) {
            let pattern = EarTrainingPhrasePairEngine.Pattern(
                id: row.id.uuidString,
                label: row.label,
                pcs: row.pcs.map { (($0 % 12) + 12) % 12 },
                familyId: row.familyId,
                carryTailLength: row.carryTailLength,
                priority: row.priority
            )
            patternsByGroupId[row.groupId, default: []].append(pattern)
        }

        let steps = stepRows.map {
            let quoteTrimmed = ($0.quote ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            return EarTrainingPhrasePairAdlibStep(
                id: $0.id,
                orderIndex: $0.orderIndex,
                chordName: $0.chordName,
                patternGroupId: $0.patternGroupId,
                measureNumber: $0.measureNumber,
                startTimeSec: $0.startTimeSec,
                endTimeSec: $0.endTimeSec,
                quote: quoteTrimmed.isEmpty ? nil : quoteTrimmed,
                inputDisabled: $0.inputDisabled
            )
        }

        let bootstrap = EarTrainingPhrasePairAdlibBootstrap(
            bgmUrl: cfg.bgmUrl,
            keyFifths: cfg.keyFifths,
            loopDurationSec: cfg.loopDurationSec,
            steps: steps,
            patternsByGroupId: patternsByGroupId
        )

        return EarTrainingStageDetail(
            id: detail.id,
            slug: detail.slug,
            title: detail.title,
            titleEn: detail.titleEn,
            description: detail.description,
            descriptionEn: detail.descriptionEn,
            bpm: detail.bpm,
            beatsPerMeasure: detail.beatsPerMeasure,
            beatType: detail.beatType,
            loopMeasures: detail.loopMeasures,
            maxLoopsPerPhrase: detail.maxLoopsPerPhrase,
            countInBeats: detail.countInBeats,
            timeLimitSec: detail.timeLimitSec,
            playerHp: detail.playerHp,
            enemyHp: detail.enemyHp,
            perCorrectNoteDamage: detail.perCorrectNoteDamage,
            goodCompletionDamage: detail.goodCompletionDamage,
            greatCompletionDamage: detail.greatCompletionDamage,
            perfectCompletionDamage: detail.perfectCompletionDamage,
            missDamage: detail.missDamage,
            failDamage: detail.failDamage,
            perfectMaxMisses: detail.perfectMaxMisses,
            greatMaxMisses: detail.greatMaxMisses,
            backgroundTheme: detail.backgroundTheme,
            isActive: detail.isActive,
            mode: detail.mode,
            keyFifths: detail.keyFifths,
            phrases: detail.phrases,
            chordVoicingSelfPaced: detail.chordVoicingSelfPaced,
            quizDurationSeconds: detail.quizDurationSeconds,
            quizQuestionOrder: detail.quizQuestionOrder,
            quizShowNotationInBattle: detail.quizShowNotationInBattle,
            hideChordNamesInBattle: detail.hideChordNamesInBattle,
            quizRequiredCorrectCount: detail.quizRequiredCorrectCount,
            showKeyboardHintsInBattle: detail.showKeyboardHintsInBattle,
            osmdTargetsFromScore: detail.osmdTargetsFromScore,
            practiceTranspose: detail.practiceTranspose,
            chordQuizItems: detail.chordQuizItems,
            chordVoicingCompositePhrase: detail.chordVoicingCompositePhrase,
            compositePhraseBootstrap: detail.compositePhraseBootstrap,
            phrasePairAdlibBootstrap: bootstrap
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

    func fetchBalloonRushStageById(_ id: UUID) async throws -> BalloonRushStageDefinition? {
        let row: BalloonRushStageRow = try await client
            .from("balloon_rush_stages")
            .select()
            .eq("id", value: id.uuidString)
            .single()
            .execute()
            .value
        return row.toDefinition()
    }

    func fetchBalloonRushPlayDialogue(stageId: UUID) async -> SurvivalStageIntroScriptPayload? {
        struct Row: Decodable {
            let script: SurvivalStageIntroScriptPayload
        }
        do {
            let rows: [Row] = try await client
                .from("balloon_rush_play_dialogues")
                .select("script")
                .eq("stage_id", value: stageId.uuidString)
                .eq("is_active", value: true)
                .limit(1)
                .execute()
                .value
            return rows.first?.script
        } catch {
            return nil
        }
    }

    // MARK: - Player track XP (separate from diary `profiles.xp` / `profiles.level`)

    struct PlayerXpLevelPayload: Equatable {
        let level: Int
        let totalXp: Int64
        let inLevelXp: Int
        let nextLevelXp: Int
    }

    private struct PlayerXpStateRaw: Decodable {
        let error: String?
        let total_xp: Int64?
        let level: Int?
        let in_level_xp: Int?
        let next_level_xp: Int?
    }

    private struct PlayerXpAwardRaw: Decodable {
        let error: String?
        let gained_xp: Int?
        let duplicate: Bool?
        let previous_level: Int?
        let new_level: Int?
        let leveled_up: Bool?
        let total_xp: Int64?
        let in_level_xp: Int?
        let next_level_xp: Int?
    }

    private struct AwardPlayerXpParams: Encodable {
        let p_reason: String
        let p_source_id: String
        let p_amount: Int
    }

    private struct EmptyRpcParams: Encodable {}

    func fetchPlayerLevelState() async throws -> PlayerXpLevelPayload {
        let raw: PlayerXpStateRaw = try await client
            .rpc("get_player_level_state", params: EmptyRpcParams())
            .execute()
            .value

        if let err = raw.error, !err.isEmpty {
            throw SupabaseServiceError.serverError(statusCode: 400, message: err)
        }
        guard let level = raw.level, let total = raw.total_xp, let inLv = raw.in_level_xp, let next = raw.next_level_xp else {
            throw SupabaseServiceError.invalidResponse
        }
        return PlayerXpLevelPayload(level: level, totalXp: total, inLevelXp: inLv, nextLevelXp: next)
    }

    func awardPlayerXp(reason: String, sourceId: String, amount: Int) async throws -> PlayerXpAwardPayload {
        let params = AwardPlayerXpParams(
            p_reason: reason,
            p_source_id: sourceId.trimmingCharacters(in: .whitespacesAndNewlines),
            p_amount: amount
        )
        let raw: PlayerXpAwardRaw = try await client
            .rpc("award_player_xp", params: params)
            .execute()
            .value

        if let err = raw.error, !err.isEmpty {
            throw SupabaseServiceError.serverError(statusCode: 400, message: err)
        }
        guard
            let gained = raw.gained_xp,
            let prev = raw.previous_level,
            let newLv = raw.new_level,
            let total = raw.total_xp,
            let inLv = raw.in_level_xp,
            let next = raw.next_level_xp
        else {
            throw SupabaseServiceError.invalidResponse
        }
        return PlayerXpAwardPayload(
            gainedXp: gained,
            duplicate: raw.duplicate ?? false,
            previousLevel: prev,
            newLevel: newLv,
            leveledUp: raw.leveled_up ?? false,
            totalXp: total,
            inLevelXp: inLv,
            nextLevelXp: next
        )
    }

    /// Award payload already validated (no `error` field).
    struct PlayerXpAwardPayload: Equatable {
        let gainedXp: Int
        let duplicate: Bool
        let previousLevel: Int
        let newLevel: Int
        let leveledUp: Bool
        let totalXp: Int64
        let inLevelXp: Int
        let nextLevelXp: Int
    }

    // MARK: - Achievement Badges

    struct UserBadgeRow: Decodable, Equatable, Sendable {
        let badgeId: String
        let earnedAt: String

        enum CodingKeys: String, CodingKey {
            case badgeId = "badge_id"
            case earnedAt = "earned_at"
        }
    }

    private struct BadgeGrantParams: Encodable {
        let p_event: String
        let p_map_category: String?
        let p_stage_number: Int?
        let p_player_level: Int?
    }

    func fetchUserBadges(userId: UUID) async throws -> [UserBadgeRow] {
        try await client
            .from("user_badges")
            .select("badge_id, earned_at")
            .eq("user_id", value: userId.uuidString)
            .order("earned_at")
            .execute()
            .value
    }

    func grantUserBadgesForEvent(
        event: String,
        mapCategory: String? = nil,
        stageNumber: Int? = nil,
        playerLevel: Int? = nil
    ) async throws -> [UserBadgeRow] {
        let params = BadgeGrantParams(
            p_event: event,
            p_map_category: mapCategory,
            p_stage_number: stageNumber,
            p_player_level: playerLevel
        )
        return try await client
            .rpc("grant_user_badges_for_event", params: params)
            .execute()
            .value
    }

    func syncUserBadges() async throws -> [UserBadgeRow] {
        try await grantUserBadgesForEvent(event: "sync")
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
