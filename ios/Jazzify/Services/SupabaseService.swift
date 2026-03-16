import Foundation
import Supabase

final class SupabaseService: Sendable {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: Config.supabaseURL,
            supabaseKey: Config.supabaseAnonKey
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
            .eq("is_published", value: true)
            .order("sort_order")
            .execute()
            .value
    }

    func fetchLessons(courseId: UUID) async throws -> [Lesson] {
        try await client
            .from("lessons")
            .select()
            .eq("course_id", value: courseId.uuidString)
            .eq("is_published", value: true)
            .order("sort_order")
            .execute()
            .value
    }

    // MARK: - Fantasy Stages

    func fetchFantasyStages() async throws -> [FantasyStage] {
        try await client
            .from("fantasy_stages")
            .select()
            .order("sort_order")
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
