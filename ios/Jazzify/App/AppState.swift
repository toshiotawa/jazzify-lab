import Foundation
import SwiftUI
import Supabase

@MainActor
final class AppState: ObservableObject {
    @Published var authState: AuthState = .loading
    @Published var profile: Profile?
    @Published var billingStatus: BillingStatusResponse?
    @Published var profileSetupError: String?
    @Published var locale: AppLocale
    @Published private(set) var lastBillingCheckedAt: Date?

    private(set) var billingFetchFailCount: Int = 0
    private var periodEndTimer: Task<Void, Never>?

    private static let staleTTL: TimeInterval = 300
    private static let failGraceTTL: TimeInterval = 1800
    private static let refreshThrottle: TimeInterval = 60
    private static let maxFailOpenRetries: Int = 3

    private let supabase = SupabaseService.shared
    private let billing = BillingService.shared
    private let store = StoreManager.shared

    init() {
        let saved = UserDefaults.standard.string(forKey: "preferred_locale")
        if let saved, let loc = AppLocale(rawValue: saved) {
            self.locale = loc
        } else {
            self.locale = Config.appLocale
        }
    }

    func bootstrap() async {
        do {
            let session = try await supabase.client.auth.session
            let userId = session.user.id
            let email = session.user.email ?? ""

            if let fetchedProfile = try await supabase.fetchProfileIfExists(userId: userId) {
                await activateAuthenticatedState(userId: userId, profile: fetchedProfile)
                return
            }

            store.setCurrentUserId(userId)
            self.profile = nil
            self.billingStatus = nil
            self.lastBillingCheckedAt = nil
            self.billingFetchFailCount = 0
            self.profileSetupError = nil
            self.authState = .profileSetupRequired(userId, email)
        } catch {
            store.setCurrentUserId(nil)
            self.profile = nil
            self.billingStatus = nil
            self.lastBillingCheckedAt = nil
            self.billingFetchFailCount = 0
            self.profileSetupError = nil
            UserDefaults.standard.removeObject(forKey: "preferred_locale")
            self.locale = Config.appLocale
            self.authState = .unauthenticated
        }
    }

    func createProfile(nickname: String, agreed: Bool) async {
        let trimmedNickname = nickname.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmedNickname.isEmpty else {
            self.profileSetupError = locale == .ja
                ? "ニックネームを入力してください"
                : "Please enter a nickname."
            return
        }

        guard agreed else {
            self.profileSetupError = locale == .ja
                ? "利用規約とプライバシーポリシーに同意してください"
                : "Please agree to the Terms of Service and Privacy Policy."
            return
        }

        guard case let .profileSetupRequired(userId, email) = authState else { return }

        self.profileSetupError = nil

        do {
            if let existingProfile = try await supabase.fetchProfileIfExists(userId: userId) {
                await activateAuthenticatedState(userId: userId, profile: existingProfile)
                return
            }

            try await supabase.createProfile(
                userId: userId,
                email: email,
                nickname: trimmedNickname,
                locale: locale
            )

            guard let createdProfile = try await supabase.fetchProfileIfExists(userId: userId) else {
                throw ProfileSetupError.profileNotFoundAfterCreation
            }

            await activateAuthenticatedState(userId: userId, profile: createdProfile)
        } catch {
            if let existingProfile = try? await supabase.fetchProfileIfExists(userId: userId) {
                await activateAuthenticatedState(userId: userId, profile: existingProfile)
                return
            }

            self.profileSetupError = locale == .ja
                ? "プロフィールの作成に失敗しました: \(error.localizedDescription)"
                : "Failed to create profile: \(error.localizedDescription)"
        }
    }

    var isBillingStale: Bool {
        guard let checkedAt = lastBillingCheckedAt else { return true }
        return Date().timeIntervalSince(checkedAt) > Self.staleTTL
    }

    func refreshBillingStatus() async {
        do {
            let response = try await billing.fetchBillingStatus()
            self.billingStatus = response
            self.lastBillingCheckedAt = Date()
            self.billingFetchFailCount = 0
            schedulePeriodEndRefresh(response)
        } catch {
            self.lastBillingCheckedAt = Date()
            self.billingFetchFailCount += 1
            if billingFetchFailCount > Self.maxFailOpenRetries {
                self.billingStatus = nil
            }
        }
    }

