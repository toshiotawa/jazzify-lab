import Foundation

struct Subscription: Codable, Sendable {
    let id: Int
    let userId: UUID
    let provider: BillingProvider
    let providerCustomerId: String?
    let providerSubscriptionId: String?
    let planCode: String
    let status: SubscriptionStatus
    let entitlementState: EntitlementState?
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
        case entitlementState = "entitlement_state"
        case trialUsed = "trial_used"
        case currentPeriodEndsAt = "current_period_ends_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var isActive: Bool {
        if let ent = entitlementState {
            switch ent {
            case .active, .paymentIssueWithAccess, .cancelledButActiveUntilEnd:
                return true
            case .paymentIssueNoAccess, .expired:
                return false
            }
        }
        switch status {
        case .trial, .active, .grace, .pastDue:
            return true
        case .billingRetry:
            return false
        case .expired, .canceled:
            if let endsAt = currentPeriodEndsAt, endsAt > Date() {
                return true
            }
            return false
        }
    }

    var canDeleteAccount: Bool {
        if let ent = entitlementState {
            return ent == .expired
        }
        switch status {
        case .expired:
            return true
        case .canceled:
            guard let endsAt = currentPeriodEndsAt else { return true }
            return endsAt <= Date()
        case .trial, .active, .grace, .billingRetry, .pastDue:
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
    case pastDue = "past_due"
    case expired
    case canceled
}

enum EntitlementState: String, Codable, Sendable {
    case active
    case paymentIssueWithAccess = "payment_issue_with_access"
    case paymentIssueNoAccess = "payment_issue_no_access"
    case cancelledButActiveUntilEnd = "cancelled_but_active_until_end"
    case expired
}

struct BillingStatusResponse: Codable, Sendable {
    let provider: BillingProvider
    let status: SubscriptionStatus
    let entitlementState: EntitlementState
    let planCode: String
    let trialUsed: Bool
    let currentPeriodEndsAt: Date?

    enum CodingKeys: String, CodingKey {
        case provider, status
        case entitlementState = "entitlement_state"
        case planCode = "plan_code"
        case trialUsed = "trial_used"
        case currentPeriodEndsAt = "current_period_ends_at"
    }
}
