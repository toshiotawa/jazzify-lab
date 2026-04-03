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
            self.profileSetupError = nil
            self.authState = .profileSetupRequired(userId, email)
        } catch {
            store.setCurrentUserId(nil)
            self.profile = nil
            self.billingStatus = nil
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

    func refreshBillingStatus() async {
        do {
            self.billingStatus = try await billing.fetchBillingStatus()
        } catch {
            self.billingStatus = nil
        }
    }

    func signOut() async {
        try? await supabase.client.auth.signOut()
        store.setCurrentUserId(nil)
        self.profile = nil
        self.billingStatus = nil
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

    var isPremium: Bool {
        if let billing = billingStatus {
            switch billing.status {
            case .trial, .active, .grace, .billingRetry:
                return true
            case .expired, .canceled:
                if let endsAt = billing.currentPeriodEndsAt, endsAt > Date() {
                    return true
                }
                return false
            }
        }
        return profile?.rank.isPremium ?? false
    }

    var canShowIAP: Bool {
        guard let billing = billingStatus else { return true }
        return billing.provider != .lemon ||
               billing.status == .expired ||
               billing.status == .canceled
    }

    var canDeleteAccount: Bool {
        guard let billing = billingStatus else { return true }
        switch billing.status {
        case .trial, .active, .grace, .billingRetry:
            return false
        case .expired:
            return true
        case .canceled:
            guard let endsAt = billing.currentPeriodEndsAt else { return true }
            return endsAt <= Date()
        }
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
