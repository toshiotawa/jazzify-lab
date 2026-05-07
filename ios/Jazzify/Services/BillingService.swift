import Foundation

final class BillingService: Sendable {
    static let shared = BillingService()

    private let supabase = SupabaseService.shared

    private init() {}

    func fetchBillingStatus() async throws -> BillingStatusResponse {
        try await fetchBillingStatus(allowAuthRefreshRetry: true)
    }

    private func fetchBillingStatus(allowAuthRefreshRetry: Bool) async throws -> BillingStatusResponse {
        let token = try await supabase.accessToken()

        let url = Config.supabaseURL
            .appendingPathComponent("functions")
            .appendingPathComponent("v1")
            .appendingPathComponent("billing-status")

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw BillingServiceError.fetchFailed
        }
        if httpResponse.statusCode == 401, allowAuthRefreshRetry {
            _ = try? await supabase.client.auth.refreshSession()
            return try await fetchBillingStatus(allowAuthRefreshRetry: false)
        }
        guard httpResponse.statusCode == 200 else {
            throw BillingServiceError.fetchFailed
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(BillingStatusResponse.self, from: data)
    }
}

enum BillingServiceError: LocalizedError {
    case fetchFailed

    var errorDescription: String? {
        switch self {
        case .fetchFailed:
            return "Failed to fetch billing status"
        }
    }
}
