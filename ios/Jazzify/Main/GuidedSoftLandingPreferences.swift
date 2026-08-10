import Foundation

enum GuidedSoftLandingPreferences {
    private static let sessionDismissedAtKey = "guidedSoftLandingSessionDismissedAt"
    private static let offerAutoShownAtKey = "guidedSoftLandingOfferAutoShownAt"
    private static let sessionDuration: TimeInterval = 3 * 60 * 60

    static func isSessionDismissed(now: Date = Date()) -> Bool {
        guard let timestamp = UserDefaults.standard.object(forKey: sessionDismissedAtKey) as? TimeInterval else {
            return false
        }
        return now.timeIntervalSince(Date(timeIntervalSince1970: timestamp)) < sessionDuration
    }

    static func markSessionDismissed(now: Date = Date()) {
        UserDefaults.standard.set(now.timeIntervalSince1970, forKey: sessionDismissedAtKey)
    }

    static func shouldAutoShowOffer(now: Date = Date()) -> Bool {
        guard !isSessionDismissed(now: now) else { return false }
        guard let timestamp = UserDefaults.standard.object(forKey: offerAutoShownAtKey) as? TimeInterval else {
            return true
        }
        return now.timeIntervalSince(Date(timeIntervalSince1970: timestamp)) >= sessionDuration
    }

    static func markOfferAutoShown(now: Date = Date()) {
        UserDefaults.standard.set(now.timeIntervalSince1970, forKey: offerAutoShownAtKey)
    }
}

enum SoftLandingGuidance {
    static func isMainQuestBlockedForSoftLanding(
        progress: SupabaseService.MainQuestProgressResult
    ) -> Bool {
        if progress.totalLessons <= 0 { return false }
        if progress.completedLessons >= progress.totalLessons { return true }
        guard let next = progress.nextLesson else { return false }
        return !MainQuestFreeTier.isBlockPlayable(
            isPremium: false,
            blockNumber: next.blockNumber ?? 1
        )
    }

    /// ソフトランディング案内を優先表示する状態か（画面遷移は制限しない）
    static func shouldPrioritizeGuidance(
        isPremium: Bool,
        mainQuestBlocked: Bool,
        nextCandidate: SoftLandingCandidate?
    ) -> Bool {
        if isPremium { return false }
        if !mainQuestBlocked { return false }
        guard nextCandidate != nil else { return false }
        if GuidedSoftLandingPreferences.isSessionDismissed() { return false }
        return true
    }

    static func shouldAutoShowOfferOnDashboard(
        isPremium: Bool,
        mainQuestBlocked: Bool,
        nextCandidate: SoftLandingCandidate?
    ) -> Bool {
        guard shouldPrioritizeGuidance(
            isPremium: isPremium,
            mainQuestBlocked: mainQuestBlocked,
            nextCandidate: nextCandidate
        ) else {
            return false
        }
        return GuidedSoftLandingPreferences.shouldAutoShowOffer()
    }
}