    /// フォアグラウンド復帰用: スロットルつき再取得
    func refreshBillingIfNeeded() async {
        guard case .authenticated = authState else { return }
        if let checkedAt = lastBillingCheckedAt,
           Date().timeIntervalSince(checkedAt) < Self.refreshThrottle {
            return
        }
        await refreshBillingStatus()
    }

    /// プレミアム機能ゲート: stale なら再取得してから判定を返す
    func ensureFreshBilling() async -> Bool {
        if isBillingStale {
            await refreshBillingStatus()
        }
        return isPremium
    }

    private func schedulePeriodEndRefresh(_ billing: BillingStatusResponse) {
        periodEndTimer?.cancel()
        guard let endsAt = billing.currentPeriodEndsAt else { return }
        let remaining = endsAt.timeIntervalSinceNow
        guard remaining > 0 else { return }
        periodEndTimer = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(remaining * 1_000_000_000))
            guard !Task.isCancelled else { return }
            await self?.refreshBillingStatus()
        }
    }

    func signOut() async {
        try? await supabase.client.auth.signOut()
        store.setCurrentUserId(nil)
        periodEndTimer?.cancel()
        self.profile = nil
        self.billingStatus = nil
        self.lastBillingCheckedAt = nil
        self.billingFetchFailCount = 0
        self.profileSetupError = nil
        UserDefaults.standard.removeObject(forKey: "preferred_locale")
        self.locale = Config.appLocale
        self.authState = .unauthenticated
    }

    private func activateAuthenticatedState(userId: UUID, profile: Profile) async {
        self.profile = profile
        self.profileSetupError = nil

        if let prefLocale = profile.preferredLocale,
           let loc = AppLocale(rawValue: prefLocale) {
            self.locale = loc
        }

        self.authState = .authenticated(userId)
        store.setCurrentUserId(userId)
        await refreshBillingStatus()
        await store.listenForTransactions()
    }

    func updateLocale(_ newLocale: AppLocale) async {
        self.locale = newLocale
        UserDefaults.standard.set(newLocale.rawValue, forKey: "preferred_locale")

        guard let userId = profile?.id else { return }
        try? await supabase.updatePreferredLocale(userId: userId, locale: newLocale)
    }

    /// Web の `updateNickname`（profiles 更新）と同じ
    func updateNickname(_ raw: String) async -> (ok: Bool, message: String) {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            return (false, locale == .ja ? "ニックネームを入力してください" : "Please enter a nickname.")
        }
        if trimmed.count > 20 {
            return (false, locale == .ja ? "ニックネームは1〜20文字で入力してください" : "Nickname must be 1–20 characters.")
        }
        guard let userId = profile?.id else {
            return (false, locale == .ja ? "ログインが必要です" : "Please sign in.")
        }
        if trimmed == profile?.nickname {
            return (true, "")
        }

        do {
            try await supabase.updateProfileNickname(userId: userId, nickname: trimmed)
            if var p = profile {
                p.nickname = trimmed
                self.profile = p
            }
            let msg = locale == .ja ? "ニックネームを更新しました" : "Nickname updated"
            return (true, msg)
        } catch {
            return (false, error.localizedDescription)
        }
    }

    /// Web の `updateEmail`（`auth.updateUser({ email })`）と同じ
    func requestEmailChange(_ raw: String) async -> (ok: Bool, message: String) {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            return (false, locale == .ja ? "メールアドレスを入力してください" : "Please enter an email address.")
        }
        if !Self.isValidEmailFormat(trimmed) {
            return (false, locale == .ja ? "有効なメールアドレスを入力してください" : "Please enter a valid email address.")
        }
        guard let current = profile?.email else {
            return (false, locale == .ja ? "ログインが必要です" : "Please sign in.")
        }
        if trimmed == current {
            return (false, locale == .ja ? "現在のメールアドレスと同じです" : "Same as your current email.")
        }

        do {
            try await supabase.requestEmailChange(newEmail: trimmed)
            let msg = locale == .ja
                ? "\(trimmed) に確認コードを送信しました。メールに記載の6桁のコードを入力してください。"
                : "We sent a verification code to \(trimmed). Enter the 6-digit code below."
            return (true, msg)
        } catch {
            return (false, error.localizedDescription)
        }
    }

    /// メール変更 OTP 確認後、Netlify で課金メール同期 → プロフィール再取得
    func verifyEmailChangeOtp(newEmail: String, token: String) async -> (ok: Bool, message: String) {
        let trimmedEmail = newEmail.trimmingCharacters(in: .whitespacesAndNewlines)
        let digits = token.trimmingCharacters(in: .whitespacesAndNewlines).filter { $0.isNumber }
        if digits.count < 6 {
            return (false, locale == .ja ? "確認コードは6桁です" : "The code must be 6 digits.")
        }

        do {
            try await supabase.verifyEmailChangeOtp(newEmail: trimmedEmail, token: digits)
            var billingSyncError: String?
            do {
                try await supabase.syncBillingEmailAfterChange(newEmail: trimmedEmail)
            } catch {
                billingSyncError = error.localizedDescription
            }

            let session = try await supabase.client.auth.session
            if let updated = try await supabase.fetchProfileIfExists(userId: session.user.id) {
                self.profile = updated
            }
            await refreshBillingStatus()

            if let err = billingSyncError {
                let msg = locale == .ja
                    ? "メールは更新しましたが、請求情報の同期に失敗しました: \(err)"
                    : "Email updated, but billing sync failed: \(err)"
                return (true, msg)
            }
            let msg = locale == .ja ? "メールアドレスを更新しました" : "Email address updated."
            return (true, msg)
        } catch {
            return (false, error.localizedDescription)
        }
    }

    private static func isValidEmailFormat(_ value: String) -> Bool {
        let pattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
        return value.range(of: pattern, options: .regularExpression) != nil
    }

    var isPremium: Bool {
        if let billing = billingStatus {
            if let endsAt = billing.currentPeriodEndsAt,
               endsAt <= Date(),
               billing.entitlementState == .cancelledButActiveUntilEnd {
                return false
            }
            switch billing.entitlementState {
            case .active, .paymentIssueWithAccess, .cancelledButActiveUntilEnd:
                return true
            case .paymentIssueNoAccess, .expired:
                return false
            }
        }

        guard lastBillingCheckedAt != nil else {
            return profile?.rank.isPremium ?? false
        }

        if let checkedAt = lastBillingCheckedAt,
           Date().timeIntervalSince(checkedAt) <= Self.failGraceTTL,
           billingFetchFailCount <= Self.maxFailOpenRetries {
            return profile?.rank.isPremium ?? false
        }

        return false
    }

    var canShowIAP: Bool {
        guard let billing = billingStatus else { return true }
        if billing.provider != .lemon { return true }
        switch billing.entitlementState {
        case .expired, .paymentIssueNoAccess:
            return true
        case .active, .paymentIssueWithAccess, .cancelledButActiveUntilEnd:
            return false
        }
    }

    var canDeleteAccount: Bool {
        guard let billing = billingStatus else { return true }
        return billing.entitlementState == .expired
    }

    /// 支払い問題バナー（Lemon: 利用可 / Apple: 停止）
    var paymentIssueBannerKind: PaymentIssueBannerKind? {
        guard let billing = billingStatus else { return nil }
        if billing.provider == .lemon && billing.entitlementState == .paymentIssueWithAccess {
            return .lemonWithAccess
        }
        if billing.provider == .apple && billing.entitlementState == .paymentIssueNoAccess {
            return .appleNoAccess
        }
        return nil
    }
}

enum AuthState: Equatable {
    case loading
    case unauthenticated
    case authenticated(UUID)
    case profileSetupRequired(UUID, String)
}

private enum ProfileSetupError: LocalizedError {
    case profileNotFoundAfterCreation

    var errorDescription: String? {
        switch self {
        case .profileNotFoundAfterCreation:
            return "Profile not found after creation"
        }
    }
}
