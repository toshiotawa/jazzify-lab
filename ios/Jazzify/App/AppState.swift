import Foundation
import SwiftUI
import Supabase

@MainActor
final class AppState: ObservableObject {
    @Published var authState: AuthState = .loading
    @Published var profile: Profile?
    @Published var billingStatus: BillingStatusResponse?
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
            let fetchedProfile = try await supabase.fetchProfile(userId: userId)
            self.profile = fetchedProfile

            if let prefLocale = fetchedProfile.preferredLocale,
               let loc = AppLocale(rawValue: prefLocale) {
                self.locale = loc
            }

            self.authState = .authenticated(userId)

            await refreshBillingStatus()
            await store.listenForTransactions()
        } catch {
            self.authState = .unauthenticated
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
        self.profile = nil
        self.billingStatus = nil
        self.authState = .unauthenticated
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
}
