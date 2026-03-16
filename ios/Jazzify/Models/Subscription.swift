import Foundation

struct Subscription: Codable, Sendable {
    let id: Int
    let userId: UUID
    let provider: BillingProvider
    let providerCustomerId: String?
    let providerSubscriptionId: String?
    let planCode: String
    let status: SubscriptionStatus
    let trialUsed: Bool
    let currentPeriodEndsAt: Date?
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case provider
        case providerCustomerId = "provider_customer_id"
        case providerSubscriptionId = "provider_subscription_id"
        case planCode = "plan_code"
        case status
        case trialUsed = "trial_used"
        case currentPeriodEndsAt = "current_period_ends_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var isActive: Bool {
        switch status {
        case .trial, .active, .grace, .billingRetry:
            return true
        case .expired, .canceled:
            if let endsAt = currentPeriodEndsAt, endsAt > Date() {
                return true
            }
            return false
        }
    }

    var canDeleteAccount: Bool {
        switch status {
        case .expired:
            return true
        case .canceled:
            guard let endsAt = currentPeriodEndsAt else { return true }
            return endsAt <= Date()
        case .trial, .active, .grace, .billingRetry:
            return false
        }
    }
}

enum BillingProvider: String, Codable, Sendable {
    case apple
    case lemon
    case none
}

enum SubscriptionStatus: String, Codable, Sendable {
    case trial
    case active
    case grace
    case billingRetry = "billing_retry"
    case expired
    case canceled
}

struct BillingStatusResponse: Codable, Sendable {
    let provider: BillingProvider
    let status: SubscriptionStatus
    let planCode: String
    let trialUsed: Bool
    let currentPeriodEndsAt: Date?

    enum CodingKeys: String, CodingKey {
        case provider, status
        case planCode = "plan_code"
        case trialUsed = "trial_used"
        case currentPeriodEndsAt = "current_period_ends_at"
    }
}
